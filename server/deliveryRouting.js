import {
  createEntity,
  filterEntities,
  getEntity,
  updateEntity,
  listEntities,
  nowIso,
} from './db.js';
import { isDriverCapableUser, canManageCustomerTeam } from './roles.js';
import { parseDeliveryBarcode, hasDeliverableAddress } from './barcodeParsers.js';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCustomerDeliverySettings(customerId) {
  const customer = customerId ? getEntity('Customer', customerId) : null;
  return {
    max_stops_per_route: Number(customer?.max_stops_per_route) || 200,
    require_pod_signature: !!customer?.require_pod_signature,
    allow_virtual_pod: customer?.allow_virtual_pod !== false,
  };
}

function assertDriver(user) {
  if (!user) throw new Error('Unauthorized');
  if (!isDriverCapableUser(user)) throw new Error('Driver access required');
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function getOrCreateTodayRoute(user, routeName) {
  const today = todayIso();
  const existing = filterEntities('DeliveryRoute', { driver_id: user.id }, null, 50)
    .find((r) => r.route_date === today && r.status !== 'cancelled');
  if (existing) return existing;

  return createEntity('DeliveryRoute', {
    route_name: routeName || `Route ${today}`,
    route_date: today,
    driver_id: user.id,
    driver_name: user.full_name || user.email,
    customer_id: user.customer_id || '',
    status: 'pending',
    total_stops: 0,
    completed_stops: 0,
    notes: 'Created from driver scans',
    source: 'driver_scan',
  });
}

function enforceStopLimit(customerId, routeId, adding = 1) {
  const settings = getCustomerDeliverySettings(customerId);
  const max = settings.max_stops_per_route;
  if (!max || max <= 0) return settings;
  const current = filterEntities('DeliveryStop', { route_id: routeId }).length;
  if (current + adding > max) {
    throw new Error(`Stop limit reached (${max} per route). Your fleet manager can raise the limit in PD Command.`);
  }
  return settings;
}

function findStopByTracking(customerId, tracking) {
  if (!tracking) return null;
  const code = String(tracking).trim().toUpperCase();
  const stops = listEntities('DeliveryStop').filter((s) => {
    if (customerId && s.customer_id && s.customer_id !== customerId) return false;
    return String(s.tracking_number || '').toUpperCase() === code
      || String(s.barcode || '').toUpperCase() === code;
  });
  return stops[0] || null;
}

function matchExistingStop(user, parsed) {
  const tracking = parsed.tracking_number || parsed.raw;
  const byTracking = findStopByTracking(user.customer_id, tracking);
  if (byTracking) return { stop: byTracking, matchType: 'tracking' };

  if (parsed.recipient_name && parsed.address) {
    const stops = filterEntities('DeliveryStop', { customer_id: user.customer_id || undefined });
    const hit = stops.find(
      (s) => s.recipient_name?.toLowerCase() === parsed.recipient_name.toLowerCase()
        && s.address?.toLowerCase() === parsed.address.toLowerCase()
        && (s.status === 'pending' || s.status === 'attempted')
    );
    if (hit) return { stop: hit, matchType: 'address' };
  }
  return { stop: null, matchType: null };
}

export function parseDeliveryBarcodeHandler(body, user) {
  assertDriver(user);
  const { barcode } = body;
  if (!barcode) throw new Error('barcode is required');

  const parsed = parseDeliveryBarcode(barcode);
  const match = matchExistingStop(user, parsed);

  return {
    success: true,
    parsed,
    matchedStop: match.stop,
    matchType: match.matchType,
    deliverySettings: getCustomerDeliverySettings(user.customer_id),
  };
}

export function addDeliveryStopFromScan(body, user) {
  assertDriver(user);
  const { barcode, routeId, lat, lng } = body;
  if (!barcode) throw new Error('barcode is required');

  const parsed = parseDeliveryBarcode(barcode);

  const existing = matchExistingStop(user, parsed);
  if (existing.stop) {
    return {
      success: true,
      stop: existing.stop,
      route: getEntity('DeliveryRoute', existing.stop.route_id),
      alreadyOnRoute: true,
      parsed,
    };
  }

  if (!hasDeliverableAddress(parsed)) {
    throw new Error(
      'This barcode is a tracking number only — no name/address embedded. Dispatch must assign the stop, or scan a manifest QR with full delivery data.'
    );
  }

  const route = routeId ? getEntity('DeliveryRoute', routeId) : getOrCreateTodayRoute(user);
  if (!route) throw new Error('Route not found');
  if (route.driver_id !== user.id && !canManageCustomerTeam(user.role)) {
    throw new Error('Not your route');
  }

  enforceStopLimit(user.customer_id, route.id, 1);

  const stops = filterEntities('DeliveryStop', { route_id: route.id });
  const sequence = stops.length + 1;

  const stop = createEntity('DeliveryStop', {
    route_id: route.id,
    customer_id: user.customer_id || '',
    sequence,
    tracking_number: parsed.tracking_number || parsed.raw,
    barcode: parsed.raw,
    recipient_name: parsed.recipient_name,
    recipient_phone: parsed.recipient_phone || '',
    address: parsed.address,
    city: parsed.city || '',
    state: parsed.state || '',
    zip: parsed.zip || '',
    package_description: parsed.package_description || '',
    notes: parsed.notes || '',
    status: 'pending',
    lat: lat ?? null,
    lng: lng ?? null,
    barcode_format: parsed.barcode_format,
    created_from_scan: true,
  });

  updateEntity('DeliveryRoute', route.id, {
    total_stops: sequence,
    status: route.status === 'completed' ? 'in_progress' : route.status,
  });

  createEntity('BarcodeScan', {
    driver_id: user.id,
    driver_name: user.full_name,
    customer_id: user.customer_id || '',
    barcode: parsed.raw,
    scan_type: 'delivery_stop',
    linked_id: stop.id,
    label: `${parsed.recipient_name} — ${parsed.address}`,
    lat: lat ?? null,
    lng: lng ?? null,
    scanned_at: nowIso(),
  });

  return { success: true, stop, route, parsed, created: true };
}

export function scanDeliveryPackage(body, user) {
  assertDriver(user);
  const { barcode, lat, lng } = body;
  if (!barcode) throw new Error('barcode is required');

  const parsed = parseDeliveryBarcode(barcode);
  const match = matchExistingStop(user, parsed);

  createEntity('BarcodeScan', {
    driver_id: user.id,
    driver_name: user.full_name,
    customer_id: user.customer_id || '',
    barcode: parsed.raw,
    scan_type: match.stop ? 'delivery_confirm' : parsed.tracking_number ? 'tracking_lookup' : 'unknown',
    linked_id: match.stop?.id || '',
    label: match.stop
      ? `Stop #${match.stop.sequence} — ${match.stop.recipient_name}`
      : parsed.tracking_number || parsed.raw,
    lat: lat ?? null,
    lng: lng ?? null,
    scanned_at: nowIso(),
  });

  if (!match.stop && parsed.tracking_number) {
    throw new Error(`No stop found for tracking ${parsed.tracking_number}. Add it from Scan → Build Route, or ask dispatch.`);
  }

  return {
    success: true,
    parsed,
    stop: match.stop,
    route: match.stop ? getEntity('DeliveryRoute', match.stop.route_id) : null,
    matchType: match.matchType,
    deliverySettings: getCustomerDeliverySettings(user.customer_id),
  };
}

export function optimizeDeliveryRoute(body, user) {
  assertDriver(user);
  const { routeId, startLat, startLng } = body;
  if (!routeId) throw new Error('routeId is required');

  const route = getEntity('DeliveryRoute', routeId);
  if (!route) throw new Error('Route not found');
  if (route.driver_id !== user.id && !canManageCustomerTeam(user.role)) {
    throw new Error('Not authorized');
  }

  let stops = filterEntities('DeliveryStop', { route_id: routeId })
    .filter((s) => s.status === 'pending' || s.status === 'attempted');

  const done = filterEntities('DeliveryStop', { route_id: routeId })
    .filter((s) => s.status === 'delivered' || s.status === 'failed');

  const withCoords = stops.filter((s) => s.lat != null && s.lng != null);
  const withoutCoords = stops.filter((s) => s.lat == null || s.lng == null);

  const ordered = [];

  if (withCoords.length > 1 && startLat != null && startLng != null) {
    const pool = [...withCoords];
    let curLat = Number(startLat);
    let curLng = Number(startLng);
    while (pool.length) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < pool.length; i += 1) {
        const d = haversine(curLat, curLng, pool[i].lat, pool[i].lng);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      const next = pool.splice(bestIdx, 1)[0];
      ordered.push(next);
      curLat = next.lat;
      curLng = next.lng;
    }
  } else {
    // Zip / city sort when GPS pins unavailable
    ordered.push(
      ...withCoords.sort((a, b) => String(a.zip).localeCompare(String(b.zip)) || String(a.city).localeCompare(String(b.city)))
    );
  }

  withoutCoords.sort(
    (a, b) => String(a.zip).localeCompare(String(b.zip))
      || String(a.city).localeCompare(String(b.city))
      || String(a.address).localeCompare(String(b.address))
  );
  ordered.push(...withoutCoords);

  const finalOrder = [...done, ...ordered];
  finalOrder.forEach((stop, idx) => {
    updateEntity('DeliveryStop', stop.id, { sequence: idx + 1 });
  });

  updateEntity('DeliveryRoute', routeId, {
    optimized_at: nowIso(),
    optimization_method: withCoords.length > 1 && startLat != null ? 'nearest_neighbor_gps' : 'zip_city_sort',
  });

  return {
    success: true,
    message: `Route optimized — ${ordered.length} stop(s) resequenced for fastest path.`,
    stops: finalOrder.map((s, idx) => ({ ...s, sequence: idx + 1 })),
  };
}

export async function geocodeDeliveryRoute(body, user) {
  const { routeId } = body;
  if (!routeId) throw new Error('routeId is required');

  const route = getEntity('DeliveryRoute', routeId);
  if (!route) throw new Error('Route not found');
  if (route.driver_id !== user.id && !canManageCustomerTeam(user.role)) {
    throw new Error('Not authorized');
  }

  const stops = filterEntities('DeliveryStop', { route_id: routeId });
  const { geocodeStopList } = await import('./geocoding.js');
  const { results, geocoded } = await geocodeStopList(stops);

  const updated = [];
  for (const r of results) {
    if (r.lat != null && r.lng != null && !r.skipped) {
      const stop = updateEntity('DeliveryStop', r.id, {
        lat: r.lat,
        lng: r.lng,
        geocoded_at: nowIso(),
      });
      updated.push(stop);
    }
  }

  return {
    success: true,
    message: geocoded
      ? `Geocoded ${geocoded} stop(s) for map display.`
      : 'All stops already have map coordinates.',
    geocoded,
    stops: filterEntities('DeliveryStop', { route_id: routeId }),
  };
}

export async function importDeliveryManifest(body, user) {
  const {
    routeName,
    routeDate,
    driverId,
    stops,
    geocode = true,
  } = body;

  if (!Array.isArray(stops) || stops.length === 0) {
    throw new Error('stops array is required');
  }

  const isManager = canManageCustomerTeam(user.role);
  const targetDriverId = driverId || user.id;
  if (targetDriverId !== user.id && !isManager) {
    throw new Error('Not authorized to assign routes to other drivers');
  }

  const date = routeDate || todayIso();
  const customerId = user.customer_id || '';

  const route = createEntity('DeliveryRoute', {
    route_name: routeName || `Manifest ${date}`,
    route_date: date,
    driver_id: targetDriverId,
    customer_id: customerId,
    status: 'pending',
    total_stops: stops.length,
    completed_stops: 0,
    notes: 'Imported from warehouse manifest',
    source: 'manifest_import',
  });

  enforceStopLimit(customerId, route.id, stops.length);

  const created = [];
  for (let i = 0; i < stops.length; i += 1) {
    const s = stops[i];
    const stop = createEntity('DeliveryStop', {
      route_id: route.id,
      customer_id: customerId,
      sequence: i + 1,
      tracking_number: String(s.tracking_number || s.tracking || '').trim(),
      barcode: String(s.tracking_number || s.tracking || s.barcode || '').trim(),
      recipient_name: String(s.recipient_name || '').trim(),
      recipient_phone: String(s.recipient_phone || s.phone || '').trim(),
      address: String(s.address || '').trim(),
      city: String(s.city || '').trim(),
      state: String(s.state || '').trim().toUpperCase().slice(0, 2),
      zip: String(s.zip || '').trim(),
      package_description: String(s.package_description || s.package || '').trim(),
      notes: String(s.notes || '').trim(),
      status: 'pending',
      import_source: 'manifest',
    });
    created.push(stop);
  }

  let geocodedCount = 0;
  if (geocode) {
    const { geocodeStopList } = await import('./geocoding.js');
    const { results, geocoded } = await geocodeStopList(created, { max: 60 });
    geocodedCount = geocoded;
    for (const r of results) {
      if (r.lat != null && r.lng != null && !r.skipped) {
        updateEntity('DeliveryStop', r.id, {
          lat: r.lat,
          lng: r.lng,
          geocoded_at: nowIso(),
        });
      }
    }
  }

  const finalStops = filterEntities('DeliveryStop', { route_id: route.id });

  return {
    success: true,
    message: `Imported ${created.length} stop(s)${geocodedCount ? ` — ${geocodedCount} mapped` : ''}.`,
    route,
    stops: finalStops,
    geocoded: geocodedCount,
  };
}

export function updateCustomerDeliverySettings(body, user) {
  if (!user?.customer_id || !canManageCustomerTeam(user.role)) {
    throw new Error('Customer manager access required');
  }
  const customer = getEntity('Customer', user.customer_id);
  if (!customer) throw new Error('Customer not found');

  const patch = {};
  if (body.max_stops_per_route != null) {
    const n = Number(body.max_stops_per_route);
    if (!Number.isFinite(n) || n < 1 || n > 500) {
      throw new Error('max_stops_per_route must be between 1 and 500');
    }
    patch.max_stops_per_route = n;
  }
  if (body.require_pod_signature != null) patch.require_pod_signature = !!body.require_pod_signature;
  if (body.allow_virtual_pod != null) patch.allow_virtual_pod = !!body.allow_virtual_pod;

  const updated = updateEntity('Customer', customer.id, patch);
  return { success: true, customer: updated };
}

export function getCustomerDeliverySettingsHandler(body, user) {
  const customerId = body?.customerId || user?.customer_id;
  if (!customerId) throw new Error('customerId required');
  const customer = getEntity('Customer', customerId);
  if (!customer) throw new Error('Customer not found');
  return {
    success: true,
    settings: {
      max_stops_per_route: Number(customer.max_stops_per_route) || 200,
      require_pod_signature: !!customer.require_pod_signature,
      allow_virtual_pod: customer.allow_virtual_pod !== false,
    },
  };
}

/**
 * VIN decode, compatible parts, maintenance, and accessory serial lookup.
 * Read-only aggregation — never mutates existing customer records except optional VIN cache on vehicle.
 */
import { getEntity, listEntities, updateEntity } from './db.js';
import {
  buildScopeIndex,
  filterEntitiesForContext,
  resolveCustomerContext,
  entityBelongsToCustomer,
} from './entityScope.js';

function normalizeVin(vin) {
  return (vin || '').trim().toUpperCase();
}

function parseListField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  return String(value)
    .split(/[,;|]/)
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function partMatchesVehicle(part, specs, vehicle) {
  const make = (specs?.make || vehicle?.make || '').toLowerCase();
  const model = (specs?.model || vehicle?.model || '').toLowerCase();
  const engine = (specs?.engine || vehicle?.engine || '').toLowerCase();

  const makes = parseListField(part.compatible_makes);
  const models = parseListField(part.compatible_models);
  const engines = parseListField(part.compatible_engines);

  if (makes.length && make && !makes.some((m) => make.includes(m) || m.includes(make))) return false;
  if (models.length && model && !models.some((m) => model.includes(m) || m.includes(model))) return false;
  if (engines.length && engine && !engines.some((e) => engine.includes(e) || e.includes(engine))) return false;

  if (!makes.length && !models.length && !engines.length) {
    const hay = `${part.description || ''} ${part.notes || ''} ${part.category || ''}`.toLowerCase();
    if (make && hay.includes(make)) return true;
    if (model && hay.includes(model)) return true;
    return false;
  }
  return true;
}

function templateMatchesVehicle(template, specs, vehicle) {
  const make = (specs?.make || vehicle?.make || '').toLowerCase();
  const model = (specs?.model || vehicle?.model || '').toLowerCase();
  const makes = parseListField(template.compatible_makes);
  const models = parseListField(template.compatible_models);
  if (!makes.length && !models.length) return true;
  if (makes.length && make && makes.some((m) => make.includes(m) || m.includes(make))) return true;
  if (models.length && model && models.some((m) => model.includes(m) || m.includes(model))) return true;
  return false;
}

async function fetchVinDecode(vin) {
  const cleanVin = normalizeVin(vin);
  const decodeRes = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${cleanVin}?format=json`,
  );
  const decodeData = await decodeRes.json();
  if (!decodeData?.Results?.length) {
    throw new Error('Could not decode VIN. No results from NHTSA.');
  }
  const results = decodeData.Results;
  const findValue = (name) => results.find((r) => r.Variable === name)?.Value || null;
  return {
    vin: cleanVin,
    specs: {
      make: findValue('Make'),
      model: findValue('Model'),
      year: findValue('Model Year') ? parseInt(findValue('Model Year'), 10) : null,
      body_class: findValue('Body Class'),
      fuel_type: findValue('Fuel Type - Primary'),
      engine: findValue('Engine Model') || findValue('Engine Configuration'),
      manufacturer: findValue('Manufacturer Name'),
      vehicle_type: findValue('Vehicle Type'),
      trim: findValue('Trim'),
      drive_type: findValue('Drive Type'),
    },
    decoded_at: new Date().toISOString(),
  };
}

async function fetchVinRecalls(vin) {
  const cleanVin = normalizeVin(vin);
  try {
    const recallRes = await fetch(`https://api.nhtsa.gov/recalls/recallsByVin?vin=${cleanVin}`);
    const recallData = await recallRes.json();
    const items = recallData?.results || recallData?.Results || [];
    return items.map((r) => ({
      nhtsa_campaign: r.NHTSACampaignNumber || r.nhtsaCampaignNumber || '',
      component: r.Component || r.component || '',
      summary: r.Summary || r.summary || '',
      remedy: r.Remedy || r.remedy || '',
      report_date: r.ReportReceivedDate || r.reportReceivedDate || null,
      manufacturer: r.Manufacturer || r.manufacturer || '',
    }));
  } catch {
    try {
      const alt = await fetch(`https://api.nhtsa.gov/vehicles/${cleanVin}/recalls?format=json`);
      const altData = await alt.json();
      return (altData?.results || []).map((r) => ({
        nhtsa_campaign: r.NHTSACampaignNumber || '',
        component: r.Component || '',
        summary: r.Summary || '',
        remedy: r.Remedy || '',
        report_date: r.ReportReceivedDate || null,
        manufacturer: r.Manufacturer || '',
      }));
    } catch {
      return [];
    }
  }
}

function enrichPartsWithVendors(parts) {
  const vendors = listEntities('Vendor');
  return parts.map((part) => {
    const supplier = (part.supplier || '').trim().toLowerCase();
    let vendor = null;
    if (supplier) {
      vendor = vendors.find((v) => {
        const name = (v.name || '').trim().toLowerCase();
        return name === supplier || name.includes(supplier) || supplier.includes(name);
      }) || null;
    }
    return { ...part, vendor_name: part.supplier || null, vendor };
  });
}

function resolveLookupContext(user, requestedCustomerId) {
  const ctx = resolveCustomerContext(user, requestedCustomerId);
  if (ctx.customerId) {
    ctx.scopeIndex = buildScopeIndex(ctx.customerId);
  }
  return ctx;
}

function filterVehiclesForCtx(vehicles, ctx) {
  return filterEntitiesForContext('Vehicle', vehicles, ctx, ctx.scopeIndex);
}

export async function vehiclePartsLookup(body, user) {
  const { vin, vehicle_id: vehicleId, customer_id: requestedCustomerId } = body || {};
  const ctx = resolveLookupContext(user, requestedCustomerId);

  let vehicle = null;
  const cleanVin = vin ? normalizeVin(vin) : null;

  if (vehicleId) {
    vehicle = getEntity('Vehicle', vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');
    if (!entityBelongsToCustomer('Vehicle', vehicle, ctx.customerId, ctx.scopeIndex)) {
      throw new Error('Access denied for this vehicle');
    }
  } else if (cleanVin) {
    const allVehicles = filterVehiclesForCtx(listEntities('Vehicle'), ctx);
    vehicle = allVehicles.find((v) => normalizeVin(v.vin) === cleanVin) || null;
  } else {
    throw new Error('VIN or vehicle_id is required');
  }

  const effectiveVin = cleanVin || (vehicle?.vin ? normalizeVin(vehicle.vin) : null);
  if (!effectiveVin) {
    throw new Error('No VIN available — enter a VIN or select a vehicle with a VIN on file');
  }

  let decode = vehicle?.vin_decode_cache;
  const cacheVin = decode?.vin ? normalizeVin(decode.vin) : null;
  if (!decode || cacheVin !== effectiveVin) {
    decode = await fetchVinDecode(effectiveVin);
    if (vehicle?.id) {
      updateEntity('Vehicle', vehicle.id, { vin_decode_cache: decode });
      vehicle = { ...vehicle, vin_decode_cache: decode };
    }
  }

  const specs = decode.specs || {};
  const allParts = listEntities('PartInventory');
  const compatibleParts = enrichPartsWithVendors(
    allParts.filter((p) => partMatchesVehicle(p, specs, vehicle)),
  );

  let maintenance = listEntities('MaintenanceSchedule');
  let workOrders = listEntities('WorkOrder');
  if (vehicle?.id) {
    maintenance = maintenance.filter((m) => m.vehicle_id === vehicle.id);
    workOrders = workOrders.filter((wo) => wo.vehicle_id === vehicle.id);
  } else {
    maintenance = [];
    workOrders = [];
  }
  maintenance = filterEntitiesForContext('MaintenanceSchedule', maintenance, ctx, ctx.scopeIndex);
  workOrders = filterEntitiesForContext('WorkOrder', workOrders, ctx, ctx.scopeIndex);

  const templates = listEntities('ServiceTemplate').filter((t) =>
    templateMatchesVehicle(t, specs, vehicle),
  );

  const recalls = await fetchVinRecalls(effectiveVin);

  const vendorParts = compatibleParts.reduce((acc, part) => {
    const key = part.vendor_name || part.supplier || 'Unknown vendor';
    if (!acc[key]) acc[key] = { vendor_name: key, vendor: part.vendor, parts: [] };
    acc[key].parts.push(part);
    return acc;
  }, {});

  let accessories = listEntities('VehicleAccessory');
  if (vehicle?.id) {
    accessories = accessories.filter((a) => a.vehicle_id === vehicle.id);
  } else if (effectiveVin && vehicle) {
    accessories = accessories.filter((a) => a.vehicle_id === vehicle.id);
  }
  accessories = filterEntitiesForContext('VehicleAccessory', accessories, ctx, ctx.scopeIndex);

  return {
    vin: effectiveVin,
    decode,
    vehicle,
    recalls,
    compatible_parts: compatibleParts,
    vendor_parts: Object.values(vendorParts),
    maintenance_schedules: maintenance,
    work_orders: workOrders,
    service_templates: templates,
    accessories,
  };
}

export async function accessorySerialLookup(body, user) {
  const { brand, serial_number: serialNumber, customer_id: requestedCustomerId } = body || {};
  const brandNorm = (brand || '').trim().toLowerCase();
  const serialNorm = (serialNumber || '').trim().toLowerCase();

  if (!brandNorm && !serialNorm) {
    throw new Error('Brand or serial number is required');
  }

  const ctx = resolveLookupContext(user, requestedCustomerId);
  let accessories = listEntities('VehicleAccessory');
  accessories = filterEntitiesForContext('VehicleAccessory', accessories, ctx, ctx.scopeIndex);

  accessories = accessories.filter((a) => {
    const aBrand = (a.brand || '').toLowerCase();
    const aSerial = (a.serial_number || '').toLowerCase();
    const brandMatch = !brandNorm || aBrand.includes(brandNorm) || brandNorm.includes(aBrand);
    const serialMatch = !serialNorm || aSerial.includes(serialNorm) || serialNorm.includes(aSerial);
    return brandMatch && serialMatch;
  });

  const results = accessories.map((accessory) => {
    const vehicle = accessory.vehicle_id ? getEntity('Vehicle', accessory.vehicle_id) : null;
    const warrantyActive = accessory.warranty_expiry
      ? new Date(accessory.warranty_expiry) >= new Date()
      : null;

    const relatedMaintenance = accessory.vehicle_id
      ? listEntities('MaintenanceSchedule').filter((m) => m.vehicle_id === accessory.vehicle_id)
      : [];
    const relatedWorkOrders = accessory.vehicle_id
      ? listEntities('WorkOrder').filter((wo) => wo.vehicle_id === accessory.vehicle_id)
      : [];

    const accessoryTypes = parseListField(accessory.accessory_type);
    const relatedParts = listEntities('PartInventory').filter((p) => {
      const partTypes = parseListField(p.accessory_types);
      const partBrands = parseListField(p.compatible_brands);
      if (partTypes.length && accessoryTypes.length) {
        return partTypes.some((t) => accessoryTypes.includes(t));
      }
      if (partBrands.length && brandNorm) {
        return partBrands.some((b) => aBrandIncludes(brandNorm, b));
      }
      const hay = `${p.description || ''} ${p.notes || ''}`.toLowerCase();
      return (accessory.brand && hay.includes((accessory.brand || '').toLowerCase()))
        || (accessory.accessory_type && hay.includes((accessory.accessory_type || '').toLowerCase()));
    });

    return {
      accessory,
      vehicle,
      warranty_active: warrantyActive,
      maintenance_schedules: relatedMaintenance,
      work_orders: relatedWorkOrders,
      related_parts: relatedParts,
    };
  });

  return { count: results.length, results };
}

function aBrandIncludes(brandNorm, partBrand) {
  return brandNorm.includes(partBrand) || partBrand.includes(brandNorm);
}

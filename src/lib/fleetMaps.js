/**
 * FleetCo map stack — license-free for display, geocoding, and navigation links.
 *
 * Tiles + geocoding: OpenStreetMap (attribution required, no API key).
 * Road geometry: OSRM public demo (no API key; throttle in production or self-host).
 * Navigation: geo: / OSM directions — opens the driver's device maps app, not a paid FleetCo API.
 */

import L from 'leaflet';

/** Standard OSM raster tiles — free with attribution (ODbL). */
export const OSM_TILES = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
  maxZoom: 19,
};

export const DEFAULT_MAP_CENTER = [32.7767, -96.797]; // Dallas fallback

export function fixLeafletDefaultIcons() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export function formatAddress({ address, city, state, zip } = {}) {
  return [address, city, state, zip].filter(Boolean).join(', ');
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/** OSM turn-by-turn directions in browser (FOSSGIS OSRM engine). */
export function buildOsmDirectionsUrl({ fromLat, fromLng, toLat, toLng, toLabel } = {}) {
  const base = 'https://www.openstreetmap.org/directions';
  const params = new URLSearchParams();
  params.set('engine', 'fossgis_osrm_car');
  if (fromLat != null && fromLng != null && toLat != null && toLng != null) {
    params.set('route', `${fromLng},${fromLat};${toLng},${toLat}`);
  } else if (toLat != null && toLng != null) {
    params.set('route', `;${toLng},${toLat}`);
  } else if (toLabel) {
    return `${base}?to=${encodeURIComponent(toLabel)}`;
  } else {
    return base;
  }
  return `${base}?${params.toString()}`;
}

/** Native maps deep link — no FleetCo API license; uses device default maps app. */
export function buildNativeMapsUrl({ lat, lng, label } = {}) {
  if (lat == null || lng == null) return null;
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
  if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return `maps://?daddr=${lat},${lng}&q=${q}`;
  }
  return `geo:${lat},${lng}?q=${q}`;
}

/**
 * Best navigation URL for a stop or address.
 * Prefers native geo/maps on mobile when coordinates exist; OSM directions on desktop.
 */
export function buildNavigationUrl({ lat, lng, address, city, state, zip, label } = {}) {
  const fullLabel = label || formatAddress({ address, city, state, zip }) || (lat != null ? `${lat},${lng}` : '');
  const native = lat != null && lng != null ? buildNativeMapsUrl({ lat, lng, label: fullLabel }) : null;
  const osm =
    lat != null && lng != null
      ? buildOsmDirectionsUrl({ toLat: lat, toLng: lng, toLabel: fullLabel })
      : fullLabel
        ? buildOsmDirectionsUrl({ toLabel: fullLabel })
        : null;

  return {
    href: isMobileDevice() && native ? native : osm || '#',
    native,
    osm,
    label: fullLabel,
  };
}

/** Multi-stop route link via OSM directions (coordinate chain). */
export function buildMultiStopDirectionsUrl(stops) {
  const pinned = stops.filter((s) => s.lat != null && s.lng != null);
  if (pinned.length === 0) return null;
  if (pinned.length === 1) return buildNavigationUrl(pinned[0]).href;

  const coords = pinned.map((s) => `${s.lng},${s.lat}`).join(';');
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(coords)}`;
}

/** Load origin → destination directions (address strings). */
export function buildLoadRouteUrl(origin, destination) {
  if (!origin || !destination) return null;
  const from = encodeURIComponent(origin);
  const to = encodeURIComponent(destination);
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&from=${from}&to=${to}`;
}

/** Fetch road-following polyline from OSRM public demo (no API key). */
export async function fetchOsrmRoute(latLngPoints) {
  if (!latLngPoints || latLngPoints.length < 2) return null;
  const coords = latLngPoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) return null;
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch {
    return null;
  }
}

/** Open navigation — prefers native maps on mobile, OSM in new tab on desktop. */
export function openNavigation(opts) {
  const { href, native, osm } = buildNavigationUrl(opts);
  if (isMobileDevice() && native) {
    window.location.href = native;
    return;
  }
  if (osm) window.open(osm, '_blank', 'noopener,noreferrer');
  else if (href && href !== '#') window.open(href, '_blank', 'noopener,noreferrer');
}

export function openLoadRoute(origin, destination) {
  const url = buildLoadRouteUrl(origin, destination);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

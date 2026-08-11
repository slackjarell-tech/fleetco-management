/**
 * OpenStreetMap Nominatim geocoding (free; respect 1 req/sec policy).
 * Used to pin delivery stops on FleetCo maps — not affiliated with third-party carriers.
 */

const USER_AGENT = 'FleetCoDriver/1.0 (fleetcomanagement.org; delivery-routing)';
const MIN_INTERVAL_MS = 1100;

let lastRequestAt = 0;

async function throttle() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

export function formatGeocodeQuery({ address, city, state, zip }) {
  return [address, city, state, zip, 'USA'].filter(Boolean).join(', ');
}

export async function geocodeAddress(fields) {
  const q = formatGeocodeQuery(fields);
  if (!q || q === 'USA') return null;

  await throttle();
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'us');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const hit = data?.[0];
  if (!hit) return null;

  return {
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
    display_name: hit.display_name,
  };
}

export async function geocodeStopList(stops, { max = 40 } = {}) {
  const results = [];
  let geocoded = 0;
  for (const stop of stops.slice(0, max)) {
    if (stop.lat != null && stop.lng != null) {
      results.push({ id: stop.id, lat: stop.lat, lng: stop.lng, skipped: true });
      continue;
    }
    if (!stop.address) {
      results.push({ id: stop.id, error: 'missing_address' });
      continue;
    }
    try {
      const geo = await geocodeAddress(stop);
      if (geo) {
        geocoded += 1;
        results.push({ id: stop.id, ...geo });
      } else {
        results.push({ id: stop.id, error: 'not_found' });
      }
    } catch {
      results.push({ id: stop.id, error: 'geocode_failed' });
    }
  }
  return { results, geocoded };
}

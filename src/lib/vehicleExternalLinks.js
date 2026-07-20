/** External catalog / decoder links for vehicle research (free resources) */

function slugPart(value) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '+');
}

export function vehicleSearchLabel(vehicle) {
  const parts = [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean);
  return parts.length ? parts.join(' ') : 'your vehicle';
}

export function nhtsaVinDecoderUrl(vin) {
  const base = 'https://www.nhtsa.gov/vin-decoder';
  if (!vin) return base;
  return `${base}?vin=${encodeURIComponent(vin.trim().toUpperCase())}`;
}

export function nhtsaRecallsUrl(vin) {
  if (!vin) return 'https://www.nhtsa.gov/recalls';
  return `https://www.nhtsa.gov/recalls?v=${encodeURIComponent(vin.trim().toUpperCase())}`;
}

/**
 * RockAuto — free parts catalog with year / make / model navigation.
 * https://www.rockauto.com/
 */
export function rockAutoCatalogUrl(vehicle) {
  const make = slugPart(vehicle?.make);
  const year = vehicle?.year ? String(vehicle.year).trim() : '';
  const model = slugPart(vehicle?.model);
  if (make && year && model) {
    return `https://www.rockauto.com/en/catalog/${make},${year},${model}`;
  }
  if (make && year) {
    return `https://www.rockauto.com/en/catalog/${make},${year}`;
  }
  if (make) {
    return `https://www.rockauto.com/en/catalog/${make}`;
  }
  return 'https://www.rockauto.com/en/catalog/';
}

/**
 * AutoZone Repair Guides — free step-by-step service procedures by vehicle.
 * https://www.autozone.com/repair-guides
 */
export function autoZoneRepairGuidesUrl(vehicle) {
  const label = vehicleSearchLabel(vehicle);
  if (label === 'your vehicle') {
    return 'https://www.autozone.com/repair-guides';
  }
  return `https://www.autozone.com/repair-guides?search=${encodeURIComponent(label)}`;
}

/** Cummins QuickServe — free diesel engine service docs by serial (heavy truck fleets). */
export function cumminsQuickServeUrl() {
  return 'https://quickserve.cummins.com/';
}

/** @deprecated use rockAutoCatalogUrl */
export function sevenZapCatalogUrl(vehicle) {
  return rockAutoCatalogUrl(vehicle);
}

/** @deprecated use vehicleSearchLabel */
export function sevenZapSearchHint(vehicle) {
  return vehicleSearchLabel(vehicle);
}

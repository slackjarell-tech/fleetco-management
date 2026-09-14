/** Fleet map color categories for trucks, trailers, and assets. */
export const MAP_COLOR_HEX = {
  driveable: '#22c55e',
  support_needed: '#ef4444',
  in_shop: '#3b82f6',
  unknown: '#94a3b8',
};

export const MAP_COLOR_LABELS = {
  driveable: 'Driveable',
  support_needed: 'Support Needed',
  in_shop: 'In Shop',
};

/** Default map color from operational status when map_color is not set. */
export function defaultMapColorFromStatus(status) {
  switch (status) {
    case 'active':
    case 'leased_out':
      return 'driveable';
    case 'in_shop':
      return 'in_shop';
    case 'waiting_for_parts':
    case 'out_of_service':
    case 'pending_inspection':
    case 'inactive':
    case 'retired':
    case 'sold':
      return 'support_needed';
    default:
      return 'driveable';
  }
}

export function getVehicleMapColor(vehicle) {
  const key = vehicle?.map_color || defaultMapColorFromStatus(vehicle?.status);
  return MAP_COLOR_HEX[key] || MAP_COLOR_HEX.unknown;
}

export function getVehicleMapColorKey(vehicle) {
  return vehicle?.map_color || defaultMapColorFromStatus(vehicle?.status);
}

export function mpsToMph(speedMps) {
  const n = Number(speedMps);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 2.237);
}

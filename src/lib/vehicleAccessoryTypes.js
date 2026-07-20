/** Accessory/equipment categories per vehicle (cranes, welders, etc.) */
export const VEHICLE_ACCESSORY_TYPES = [
  { id: 'crane', label: 'Crane / Hoist' },
  { id: 'welder', label: 'Welder' },
  { id: 'reefer', label: 'Reefer Unit' },
  { id: 'liftgate', label: 'Liftgate' },
  { id: 'apu', label: 'APU' },
  { id: 'pto', label: 'PTO' },
  { id: 'compressor', label: 'Air Compressor' },
  { id: 'generator', label: 'Generator' },
  { id: 'winch', label: 'Winch' },
  { id: 'fifth_wheel', label: 'Fifth Wheel' },
  { id: 'dashcam', label: 'Dashcam / Camera' },
  { id: 'other', label: 'Other Equipment' },
];

export const ACCESSORY_TYPE_IDS = VEHICLE_ACCESSORY_TYPES.map((t) => t.id);

export function accessoryTypeLabel(type) {
  return VEHICLE_ACCESSORY_TYPES.find((t) => t.id === type)?.label || type;
}

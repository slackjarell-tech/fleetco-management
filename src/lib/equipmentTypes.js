/**
 * Standard equipment taxonomy for vehicles and load posting.
 * Values align with common load-board categories (DAT, Truckstop, etc.) for future syndication.
 */
export const EQUIPMENT_CATEGORIES = [
  {
    id: 'power_only',
    label: 'Power Only',
    description: 'Tractor only — shipper provides trailer',
    datCode: 'PO',
  },
  {
    id: 'cargo_van',
    label: 'Cargo Van / Sprinter',
    description: 'Small box or cargo van',
    datCode: 'SV',
  },
  {
    id: 'box_truck',
    label: 'Box Truck / Straight Truck',
    description: 'Single-unit straight truck with box body',
    datCode: 'SB',
  },
  {
    id: 'box_truck_liftgate',
    label: 'Box Truck w/ Liftgate',
    description: 'Straight truck with liftgate',
    datCode: 'SB',
  },
  {
    id: 'dry_van',
    label: 'Dry Van',
    description: '53\' or shorter dry van trailer',
    datCode: 'V',
  },
  {
    id: 'reefer',
    label: 'Reefer / Refrigerated',
    description: 'Temperature-controlled trailer',
    datCode: 'R',
  },
  {
    id: 'flatbed',
    label: 'Flatbed',
    description: 'Open flatbed trailer',
    datCode: 'F',
  },
  {
    id: 'step_deck',
    label: 'Step Deck / Drop Deck',
    description: 'Step deck or drop deck trailer',
    datCode: 'SD',
  },
  {
    id: 'lowboy',
    label: 'Lowboy / RGN',
    description: 'Heavy haul lowboy or removable gooseneck',
    datCode: 'LB',
  },
  {
    id: 'conestoga',
    label: 'Conestoga / Curtainside',
    description: 'Rolling tarp or curtainside flatbed',
    datCode: 'CN',
  },
  {
    id: 'tanker',
    label: 'Tanker',
    description: 'Liquid bulk tank trailer',
    datCode: 'T',
  },
  {
    id: 'hotshot',
    label: 'Hotshot',
    description: 'Pickup + gooseneck or small flatbed',
    datCode: 'HS',
  },
  {
    id: 'car_hauler',
    label: 'Car Hauler / Auto Transport',
    description: 'Multi-level auto carrier',
    datCode: 'AC',
  },
  {
    id: 'dedicated',
    label: 'Dedicated / Team',
    description: 'Dedicated lane or team driver required',
    datCode: 'V',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other equipment — specify in notes',
    datCode: 'O',
  },
];

export const EQUIPMENT_IDS = EQUIPMENT_CATEGORIES.map((e) => e.id);

/** Optional add-ons that can apply to a load or vehicle */
export const EQUIPMENT_ACCESSORIES = [
  { id: 'liftgate', label: 'Liftgate Required' },
  { id: 'team', label: 'Team Drivers' },
  { id: 'hazmat', label: 'Hazmat' },
  { id: 'tarp', label: 'Tarp Required' },
  { id: 'chains_binders', label: 'Chains & Binders' },
  { id: 'pallet_jack', label: 'Pallet Jack' },
  { id: 'appointment', label: 'Appointment Required' },
  { id: 'twic', label: 'TWIC Card Required' },
];

export function equipmentLabel(id) {
  return EQUIPMENT_CATEGORIES.find((e) => e.id === id)?.label || id || '—';
}

export function equipmentDatCode(id) {
  return EQUIPMENT_CATEGORIES.find((e) => e.id === id)?.datCode || 'O';
}

export function accessoryLabel(id) {
  return EQUIPMENT_ACCESSORIES.find((a) => a.id === id)?.label || id;
}

/** Map legacy trailer_type strings to equipment id */
export function trailerTypeToEquipment(trailerType) {
  const map = {
    'Dry Van': 'dry_van',
    Reefer: 'reefer',
    Flatbed: 'flatbed',
    'Step Deck': 'step_deck',
    Lowboy: 'lowboy',
    Tanker: 'tanker',
    Curtainside: 'conestoga',
  };
  return map[trailerType] || null;
}

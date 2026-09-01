/** FleetCo Safety AI — event labels and UI helpers. */

export const SAFETY_EVENT_LABELS = {
  lane_departure: 'Lane Departure',
  lane_split: 'Lane Split / Weaving',
  distraction: 'Driver Distraction',
  drowsiness: 'Drowsiness',
  phone_use: 'Phone Use',
  impaired: 'Possible Impairment',
  tailgating: 'Tailgating',
  harsh_braking: 'Harsh Braking',
  no_seatbelt: 'No Seatbelt',
  other: 'Safety Alert',
};

export const SEVERITY_COLORS = {
  low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  medium: 'bg-orange-100 text-orange-800 border-orange-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-red-600 text-white border-red-700',
};

export function safetyEventLabel(type) {
  return SAFETY_EVENT_LABELS[type] || SAFETY_EVENT_LABELS.other;
}

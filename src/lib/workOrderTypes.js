/**
 * Work order taxonomy: maintenance strategy → repair type.
 * Preventive = scheduled routine care; Corrective = unplanned breakdown;
 * Predictive = condition/data-driven before failure.
 */

export const MAINTENANCE_STRATEGIES = ['preventive', 'corrective', 'predictive'];

export const MAINTENANCE_STRATEGY_META = {
  preventive: {
    id: 'preventive',
    label: 'Preventive Maintenance',
    shortLabel: 'Preventive',
    description:
      'Scheduled, routine care (oil changes, filter replacements, fluid checks, and the 30-60-90 rule) done to stop parts from failing before their time.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  corrective: {
    id: 'corrective',
    label: 'Corrective (Reactive) Maintenance',
    shortLabel: 'Corrective',
    description: 'Unplanned repairs performed after a component breaks down or malfunctions.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  predictive: {
    id: 'predictive',
    label: 'Predictive Maintenance',
    shortLabel: 'Predictive',
    description:
      'Work triggered by condition monitoring—diagnostic codes, telematics, oil analysis, or sensors—before a hard failure.',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
};

/** Repair types grouped under each maintenance strategy */
export const REPAIR_TYPES_BY_STRATEGY = {
  preventive: [
    { value: 'PM — Oil & Filter Change', hint: 'Engine oil, filters per interval' },
    { value: 'PM — Fluids & Lubrication', hint: 'Coolant, trans, diff, grease points' },
    { value: 'PM — 30-60-90 Service', hint: 'Mileage-based scheduled package' },
    { value: 'PM — Filter Replacement', hint: 'Air, fuel, cabin, DEF filters' },
    { value: 'PM — Tire Rotation & Pressure', hint: 'Scheduled tire program' },
    { value: 'PM — DOT / Annual Inspection', hint: 'Regulatory / safety inspection' },
    { value: 'PM — Belt & Hose Inspection', hint: 'Wear items on schedule' },
    { value: 'PM — Accessory Service', hint: 'Reefer, crane, welder PM' },
  ],
  corrective: [
    { value: 'Engine', hint: 'Breakdown or performance failure' },
    { value: 'Transmission', hint: 'Shift, slip, or leak repair' },
    { value: 'Brakes', hint: 'Unplanned brake repair' },
    { value: 'Tires', hint: 'Road damage, blowout, irregular wear' },
    { value: 'Electrical', hint: 'Wiring, alternator, lighting failure' },
    { value: 'HVAC', hint: 'A/C or heat not working' },
    { value: 'Suspension', hint: 'Ride, alignment, springs/shocks' },
    { value: 'Fuel System', hint: 'Leaks, pumps, injectors' },
    { value: 'Exhaust', hint: 'Aftertreatment, muffler, leaks' },
    { value: 'Body & Frame', hint: 'Collision, doors, body damage' },
    { value: 'Other', hint: 'General unplanned repair' },
  ],
  predictive: [
    { value: 'Predictive — Diagnostic Code (DTC)', hint: 'Check engine / ABS / ECU alert' },
    { value: 'Predictive — Telematics Alert', hint: 'Fleet device flagged condition' },
    { value: 'Predictive — Oil Analysis', hint: 'Lab sample out of spec' },
    { value: 'Predictive — Vibration / Sensor', hint: 'Unusual vibration or sensor trend' },
    { value: 'Predictive — Emissions / DEF', hint: 'DEF/SCR trend before derate' },
    { value: 'Predictive — Battery / Electrical Health', hint: 'Voltage, cranking, parasitic draw' },
    { value: 'Predictive — Tire Pressure / Wear Trend', hint: 'TPMS or tread monitoring' },
  ],
};

/** Legacy flat repair_type values → strategy + modern repair_type */
const LEGACY_REPAIR_TYPE_MAP = {
  'Preventive Maintenance': { strategy: 'preventive', repair_type: 'PM — Oil & Filter Change' },
  Engine: { strategy: 'corrective', repair_type: 'Engine' },
  Transmission: { strategy: 'corrective', repair_type: 'Transmission' },
  Brakes: { strategy: 'corrective', repair_type: 'Brakes' },
  Tires: { strategy: 'corrective', repair_type: 'Tires' },
  Electrical: { strategy: 'corrective', repair_type: 'Electrical' },
  HVAC: { strategy: 'corrective', repair_type: 'HVAC' },
  Suspension: { strategy: 'corrective', repair_type: 'Suspension' },
  'Fuel System': { strategy: 'corrective', repair_type: 'Fuel System' },
  Exhaust: { strategy: 'corrective', repair_type: 'Exhaust' },
  'Body & Frame': { strategy: 'corrective', repair_type: 'Body & Frame' },
  Other: { strategy: 'corrective', repair_type: 'Other' },
};

export function repairTypesForStrategy(strategy) {
  return REPAIR_TYPES_BY_STRATEGY[strategy] || REPAIR_TYPES_BY_STRATEGY.corrective;
}

export function allRepairTypeValues() {
  return MAINTENANCE_STRATEGIES.flatMap((s) => repairTypesForStrategy(s).map((t) => t.value));
}

export function inferStrategyFromRepairType(repairType) {
  if (!repairType) return 'corrective';
  for (const strategy of MAINTENANCE_STRATEGIES) {
    if (repairTypesForStrategy(strategy).some((t) => t.value === repairType)) return strategy;
  }
  if (repairType.startsWith('PM —') || repairType.startsWith('Predictive —')) {
    return repairType.startsWith('PM —') ? 'preventive' : 'predictive';
  }
  const legacy = LEGACY_REPAIR_TYPE_MAP[repairType];
  return legacy?.strategy || 'corrective';
}

export function normalizeRepairTypeAndStrategy(repairType, maintenanceStrategy) {
  let rt = repairType || 'Other';
  let strategy = maintenanceStrategy;

  if (LEGACY_REPAIR_TYPE_MAP[rt] && !repairTypesForStrategy('preventive').some((t) => t.value === rt)
    && !repairTypesForStrategy('predictive').some((t) => t.value === rt)) {
    const mapped = LEGACY_REPAIR_TYPE_MAP[rt];
    if (rt === 'Preventive Maintenance' || !strategy) {
      strategy = mapped.strategy;
      rt = mapped.repair_type;
    }
  }

  if (!strategy) strategy = inferStrategyFromRepairType(rt);

  const allowed = repairTypesForStrategy(strategy).map((t) => t.value);
  if (!allowed.includes(rt)) {
    rt = allowed[0] || 'Other';
  }

  return { repair_type: rt, maintenance_strategy: strategy };
}

export function resolveWorkOrderMaintenance(wo) {
  return normalizeRepairTypeAndStrategy(wo?.repair_type, wo?.maintenance_strategy);
}

export function maintenanceStrategyLabel(strategy) {
  return MAINTENANCE_STRATEGY_META[strategy]?.label || strategy || 'Corrective';
}

export function maintenanceStrategyShortLabel(strategy) {
  return MAINTENANCE_STRATEGY_META[strategy]?.shortLabel || strategy || 'Corrective';
}

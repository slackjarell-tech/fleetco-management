/**
 * Ideal Customer Profile (ICP) targets for FleetCo outreach.
 * Examples are research prospects — not customers unless they appear in Inquiries.
 */
import { PRICE_PER_UNIT_MONTHLY } from './roles.js';

const APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';

/** @typedef {{ id: string, name: string, region?: string, fleet_hint?: string, fit_note?: string }} TargetExample */

/** @typedef {{ id: string, label: string, fleet_size: string, pain_points: string[], why_fleetco: string, search_tips: string[], examples: TargetExample[] }} TargetSegment */

export const TARGET_SEGMENTS = [
  {
    id: 'owner_operator',
    label: 'Owner-operators & micro-fleets',
    fleet_size: '1–5 power units',
    pain_points: [
      'Spreadsheets for maintenance, fuel, and IFTA',
      'No single place for loads, invoices, and driver pay',
      'Dashcam and compliance scattered across apps',
    ],
    why_fleetco: `One portal + driver app from $${PRICE_PER_UNIT_MONTHLY}/unit/mo — maintenance, HOS, payroll, and billing without enterprise TMS cost.`,
    search_tips: [
      'FMCSA SAFER — carriers with 1–5 power units in your state',
      'LinkedIn: "owner operator" + your metro + "fleet"',
      'Facebook groups: O/O and small fleet maintenance',
    ],
    examples: [
      { id: 'oo-1', name: 'Independent authority holders (SAFER MC search)', region: 'National', fleet_hint: '1–3 trucks', fit_note: 'High pain on admin time; strong fit for portal + driver app' },
      { id: 'oo-2', name: 'Lease-purchase operators building to 5 trucks', region: 'National', fleet_hint: '2–5', fit_note: 'Outgrowing QuickBooks + Google Sheets' },
      { id: 'oo-3', name: 'Hotshot / expedited O/O fleets', region: 'South & Midwest', fleet_hint: '1–4', fit_note: 'Need loads, maintenance, and fuel in one workflow' },
      { id: 'oo-4', name: 'Pacific NW logging & heavy haul O/Os', region: 'WA, OR, ID', fleet_hint: '1–6', fit_note: 'Seasonal peaks — unit-based pricing scales down' },
      { id: 'oo-5', name: 'Flatbed O/Os with trailer tracking needs', region: 'National', fleet_hint: '1–5', fit_note: 'Trailer sign-in on driver app without trailer GPS' },
    ],
  },
  {
    id: 'regional_carrier',
    label: 'Regional dry van / reefer carriers',
    fleet_size: '10–75 tractors',
    pain_points: [
      'Legacy TMS or disjointed dispatch + accounting',
      'Driver turnover and payroll reconciliation',
      'Compliance audits spread across paper and email',
    ],
    why_fleetco: 'Unified fleet map, work orders, payroll, and IFTA without six-figure enterprise contracts.',
    search_tips: [
      'SAFER — carriers 10–50 power units, intrastate + interstate',
      'DAT / Truckstop company profiles in your lane regions',
      'State trucking association member directories',
    ],
    examples: [
      { id: 'reg-1', name: 'Intrastate reefer carriers (regional grocery lanes)', region: 'Southeast', fleet_hint: '15–40', fit_note: 'Maintenance + temperature compliance' },
      { id: 'reg-2', name: 'Midwest dry van family carriers', region: 'IL, IN, OH, MI', fleet_hint: '20–60', fit_note: 'Often still on QuickBooks + Excel dispatch' },
      { id: 'reg-3', name: 'Texas regional flatbed fleets', region: 'TX, OK', fleet_hint: '10–35', fit_note: 'Equipment-heavy — work order + parts inventory fit' },
      { id: 'reg-4', name: 'Northeast LTL-style regional carriers', region: 'PA, NJ, NY', fleet_hint: '25–75', fit_note: 'Payroll + driver app adoption gap' },
      { id: 'reg-5', name: 'Mountain West regional carriers', region: 'CO, UT, WY', fleet_hint: '12–45', fit_note: 'IFTA + mountain route compliance' },
    ],
  },
  {
    id: 'construction_haul',
    label: 'Construction, aggregate & dump fleets',
    fleet_size: '5–40 trucks',
    pain_points: [
      'Equipment + truck maintenance in different systems',
      'Job costing and fuel by project unclear',
      'Driver time clock vs payroll disputes',
    ],
    why_fleetco: 'Fleet units, time clock, work orders, and P&L views tied to operations — built for asset-heavy fleets.',
    search_tips: [
      'Google Maps: "aggregate hauling" / "heavy haul" near quarry markets',
      'AGC and local contractor subcontractor lists',
      'LinkedIn: fleet manager at construction logistics firms',
    ],
    examples: [
      { id: 'con-1', name: 'Ready-mix & concrete haul subcontractors', region: 'Metro areas', fleet_hint: '8–25', fit_note: 'High maintenance volume' },
      { id: 'con-2', name: 'Sand & gravel haulers (quarry to job site)', region: 'Sun Belt & PNW', fleet_hint: '10–30', fit_note: 'Fuel + mileage by job' },
      { id: 'con-3', name: 'Demolition & debris box truck fleets', region: 'Urban', fleet_hint: '5–20', fit_note: 'Inspection + incident tracking' },
      { id: 'con-4', name: 'Pipeline & utility contractors with truck pools', region: 'National', fleet_hint: '15–50', fit_note: 'Multi-state payroll tax profiles' },
      { id: 'con-5', name: 'Asphalt & paving company private fleets', region: 'Seasonal markets', fleet_hint: '6–35', fit_note: 'Seasonal scale — per-unit pricing' },
    ],
  },
  {
    id: 'food_beverage',
    label: 'Food service & beverage distribution',
    fleet_size: '8–60 delivery tractors',
    pain_points: [
      'Route compliance and driver safety programs',
      'Refrigerated unit maintenance tracking',
      'High insurance — need dashcam and scorecards',
    ],
    why_fleetco: 'Driver app dashcam, scorecards, maintenance, and compliance in one stack.',
    search_tips: [
      'Local beer/wine distributors and broadline foodservice',
      'Dairy and bakery route companies',
      'LinkedIn "distribution fleet manager"',
    ],
    examples: [
      { id: 'food-1', name: 'Regional beer & beverage distributors', region: 'Multi-state', fleet_hint: '20–80', fit_note: 'Route-heavy — driver app focus' },
      { id: 'food-2', name: 'Independent broadline foodservice distributors', region: 'Regional', fleet_hint: '15–45', fit_note: 'Competing with Sysco-level IT on a budget' },
      { id: 'food-3', name: 'Dairy route operators', region: 'Midwest / Northeast', fleet_hint: '10–30', fit_note: 'Early AM shifts — time clock accuracy' },
      { id: 'food-4', name: 'Specialty cold chain regional carriers', region: 'National niches', fleet_hint: '12–40', fit_note: 'Reefer maintenance + HOS' },
      { id: 'food-5', name: 'Coffee & snack route fleets', region: 'Metro', fleet_hint: '5–25', fit_note: 'Stop-level efficiency' },
    ],
  },
  {
    id: 'mobile_fleet_service',
    label: 'Mobile fleet maintenance & field service',
    fleet_size: 'Service vans + customer fleets',
    pain_points: [
      'Scheduling field techs and parts without shop software',
      'Customer fleets want visibility — you need a portal story',
      'Quoting and work orders on paper',
    ],
    why_fleetco: 'White-label style customer portals, work orders, and parts — aligns with mobile maintenance dealers.',
    search_tips: [
      'Search "mobile fleet maintenance" + state',
      'FSI-style dealers and NAPA fleet partners',
      'LinkedIn: mobile diesel repair company owners',
    ],
    examples: [
      { id: 'mob-1', name: 'Mobile diesel repair operators (2–10 tech vans)', region: 'National', fleet_hint: 'Service business', fit_note: 'Use FleetCo for their customers\' fleet records' },
      { id: 'mob-2', name: 'On-site fleet service companies (FSI-adjacent model)', region: 'Sun Belt', fleet_hint: 'Dealer network', fit_note: 'Portal per customer company' },
      { id: 'mob-3', name: 'Tire & PM route service providers', region: 'Regional', fleet_hint: 'Vans + PM contracts', fit_note: 'Work order + customer messaging' },
      { id: 'mob-4', name: 'Fleet washing & preventive maintenance routes', region: 'Metro', fleet_hint: '5–15 vans', fit_note: 'Recurring work orders' },
      { id: 'mob-5', name: 'Equipment rental companies with delivery trucks', region: 'National', fleet_hint: '10–40', fit_note: 'Asset + truck combined ops' },
    ],
  },
  {
    id: 'waste_recycling',
    label: 'Waste, recycling & environmental haulers',
    fleet_size: '10–100 roll-offs / trucks',
    pain_points: [
      'Safety incidents and DOT audits',
      'Heavy maintenance on vocational trucks',
      'Driver shortage — need simple mobile tools',
    ],
    why_fleetco: 'Compliance tracker, inspections, maintenance, and driver app for vocational fleets.',
    search_tips: [
      'State waste hauler licensing lists',
      'Independent haulers competing with national brands',
      'Environmental services roll-off operators',
    ],
    examples: [
      { id: 'waste-1', name: 'Independent roll-off haulers', region: 'Suburban markets', fleet_hint: '15–60', fit_note: 'Maintenance-heavy vocational fleet' },
      { id: 'waste-2', name: 'Recycling collection regional operators', region: 'West Coast', fleet_hint: '20–80', fit_note: 'Municipal contract compliance' },
      { id: 'waste-3', name: 'Liquid waste & septic truck fleets', region: 'Rural + suburban', fleet_hint: '5–25', fit_note: 'Route + inspection logs' },
      { id: 'waste-4', name: 'Port & intermodal drayage small fleets', region: 'Coastal ports', fleet_hint: '10–40', fit_note: 'Chassis + container tracking pain' },
      { id: 'waste-5', name: 'Environmental remediation truck fleets', region: 'National', fleet_hint: '8–30', fit_note: 'Incident reporting critical' },
    ],
  },
  {
    id: 'passenger_charter',
    label: 'Charter, shuttle & passenger motor carriers',
    fleet_size: '5–50 buses / coaches',
    pain_points: [
      'Driver qualification files and hours tracking',
      'Maintenance for mixed bus fleet',
      'Booking and ops often separate from fleet data',
    ],
    why_fleetco: 'Compliance and maintenance modules adapt to mixed unit types; per-unit pricing fits seasonal demand.',
    search_tips: [
      'State PUC charter carrier lists',
      'School contract shuttle operators (private)',
      'Airport parking shuttle companies',
    ],
    examples: [
      { id: 'pax-1', name: 'Regional charter bus operators', region: 'Tourism markets', fleet_hint: '8–35', fit_note: 'Seasonal fleet size swings' },
      { id: 'pax-2', name: 'Employee shuttle contractors (corporate campuses)', region: 'Tech hubs', fleet_hint: '10–40', fit_note: 'On-time + compliance' },
      { id: 'pax-3', name: 'Airport parking & hotel shuttle fleets', region: 'Metro', fleet_hint: '5–20', fit_note: 'High driver churn' },
      { id: 'pax-4', name: 'Casino & tour shuttle operators', region: 'Gaming markets', fleet_hint: '10–25', fit_note: 'Night-shift payroll' },
      { id: 'pax-5', name: 'NEMT (non-emergency medical transport) regional providers', region: 'State Medicaid markets', fleet_hint: '15–60', fit_note: 'Compliance documentation load' },
    ],
  },
  {
    id: 'ag_livestock',
    label: 'Agriculture, livestock & bulk commodity',
    fleet_size: '5–40 trucks',
    pain_points: [
      'Seasonal hiring and payroll spikes',
      'Spread-out operations — need mobile-first tools',
      'Maintenance on trailers and hopper fleets',
    ],
    why_fleetco: 'Payroll, driver app, and fleet map for dispersed rural operations.',
    search_tips: [
      'Co-op and grain elevator trucking partners',
      'Livestock hauler associations by state',
      'Fertilizer & agronomy delivery fleets',
    ],
    examples: [
      { id: 'ag-1', name: 'Grain & commodity haulers (elevator to port)', region: 'Plains states', fleet_hint: '10–35', fit_note: 'Harvest season scale' },
      { id: 'ag-2', name: 'Livestock haulers (regional)', region: 'Central US', fleet_hint: '5–20', fit_note: 'Hours + welfare compliance' },
      { id: 'ag-3', name: 'Timber & logging truck contractors', region: 'PNW / South', fleet_hint: '8–30', fit_note: 'Weight compliance + maintenance' },
      { id: 'ag-4', name: 'Fertilizer & agronomy delivery fleets', region: 'Farm belt', fleet_hint: '6–25', fit_note: 'Seasonal unit count' },
      { id: 'ag-5', name: 'Produce haul regional carriers', region: 'CA, FL, TX', fleet_hint: '12–40', fit_note: 'Reefer + tight windows' },
    ],
  },
];

export function listTargetSegments() {
  return TARGET_SEGMENTS.map(({ examples, ...rest }) => ({
    ...rest,
    example_count: examples.length,
  }));
}

export function listTargetCompanies({ segmentId, limit = 100 } = {}) {
  let rows = [];
  for (const seg of TARGET_SEGMENTS) {
    if (segmentId && seg.id !== segmentId) continue;
    for (const ex of seg.examples) {
      rows.push({
        ...ex,
        segment_id: seg.id,
        segment_label: seg.label,
        fleet_size: seg.fleet_size,
        why_fleetco: seg.why_fleetco,
      });
    }
  }
  return rows.slice(0, Math.min(limit, 200));
}

export function getTargetSegment(segmentId) {
  return TARGET_SEGMENTS.find((s) => s.id === segmentId) || null;
}

/** Deterministic daily focus — rotates segment + example without random API cost. */
export function pickDailyTargetFocus(date = new Date()) {
  const dayIndex = Math.floor(date.getTime() / 86400000);
  const seg = TARGET_SEGMENTS[dayIndex % TARGET_SEGMENTS.length];
  const ex = seg.examples[dayIndex % seg.examples.length];
  return { segment: seg, example: ex, dayIndex };
}

export function buildSegmentSocialCopy({ segment, example, platform = 'linkedin' }) {
  const hook = example?.name || segment.label;
  const pain = segment.pain_points[0] || 'fleet admin chaos';
  const tags = platform === 'linkedin'
    ? '#fleetmanagement #trucking #logistics #FleetCo'
    : '#trucking #fleetmanagement #FleetCo';
  return [
    `${hook} — ${segment.fleet_size} fleets often struggle with ${pain.toLowerCase()}.`,
    '',
    `FleetCo Management: maintenance, compliance, payroll, and driver tools in one portal — $${PRICE_PER_UNIT_MONTHLY}/unit/month.`,
    '',
    APP_URL,
    '',
    tags,
  ].join('\n');
}

export function buildOutreachAngleText({ segment, example }) {
  const name = example?.name || segment.label;
  return [
    `**Outreach angle — ${name}**`,
    `Segment: ${segment.label} (${segment.fleet_size})`,
    '',
    'Pain to mention:',
    ...segment.pain_points.slice(0, 3).map((p) => `- ${p}`),
    '',
    'FleetCo pitch:',
    segment.why_fleetco,
    '',
    'Discovery questions:',
    '- How do you track maintenance and compliance today?',
    '- Where does driver payroll data come from (time clock, ELD, paper)?',
    `- Would $${PRICE_PER_UNIT_MONTHLY}/unit/month beat your current software spend?`,
    '',
    `Demo: ${APP_URL}`,
  ].join('\n');
}

export function formatTargetCompaniesMarkdown({ segmentId, limit = 25 } = {}) {
  const companies = listTargetCompanies({ segmentId, limit });
  if (!companies.length) return 'No targets matched that segment.';
  const lines = ['**FleetCo ICP target list** (research prospects — verify before outreach)', ''];
  let lastSeg = '';
  companies.forEach((c, i) => {
    if (c.segment_label !== lastSeg) {
      lastSeg = c.segment_label;
      lines.push(`### ${lastSeg} (${c.fleet_size})`);
    }
    lines.push(`${i + 1}. **${c.name}**${c.region ? ` — ${c.region}` : ''}${c.fleet_hint ? ` · ~${c.fleet_hint} units` : ''}`);
    if (c.fit_note) lines.push(`   ${c.fit_note}`);
  });
  lines.push('', `_Total segments: ${TARGET_SEGMENTS.length} · Examples listed: ${companies.length}_`);
  return lines.join('\n');
}

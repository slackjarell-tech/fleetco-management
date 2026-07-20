/** FleetCo 10-year financial model — shared by business plan and revenue PDFs. */

export const PRICING = {
  Starter: { monthly: 299, yearly: 3229, fleetMax: 5 },
  Growth: { monthly: 599, yearly: 6471, fleetMax: 15 },
  Enterprise: { monthly: 1200, yearly: 12960, fleetMin: 16 },
};

export const ASSUMPTIONS = {
  modelStartYear: 2026,
  grossMarginPct: 68,
  billingMix: { monthly: 0.7, yearly: 0.3 },
  yearlyDiscountPct: 10,
  startingCustomers: 0,
  churnStartPct: 10,
  churnEndPct: 6,
};

/** Base-case 10-year projection (Year 1 = first commercial year). */
export const BASE_PROJECTION = [
  { year: 1, calendar: 2026, customersEoy: 18, netNew: 18, arpuMonthly: 450, annualRevenue: 48600, arrEoy: 97200, yoyGrowthPct: null, avgCustomers: 9, grossProfit: 33048, opex: 180000, ebitda: -146952 },
  { year: 2, calendar: 2027, customersEoy: 42, netNew: 27, arpuMonthly: 470, annualRevenue: 169200, arrEoy: 236880, yoyGrowthPct: 248, avgCustomers: 30, grossProfit: 115056, opex: 280000, ebitda: -164944 },
  { year: 3, calendar: 2028, customersEoy: 85, netNew: 46, arpuMonthly: 485, annualRevenue: 366660, arrEoy: 494700, yoyGrowthPct: 117, avgCustomers: 63, grossProfit: 249329, opex: 380000, ebitda: -130671 },
  { year: 4, calendar: 2029, customersEoy: 145, netNew: 65, arpuMonthly: 500, annualRevenue: 690000, arrEoy: 870000, yoyGrowthPct: 88, avgCustomers: 115, grossProfit: 469200, opex: 520000, ebitda: -50800 },
  { year: 5, calendar: 2030, customersEoy: 220, netNew: 82, arpuMonthly: 515, annualRevenue: 1124760, arrEoy: 1359600, yoyGrowthPct: 63, avgCustomers: 182, grossProfit: 764837, opex: 680000, ebitda: 84837 },
  { year: 6, calendar: 2031, customersEoy: 310, netNew: 97, arpuMonthly: 535, annualRevenue: 1701300, arrEoy: 1990200, yoyGrowthPct: 51, avgCustomers: 265, grossProfit: 1156884, opex: 900000, ebitda: 256884 },
  { year: 7, calendar: 2032, customersEoy: 410, netNew: 107, arpuMonthly: 555, annualRevenue: 2397600, arrEoy: 2730600, yoyGrowthPct: 41, avgCustomers: 360, grossProfit: 1630368, opex: 1150000, ebitda: 480368 },
  { year: 8, calendar: 2033, customersEoy: 520, netNew: 118, arpuMonthly: 575, annualRevenue: 3207000, arrEoy: 3588000, yoyGrowthPct: 34, avgCustomers: 465, grossProfit: 2180760, opex: 1450000, ebitda: 730760 },
  { year: 9, calendar: 2034, customersEoy: 640, netNew: 132, arpuMonthly: 590, annualRevenue: 4106400, arrEoy: 4531200, yoyGrowthPct: 28, avgCustomers: 580, grossProfit: 2792352, opex: 1750000, ebitda: 1042352 },
  { year: 10, calendar: 2035, customersEoy: 780, netNew: 152, arpuMonthly: 610, annualRevenue: 5197200, arrEoy: 5709600, yoyGrowthPct: 27, avgCustomers: 710, grossProfit: 3534096, opex: 2100000, ebitda: 1434096 },
];

export const SCENARIOS_Y10 = {
  conservative: { label: 'Conservative', customersEoy: 520, arpuMonthly: 520, arrEoy: 3244800, annualRevenue: 2970000 },
  base: { label: 'Base Case', customersEoy: 780, arpuMonthly: 610, arrEoy: 5709600, annualRevenue: 5197200 },
  optimistic: { label: 'Optimistic', customersEoy: 1050, arpuMonthly: 680, arrEoy: 8568000, annualRevenue: 7812000 },
};

export const SCENARIOS_Y5 = {
  conservative: { label: 'Conservative', customersEoy: 160, arpuMonthly: 480, arrEoy: 921600, annualRevenue: 768000 },
  base: { label: 'Base Case', customersEoy: 220, arpuMonthly: 515, arrEoy: 1359600, annualRevenue: 1124760 },
  optimistic: { label: 'Optimistic', customersEoy: 280, arpuMonthly: 550, arrEoy: 1848000, annualRevenue: 1512000 },
};

export const MILESTONES = [
  { when: 'Month 14 (~Year 2)', metric: 'First $100K ARR' },
  { when: 'Year 5', metric: '$1M+ ARR · EBITDA break-even' },
  { when: 'Year 7', metric: '$2.5M+ ARR · 410 customers' },
  { when: 'Year 10', metric: '$5.7M ARR · ~780 customers · ~4,500+ vehicles under management' },
];

export const CUMULATIVE_REVENUE = BASE_PROJECTION.reduce((sum, row) => sum + row.annualRevenue, 0);

export function formatCurrency(n, compact = false) {
  if (compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
    return `$${n.toLocaleString()}`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}

export function formatPct(n) {
  if (n == null) return '—';
  return `${n}%`;
}

export function ebitdaMargin(row) {
  if (!row.annualRevenue) return null;
  return Math.round((row.ebitda / row.annualRevenue) * 100);
}

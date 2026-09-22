import { PRICE_PER_UNIT_MONTHLY, YEARLY_DISCOUNT_PERCENT } from './roles.js';

const APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';

export const FLEETCO_PRICING = {
  model: 'per_unit',
  price_per_unit_monthly_usd: PRICE_PER_UNIT_MONTHLY,
  yearly_discount_percent: YEARLY_DISCOUNT_PERCENT,
  summary: `$${PRICE_PER_UNIT_MONTHLY}/unit/month — 5% discount when billed annually.`,
};

export const FLEETCO_FEATURES = {
  fleet: 'Fleet units, work orders, maintenance, yard management, live fleet map, TCO and P&L.',
  payroll: 'Driver payroll, time clock, direct deposit export, HR tax profiles.',
  compliance: 'ELD/HOS, IFTA, inspections, pre-trip, incident reports, compliance tracker.',
  drivers: 'Driver app — dashcam, routes, fuel, scans, trailer sign-in, video reviews.',
  marketing: 'Website FleetCo Guide chat, autopilot nurture emails, SLT Marketing AI dashboard.',
  default: 'All-in-one portal for owner-operators and small fleets: operations, fleet, payroll, compliance, finance.',
};

export const SOCIAL_POST_TEMPLATES = {
  facebook: [
    `Owner-operators: run fleet, payroll, and compliance from one portal — not five spreadsheets.\n\n${APP_URL}\n\n#fleetmanagement #trucking #FleetCo`,
    `FleetCo Driver app — dashcam, routes, fuel logs, and time clock on one phone.\n\nSee it at ${APP_URL}\n\n#trucking #fleettech`,
  ],
  linkedin: [
    `Small fleets lose hours to admin. FleetCo Management unifies maintenance, IFTA, payroll, and dispatch in one platform — $${PRICE_PER_UNIT_MONTHLY}/unit/month.\n\n${APP_URL}`,
    `New: live fleet map with truck GPS, trailer sign-in (no trailer GPS needed), and daily route trails.\n\nBuilt for owner-operators → ${APP_URL}`,
  ],
  instagram: [
    `Built for trucking — not generic SaaS. Fleet + drivers + payroll in one place.\n\nLink in bio: ${APP_URL.replace('https://', '')}`,
  ],
  x: [
    `FleetCo: $${PRICE_PER_UNIT_MONTHLY}/unit/mo — fleet portal + driver app + payroll. No HubSpot required for lead nurture.\n\n${APP_URL}`,
  ],
};

export function pickSocialTemplate(platform) {
  const list = SOCIAL_POST_TEMPLATES[platform] || SOCIAL_POST_TEMPLATES.facebook;
  return list[Math.floor(Math.random() * list.length)];
}

export function marketingFactsMarkdown() {
  return [
    '**FleetCo Marketing facts (internal)**',
    `- Pricing: ${FLEETCO_PRICING.summary}`,
    `- Website AI: FleetCo Guide captures leads → autopilot nurture (Resend)`,
    `- Autopilot: 4-step email sequence, runs every 15 minutes`,
    `- Social: weekly drafts Monday 9am CST; approve in SLT hub`,
    `- Daily report: 3:00 PM CST to SLT inbox`,
    `- No HubSpot/Apollo required`,
  ].join('\n');
}

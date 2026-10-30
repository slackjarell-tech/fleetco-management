/**
 * Investor deck: hosting economics, cost vs revenue, growth, full system & data scope.
 * Run: npm run marketing:investor-economics
 */
import PptxGenJS from 'pptxgenjs';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { BRAND } from '../marketing/brand.js';
import {
  BASE_PROJECTION,
  SCENARIOS_Y5,
  SCENARIOS_Y10,
  COMBINED_PROJECTION,
  ASSUMPTIONS,
  MILESTONES,
  SHOP_ASSUMPTIONS,
  formatCurrency,
} from '../marketing/financial-model.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'marketing');
const publicDir = path.join(__dirname, '..', 'public', 'marketing');
const FILE_NAME = 'FleetCo-Investor-Cost-Revenue-Analysis.pptx';
const outFile = path.join(outDir, FILE_NAME);

const NAVY = '0F172A';
const AMBER = 'F59E0B';
const SLATE = '64748B';
const WHITE = 'FFFFFF';
const LIGHT = 'F8FAFC';
const GREEN = '059669';
const RED = 'B91C1C';

const UNIT_PRICE_MO = 35;
const ANNUAL_UNIT_DISCOUNT_PCT = 5;

let slideNum = 0;

function footer(slide) {
  slideNum += 1;
  slide.addText(
    `${BRAND.shortName} · Investor economics · ${BRAND.url} · Slide ${slideNum} · Oct 2026`,
    { x: 0.4, y: 7.05, w: 12.6, h: 0.28, fontSize: 8, color: SLATE, align: 'center' },
  );
}

function sectionSlide(pptx, label, title, subtitle, dark = false) {
  const slide = pptx.addSlide();
  slide.background = { color: dark ? NAVY : LIGHT };
  slide.addText(label.toUpperCase(), {
    x: 0.55, y: 0.4, w: 12, h: 0.35, fontSize: 10, bold: true, color: AMBER, charSpace: 1.2,
  });
  slide.addText(title, {
    x: 0.55, y: 0.78, w: 12, h: 0.7, fontSize: 26, bold: true, color: dark ? WHITE : NAVY,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.55, y: 1.45, w: 12, h: 0.55, fontSize: 13, color: SLATE,
    });
  }
  footer(slide);
  return slide;
}

function bullets(slide, items, y = 2.0, fontSize = 12, color = NAVY) {
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })),
    { x: 0.65, y, w: 12, h: 6.5 - y, fontSize, color, valign: 'top', lineSpacingMultiple: 1.06 },
  );
}

function addTable(slide, headers, rows, y = 2.0) {
  const headRow = headers.map((h) => ({
    text: h,
    options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 },
  }));
  const body = rows.map((row) =>
    row.map((cell, i) => ({
      text: String(cell),
      options: {
        fontSize: 9,
        color: NAVY,
        fill: i === 0 ? { color: 'E2E8F0' } : undefined,
      },
    })),
  );
  slide.addTable([headRow, ...body], {
    x: 0.55,
    y,
    w: 12.2,
    colW: headers.map(() => 12.2 / headers.length),
    border: { pt: 0.5, color: SLATE },
    autoPage: false,
  });
}

/** Monthly revenue for n billable units */
function unitRevenueMo(units) {
  return units * UNIT_PRICE_MO;
}

/** Illustrative allocated infra + variable COGS per customer at scale */
function estCustomerCogsMo(units, platformCustomers = 50, videoHeavy = false) {
  const fixedPlatform = videoHeavy ? 185 : 95;
  const allocFixed = fixedPlatform / Math.max(platformCustomers, 1);
  const storagePerUnit = videoHeavy ? 2.5 : 0.85;
  const emailAndApi = 3.5;
  const supportAlloc = 8;
  const stripePct = unitRevenueMo(units) * 0.029 + 0.3;
  return allocFixed + units * storagePerUnit + emailAndApi + supportAlloc + stripePct;
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  slideNum = 0;
  const pptx = new PptxGenJS();
  pptx.author = BRAND.company;
  pptx.company = BRAND.shortName;
  pptx.title = `${BRAND.shortName} — Investor Cost & Revenue Analysis`;
  pptx.subject = 'Hosting economics, unit economics, growth projections, platform data scope';
  pptx.layout = 'LAYOUT_WIDE';

  const y5 = BASE_PROJECTION[4];
  const y10 = BASE_PROJECTION[9];
  const comb10 = COMBINED_PROJECTION[9];

  // Cover
  let slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.14, h: '100%', fill: { color: AMBER } });
  slide.addText('FLEETCO MANAGEMENT', { x: 0.75, y: 0.9, w: 11, h: 0.55, fontSize: 18, color: AMBER, charSpacing: 4 });
  slide.addText('Investor Cost & Revenue Analysis', {
    x: 0.75, y: 1.55, w: 11, h: 1.0, fontSize: 34, bold: true, color: WHITE,
  });
  slide.addText('Whole-system scope · hosting economics · unit & platform margins · 10-year growth', {
    x: 0.75, y: 2.65, w: 11, h: 0.9, fontSize: 16, color: SLATE,
  });
  slide.addText(`List price ${UNIT_PRICE_MO}/unit/month · ${ASSUMPTIONS.grossMarginPct}% modeled SaaS gross margin · Render production today`, {
    x: 0.75, y: 3.65, w: 11, h: 0.5, fontSize: 13, color: WHITE,
  });
  slide.addText(`${BRAND.url}  ·  ${BRAND.phone}  ·  Confidential`, {
    x: 0.75, y: 6.2, w: 10, h: 0.35, fontSize: 12, color: AMBER,
  });
  footer(slide);

  slide = sectionSlide(
    pptx,
    'Purpose',
    'What This Deck Answers for Investors',
    'Operational costs are not passed through as line items to customers — they determine margin at scale.',
  );
  bullets(slide, [
    'How much does it cost FleetCo to run the platform (fixed vs variable) on Render vs a typical AWS stack?',
    'What gross profit remains per customer at 5, 10, 25, and 50+ units when billing ~$35/unit/month?',
    'How do SaaS revenue, COGS, and EBITDA evolve in the base 10-year financial model (18 → 780 customers)?',
    'What data and modules exist today — creating retention, upsell, and a defensible operational record?',
    'Where optional spend (LiveKit video, Groq AI, R2 storage, Stripe) moves the cost curve?',
    'Combined upside: affiliated Fleet Services International (FSI) mobile territories alongside SaaS ARR.',
  ]);

  slide = sectionSlide(pptx, 'Executive summary', 'High-Margin SaaS on a Deep Operations Stack', null, true);
  bullets(slide, [
    `Commercial pricing: ${UNIT_PRICE_MO}/unit/month (5% discount on annual prepay) — full owner portal, customer portal, Android driver app`,
    `Base case Year 5: ${y5.customersEoy} customers · ${formatCurrency(y5.arrEoy, true)} SaaS ARR · EBITDA ${formatCurrency(y5.ebitda, true)} (first meaningful operating profit year in model)`,
    `Base case Year 10: ${y10.customersEoy} customers · ${formatCurrency(y10.arrEoy, true)} SaaS ARR · EBITDA ${formatCurrency(y10.ebitda, true)}`,
    comb10
      ? `Year 10 combined SaaS + ${SHOP_ASSUMPTIONS.entity}: ${formatCurrency(comb10.annualRevenue, true)} revenue · ${comb10.locationsEoy} FSI territories`
      : 'Year 10 combined revenue targets $12M+ with 12 FSI territories',
    `Illustrative infra at ~50 paying fleets: ~$95–185/mo platform fixed (no video vs heavy LiveKit) — highly leverageable as customers add units`,
    'Key investor takeaway: variable COGS per unit stays low; revenue scales linearly with fleet size under management',
  ], 1.95, 11, WHITE);

  slide = sectionSlide(pptx, 'Platform overview', 'FleetCo Command Center — One Multi-Tenant SaaS', 'Production: fleetcomanagement.org on Render (Node API + Vite SPA + JSON/SQL persistence).');
  bullets(slide, [
    'Roles: platform owner/executive, internal staff (dispatch, shop, finance), customer org admins, drivers (mobile)',
    'Stripe subscriptions & Connect for billing, load fees, and carrier payouts where enabled',
    'Resend transactional email; Groq-powered marketing guide & autopilot (optional API spend)',
    'LiveKit Cloud for live cab/yard video streams and ~15-day recording retention (optional, usage-sensitive)',
    'Persistent disk on Render for uploads; R2 mirror documented for video scale-out',
    'FleetCo Driver Android app: GPS breadcrumbs, barcode scans, routes, HOS duty events, POD — ties to same API',
  ]);

  slide = sectionSlide(pptx, 'Owner & staff modules', 'Operational Surface Area (Portal Tabs)', 'Each module generates structured records in the shared entity store.');
  bullets(slide, [
    'Dashboard · Fleet map (live locations, trails, yards) · Vehicles & accessories · Drivers & documents',
    'Dispatch & loads · Routes & stops · Work orders (preventive / corrective / predictive) · Maintenance schedules',
    'Fuel logs, cards, stations · IFTA-oriented reporting · Inspections · Incidents · HOS logs & FMCSA duty clocks',
    'Parts inventory · Vendors · Purchase orders · Service templates · Time clock & trailer assignments',
    'Accounting: chart of accounts, journal entries, invoices · Payroll runs & disbursements · Customer P&L views',
    'Dashcam sessions · Live stream sessions · Safety events · Marketing autopilot · Broker marketplace hooks',
  ], 1.95, 11);

  slide = sectionSlide(pptx, 'Customer portal', 'What Paying Carriers See (Scoped Data)', 'Customer users only access their organization’s entities — enforced server-side.');
  bullets(slide, [
    'Fleet visibility, fuel, maintenance status, documents, and invoices aligned to their units',
    'Load and dispatch collaboration where enabled · Messaging · Usage feedback',
    'Subscription and payment methods via Stripe · Trial and broker application flows',
    'Reduces support burden: self-service status vs phone tag across 5+ legacy tools',
    'Upsell path: more units, enterprise telematics integrations, video add-ons, FSI mobile PM contracts',
  ]);

  slide = sectionSlide(pptx, 'Data layer', '60+ Entity Types — Operational System of Record', 'Representative list from production API (server/index.js ENTITY_NAMES).');
  const entityGroups = [
    'Core fleet: Customer, Vehicle, VehicleDocument, VehicleAccessory, DriverDocument, Yard, YardPlacement, TrailerAssignment',
    'Movement & compliance: DriverLocation, HOSLog, HOSDutyEvent, Inspection, Incident, DrivingSafetyEvent, TimeClockEntry',
    'Maintenance: WorkOrder, MaintenanceSchedule, ServiceTemplate, PartInventory, Vendor, PurchaseOrder, DiagnosticCode',
    'Fuel & money: FuelLog, FuelCard, FuelStation, Invoice, ChartOfAccount, JournalEntry, PayrollRecord, PayrollRun, Subscription',
    'Dispatch & loads: Load, DeliveryRoute, DeliveryStop, LoadMessage, LoadMarketplaceEvent, BarcodeScan',
    'Video & safety: DashcamSession, DashcamFrame, LiveStreamSession, LiveStreamRecording',
    'Platform & growth: User, PortalActivity, Inquiry, TrialRequest, Marketing* entities, JobPosting, JobApplication',
  ];
  bullets(slide, entityGroups, 1.95, 10.5);

  slide = sectionSlide(pptx, 'Data value', 'Why the Data Moat Matters for Revenue & Retention', null, true);
  bullets(slide, [
    'Historical fuel, PM, and cost-per-mile data improves pricing and cross-sell (maintenance programs, fuel coaching)',
    'HOS and inspection records reduce compliance risk — switching cost rises after 12–24 months of logs',
    'GPS + work order linkage proves SLA performance for shipper contracts',
    'Aggregated (anonymized) benchmarks become a future analytics SKU for enterprise tiers',
    'FSI territories consume the same maintenance and vehicle data for on-site service scheduling',
  ], 1.95, 11, WHITE);

  slide = sectionSlide(pptx, 'Revenue model', 'How FleetCo Makes Money (SaaS)', `Public list price aligns with product copy: ${BRAND.pricing[0].price}.`);
  bullets(slide, [
    `${UNIT_PRICE_MO}/unit/month — bill only active units; annual prepay ~${ANNUAL_UNIT_DISCOUNT_PCT}% discount`,
    'Enterprise (50+ units): custom quote — telematics integrations, dedicated support, volume pricing',
    'Financial model ARPU (~$450–610/mo per customer by Year 1–10) reflects mix of fleet sizes, legacy tiers, and add-ons',
    'Stripe fees: ~2.9% + $0.30 on card revenue — modeled inside COGS, not charged separately to customers',
    'Future revenue: marketplace load fees, video storage tiers, payroll processing margins, FSI service contracts',
  ]);

  slide = sectionSlide(pptx, 'Pricing tiers (model)', 'Legacy Tier Assumptions in 10-Year Model', 'Used alongside per-unit pricing for ARPU blending in financial-model.mjs.');
  addTable(
    slide,
    ['Tier', 'Monthly', 'Yearly (disc.)', 'Fleet cap'],
    [
      ['Starter', '$299', '$3,229', '≤5 units'],
      ['Growth', '$599', '$6,471', '≤15 units'],
      ['Enterprise', '$1,200+', '$12,960+', '16+ units'],
      ['Per unit (live product)', `$${UNIT_PRICE_MO}/unit`, `${ANNUAL_UNIT_DISCOUNT_PCT}% off annual`, 'Any size'],
    ],
    2.05,
  );
  slide.addText(
    `Billing mix assumption: ${ASSUMPTIONS.billingMix.monthly * 100}% monthly / ${ASSUMPTIONS.billingMix.yearly * 100}% annual · Churn improves ${ASSUMPTIONS.churnStartPct}% → ${ASSUMPTIONS.churnEndPct}%`,
    { x: 0.55, y: 4.35, w: 12, h: 0.45, fontSize: 10, color: SLATE },
  );

  slide = sectionSlide(pptx, 'Launch costs', 'One-Time & Year-1 Non-Infra Spend', 'Qualitative ranges — actuals depend on legal and hiring choices.');
  addTable(
    slide,
    ['Category', 'Typical range (USD)', 'Notes'],
    [
      ['Domain + DNS + email auth', '$50–200/yr', 'SPF/DKIM for Resend on fleetcomanagement.org'],
      ['Apple + Google developer', '$124/yr', 'Play internal testing live; App Store when iOS ships'],
      ['Legal (MSA, privacy, DPA)', '$2K–15K', 'One-time; scales with enterprise sales'],
      ['Initial sales & marketing', '$5K–50K', 'Trade shows, ads, outbound — model opex separate'],
      ['FSI territory capital (optional)', SHOP_ASSUMPTIONS.fsiTypicalCapitalUsd, 'Per affiliated mobile territory — not SaaS COGS'],
    ],
    2.0,
  );

  slide = sectionSlide(pptx, 'Hosting today', 'Render Production Stack (render.yaml)', 'Current deployment pattern — costs rise with plan tier, disk, and database.');
  bullets(slide, [
    'Web service: Node server (API + static SPA) · buildCommand npm run build:render',
    'PostgreSQL database (fleetco-db) + DATA_PATH / UPLOADS_PATH on persistent disk (10 GB default; increase for video)',
    'Environment: JWT, Stripe, Resend, Groq, LiveKit, owner bootstrap — secrets via Render dashboard',
    'Free/starter tiers suitable for demo; production with paying customers typically $40–120+/mo all-in (web + DB + disk)',
    'Scaling lever: upgrade web instance, disk GB, and Postgres plan before moving to AWS',
  ]);

  slide = sectionSlide(pptx, 'Render cost bands', 'Monthly Fixed Platform Cost (Illustrative)', 'Excludes headcount; includes typical managed DB + disk.');
  addTable(
    slide,
    ['Stage', 'Customers', 'Units Mgmt', 'Est. Render/mo', 'Driver'],
    [
      ['Pilot / demo', '1–3', '<30', '$0–25', 'Free tier limits; cold starts'],
      ['Early revenue', '5–20', '50–200', '$45–95', 'Starter paid web + DB + 10GB disk'],
      ['Growth', '20–80', '200–800', '$95–185', 'Plus disk expansion; consider R2 for video'],
      ['Scale-out', '80+', '800+', '$185–400+', 'Multi-instance or migrate to AWS'],
    ],
    2.05,
  );

  slide = sectionSlide(pptx, 'AWS alternative', 'Typical AWS Stack (When Render Caps Out)', 'More control; higher ops burden; better for multi-region and burst video.');
  addTable(
    slide,
    ['Component', 'Example', 'Est. monthly'],
    [
      ['Compute', 'EC2 t4g.small or Fargate (2 vCPU)', '$25–70'],
      ['Database', 'RDS Postgres db.t4g.micro → small', '$15–80'],
      ['Object storage', 'S3 + CloudFront for uploads/video', '$5–200+ (usage)'],
      ['Load balancer / DNS', 'ALB + Route53', '$20–35'],
      ['Email / AI / video', 'SES, Groq, LiveKit (same vendors)', 'Variable'],
      ['Total starter', 'Single-region MVP', '$80–200'],
      ['Total growth', 'HA + backups + monitoring', '$200–600+'],
    ],
    2.0,
  );

  slide = sectionSlide(pptx, 'Variable COGS', 'Per-Customer & Per-Unit Variable Costs', 'Largest swing factors: video storage, email volume, AI sessions, payment mix.');
  bullets(slide, [
    'Storage: JSON rows + uploads on disk/S3 — estimate $0.85–2.50/unit/mo depending on dashcam/video adoption',
    'Email: Resend — cents per thousand; onboarding and payment reminders scale with users',
    'Groq AI: marketing guide/autopilot — marginal $ per session; cap via rate limits',
    'LiveKit: participant-minutes and egress — budget only for customers using live stream/dashcam heavily',
    'Stripe: ~2.9% + $0.30 on subscriptions and transaction flows',
    'Support: allocate ~$8–25/customer/mo at early scale (phone/chat); falls as self-service and docs improve',
  ]);

  slide = sectionSlide(pptx, 'Unit economics', 'Single Customer — Cost vs Revenue (No Video)', 'Assumes 50 customers share ~$95/mo fixed platform; illustrative not GAAP.');
  const unitRows = [5, 10, 25, 50].map((u) => {
    const rev = unitRevenueMo(u);
    const cogs = estCustomerCogsMo(u, 50, false);
    const gp = rev - cogs;
    const margin = ((gp / rev) * 100).toFixed(0);
    return [String(u), `$${rev}`, `$${cogs.toFixed(0)}`, `$${gp.toFixed(0)}`, `${margin}%`];
  });
  addTable(slide, ['Units', 'Rev/mo', 'Est. COGS/mo', 'Gross profit/mo', 'GM%'], unitRows, 2.05);
  slide.addText('At 10 units: ~$350/mo revenue vs ~$25–40/mo incremental COGS → strong unit-level contribution before sales opex.', {
    x: 0.55, y: 4.5, w: 12, h: 0.55, fontSize: 11, color: GREEN, bold: true,
  });

  slide = sectionSlide(pptx, 'Unit economics', 'Single Customer — Video-Heavy Scenario', 'LiveKit + larger disk/R2 — still profitable at list price above ~8 units.');
  const unitRowsVideo = [5, 10, 25, 50].map((u) => {
    const rev = unitRevenueMo(u);
    const cogs = estCustomerCogsMo(u, 50, true);
    const gp = rev - cogs;
    const margin = ((gp / rev) * 100).toFixed(0);
    return [String(u), `$${rev}`, `$${cogs.toFixed(0)}`, `$${gp.toFixed(0)}`, `${margin}%`];
  });
  addTable(slide, ['Units', 'Rev/mo', 'Est. COGS/mo', 'Gross profit/mo', 'GM%'], unitRowsVideo, 2.05);
  slide.addText('Mitigation: video as priced add-on ($5–15/unit), R2 lifecycle rules, shorter retention default.', {
    x: 0.55, y: 4.5, w: 12, h: 0.45, fontSize: 11, color: NAVY,
  });

  slide = sectionSlide(pptx, 'Platform leverage', 'Fixed Cost Spread as Customer Count Grows', null, true);
  addTable(
    slide,
    ['Paying customers', 'Fixed ~$95/mo alloc/customer', 'Fixed ~$185/mo (video) alloc/customer'],
    [
      ['10', '$9.50', '$18.50'],
      ['25', '$3.80', '$7.40'],
      ['50', '$1.90', '$3.70'],
      ['100', '$0.95', '$1.85'],
      ['220 (Y5 base)', '$0.43', '$0.84'],
    ],
    2.1,
  );
  bullets(slide, ['This is why SaaS gross margin modeled at 68% is achievable once opex for sales/engineering is controlled.'], 4.85, 11, WHITE);

  slide = sectionSlide(pptx, 'Cost vs revenue', 'Monthly Snapshot — 10 Customers × 12 Units (120 units)', 'Pure SaaS slice; excludes payroll and marketing opex.');
  const rev120 = unitRevenueMo(120);
  const cogs120 = 95 + 120 * 0.85 + 10 * 3.5 + 10 * 8 + rev120 * 0.029;
  addTable(
    slide,
    ['Line', 'Monthly USD'],
    [
      ['Gross subscription revenue (120 × $35)', `$${rev120.toLocaleString()}`],
      ['Platform hosting (Render mid-tier)', '~$95'],
      ['Storage & API variable', `~$${(120 * 0.85).toFixed(0)}`],
      ['Email + support allocation', '~$115'],
      ['Stripe fees (~2.9%)', `~$${(rev120 * 0.029).toFixed(0)}`],
      ['Total est. COGS', `~$${cogs120.toFixed(0)}`],
      ['Est. gross profit', `$${(rev120 - cogs120).toFixed(0)}`],
      ['Est. gross margin', `${(((rev120 - cogs120) / rev120) * 100).toFixed(0)}%`],
    ],
    2.0,
  );

  slide = sectionSlide(pptx, 'Annual view', 'Same Cohort — Annualized (120 units under management)', null);
  const gpAnnual = (rev120 - cogs120) * 12;
  addTable(
    slide,
    ['Metric', 'Value'],
    [
      ['Annual gross revenue', `$${(rev120 * 12).toLocaleString()}`],
      ['Annual est. COGS', `$${(cogs120 * 12).toFixed(0)}`],
      ['Annual est. gross profit', `$${gpAnnual.toFixed(0)}`],
      ['Revenue per unit per year', `$${UNIT_PRICE_MO * 12}`],
      ['COGS per unit per year (est.)', `$${((cogs120 / 120) * 12).toFixed(0)}`],
    ],
    2.15,
  );

  slide = sectionSlide(pptx, 'Model assumptions', 'Base Case SaaS Financial Model', 'Source: marketing/financial-model.mjs — Year 1 = first commercial year 2026.');
  bullets(slide, [
    `Gross margin ${ASSUMPTIONS.grossMarginPct}% — COGS = hosting, support, payment fees, third-party APIs (not R&D or sales salaries)`,
    `Customer count EOY Year 1 → 10: ${BASE_PROJECTION[0].customersEoy} → ${y10.customersEoy}`,
    `ARPU grows with fleet size and tier mix: $${BASE_PROJECTION[0].arpuMonthly} → $${y10.arpuMonthly}/customer/month`,
    'Opex line in model: sales, engineering, G&A — EBITDA turns positive base case Year 5',
    `Cumulative SaaS revenue (10 yr): ${formatCurrency(BASE_PROJECTION.reduce((s, r) => s + r.annualRevenue, 0), true)}`,
  ]);

  slide = sectionSlide(pptx, 'Growth table', 'Years 1–5 — Customers, ARR, EBITDA', 'Base projection.');
  addTable(
    slide,
    ['Yr', 'Cal', 'Cust EOY', 'ARPU/mo', 'Annual rev', 'ARR EOY', 'EBITDA'],
    BASE_PROJECTION.slice(0, 5).map((r) => [
      r.year,
      r.calendar,
      r.customersEoy,
      `$${r.arpuMonthly}`,
      formatCurrency(r.annualRevenue, true),
      formatCurrency(r.arrEoy, true),
      formatCurrency(r.ebitda, true),
    ]),
    2.0,
  );

  slide = sectionSlide(pptx, 'Growth table', 'Years 6–10 — Customers, ARR, EBITDA', 'Base projection.');
  addTable(
    slide,
    ['Yr', 'Cal', 'Cust EOY', 'ARPU/mo', 'Annual rev', 'ARR EOY', 'EBITDA'],
    BASE_PROJECTION.slice(5).map((r) => [
      r.year,
      r.calendar,
      r.customersEoy,
      `$${r.arpuMonthly}`,
      formatCurrency(r.annualRevenue, true),
      formatCurrency(r.arrEoy, true),
      formatCurrency(r.ebitda, true),
    ]),
    2.0,
  );

  slide = sectionSlide(pptx, 'Scenarios', 'Year 5 ARR — Conservative / Base / Optimistic', null, true);
  addTable(
    slide,
    ['Scenario', 'Customers EOY', 'ARPU/mo', 'Annual rev', 'ARR EOY'],
    Object.values(SCENARIOS_Y5).map((s) => [
      s.label,
      s.customersEoy,
      `$${s.arpuMonthly}`,
      formatCurrency(s.annualRevenue, true),
      formatCurrency(s.arrEoy, true),
    ]),
    2.1,
  );

  slide = sectionSlide(pptx, 'Scenarios', 'Year 10 ARR — Conservative / Base / Optimistic', null, true);
  addTable(
    slide,
    ['Scenario', 'Customers EOY', 'ARPU/mo', 'Annual rev', 'ARR EOY'],
    Object.values(SCENARIOS_Y10).map((s) => [
      s.label,
      s.customersEoy,
      `$${s.arpuMonthly}`,
      formatCurrency(s.annualRevenue, true),
      formatCurrency(s.arrEoy, true),
    ]),
    2.1,
  );

  slide = sectionSlide(pptx, 'Combined revenue', 'SaaS + Affiliated FSI Territories', SHOP_ASSUMPTIONS.modelSummary);
  addTable(
    slide,
    ['Yr', 'SaaS rev', 'FSI rev', 'Combined', 'FSI locs EOY'],
    COMBINED_PROJECTION.filter((_, i) => i % 2 === 1 || i === 9).map((r) => [
      r.year,
      formatCurrency(r.saasRevenue, true),
      formatCurrency(r.shopRevenue, true),
      formatCurrency(r.annualRevenue, true),
      r.locationsEoy,
    ]),
    2.0,
  );
  slide.addText(`FSI gross margin ~${SHOP_ASSUMPTIONS.grossMarginPct}% vs SaaS ~${ASSUMPTIONS.grossMarginPct}% — different COGS profile (labor/parts).`, {
    x: 0.55, y: 5.2, w: 12, fontSize: 10, color: SLATE,
  });

  slide = sectionSlide(pptx, 'EBITDA path', 'When Operating Profit Turns (Base SaaS Model)', 'Opex in model includes team scaling — not hosting alone.');
  bullets(slide, [
    'Years 1–4: negative EBITDA while building product, sales, and support — typical SaaS J-curve',
    `Year 5: EBITDA ${formatCurrency(y5.ebitda, true)} on ${formatCurrency(y5.annualRevenue, true)} revenue — break-even zone`,
    `Year 7: EBITDA ${formatCurrency(BASE_PROJECTION[6].ebitda, true)} · Year 10: ${formatCurrency(y10.ebitda, true)}`,
    'Hosting COGS stays a single-digit % of revenue at scale; opex dominates until customer velocity compounds',
    'Investor focus: CAC payback on $35/unit streams, churn ≤6%, and ARPU expansion via units + enterprise',
  ]);

  slide = sectionSlide(pptx, 'Growth drivers', 'How Customer & Unit Counts Compound', null);
  bullets(slide, [
    'Outbound to 5–50 unit regional carriers — sweet spot for all-in-one vs McLeod + maintenance spreadsheets',
    'FSI mobile PM converts break-fix fleets to subscribed maintenance + SaaS bundle',
    'Driver app on Play Store unlocks proof-of-delivery and HOS accuracy — reduces churn',
    'Marketplace and broker features add transaction revenue atop subscription',
    'Referrals from fuel savings and IFTA time savings (documented in marketing case studies)',
    'Land with 8–15 units; expand to 25+ as dispatch and accounting modules replace incumbents',
  ]);

  slide = sectionSlide(pptx, 'Market context', 'TAM & SAM (Qualitative)', 'U.S. for-hire and private fleets — millions of Class 3–8 assets.');
  bullets(slide, [
    'SAM: tens of thousands of carriers with 5–100 trucks using disconnected tools — target ICP for FleetCo',
    'At 780 customers × ~15 avg units (Y10 base): ~11,700 billable units → ~$4.9M/yr at pure $35/unit (model uses higher ARPU with tiers/add-ons → $5.2M+ annual)',
    'Compliance (FMCSA HOS, DVIR, drug screening records) creates non-discretionary software budget',
    'Video/telematics upsell aligns with insurance and safety program spend',
  ]);

  slide = sectionSlide(pptx, 'Investor metrics', 'Suggested KPI Dashboard', null, true);
  addTable(
    slide,
    ['KPI', 'Target direction', 'Why it matters'],
    [
      ['Billable units under management', 'Up', 'Primary revenue driver at $35/unit'],
      ['Net revenue retention', '>100%', 'Unit expansion within accounts'],
      ['Logo churn (annual)', '≤6–10%', 'Model matures to 6%'],
      ['Gross margin %', '≥65%', 'Hosting leverage'],
      ['CAC payback (months)', '<18', 'SMB fleet sales efficiency'],
      ['Infra $ / $1 ARR', 'Down over time', 'Render/AWS efficiency + R2'],
    ],
    2.05,
  );

  slide = sectionSlide(pptx, 'Use of funds', 'Typical Seed / Growth Capital Allocation', 'Illustrative — adjust to your raise size.');
  bullets(slide, [
    '40% — Sales & customer success (fleet industry reps, onboarding playbooks)',
    '35% — Engineering (iOS parity, telematics integrations, hardening multi-tenant scale)',
    '15% — Marketing & events (trade shows, digital, case studies)',
    '10% — Infra & security (SOC2 path, backups, penetration test, R2/LiveKit reserves)',
    'FSI territory expansion can be capital-separated — mobile service uses different ROI than SaaS',
  ]);

  slide = sectionSlide(pptx, 'Milestones', 'Execution Timeline (from Financial Model)', null);
  bullets(slide, MILESTONES.map((m) => `${m.when}: ${m.metric}`), 1.95, 11);

  slide = sectionSlide(pptx, 'Risks & mitigations', 'What Could Compress Margin or Slow Growth', null, true);
  bullets(slide, [
    'Video storage costs spike → price video tier; default retention; R2 lifecycle policies',
    'Render limits → documented AWS migration; horizontal API instances',
    'Stripe/dispute risk → clear MSA, usage billing alignment to active units',
    'Competitive ELD mandates → FMCSA HOS duty events already in platform; continue parity with certified ELD partners',
    'Key person / support load → documentation, in-app guide, tiered support hours',
    'Concentration in early customers → diversify verticals (refrigerated, flatbed, last-mile)',
  ], 1.95, 11, WHITE);

  slide = sectionSlide(pptx, 'Break-even sanity', 'Back-of-Envelope: Cover $680K Year-5 Opex (Model)', 'SaaS gross profit must fund team — not hosting alone.');
  bullets(slide, [
    `Year 5 opex in model: ${formatCurrency(y5.opex, true)} · Gross profit: ${formatCurrency(y5.grossProfit, true)}`,
    `At ${ASSUMPTIONS.grossMarginPct}% GM, revenue needed to cover opex only: ~${formatCurrency(y5.opex / (ASSUMPTIONS.grossMarginPct / 100), true)}`,
    `Model actual Year 5 revenue: ${formatCurrency(y5.annualRevenue, true)} — exceeds that threshold → positive EBITDA`,
    'Hosting line item alone would require ~200+ customers at $15 ARPU equivalent — actual ARPU 10× higher',
  ]);

  slide = sectionSlide(pptx, 'Appendix', 'Full 10-Year Base Projection (SaaS)', null);
  addTable(
    slide,
    ['Y', 'Cust', 'Avg cust', 'Rev', 'GP', 'Opex', 'EBITDA'],
    BASE_PROJECTION.map((r) => [
      r.year,
      r.customersEoy,
      r.avgCustomers,
      formatCurrency(r.annualRevenue, true),
      formatCurrency(r.grossProfit, true),
      formatCurrency(r.opex, true),
      formatCurrency(r.ebitda, true),
    ]),
    1.85,
  );

  slide = sectionSlide(pptx, 'Next steps', 'Due Diligence & Live Demo', null, true);
  bullets(slide, [
    `Live production tenant: ${BRAND.url} — owner demo and customer-scoped review accounts on request`,
    'Technical appendix: system capabilities deck, deep-dive deck, smartphone telematics deck (regenerate via npm scripts)',
    'Financial appendix: marketing/business plan PDF (npm run marketing:plan)',
    `Contact: ${BRAND.supportEmail} · ${BRAND.phone}`,
    'This document is illustrative; verify all projections with your CPA and counsel before investment decisions.',
  ], 1.95, 12, WHITE);

  await pptx.writeFile({ fileName: outFile });
  fs.copyFileSync(outFile, path.join(publicDir, FILE_NAME));
  const downloadsPath = path.join(os.homedir(), 'Downloads', FILE_NAME);
  fs.copyFileSync(outFile, downloadsPath);

  console.log(`Slides: ${slideNum}`);
  console.log('Wrote:', outFile);
  console.log('Public:', path.join(publicDir, FILE_NAME));
  console.log('Downloads:', downloadsPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

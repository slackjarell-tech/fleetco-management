/**
 * Detailed $2M seed / growth raise deck — master plan + financials + GTM + product depth.
 * Run: npm run marketing:raise-2m
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
  SHOP_PROJECTION,
  ASSUMPTIONS,
  MILESTONES,
  SHOP_ASSUMPTIONS,
  CUMULATIVE_COMBINED_REVENUE,
  formatCurrency,
} from '../marketing/financial-model.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'marketing');
const publicDir = path.join(__dirname, '..', 'public', 'marketing');
const FILE_NAME = 'FleetCo-2M-Raise-Pitch-Deck.pptx';
const outFile = path.join(outDir, FILE_NAME);

const RAISE_USD = 2_000_000;
const RUNWAY_MONTHS = 24;
const UNIT_PRICE = 35;

const NAVY = '0F172A';
const AMBER = 'F59E0B';
const SLATE = '64748B';
const WHITE = 'FFFFFF';
const LIGHT = 'F8FAFC';

let slideNum = 0;

function footer(slide) {
  slideNum += 1;
  slide.addText(
    `${BRAND.shortName} · $2M Raise (Detailed) · Confidential · ${BRAND.url} · Slide ${slideNum}`,
    { x: 0.35, y: 7.05, w: 12.8, h: 0.28, fontSize: 7.5, color: SLATE, align: 'center' },
  );
}

function sectionSlide(pptx, label, title, subtitle, dark = false) {
  const slide = pptx.addSlide();
  slide.background = { color: dark ? NAVY : LIGHT };
  slide.addText(label.toUpperCase(), {
    x: 0.55, y: 0.4, w: 12, h: 0.35, fontSize: 10, bold: true, color: AMBER, charSpace: 1.2,
  });
  slide.addText(title, {
    x: 0.55, y: 0.78, w: 12, h: 0.7, fontSize: 24, bold: true, color: dark ? WHITE : NAVY,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.55, y: 1.45, w: 12, h: 0.55, fontSize: 12, color: SLATE,
    });
  }
  footer(slide);
  return slide;
}

function bullets(slide, items, y = 2.0, fontSize = 11, color = NAVY) {
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })),
    { x: 0.65, y, w: 12, h: 6.55 - y, fontSize, color, valign: 'top', lineSpacingMultiple: 1.05 },
  );
}

function addTable(slide, headers, rows, y = 2.0, fontSize = 8.5) {
  const headRow = headers.map((h) => ({
    text: h,
    options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: fontSize + 0.5 },
  }));
  const body = rows.map((row) =>
    row.map((cell, i) => ({
      text: String(cell),
      options: {
        fontSize,
        color: NAVY,
        fill: i === 0 ? { color: 'E2E8F0' } : undefined,
      },
    })),
  );
  slide.addTable([headRow, ...body], {
    x: 0.45,
    y,
    w: 12.4,
    colW: headers.map(() => 12.4 / headers.length),
    border: { pt: 0.5, color: SLATE },
    autoPage: false,
  });
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  slideNum = 0;
  const pptx = new PptxGenJS();
  pptx.author = BRAND.company;
  pptx.company = BRAND.shortName;
  pptx.title = `${BRAND.shortName} — $2M Investment Opportunity (Detailed)`;
  pptx.layout = 'LAYOUT_WIDE';

  const y1 = BASE_PROJECTION[0];
  const y2 = BASE_PROJECTION[1];
  const y3 = BASE_PROJECTION[2];
  const y5 = BASE_PROJECTION[4];
  const y10 = BASE_PROJECTION[9];
  const comb5 = COMBINED_PROJECTION[4];
  const comb10 = COMBINED_PROJECTION[9];

  // ── Cover ──
  let slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.14, h: '100%', fill: { color: AMBER } });
  slide.addText('FLEETCO MANAGEMENT LLC', { x: 0.75, y: 0.75, w: 11, h: 0.45, fontSize: 14, color: AMBER, charSpacing: 4 });
  slide.addText('The Operating System for SMB Fleets', { x: 0.75, y: 1.25, w: 11, h: 0.85, fontSize: 34, bold: true, color: WHITE });
  slide.addText('Detailed investor presentation · Five-pillar master plan', { x: 0.75, y: 2.15, w: 11, h: 0.4, fontSize: 14, color: SLATE });
  slide.addText('Software → Data → Fuel & Credit → Field Service → Freight', { x: 0.75, y: 2.65, w: 11, h: 0.45, fontSize: 13, color: WHITE });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.75, y: 3.35, w: 4.5, h: 1.1, fill: { color: AMBER }, rectRadius: 0.08 });
  slide.addText(`Seeking $${(RAISE_USD / 1e6).toFixed(0)}M`, { x: 0.75, y: 3.48, w: 4.5, h: 0.55, fontSize: 30, bold: true, color: NAVY, align: 'center' });
  slide.addText(`${RUNWAY_MONTHS}-month execution · Series A metrics target`, { x: 0.75, y: 4.05, w: 4.5, h: 0.35, fontSize: 9, color: NAVY, align: 'center' });
  slide.addText(`${BRAND.url} · ${BRAND.phone} · ${BRAND.location}`, { x: 0.75, y: 5.4, w: 10, fontSize: 12, color: WHITE });
  slide.addText('Confidential — qualified investors only · Oct 2026', { x: 0.75, y: 6.05, w: 8, fontSize: 9, color: SLATE });
  footer(slide);

  slide = sectionSlide(pptx, 'Agenda', 'What This Deck Covers', '45+ slides — strategy, product, GTM, use of funds, and model detail');
  bullets(slide, [
    'Investment ask, terms framework, and 24-month milestones tied to capital',
    'Problem quantification and ideal customer profile (ICP)',
    'Live product: portal modules, mobile app, billing integrity (units + VIN)',
    'Five-pillar master plan — each pillar with phases, KPIs, and economics',
    'Competitive landscape matrix vs telematics and fleet software',
    'Unit economics, pricing, and 10-year base / scenario financials',
    'Detailed use-of-funds by department and quarter; path to Series A',
  ], 1.95, 11);

  slide = sectionSlide(pptx, 'Executive summary', 'Investment Thesis in One View', null, true);
  bullets(slide, [
    `FleetCo is production SaaS at ${BRAND.url} — not vaporware. Multi-tenant portal + Android driver app + Stripe billing.`,
    'We consolidate dispatch, maintenance, fuel, HOS/compliance, accounting, and customer portals for 5–50 unit regional carriers underserved by enterprise telematics.',
    'Five revenue layers over time: (1) SaaS per unit (2) data-driven upsell (3) fuel card + company credit (4) FSI mobile service territories (5) brokered final-mile freight.',
    `Raise $${(RAISE_USD / 1e6).toFixed(0)}M to compress 36 months of GTM + product + first territory into ${RUNWAY_MONTHS} months with measurable KPIs.`,
    `Model base Year 5: ${y5.customersEoy} customers · ${formatCurrency(y5.arrEoy, true)} SaaS ARR · combined w/ FSI ${formatCurrency(comb5.annualRevenue, true)}.`,
    'Investors: software gross margins today; transaction and service margins as density compounds in chosen metros.',
  ], 1.95, 10.5, WHITE);

  slide = sectionSlide(pptx, 'The ask', `$${(RAISE_USD / 1e6).toFixed(0)}M Growth Round — Terms Framework`, 'Final structure with lead investor and counsel');
  addTable(slide, ['Item', 'Detail'], [
    ['Amount sought', `$${RAISE_USD.toLocaleString()} USD`],
    ['Primary use', 'Sales & CS headcount, fuel/credit program build, iOS parity, first FSI territory seed'],
    ['Target runway', `${RUNWAY_MONTHS} months (monthly burn ~$83K blended post-ramp)`],
    ['Instrument options', 'Priced seed · SAFE (cap/discount TBD) · Convertible note — investor preference'],
    ['24-mo success metrics', '150+ customers · 2,500+ licensed units · fuel aggregation live · 1 FSI territory · credit pilot'],
    ['Series A narrative', '~$3M+ ARR run-rate path · NRR >100% · fuel attach >40% of units (target)'],
  ], 2.0);

  slide = sectionSlide(pptx, 'Problem', 'The SMB Fleet Stack Is Broken', 'Operators lose 15–30% of margin to fragmentation (industry benchmarks vary by segment).');
  addTable(slide, ['Pain', 'Typical SMB reality', 'Cost impact'], [
    ['Tool sprawl', 'ELD + dispatch spreadsheet + QuickBooks + fuel card portal + shop whiteboard', '10–20 admin hrs/week'],
    ['No cost-per-mile truth', 'Fuel at issuer, repairs at shop, revenue in TMS — never one P&L per unit', 'Bad buy/sell decisions on equipment'],
    ['Downtime', 'Missed PM → roadside failure → missed load', '$1K–15K+ per incident'],
    ['Compliance', 'HOS, DVIR, DQ files scattered', 'Fines + insurance spikes'],
    ['Enterprise pricing', 'Telematics contracts built for 500+ units', 'SMB priced out or under-featured'],
  ], 2.05, 8);

  slide = sectionSlide(pptx, 'ICP', 'Ideal Customer Profile (Initial Wedge)', 'Land here before expanding verticals (refrigerated, flatbed, last-mile).');
  addTable(slide, ['Attribute', 'Target'], [
    ['Fleet size', '5–50 power units (+ trailers); sweet spot 8–25'],
    ['Geography', 'Texas & Sun Belt first · I-35 / I-20 / I-10 freight corridors'],
    ['Persona', 'Owner-operator scaling up OR small fleet GM/owner wearing 6 hats'],
    ['Current tools', 'Mix of ELD, Google Sheets, QuickBooks, WhatsApp dispatch'],
    ['Trigger events', 'Failed audit, insurance renewal, new contract requiring visibility, shop chaos'],
    ['ACV (software)', `$${UNIT_PRICE}/unit/mo × avg 12 units ≈ $420/mo · expands with units + services`],
  ], 2.0, 8.5);

  slide = sectionSlide(pptx, 'Solution', 'FleetCo Command Center + Driver App', 'Single API · single datastore · role-based portals', true);
  bullets(slide, [
    'Owner / executive / fleet manager / coordinator / shop tech roles — internal operations',
    'Customer org admins — scoped fleet, invoices, loads, documents',
    'Drivers — Android app: clock-in GPS, HOS duty events, routes, fuel, scans, POD, dashcam hooks',
    'Licensed unit enforcement + VIN audit trail — billing aligned to real assets',
    'Stripe subscriptions, Connect for marketplace payouts, SLT billing hub for leadership',
    'Optional FSI-affiliated mobile PM/repair — work orders born in same system customers already use',
  ], 1.95, 10, WHITE);

  slide = sectionSlide(pptx, 'Architecture', 'Technical Stack (Production)', BRAND.url);
  addTable(slide, ['Layer', 'Technology', 'Notes'], [
    ['Frontend', 'React + Vite SPA', 'Owner & customer portals, marketing site'],
    ['API', 'Node.js Express', 'REST entities, functions, webhooks (Stripe)'],
    ['Data', 'PostgreSQL + JSON store / file persistence', 'Multi-tenant entity model, 60+ types'],
    ['Mobile', 'FleetCo Driver (Android)', 'Play internal testing; iOS funded by raise'],
    ['Integrations', 'Stripe, Resend, Groq AI, LiveKit (optional video)', 'Fuel issuer APIs planned'],
    ['Hosting', 'Self-hosted / cloud (Consur) + IONOS DNS', 'Not dependent on single PaaS vendor'],
  ], 2.0, 8);

  slide = sectionSlide(pptx, 'Product', 'Portal Modules — Operations (1/2)', 'Live in production today');
  addTable(slide, ['Module', 'Capabilities'], [
    ['Dashboard & map', 'Live locations, trails, yards, map colors by status, speed'],
    ['Fleet units', 'Trucks/trailers, VIN decode (NHTSA), documents, accessories, unit limits'],
    ['Drivers & HR', 'Roster, documents, screening, time clock, trailer sign-in/out'],
    ['Dispatch & loads', 'Load board, marketplace audit, routes, stops, POD'],
    ['Maintenance', 'WO: preventive / corrective / predictive, PM schedules, templates'],
    ['Parts & vendors', 'Inventory, POs, vendor contracts, diagnostic codes'],
  ], 1.95, 8);

  slide = sectionSlide(pptx, 'Product', 'Portal Modules — Money & Compliance (2/2)', null);
  addTable(slide, ['Module', 'Capabilities'], [
    ['Fuel', 'Fuel logs, cards, stations, audits, cost-per-mile / TCO views'],
    ['Compliance', 'HOS logs, FMCSA duty clocks, inspections, incidents, posted notices'],
    ['Accounting', 'Chart of accounts, journal entries, invoices, QuickBooks export hooks'],
    ['Payroll', 'Runs, disbursements, tax profiles, carrier payment schedulers'],
    ['Billing', 'Per-unit Stripe, licensed slots, customer portal billing, broker fees'],
    ['Marketing AI', 'Autopilot, lead nurture (optional Groq) — internal growth tooling'],
  ], 1.95, 8);

  slide = sectionSlide(pptx, 'Mobile', 'FleetCo Driver App — Field Data Capture', 'Package: org.fleetcomanagement.driver', true);
  bullets(slide, [
    'Time clock with GPS while on shift → feeds fleet map and HOS context',
    'FMCSA-style duty events on vehicle movement — countdown clocks in portal',
    'Delivery routes, stop completion, barcode/QR scans with geostamp',
    'Fuel logging, inspections, work order updates (role-gated), messages',
    'Dashcam / live stream hooks (optional LiveKit) — retention policies configurable',
    'Raise funds iOS parity for Apple-only driver populations and App Store distribution',
  ], 1.95, 10, WHITE);

  slide = sectionSlide(pptx, 'Data moat', 'Entity Layer — System of Record', 'Representative entity groups (60+ API types)');
  bullets(slide, [
    'Fleet: Customer, Vehicle, TrailerAssignment, Yard, YardPlacement, VehicleDocument',
    'Movement: DriverLocation, HOSLog, HOSDutyEvent, DeliveryRoute, DeliveryStop',
    'Maintenance: WorkOrder, MaintenanceSchedule, ServiceTemplate, PartInventory, Vendor',
    'Fuel & money: FuelLog, FuelCard, FuelStation, Invoice, Subscription, JournalEntry',
    'Safety & video: Inspection, Incident, DashcamSession, LiveStreamRecording, DrivingSafetyEvent',
    'Integrity: VehicleVinEvent (removal/re-add audit), PortalActivity, licensed unit counters',
  ], 1.95, 10);

  slide = sectionSlide(pptx, 'Master plan', 'Five Pillars — Sequenced Capital Deployment', 'Do not skip to 4–5 without 1–2 density');
  addTable(slide, ['#', 'Pillar', 'Revenue type', 'Capital intensity'], [
    ['1', 'Scale SaaS', 'Recurring subscription', 'Low — mainly people'],
    ['2', 'Data moat', 'Analytics & steering (future SKU)', 'Low — software'],
    ['3', 'Fuel & credit', 'Interchange, spread, fees', 'Med — compliance & partners'],
    ['4', 'FSI + fuel density', 'Service labor/parts, fuel margin', 'Med–high — territory seed'],
    ['5', 'Freight layers', 'Platform % on freight', 'Med — working capital later'],
  ], 2.05, 9);

  slide = sectionSlide(pptx, 'Pillar 1', 'Scale SaaS — Go-to-Market Detail', 'Funded primarily by 40% of raise ($800K)');
  addTable(slide, ['Channel', 'Tactic', 'KPI'], [
    ['Outbound', '2 AEs + 1 SDR — MC/DOT lists, call-down in TX/OK/LA', 'SQLs → demos → 30-day activation'],
    ['Inbound', 'SEO, case studies, trade shows (MATS, regional shows)', 'Cost per activated unit'],
    ['Partner', 'FSI techs refer fleets needing software', 'Partner-sourced % of new logos'],
    ['Product-led', 'Trial/demo sandbox, onboarding checklist', 'Time-to-first fuel log & first WO'],
    ['Expand', 'Upsell units within account; annual prepay 5% off', 'NRR > 100%'],
  ], 2.0, 8);

  slide = sectionSlide(pptx, 'Pillar 1', 'SaaS Pricing & Unit Economics', `$${UNIT_PRICE}/unit/month list · licensed fleet_size enforced`);
  addTable(slide, ['Metric', 'Value / assumption'], [
    ['List price', `$${UNIT_PRICE}/unit/month · 5% annual prepay discount`],
    ['Model ARPU (Y5)', `$${y5.arpuMonthly}/customer/month — mix of units + tiers + add-ons`],
    ['SaaS gross margin', `${ASSUMPTIONS.grossMarginPct}% (model — hosting, support, payment fees)`],
    ['Churn (model)', `${ASSUMPTIONS.churnStartPct}% → ${ASSUMPTIONS.churnEndPct}% annual logo churn improvement`],
    ['Illustrative 10-unit customer', `$350/mo revenue · ~$25–45/mo infra+COGS at scale (see economics deck)`],
    ['Integrity', 'VIN ledger on delete · block over licensed slots for customers'],
  ], 2.0, 8.5);

  slide = sectionSlide(pptx, 'Pillar 2', 'Data — What We Collect & Why It Matters', null, true);
  addTable(slide, ['Signal', 'Source', 'Decisions enabled'], [
    ['Where trucks run', 'GPS, routes', 'FSI territory · fuel deals · last-mile pilot city'],
    ['What breaks', 'WO type, diagnostic, downtime', 'Mobile PM routes · parts stocking'],
    ['Fuel behavior', 'Logs + future card txn', 'Steering · credit limits · IFTA accuracy'],
    ['Compliance risk', 'HOS, inspections', 'Retention · upsell compliance modules'],
    ['Payment behavior', 'Stripe, pauses, tenure', 'Credit underwriting (Pillar 3)'],
  ], 2.05, 8, WHITE);

  slide = sectionSlide(pptx, 'Pillar 2', 'Analytics Roadmap (Post-Raise)', 'Internal first · customer benchmarks later');
  bullets(slide, [
    'Q1–Q2: Metro mile aggregates, WO heat maps, customer health score (usage + payment)',
    'Q3–Q4: Fuel spend vs lane benchmarks · breakdown clustering by equipment class',
    'Year 2: Anonymized peer benchmarks as enterprise tier · API export for large accounts',
    'Governance: customer data ownership in MSA · aggregated analytics opt-in where required',
    'Moat: 18+ months of history increases switching cost even before fuel/credit attach',
  ], 1.95, 10, WHITE);

  slide = sectionSlide(pptx, 'Pillar 3', 'Fuel Program — Three Phases', 'Partner-led issuance — FleetCo is program software, not a bank');
  addTable(slide, ['Phase', 'Timeline', 'Deliverable', 'Revenue'], [
    ['3A Aggregate', 'Mo 3–9', 'Link WEX/Comdata/EFS; reconcile to FuelLog & audits', 'Attach KPI; prep for 3B'],
    ['3B Co-brand', 'Mo 9–18', 'Issuer partner · FleetCo-branded card · driver controls', 'Interchange + rebate share'],
    ['3C Steering', 'Mo 12–24', 'Preferred network from Pillar 2 heat maps', 'Merchant margin deals'],
  ], 2.0, 8);

  slide = sectionSlide(pptx, 'Pillar 3', 'Company Credit — Underwriting & Controls', 'Start SaaS + FSI invoices only; fuel line after behavior proof');
  addTable(slide, ['Control', 'Policy'], [
    ['Initial limit', 'Small — e.g. 1–2× monthly SaaS + avg repair spend'],
    ['Terms', 'Net 15 → Net 30 for qualified accounts; card autopay backup'],
    ['Signals', 'Tenure, Stripe history, units licensed vs in use, fuel volume stability'],
    ['Collections', 'Auto portal pause · lien/UCC for larger lines (standard trucking finance)'],
    ['Product', 'Single AR statement: subscription + shop + fuel (vision)'],
  ], 2.05, 8.5);

  slide = sectionSlide(pptx, 'Pillar 4', 'FSI Field Service Model', SHOP_ASSUMPTIONS.fsiCorporateSite || 'fleetservicesint.com');
  bullets(slide, [
    SHOP_ASSUMPTIONS.modelSummary,
    `Typical territory capital: ${SHOP_ASSUMPTIONS.fsiTypicalCapitalUsd} — raise allocates $300K seed, not full roll-up`,
    `${SHOP_ASSUMPTIONS.mobileWorkstationsPerTerritory} mobile workstations per territory (model) · on-site PM + breakdown`,
    'Every WO in FleetCo: labor, parts, customer invoice, technician time — same datastore as SaaS',
    `Modeled service gross margin ~${SHOP_ASSUMPTIONS.grossMarginPct}% vs SaaS ~${ASSUMPTIONS.grossMarginPct}%`,
    'Site selection: rank metros by billable units + WO density + fuel gallons (Pillar 2)',
  ], 1.95, 10);

  slide = sectionSlide(pptx, 'Pillar 4', 'FSI Financial Model Snapshot (Base)', 'From combined projection — illustrative');
  addTable(slide, ['Year', 'FSI locs EOY', 'FSI revenue', 'Combined w/ SaaS'], [
    ['Y1', SHOP_PROJECTION[0].locationsEoy, formatCurrency(SHOP_PROJECTION[0].annualRevenue, true), formatCurrency(COMBINED_PROJECTION[0].annualRevenue, true)],
    ['Y3', SHOP_PROJECTION[2].locationsEoy, formatCurrency(SHOP_PROJECTION[2].annualRevenue, true), formatCurrency(COMBINED_PROJECTION[2].annualRevenue, true)],
    ['Y5', SHOP_PROJECTION[4].locationsEoy, formatCurrency(SHOP_PROJECTION[4].annualRevenue, true), formatCurrency(comb5.annualRevenue, true)],
    ['Y10', SHOP_PROJECTION[9].locationsEoy, formatCurrency(SHOP_PROJECTION[9].annualRevenue, true), formatCurrency(comb10.annualRevenue, true)],
  ], 2.1, 8.5);

  slide = sectionSlide(pptx, 'Pillar 5', 'Freight — Phased Market Entry', 'Use existing load board + Connect infrastructure', true);
  addTable(slide, ['Phase', 'Scope', 'Prerequisites'], [
    ['5A Final mile', '1 metro · IC 1099 drivers · regional delivery', '50+ local units on platform'],
    ['5B Multi-city', 'Replicate playbooks · shared back-office', 'Fuel + credit for settlement float'],
    ['5C Middle mile', 'Regional linehaul between hubs', 'Broker authority + credit lines mature'],
    ['5D First mile', 'Pickup / dray / port adjacency', 'Selective — only where data shows lane edge'],
  ], 2.05, 8.5, WHITE);

  slide = sectionSlide(pptx, 'Traction', 'Product & GTM Status (Detailed)', null);
  addTable(slide, ['Area', 'Status'], [
    ['Production URL', `${BRAND.url} — HTTPS, privacy/terms, pricing`],
    ['Driver app', 'Android · Google Play internal testing track'],
    ['Billing', 'Stripe subscriptions · unit limits · VIN audit events'],
    ['Owner tools', 'SLT billing hub · customer provisioning · marketing gallery/decks'],
    ['Compliance', 'FMCSA HOS duty clocks · posted notice · movement-triggered events'],
    ['Sales assets', 'Client deck, investor economics deck, capabilities/deep-dive PPTs'],
  ], 2.0, 8);

  slide = sectionSlide(pptx, 'Competition', 'Feature Matrix (Simplified)', 'Enterprise vendors vary by contract — directional only', true);
  addTable(slide, ['Capability', 'FleetCo', 'Typical enterprise telematics', 'Fleet maintenance only'], [
    ['Dispatch + loads', 'Yes', 'Partial / add-on', 'No'],
    ['Shop WO + PM', 'Yes', 'Limited', 'Yes'],
    ['Fuel + IFTA context', 'Yes', 'Fuel card partner', 'Rare'],
    ['Accounting hooks', 'Yes', 'Export', 'Export'],
    ['Mobile driver app', 'Yes', 'Yes', 'Sometimes'],
    ['Field service territory', 'FSI option', 'No', 'No'],
    ['Fuel/credit program (roadmap)', 'Yes', 'Rare as issuer', 'No'],
  ], 1.85, 7.5, WHITE);

  slide = sectionSlide(pptx, 'Differentiation', 'Why FleetCo Wins the SMB Wallet', null);
  bullets(slide, [
    'All-in-one login replaces 5+ vendors — implementation in days, not quarters',
    'Unit-based pricing aligns with how small carriers think (per truck, not per seat mystery)',
    'Data compounds inside one system — not siloed at fuel issuer + ELD + shop software',
    'FSI layer adds human service revenue competitors cannot copy without capital deployment',
    'Financial layers (3) turn SaaS into platform ARPU expansion without only raising price/unit',
  ], 1.95, 10);

  slide = sectionSlide(pptx, 'Business model', 'Revenue Streams & Timing', null, true);
  addTable(slide, ['Stream', 'Start', 'Model economics', 'Notes'], [
    ['SaaS subscription', 'Now', `$${UNIT_PRICE}/unit · ${ASSUMPTIONS.grossMarginPct}% GM`, 'Primary Year 1–3'],
    ['Onboarding / services', 'Now', 'Project fees', 'High-touch fleets'],
    ['FSI mobile repair', 'Y1–2', `${SHOP_ASSUMPTIONS.grossMarginPct}% GM`, 'Territory model'],
    ['Fuel program', 'Y2', 'Interchange + rebate', 'Partner bank'],
    ['Credit spread/fees', 'Y2', 'Risk-adjusted', 'Underwriting discipline'],
    ['Load platform fee', 'Y3+', '% of freight', 'After 5A pilot'],
  ], 1.95, 7.5, WHITE);

  slide = sectionSlide(pptx, 'Financials', 'Years 1–3 Base Case (SaaS)', 'Source: marketing/financial-model.mjs');
  addTable(slide, ['', 'Year 1', 'Year 2', 'Year 3'], [
    ['Calendar', y1.calendar, y2.calendar, y3.calendar],
    ['Customers EOY', y1.customersEoy, y2.customersEoy, y3.customersEoy],
    ['ARPU/mo', `$${y1.arpuMonthly}`, `$${y2.arpuMonthly}`, `$${y3.arpuMonthly}`],
    ['Annual revenue', formatCurrency(y1.annualRevenue, true), formatCurrency(y2.annualRevenue, true), formatCurrency(y3.annualRevenue, true)],
    ['ARR EOY', formatCurrency(y1.arrEoy, true), formatCurrency(y2.arrEoy, true), formatCurrency(y3.arrEoy, true)],
    ['EBITDA', formatCurrency(y1.ebitda, true), formatCurrency(y2.ebitda, true), formatCurrency(y3.ebitda, true)],
  ], 2.0, 8);

  slide = sectionSlide(pptx, 'Financials', 'Years 4–5 Base Case (SaaS)', null, true);
  addTable(slide, ['', 'Year 4', 'Year 5'], [
    ['Customers EOY', BASE_PROJECTION[3].customersEoy, y5.customersEoy],
    ['Annual revenue', formatCurrency(BASE_PROJECTION[3].annualRevenue, true), formatCurrency(y5.annualRevenue, true)],
    ['ARR EOY', formatCurrency(BASE_PROJECTION[3].arrEoy, true), formatCurrency(y5.arrEoy, true)],
    ['EBITDA', formatCurrency(BASE_PROJECTION[3].ebitda, true), formatCurrency(y5.ebitda, true)],
    ['EBITDA margin (Y5)', '', `${Math.round((y5.ebitda / y5.annualRevenue) * 100)}% (base)`],
  ], 2.1, 8.5, WHITE);

  slide = sectionSlide(pptx, 'Scenarios', 'Year 5 & Year 10 ARR Bands', 'Conservative / base / optimistic from model');
  addTable(slide, ['Scenario', 'Y5 customers', 'Y5 ARR', 'Y10 customers', 'Y10 ARR'], [
    ['Conservative', SCENARIOS_Y5.conservative.customersEoy, formatCurrency(SCENARIOS_Y5.conservative.arrEoy, true), SCENARIOS_Y10.conservative.customersEoy, formatCurrency(SCENARIOS_Y10.conservative.arrEoy, true)],
    ['Base', SCENARIOS_Y5.base.customersEoy, formatCurrency(SCENARIOS_Y5.base.arrEoy, true), SCENARIOS_Y10.base.customersEoy, formatCurrency(SCENARIOS_Y10.base.arrEoy, true)],
    ['Optimistic', SCENARIOS_Y5.optimistic.customersEoy, formatCurrency(SCENARIOS_Y5.optimistic.arrEoy, true), SCENARIOS_Y10.optimistic.customersEoy, formatCurrency(SCENARIOS_Y10.optimistic.arrEoy, true)],
  ], 2.0, 7.5);

  slide = sectionSlide(pptx, 'Vision', 'Year 10 Combined (SaaS + FSI)', null, true);
  bullets(slide, [
    `SaaS ARR EOY: ${formatCurrency(y10.arrEoy, true)} · ${y10.customersEoy} customers · ~${Math.round(y10.customersEoy * 15)} units illustrative`,
    `FSI: ${SHOP_PROJECTION[9].locationsEoy} territories · ${formatCurrency(SHOP_PROJECTION[9].annualRevenue, true)} service revenue (model)`,
    `Combined annual revenue Y10: ${formatCurrency(comb10.annualRevenue, true)}`,
    `Cumulative combined revenue (10 yr model): ${formatCurrency(CUMULATIVE_COMBINED_REVENUE, true)}`,
    MILESTONES[MILESTONES.length - 1].metric,
  ], 1.95, 10, WHITE);

  slide = sectionSlide(pptx, 'Use of funds', `$${(RAISE_USD / 1e6).toFixed(0)}M — Category Summary`, `${RUNWAY_MONTHS}-month plan`);
  addTable(slide, ['Category', '$', '%', 'Outcome'], [
    ['Go-to-market', '800,000', '40%', 'Revenue scale · 150+ customers target'],
    ['Product & engineering', '700,000', '35%', 'Fuel/credit MVP · iOS · analytics · security'],
    ['FSI territory seed', '300,000', '15%', '1 mobile territory proof'],
    ['G&A & contingency', '200,000', '10%', 'Legal, finance, issuer setup, buffer'],
  ], 2.05, 8.5);

  slide = sectionSlide(pptx, 'Use of funds', 'GTM Detail ($800K)', 'Headcount + programs');
  addTable(slide, ['Line item', 'Est. spend', 'Notes'], [
    ['Account Executives (2)', '$280K', 'Base + commission · regional carriers'],
    ['SDR (1)', '$75K', 'Pipeline generation · MC/DOT lists'],
    ['Customer Success (1)', '$85K', 'Onboarding · activation playbooks'],
    ['Marketing programs', '$180K', 'Trade shows, digital, content, case studies'],
    ['Sales tools & travel', '$60K', 'CRM, demo env, regional travel'],
    ['Partner / channel', '$120K', 'FSI co-marketing · referral incentives'],
  ], 2.0, 8);

  slide = sectionSlide(pptx, 'Use of funds', 'Engineering Detail ($700K)', '18-month product roadmap funded');
  addTable(slide, ['Initiative', 'Est. spend', 'Deliverable'], [
    ['iOS Driver app', '$180K', 'Feature parity core · App Store launch'],
    ['Fuel program integration', '$120K', 'Issuer APIs · reconciliation · controls'],
    ['Credit / billing AR', '$100K', 'Limits · statements · collections hooks'],
    ['Analytics v1 (Pillar 2)', '$80K', 'Metro dashboards · health scores'],
    ['Scale & security', '$120K', 'Hardening, backups, monitoring, pen test'],
    ['Engineering salaries (partial)', '$100K', '1–2 full-stack / mobile FTE allocation'],
  ], 2.0, 7.5);

  slide = sectionSlide(pptx, 'Use of funds', 'FSI Seed ($300K) + G&A ($200K)', null);
  addTable(slide, ['FSI seed', 'Amount', 'G&A line', 'Amount'], [
    ['Mobile unit equipment', '$120K', 'Legal & securities', '$60K'],
    ['Initial tech labor', '$100K', 'Finance / insurance', '$45K'],
    ['Parts & WC float', '$80K', 'Issuer program setup', '$55K'],
    ['', '', 'Contingency', '$40K'],
  ], 2.05, 8.5);

  slide = sectionSlide(pptx, 'Burn & runway', 'Monthly Burn Profile (Illustrative)', 'Ramp in Q1 post-close · stabilize Q4');
  addTable(slide, ['Quarter', 'Est. net burn/mo', 'Cumulative', 'Focus'], [
    ['Q1', '$95K', '$285K', 'Hires · fuel spec · sales playbook'],
    ['Q2', '$88K', '$549K', 'Pipeline · 3A fuel aggregate MVP'],
    ['Q3', '$82K', '$795K', 'Co-brand negotiations · FSI launch prep'],
    ['Q4', '$78K', '$1.03M', 'Territory live · credit pilot'],
    ['Q5–Q8', '$75–85K', '→ $2M', 'Scale to Series A metrics'],
  ], 2.0, 8);

  slide = sectionSlide(pptx, 'Milestones', '24-Month KPI Calendar', 'Tied to raise deployment', true);
  addTable(slide, ['When', 'Customers', 'Units', 'Product / ops'], [
    ['Month 6', '40+', '600+', 'Fuel 3A MVP · documented sales playbook'],
    ['Month 12', '80+', '1,400+', 'Fuel partner signed · Net-15 credit pilot'],
    ['Month 18', '115+', '2,000+', 'FSI territory at utilization target · analytics v1'],
    ['Month 24', '150+', '2,500+', 'Final-mile pilot · Series A data room ready'],
  ], 2.05, 8.5, WHITE);

  slide = sectionSlide(pptx, 'Milestones', 'Long-Term Model Milestones', 'From financial model — beyond this raise');
  bullets(slide, MILESTONES.map((m) => `${m.when}: ${m.metric}`), 1.95, 10);

  slide = sectionSlide(pptx, 'Investor KPIs', 'Dashboard We Report (Board / Investors)', null);
  addTable(slide, ['KPI', 'Definition', 'Target direction'], [
    ['Billable units', 'Licensed active vehicles+trailers', 'Up MoM'],
    ['MRR / ARR', 'Subscription recognized', 'Up · path to $100K ARR ~Y2 model'],
    ['NRR', 'Expansion − churn on customer cohort', '> 100%'],
    ['CAC payback', 'Months to recover CAC on GM', '< 18 mo'],
    ['Fuel attach', '% units on FleetCo fuel program', '> 40% (Y2 goal)'],
    ['Gross margin %', 'SaaS blended', `≥ ${ASSUMPTIONS.grossMarginPct}%`],
    ['Logo churn', 'Annual', `→ ${ASSUMPTIONS.churnEndPct}%`],
  ], 1.95, 7.5);

  slide = sectionSlide(pptx, 'Series A', 'Path After This Round', 'Illustrative — not commitment to raise timing', true);
  bullets(slide, [
    'Target raise window: 24–30 months post-close · $8–15M range typical for vertical SaaS + fintech layers (market dependent)',
    'Proof points: 150+ logos, 2.5K+ units, fuel program revenue started, one FSI territory profitable',
    'Metrics: $3M+ ARR run-rate or clear line of sight with NRR and fuel attach',
    'Use Series A for: multi-region sales, 5+ FSI territories, national fuel program, freight 5B rollout',
    'This $2M round is designed to de-risk product and GTM — not to fund national freight day one',
  ], 1.95, 10, WHITE);

  slide = sectionSlide(pptx, 'Risks', 'Risk Register with Mitigations', null);
  addTable(slide, ['Risk', 'Impact', 'Mitigation'], [
    ['Long sales cycles', 'Slow burn efficiency', 'ICP focus · FSI channel · annual prepay'],
    ['Fuel/credit regulation', 'Delay Pillar 3', 'Bank/issuer partners · counsel · phased rollout'],
    ['FSI capital needs', 'Territory underperforms', 'Mobile-first · one proof market · data-led site pick'],
    ['Competition', 'Price pressure', 'Integrated service · switching cost · regional density'],
    ['Execution / key person', 'Delivery slip', 'Hire CS+eng early · document playbooks'],
    ['Tech / security incident', 'Trust loss', 'Pen test · backups · incident response plan'],
  ], 1.95, 7.5);

  slide = sectionSlide(pptx, 'Team', `${BRAND.company}`, `${BRAND.location} · nationwide customer focus`, true);
  bullets(slide, [
    'Founder-led full-stack delivery: portal, API, mobile shell, billing, compliance features shipped to production',
    'Domain: DOT compliance workflows, shop operations, fleet P&L, SMB carrier sales motion',
    'Open advisor seats: logistics finance (fuel/credit), insurance, former carrier COO, FSI territory ops',
    'Post-close hires (funded): AEs, SDR, CS, mobile engineer, part-time CFO/bookkeeper scale-up',
    `${BRAND.supportEmail} · ${BRAND.phone}`,
  ], 1.95, 10, WHITE);

  slide = sectionSlide(pptx, 'Data room', 'Due Diligence Materials Available', 'Under NDA for qualified investors');
  bullets(slide, [
    'Cap table · incorporation docs · operating agreement (as applicable)',
    'Full 10-year Excel-equivalent model · assumptions tab · scenario toggles',
    'Technical: architecture overview, entity list, security checklist, hosting summary',
    'Commercial: sample contracts, pricing, anonymized usage metrics where available',
    'Legal: privacy/terms, subprocessors, Stripe/Resend agreements summary',
    'Product: live demo tenant · driver app test track instructions',
  ], 1.95, 10);

  slide = sectionSlide(pptx, 'Closing', `Join FleetCo — $${(RAISE_USD / 1e6).toFixed(0)}M to Build the SMB Fleet Stack`, 'Software today · platform economics tomorrow.', true);
  bullets(slide, [
    'We are raising $2M to execute pillars 1–3 in 24 months while seeding pillar 4 and scoping pillar 5.',
    'Next step: 60-minute session — live product demo + financial model + Q&A with founder',
    'Timeline: lead investor · co-investors · close target within 90 days of partner meeting',
    `${BRAND.url} · ${BRAND.supportEmail} · ${BRAND.phone}`,
    'Forward-looking statements in this deck are illustrative; past performance and projections are not guarantees.',
  ], 2.0, 10, WHITE);

  slide = sectionSlide(pptx, 'Appendix', 'Model Assumptions (Summary)', null);
  addTable(slide, ['Assumption', 'Value'], [
    ['Model start year', ASSUMPTIONS.modelStartYear],
    ['SaaS gross margin', `${ASSUMPTIONS.grossMarginPct}%`],
    ['Billing mix', `${ASSUMPTIONS.billingMix.monthly * 100}% monthly / ${ASSUMPTIONS.billingMix.yearly * 100}% annual`],
    ['Annual prepay discount (product)', '5% on per-unit plan'],
    ['Churn improvement', `${ASSUMPTIONS.churnStartPct}% → ${ASSUMPTIONS.churnEndPct}%`],
    ['FSI service GM', `${SHOP_ASSUMPTIONS.grossMarginPct}%`],
  ], 2.1, 9);

  slide = sectionSlide(pptx, 'Appendix', '10-Year SaaS Projection (Base)', 'Full table — see model for edits');
  addTable(
    slide,
    ['Y', 'Cust', 'Rev', 'ARR', 'EBITDA'],
    BASE_PROJECTION.map((r) => [
      r.year,
      r.customersEoy,
      formatCurrency(r.annualRevenue, true),
      formatCurrency(r.arrEoy, true),
      formatCurrency(r.ebitda, true),
    ]),
    1.85,
    7.5,
  );

  await pptx.writeFile({ fileName: outFile });
  fs.copyFileSync(outFile, path.join(publicDir, FILE_NAME));
  fs.copyFileSync(outFile, path.join(os.homedir(), 'Downloads', FILE_NAME));

  console.log(`Slides: ${slideNum}`);
  console.log('Wrote:', outFile);
  console.log('Downloads:', path.join(os.homedir(), 'Downloads', FILE_NAME));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

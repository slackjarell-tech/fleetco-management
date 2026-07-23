/**
 * In-depth FleetCo business pitch deck (PowerPoint).
 * Run: npm run marketing:pitch
 */
import PptxGenJS from 'pptxgenjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { BRAND } from '../marketing/brand.js';
import {
  BASE_PROJECTION,
  SCENARIOS_Y5,
  SCENARIOS_Y10,
  MILESTONES,
  SHOP_ASSUMPTIONS,
  COMBINED_PROJECTION,
} from '../marketing/financial-model.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'marketing');
const outFile = path.join(outDir, 'FleetCo-Business-Pitch-Deck.pptx');

const NAVY = '0F172A';
const AMBER = 'F59E0B';
const SLATE = '64748B';
const WHITE = 'FFFFFF';
const LIGHT = 'F8FAFC';
const CARD = '1E293B';

function footer(slide, pptx) {
  slide.addText(`${BRAND.shortName}  ·  ${BRAND.website}  ·  ${BRAND.phone}`, {
    x: 0.5, y: 7.05, w: 9, h: 0.28, fontSize: 9, color: SLATE, align: 'center',
  });
}

function sectionSlide(pptx, label, title, subtitle, dark = false) {
  const slide = pptx.addSlide();
  slide.background = { color: dark ? NAVY : LIGHT };
  slide.addText(label, {
    x: 0.6, y: 0.45, w: 4, h: 0.35, fontSize: 11, bold: true, color: AMBER,
  });
  slide.addText(title, {
    x: 0.6, y: 0.85, w: 9, h: 0.75, fontSize: 28, bold: true, color: dark ? WHITE : NAVY,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6, y: 1.55, w: 9, h: 0.55, fontSize: 14, color: dark ? SLATE : SLATE,
    });
  }
  footer(slide, pptx);
  return slide;
}

function bulletBlock(slide, items, startY = 2.0, color = NAVY) {
  items.forEach((text, i) => {
    slide.addText('▸  ' + text, {
      x: 0.75, y: startY + i * 0.52, w: 8.8, h: 0.48, fontSize: 13, color,
    });
  });
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pptx = new PptxGenJS();
  pptx.author = BRAND.company;
  pptx.company = BRAND.shortName;
  pptx.title = `${BRAND.shortName} — Business Pitch Deck`;
  pptx.subject = 'SaaS fleet platform + FSI mobile service integration';
  pptx.layout = 'LAYOUT_WIDE';

  const y5 = BASE_PROJECTION[4];
  const y10 = BASE_PROJECTION[9];
  const combinedY10 = COMBINED_PROJECTION?.[9];

  // 1 Cover
  let slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.12, h: '100%', fill: { color: AMBER } });
  slide.addText('FLEETCO', { x: 0.7, y: 1.0, w: 8, h: 0.7, fontSize: 40, bold: true, color: WHITE });
  slide.addText('MANAGEMENT', { x: 0.7, y: 1.55, w: 8, h: 0.45, fontSize: 16, color: AMBER, charSpacing: 6 });
  slide.addText('Business Pitch Deck', { x: 0.7, y: 2.35, w: 9, h: 0.55, fontSize: 22, color: SLATE });
  slide.addText('Software + Mobile Driver App + FSI Service Territories', {
    x: 0.7, y: 3.0, w: 9, h: 0.9, fontSize: 32, bold: true, color: WHITE,
  });
  slide.addText(BRAND.tagline, { x: 0.7, y: 4.0, w: 8, h: 0.4, fontSize: 16, color: SLATE, italic: true });
  slide.addText(`${BRAND.url}  ·  ${BRAND.phone}  ·  ${BRAND.location}`, {
    x: 0.7, y: 4.55, w: 8, h: 0.4, fontSize: 14, color: AMBER, bold: true,
  });
  slide.addText('Confidential — July 2026', { x: 0.7, y: 6.15, w: 5, h: 0.3, fontSize: 11, color: SLATE });

  // 2 Executive summary
  slide = sectionSlide(pptx, 'EXECUTIVE SUMMARY', 'One Platform. Two Revenue Engines.', null);
  bulletBlock(slide, [
    'FleetCo Management — cloud SaaS for dispatch, maintenance, fuel, compliance, accounting, and customer portals',
    'FleetCo Driver — Android app (internal testing live) connecting drivers via GPS, scans, routes, HOS, and POD',
    'Fleet Services International (FSI) — affiliated mobile fleet service territories (protected markets, on-site PM/repair)',
    'Integrated stack: field service + software = higher retention, data moat, and blended revenue',
    `Base case Year 5: ~$${(y5.arrEoy / 1e6).toFixed(2)}M SaaS ARR · Year 10: ~$${(y10.arrEoy / 1e6).toFixed(2)}M SaaS ARR`,
    combinedY10
      ? `Year 10 combined (SaaS + FSI territories): ~$${(combinedY10.combinedRevenue / 1e6).toFixed(1)}M revenue`
      : 'Year 10 combined revenue targets $12M+ with 12 FSI territories (see financial model)',
  ]);

  // 3 Problem
  slide = sectionSlide(pptx, 'THE PROBLEM', 'Fleet Operations Are Fragmented and Expensive', 'Small and mid-size carriers lose margin to tool sprawl and downtime.');
  const problems = [
    '5+ disconnected systems for dispatch, maintenance, fuel, compliance, and accounting',
    '30% of revenue at risk from inefficiency, unplanned downtime, and poor visibility',
    'DOT violations and missed PMs → $10K+ fines and lost loads',
    'Drivers on phones without a unified app tied to dispatch and billing',
    'Shop work disconnected from fleet status, parts, and customer P&L',
  ];
  bulletBlock(slide, problems, 2.1);

  // 4 Solution
  slide = sectionSlide(pptx, 'THE SOLUTION', 'FleetCo Command Center + Driver App', null, true);
  bulletBlock(slide, [
    'Single secure portal for owners, dispatch, finance, and customers',
    'Real-time fleet map, routes, work orders, fuel, HOS, and TCO per mile',
    'FleetCo Driver mobile app syncs clock-in GPS, scans, routes, and media to the portal',
    'AI Site Commander — natural-language queries and portal automation',
    'Optional FSI mobile service territories for preventative maintenance and breakdown response',
  ], 2.0, WHITE);

  // 5 Platform modules
  slide = sectionSlide(pptx, 'PLATFORM', 'What FleetCo Delivers Today', `${BRAND.url}/login — live production portal`);
  const modules = [
    ['Fleet & Assets', 'VIN decode, specs, recalls, parts links, documents'],
    ['Dispatch & Loads', 'Load board, routes, GPS map, delivery POD'],
    ['Maintenance', 'Work orders, PM, In Shop status, parts & vendors'],
    ['Fuel & IFTA', 'Fuel logs, audits, cost-per-mile / TCO'],
    ['Compliance', 'HOS, inspections, incidents, driver documents'],
    ['Accounting', 'GL, PO email PDFs, payroll hooks, 1099, invoicing'],
  ];
  modules.forEach(([title, desc], i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.6 + col * 3.15, y: 2.05 + row * 1.55, w: 2.95, h: 1.35,
      fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.06,
    });
    slide.addText(title, { x: 0.75 + col * 3.15, y: 2.2 + row * 1.55, w: 2.7, h: 0.35, fontSize: 11, bold: true, color: NAVY });
    slide.addText(desc, { x: 0.75 + col * 3.15, y: 2.55 + row * 1.55, w: 2.7, h: 0.75, fontSize: 9, color: SLATE });
  });

  // 6 Driver app
  slide = sectionSlide(pptx, 'MOBILE', 'FleetCo Driver App', 'Package: org.fleetcomanagement.driver · Play internal testing live', true);
  bulletBlock(slide, [
    'Time clock with live GPS while on shift → Fleet Map for dispatch',
    'Barcode/QR scan history with location → Driver Scans in portal',
    'Delivery routes, POD photos, dashcam clips, fuel, HOS, inspections, messages',
    'Same API and database as the web portal — no duplicate data entry',
    'Demo drivers: driver1@fleetco.com / demo123 (seed script for production)',
  ], 2.05, WHITE);

  // 7 FSI
  slide = sectionSlide(pptx, 'VERTICAL INTEGRATION', 'Fleet Services International (FSI)', SHOP_ASSUMPTIONS.modelSummary);
  bulletBlock(slide, [
    'FSI corporate (fleetservicesint.com): protected commercial territory · Business-in-a-Box training & vendor pricing',
    'Not a franchise — no royalties per FSI public materials; typical capital $150K–$500K per territory',
    'Affiliated dealer model: mobile on-site PM + breakdown calls — owner as territory architect',
    'Every repair order flows through FleetCo: work orders, tech time, parts, customer invoicing',
    'SaaS customers get priority scheduling; shop-only fleets upsell to Starter/Growth plans',
  ], 2.15);

  // 8 Market
  slide = sectionSlide(pptx, 'MARKET', 'Large, Underserved SMB Fleet Segment', null);
  bulletBlock(slide, [
    'US trucking and fleet services: multi-billion TAM; SMB operators underserved by enterprise telematics',
    'Target: owner-operators (1–5 units), small fleets (6–15), growth fleets (16+)',
    'Competitors (Samsara, Fleetio, Motive) focus enterprise — gap for integrated ops + optional field service',
    'Geography: launch Dallas metro · expand along I-20 / I-35 / I-10 freight corridors',
  ], 2.05);

  // 9 Business model
  slide = sectionSlide(pptx, 'BUSINESS MODEL', 'Recurring SaaS + Service Revenue', null, true);
  bulletBlock(slide, [
    `SaaS: Starter $299/mo (1–5 units) · Growth $599/mo (6–15) · Enterprise custom (16+)`,
    'Managed fleet services and onboarding fees (high-touch customers)',
    'FSI-affiliated territories: recurring PM contracts + break-fix labor and parts',
    '~68% gross margin SaaS · ~42% gross margin field service (model assumptions)',
    'Land with software or service — expand wallet share within each fleet account',
  ], 2.0, WHITE);

  // 10 Competitive edge
  slide = sectionSlide(pptx, 'WHY FLEETCO', 'Competitive Advantages', null);
  const edges = [
    ['All-in-one portal', 'Dispatch, shop, fuel, compliance, accounting — one login'],
    ['Driver app + portal', 'Native Android; data syncs in real time'],
    ['AI Site Commander', 'Plain-English automation for owners and executives'],
    ['FSI option', 'Vertical service layer competitors cannot copy quickly'],
    ['Price point', 'SMB-friendly vs enterprise telematics contracts'],
  ];
  edges.forEach(([t, d], i) => {
    slide.addText(t, { x: 0.7, y: 2.0 + i * 0.95, w: 2.5, h: 0.35, fontSize: 12, bold: true, color: AMBER });
    slide.addText(d, { x: 3.2, y: 2.0 + i * 0.95, w: 6.2, h: 0.4, fontSize: 12, color: NAVY });
  });

  // 11 Traction
  slide = sectionSlide(pptx, 'TRACTION', 'Product & Go-to-Market Status', null, true);
  bulletBlock(slide, [
    'Production SaaS at fleetcomanagement.org with HTTPS, privacy/terms, pricing, and customer onboarding',
    'FleetCo Driver AAB built; Google Play internal testing track active',
    'Driver download links on website; demo driver accounts and unique DRV numbers',
    'Business plan, revenue models, client deck, and marketing assets in market',
    'FSI dealership framework aligned with fleetservicesint.com public model',
  ], 2.05, WHITE);

  // 12 Financials Y5
  slide = sectionSlide(pptx, 'FINANCIALS', '5-Year SaaS Outlook (Base Case)', 'Source: FleetCo financial model — illustrative projections');
  slide.addText(`Year 5 (${y5.calendar})`, { x: 0.6, y: 2.0, w: 4, h: 0.35, fontSize: 14, bold: true, color: NAVY });
  const fin5 = [
    [`Customers (EOY)`, `${y5.customersEoy}`],
    [`ARR (EOY)`, `$${(y5.arrEoy / 1000).toFixed(0)}K`],
    [`Annual revenue`, `$${(y5.annualRevenue / 1000).toFixed(0)}K`],
    [`EBITDA`, `$${(y5.ebitda / 1000).toFixed(0)}K`],
  ];
  fin5.forEach(([k, v], i) => {
    slide.addText(k, { x: 0.7, y: 2.45 + i * 0.45, w: 2.5, h: 0.35, fontSize: 11, color: SLATE });
    slide.addText(v, { x: 3.2, y: 2.45 + i * 0.45, w: 2, h: 0.35, fontSize: 14, bold: true, color: AMBER });
  });
  slide.addText('Year 5 scenarios (customers EOY)', { x: 5.2, y: 2.0, w: 4.5, h: 0.35, fontSize: 12, bold: true, color: NAVY });
  Object.values(SCENARIOS_Y5).forEach((s, i) => {
    slide.addText(`${s.label}: ${s.customersEoy} customers · $${(s.arrEoy / 1e6).toFixed(2)}M ARR`, {
      x: 5.2, y: 2.45 + i * 0.5, w: 4.5, h: 0.4, fontSize: 11, color: SLATE,
    });
  });

  // 13 Financials Y10 combined
  slide = sectionSlide(pptx, 'FINANCIALS', '10-Year Vision (Base Case)', null, true);
  slide.addText(`Year 10 SaaS ARR: $${(y10.arrEoy / 1e6).toFixed(2)}M · ${y10.customersEoy} customers`, {
    x: 0.6, y: 2.0, w: 9, h: 0.45, fontSize: 16, bold: true, color: AMBER,
  });
  if (combinedY10) {
    slide.addText(
      `Combined revenue (SaaS + FSI territories): $${(combinedY10.combinedRevenue / 1e6).toFixed(1)}M · ${combinedY10.locationsEoy} territories`,
      { x: 0.6, y: 2.55, w: 9, h: 0.45, fontSize: 14, color: WHITE },
    );
  }
  Object.values(SCENARIOS_Y10).forEach((s, i) => {
    slide.addText(`${s.label} Y10: $${(s.arrEoy / 1e6).toFixed(2)}M ARR · ${s.customersEoy} customers`, {
      x: 0.7, y: 3.2 + i * 0.55, w: 8.5, h: 0.45, fontSize: 13, color: WHITE,
    });
  });
  slide.addText('EBITDA turns positive in base case mid-model as opex scales slower than ARR', {
    x: 0.6, y: 5.2, w: 9, h: 0.4, fontSize: 11, color: SLATE, italic: true,
  });

  // 14 Milestones
  slide = sectionSlide(pptx, 'ROADMAP', 'Key Milestones', null);
  MILESTONES.forEach(({ when, metric }, i) => {
    slide.addText(when, { x: 0.7, y: 2.0 + i * 0.95, w: 1.4, h: 0.35, fontSize: 11, bold: true, color: AMBER });
    slide.addText(metric, { x: 2.2, y: 2.0 + i * 0.95, w: 7.2, h: 0.75, fontSize: 11, color: NAVY });
  });

  // 15 GTM
  slide = sectionSlide(pptx, 'GO-TO-MARKET', 'How We Win Customers', null);
  bulletBlock(slide, [
    'Founder-led sales, website demos, and fleet association outreach',
    'FSI territory launch: mobile PM contracts + SaaS upsell',
    'Content: client deck, video tour, user manual, competitive analysis',
    'Partner channel: FSI corporate referrals and regional dealer network',
    'Land Starter/Growth → expand units and modules → Enterprise + managed services',
  ], 2.05);

  // 16 Pricing
  slide = sectionSlide(pptx, 'PRICING', 'Simple SaaS Plans', 'Fast onboarding · month-to-month or annual');
  BRAND.pricing.forEach((plan, i) => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.6 + i * 3.15, y: 2.0, w: 2.95, h: 2.85,
      fill: { color: WHITE }, line: { color: plan.highlighted ? AMBER : 'E2E8F0', width: plan.highlighted ? 2 : 1 }, rectRadius: 0.08,
    });
    slide.addText(plan.name, { x: 0.75 + i * 3.15, y: 2.15, w: 2.7, h: 0.35, fontSize: 13, bold: true, color: NAVY });
    slide.addText(plan.price, { x: 0.75 + i * 3.15, y: 2.55, w: 2.7, h: 0.45, fontSize: 18, bold: true, color: AMBER });
    slide.addText(plan.fleetSize, { x: 0.75 + i * 3.15, y: 3.05, w: 2.7, h: 0.3, fontSize: 10, bold: true, color: NAVY });
    slide.addText(plan.detail, { x: 0.75 + i * 3.15, y: 3.4, w: 2.7, h: 1.2, fontSize: 9, color: SLATE });
  });

  // 17 Team
  slide = sectionSlide(pptx, 'TEAM', 'Leadership', BRAND.location, true);
  slide.addText('JaRell Slack & Desiree Slack — Owners / Operators', {
    x: 0.6, y: 2.1, w: 9, h: 0.45, fontSize: 18, bold: true, color: WHITE,
  });
  bulletBlock(slide, [
    'Built and deployed full-stack fleet platform (React, Node, PostgreSQL on Render)',
    'Hands-on fleet operations, customer success, and product roadmap',
    'Executing FSI-aligned mobile service strategy alongside SaaS growth',
  ], 2.75, WHITE);

  // 18 Ask / Contact
  slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: AMBER } });
  slide.addText('Partner With FleetCo', { x: 0.6, y: 1.2, w: 9, h: 0.8, fontSize: 32, bold: true, color: WHITE, align: 'center' });
  slide.addText('Invest · Refer fleets · FSI territory · Enterprise pilot', {
    x: 0.6, y: 2.05, w: 9, h: 0.5, fontSize: 14, color: SLATE, align: 'center',
  });
  slide.addText(BRAND.url, { x: 0.6, y: 2.85, w: 9, h: 0.5, fontSize: 22, bold: true, color: AMBER, align: 'center' });
  slide.addText(`${BRAND.email}  ·  ${BRAND.phone}`, {
    x: 0.6, y: 3.45, w: 9, h: 0.4, fontSize: 14, color: WHITE, align: 'center',
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 2.2, y: 4.35, w: 5.6, h: 1.35, fill: { color: CARD }, line: { color: AMBER, width: 1 },
  });
  slide.addText('Schedule a live portal demo · Request financial model · Tour FleetCo Driver app', {
    x: 2.4, y: 4.65, w: 5.2, h: 0.75, fontSize: 12, color: WHITE, align: 'center',
  });

  await pptx.writeFile({ fileName: outFile });

  const publicDir = path.join(__dirname, '..', 'public', 'marketing');
  fs.mkdirSync(publicDir, { recursive: true });
  const publicFile = path.join(publicDir, 'FleetCo-Business-Pitch-Deck.pptx');
  fs.copyFileSync(outFile, publicFile);

  const downloads = path.join(process.env.USERPROFILE || '', 'Downloads', 'FleetCo-Pitch-Deck');
  fs.mkdirSync(downloads, { recursive: true });
  fs.copyFileSync(outFile, path.join(downloads, 'FleetCo-Business-Pitch-Deck.pptx'));
  try {
    fs.copyFileSync(path.join(outDir, 'FleetCo-Client-Presentation.pptx'), path.join(downloads, 'FleetCo-Client-Presentation.pptx'));
  } catch {
    /* client deck optional if not generated yet */
  }

  fs.writeFileSync(
    path.join(downloads, 'README.txt'),
    `FleetCo Pitch Decks\n\nFleetCo-Business-Pitch-Deck.pptx — In-depth business pitch (18 slides)\nFleetCo-Client-Presentation.pptx — Shorter client deck (8 slides)\n\nRegenerate:\n  npm run marketing:pitch\n  npm run marketing:deck\n`,
  );

  console.log('Created:', outFile);
  console.log('Copied to:', publicFile);
  console.log('Downloads:', downloads);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

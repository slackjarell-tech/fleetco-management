/**
 * Generates FleetCo client marketing PowerPoint.
 * Run: npm run marketing:deck
 */
import PptxGenJS from 'pptxgenjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { BRAND } from '../marketing/brand.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'marketing');
const outFile = path.join(outDir, 'FleetCo-Client-Presentation.pptx');

const NAVY = '0F172A';
const AMBER = 'F59E0B';
const SLATE = '64748B';
const WHITE = 'FFFFFF';
const LIGHT = 'F8FAFC';

function addFooter(slide) {
  slide.addText(`${BRAND.company}  ·  ${BRAND.website}  ·  ${BRAND.phone}  ·  ${BRAND.location}`, {
    x: 0.5,
    y: 7.1,
    w: 9,
    h: 0.3,
    fontSize: 9,
    color: SLATE,
    align: 'center',
  });
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pptx = new PptxGenJS();
  pptx.author = BRAND.company;
  pptx.company = BRAND.shortName;
  pptx.title = `${BRAND.shortName} — Client Presentation`;
  pptx.subject = 'Fleet operations platform for owner-operators and small fleets';
  pptx.layout = 'LAYOUT_WIDE';

  // ── Slide 1: Cover ──
  let slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.12, h: '100%', fill: { color: AMBER } });
  slide.addText('FLEETCO', { x: 0.7, y: 1.2, w: 8, h: 0.8, fontSize: 44, bold: true, color: WHITE, fontFace: 'Arial' });
  slide.addText('MANAGEMENT', { x: 0.7, y: 1.85, w: 8, h: 0.5, fontSize: 18, color: AMBER, charSpacing: 8, fontFace: 'Arial' });
  slide.addText('Complete Fleet Operations.\nOne Platform.', {
    x: 0.7, y: 2.6, w: 9, h: 1.6, fontSize: 36, bold: true, color: WHITE, fontFace: 'Arial',
  });
  slide.addText(BRAND.tagline, {
    x: 0.7, y: 4.15, w: 8, h: 0.45, fontSize: 16, color: SLATE, italic: true,
  });
  slide.addText('Built for owner-operators & small fleets · Dallas, TX', {
    x: 0.7, y: 4.65, w: 8, h: 0.4, fontSize: 14, color: SLATE,
  });
  slide.addText(`${BRAND.website}  ·  ${BRAND.phone}`, {
    x: 0.7, y: 5.15, w: 8, h: 0.4, fontSize: 14, color: AMBER, bold: true,
  });
  slide.addText('Client Presentation — July 2026', { x: 0.7, y: 6.2, w: 5, h: 0.3, fontSize: 11, color: SLATE });

  // ── Slide 2: The Problem ──
  slide = pptx.addSlide();
  slide.background = { color: LIGHT };
  slide.addText('THE CHALLENGE', { x: 0.6, y: 0.4, w: 3, h: 0.35, fontSize: 11, bold: true, color: 'DC2626' });
  slide.addText('Fleet Management Is Fragmented', { x: 0.6, y: 0.75, w: 9, h: 0.7, fontSize: 28, bold: true, color: NAVY });
  const problems = [
    '5+ disconnected tools for dispatch, maintenance, fuel, and compliance',
    '30% of revenue lost to inefficiency, downtime, and poor visibility',
    'DOT violations and missed PMs cost $10K+ in fines and lost loads',
    'No single source of truth for fleet P&L and cost-per-mile',
  ];
  problems.forEach((text, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.6 + col * 4.7, y: 1.7 + row * 1.55, w: 4.4, h: 1.35,
      fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.08,
    });
    slide.addText(String(i + 1), {
      x: 0.85 + col * 4.7, y: 1.95 + row * 1.55, w: 0.4, h: 0.4,
      fontSize: 14, bold: true, color: 'DC2626', align: 'center',
    });
    slide.addText(text, { x: 1.35 + col * 4.7, y: 1.9 + row * 1.55, w: 3.5, h: 1, fontSize: 13, color: NAVY, valign: 'middle' });
  });
  addFooter(slide);

  // ── Slide 3: Solution ──
  slide = pptx.addSlide();
  slide.background = { color: WHITE };
  slide.addText('OUR SOLUTION', { x: 0.6, y: 0.4, w: 3, h: 0.35, fontSize: 11, bold: true, color: AMBER });
  slide.addText('FleetCo — Your Command Center', { x: 0.6, y: 0.75, w: 9, h: 0.7, fontSize: 28, bold: true, color: NAVY });
  slide.addText('One secure portal for your entire operation — from the road to the shop to the back office.', {
    x: 0.6, y: 1.45, w: 9, h: 0.5, fontSize: 14, color: SLATE,
  });
  const features = [
    ['Fleet & Assets', 'Every truck, trailer, VIN, odometer & document'],
    ['Dispatch & Loads', 'Load board, routes, GPS map & delivery POD'],
    ['Maintenance & Shop', 'Work orders, PM schedules, parts & vendors'],
    ['Fuel & IFTA', 'Station pricing, fuel logs & tax-ready reports'],
    ['Compliance', 'HOS/ELD, DVIRs, inspections & incident tracking'],
    ['Analytics & P&L', 'Fleet-wide KPIs, TCO per unit & custom reports'],
  ];
  features.forEach(([title, desc], i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.6 + col * 3.15, y: 2.2 + row * 1.65, w: 2.95, h: 1.45,
      fill: { color: LIGHT }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.06,
    });
    slide.addText(title, { x: 0.75 + col * 3.15, y: 2.35 + row * 1.65, w: 2.7, h: 0.35, fontSize: 12, bold: true, color: NAVY });
    slide.addText(desc, { x: 0.75 + col * 3.15, y: 2.75 + row * 1.65, w: 2.7, h: 0.7, fontSize: 10, color: SLATE });
  });
  addFooter(slide);

  // ── Slide 4: AI Site Commander ──
  slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addText('AI-POWERED', { x: 0.6, y: 0.5, w: 3, h: 0.35, fontSize: 11, bold: true, color: AMBER });
  slide.addText('Site Commander & Revan AI', { x: 0.6, y: 0.85, w: 9, h: 0.7, fontSize: 28, bold: true, color: WHITE });
  slide.addText('Like having Cursor built into your portal — ask in plain English, get real changes.', {
    x: 0.6, y: 1.55, w: 9, h: 0.5, fontSize: 14, color: SLATE,
  });
  const aiPoints = [
    '"List all open work orders" → instant fleet query',
    '"Change our homepage headline" → live website update',
    '"Create a brake inspection WO for unit 104" → done',
    'Executive Revan AI: audits, user management, full control',
  ];
  aiPoints.forEach((text, i) => {
    slide.addText('▸  ' + text, { x: 0.8, y: 2.3 + i * 0.55, w: 8.5, h: 0.45, fontSize: 14, color: WHITE });
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 4.8, w: 8.8, h: 1.2, fill: { color: '1E293B' }, line: { color: AMBER, width: 1 },
  });
  slide.addText(`Live demo: ${BRAND.url}/login`, {
    x: 0.8, y: 5.05, w: 8.4, h: 0.35, fontSize: 13, color: AMBER, bold: true,
  });
  slide.addText('4 customers · 12 units · 8 work orders · 5 loads — pre-loaded demo data', {
    x: 0.8, y: 5.45, w: 8.4, h: 0.35, fontSize: 11, color: SLATE,
  });

  // ── Slide 5: Results / ROI ──
  slide = pptx.addSlide();
  slide.background = { color: LIGHT };
  slide.addText('RESULTS', { x: 0.6, y: 0.4, w: 3, h: 0.35, fontSize: 11, bold: true, color: AMBER });
  slide.addText('What FleetCo Delivers', { x: 0.6, y: 0.75, w: 9, h: 0.7, fontSize: 28, bold: true, color: NAVY });
  const stats = [
    ['15–25%', 'Reduction in unplanned downtime', 'PM alerts & work order tracking'],
    ['8–12%', 'Fuel cost savings', 'Station pricing & IFTA-ready logs'],
    ['100%', 'Compliance visibility', 'HOS, DVIRs & inspection records in one place'],
    ['1 Portal', 'For owners, dispatch & drivers', 'Role-based access, mobile-ready'],
  ];
  stats.forEach(([num, title, sub], i) => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.6 + (i % 2) * 4.7, y: 1.6 + Math.floor(i / 2) * 1.75, w: 4.4, h: 1.55,
      fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.08,
    });
    slide.addText(num, { x: 0.85 + (i % 2) * 4.7, y: 1.75 + Math.floor(i / 2) * 1.75, w: 2, h: 0.5, fontSize: 22, bold: true, color: AMBER });
    slide.addText(title, { x: 0.85 + (i % 2) * 4.7, y: 2.25 + Math.floor(i / 2) * 1.75, w: 3.9, h: 0.35, fontSize: 13, bold: true, color: NAVY });
    slide.addText(sub, { x: 0.85 + (i % 2) * 4.7, y: 2.6 + Math.floor(i / 2) * 1.75, w: 3.9, h: 0.35, fontSize: 10, color: SLATE });
  });
  addFooter(slide);

  // ── Slide 6: Who We Serve ──
  slide = pptx.addSlide();
  slide.background = { color: WHITE };
  slide.addText('WHO WE SERVE', { x: 0.6, y: 0.4, w: 3, h: 0.35, fontSize: 11, bold: true, color: AMBER });
  slide.addText('Built for Real Fleet Operators', { x: 0.6, y: 0.75, w: 9, h: 0.7, fontSize: 28, bold: true, color: NAVY });
  const segments = [
    ['Owner-Operators', '1–5 trucks', 'Fuel savings, compliance, parts sourcing'],
    ['Small Fleets', '6–15 units', 'Dispatch, maintenance, driver management'],
    ['Established Fleets', '16+ units', 'Full-service management & dedicated support'],
  ];
  segments.forEach(([title, size, benefit], i) => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.6 + i * 3.15, y: 1.7, w: 2.95, h: 3.2,
      fill: { color: NAVY }, rectRadius: 0.08,
    });
    slide.addText(title, { x: 0.75 + i * 3.15, y: 2.0, w: 2.7, h: 0.4, fontSize: 14, bold: true, color: AMBER });
    slide.addText(size, { x: 0.75 + i * 3.15, y: 2.5, w: 2.7, h: 0.35, fontSize: 12, color: WHITE });
    slide.addText(benefit, { x: 0.75 + i * 3.15, y: 3.1, w: 2.7, h: 1.5, fontSize: 11, color: SLATE });
  });
  addFooter(slide);

  // ── Slide 7: Pricing ──
  slide = pptx.addSlide();
  slide.background = { color: LIGHT };
  slide.addText('PLANS & PRICING', { x: 0.6, y: 0.4, w: 3, h: 0.35, fontSize: 11, bold: true, color: AMBER });
  slide.addText('Simple Plans. Fast Onboarding.', { x: 0.6, y: 0.75, w: 9, h: 0.7, fontSize: 28, bold: true, color: NAVY });
  BRAND.pricing.forEach((plan, i) => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.6 + i * 3.15, y: 1.7, w: 2.95, h: plan.priceSub ? 3.0 : 2.85,
      fill: { color: WHITE }, line: { color: plan.highlighted ? AMBER : 'E2E8F0', width: plan.highlighted ? 2 : 1 }, rectRadius: 0.08,
    });
    slide.addText(plan.name, { x: 0.75 + i * 3.15, y: 1.9, w: 2.7, h: 0.35, fontSize: 14, bold: true, color: NAVY });
    slide.addText(plan.price, { x: 0.75 + i * 3.15, y: 2.3, w: 2.7, h: 0.5, fontSize: plan.contactOnly ? 16 : 20, bold: true, color: AMBER });
    if (plan.priceSub) {
      slide.addText(plan.priceSub, { x: 0.75 + i * 3.15, y: 2.75, w: 2.7, h: 0.25, fontSize: 10, color: SLATE, italic: true });
    }
    slide.addText(plan.fleetSize, { x: 0.75 + i * 3.15, y: plan.priceSub ? 3.05 : 2.85, w: 2.7, h: 0.3, fontSize: 11, bold: true, color: NAVY });
    slide.addText(plan.detail, { x: 0.75 + i * 3.15, y: plan.priceSub ? 3.35 : 3.2, w: 2.7, h: 1.1, fontSize: 10, color: SLATE });
  });
  slide.addText(`Schedule a free demo: ${BRAND.phone}  ·  ${BRAND.website}`, {
    x: 0.6, y: 4.85, w: 9, h: 0.4, fontSize: 13, color: NAVY, bold: true,
  });
  addFooter(slide);

  // ── Slide 8: Contact ──
  slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: AMBER } });
  slide.addText("Let's Move Your Fleet Forward", {
    x: 0.6, y: 1.3, w: 9, h: 0.9, fontSize: 32, bold: true, color: WHITE, align: 'center',
  });
  slide.addText('Schedule a demo · Request a custom quote · Tour the live portal', {
    x: 0.6, y: 2.2, w: 9, h: 0.5, fontSize: 14, color: SLATE, align: 'center',
  });
  slide.addText(BRAND.website, { x: 0.6, y: 3.0, w: 9, h: 0.5, fontSize: 22, bold: true, color: AMBER, align: 'center' });
  slide.addText(`${BRAND.email}  ·  ${BRAND.phone}  ·  ${BRAND.location}`, {
    x: 0.6, y: 3.6, w: 9, h: 0.4, fontSize: 14, color: WHITE, align: 'center',
  });
  slide.addText(BRAND.company, {
    x: 0.6, y: 4.5, w: 9, h: 0.35, fontSize: 12, color: WHITE, align: 'center', bold: true,
  });
  slide.addText(BRAND.location, {
    x: 0.6, y: 4.9, w: 9, h: 0.3, fontSize: 10, color: SLATE, align: 'center',
  });
  slide.addText(BRAND.ownersLine, {
    x: 0.6, y: 6.1, w: 9, h: 0.3, fontSize: 10, color: SLATE, align: 'center',
  });

  await pptx.writeFile({ fileName: outFile });

  const publicDir = path.join(__dirname, '..', 'public', 'marketing');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicFile = path.join(publicDir, 'FleetCo-Client-Presentation.pptx');
  fs.copyFileSync(outFile, publicFile);
  console.log('Created:', outFile);
  console.log('Copied to:', publicFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

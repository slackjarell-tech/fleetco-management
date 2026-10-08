/**
 * Illustrated deep-dive: FleetCo staff vs customer journeys + gap analysis.
 * Run: npm run marketing:deep-dive
 * Refresh screenshots: npm run marketing:deep-dive -- --refresh
 */
import PptxGenJS from 'pptxgenjs';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { BRAND } from '../marketing/brand.js';
import { captureShots, STANDARD_SHOTS, FRAMES_DIR } from './lib/manualScreenshots.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'marketing');
const outFile = path.join(outDir, 'FleetCo-System-Deep-Dive-Review.pptx');
const publicDir = path.join(__dirname, '..', 'public', 'marketing');

const NAVY = '0F172A';
const AMBER = 'F59E0B';
const SLATE = '64748B';
const WHITE = 'FFFFFF';
const LIGHT = 'F8FAFC';
const RED = 'DC2626';

let slideNum = 0;
let framePaths = {};

function footer(slide) {
  slide.addText(`${BRAND.shortName} Deep Dive  ·  ${BRAND.url}  ·  Slide ${slideNum}`, {
    x: 0.4,
    y: 7.08,
    w: 12.5,
    h: 0.32,
    fontSize: 8,
    color: SLATE,
    align: 'center',
  });
}

function addSlideBase(pptx, partLabel, title, dark = false) {
  slideNum += 1;
  const slide = pptx.addSlide();
  slide.background = { color: dark ? NAVY : LIGHT };
  slide.addText(partLabel.toUpperCase(), {
    x: 0.5,
    y: 0.35,
    w: 12,
    h: 0.35,
    fontSize: 10,
    bold: true,
    color: AMBER,
    charSpace: 1.5,
  });
  slide.addText(title, {
    x: 0.5,
    y: 0.72,
    w: 12,
    h: 0.65,
    fontSize: 26,
    bold: true,
    color: dark ? WHITE : NAVY,
  });
  footer(slide);
  return slide;
}

function addBullets(slide, items, x, y, w, h, fontSize = 11) {
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })),
    { x, y, w, h, fontSize, color: NAVY, valign: 'top', lineSpacingMultiple: 1.08 },
  );
}

function addScreenshotSlide(pptx, part, title, imageId, bullets, caption) {
  const slide = addSlideBase(pptx, part, title);
  const imgPath = framePaths[imageId] || (fs.existsSync(path.join(FRAMES_DIR, `${imageId}.png`))
    ? path.join(FRAMES_DIR, `${imageId}.png`)
    : null);
  const textW = imgPath ? 5.9 : 12;

  addBullets(slide, bullets, 0.55, 1.45, textW, 5.5, 11);

  if (imgPath && fs.existsSync(imgPath)) {
    slide.addImage({ path: imgPath, x: 6.55, y: 1.35, w: 6.35, h: 4.85, sizing: { type: 'contain', w: 6.35, h: 4.85 } });
    slide.addText(caption || `Live UI: ${imageId}`, {
      x: 6.55,
      y: 6.25,
      w: 6.35,
      h: 0.55,
      fontSize: 9,
      italic: true,
      color: SLATE,
    });
  } else {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 6.55,
      y: 1.35,
      w: 6.35,
      h: 4.85,
      fill: { color: 'E2E8F0' },
      line: { color: SLATE, width: 0.5 },
    });
    slide.addText(`Screenshot missing: ${imageId}\nRun: npm run marketing:deep-dive -- --refresh`, {
      x: 6.65,
      y: 3.2,
      w: 6.15,
      h: 1.2,
      fontSize: 11,
      color: SLATE,
      align: 'center',
    });
  }
  return slide;
}

function addTextOnlySlide(pptx, part, title, sections) {
  const slide = addSlideBase(pptx, part, title);
  let y = 1.4;
  for (const { heading, items } of sections) {
    slide.addText(heading, { x: 0.55, y, w: 12, h: 0.35, fontSize: 13, bold: true, color: NAVY });
    y += 0.38;
    addBullets(slide, items, 0.55, y, 12.1, Math.min(2.2, items.length * 0.35 + 0.5), 10);
    y += Math.min(2.35, items.length * 0.32 + 0.55);
  }
  return slide;
}

async function main() {
  const refresh = process.argv.includes('--refresh');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  console.log(refresh ? 'Refreshing screenshots from' : 'Using cached screenshots; pass --refresh to recapture');
  framePaths = await captureShots(STANDARD_SHOTS, { refresh });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = 'FleetCo System Deep Dive';
  pptx.author = BRAND.company;

  slideNum = 0;
  let slide = pptx.addSlide();
  slideNum = 1;
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.12, h: '100%', fill: { color: AMBER } });
  slide.addText('System Deep Dive Review', { x: 0.65, y: 1.8, w: 12, fontSize: 36, bold: true, color: WHITE });
  slide.addText('FleetCo operations · Customer portal · Gaps & improvements', { x: 0.65, y: 2.65, w: 11, fontSize: 16, color: 'CBD5E1' });
  slide.addText(`Screenshots from ${process.env.SITE_URL || 'https://fleetcomanagement.org'}  ·  ${new Date().toLocaleDateString()}`, {
    x: 0.65,
    y: 3.45,
    w: 11,
    fontSize: 12,
    color: AMBER,
  });
  footer(slide);

  slide = addSlideBase(pptx, 'Introduction', 'How to use this deck');
  addBullets(slide, [
    'Part A walks through the platform as FleetCo staff (owner, fleet manager, coordinator, shop tech).',
    'Part B walks through the same capabilities from a paying customer’s portal login.',
    'Part C covers the driver mobile experience.',
    'Part D lists what works today vs what still needs product, integration, or operational work — use this for prioritization.',
    'Each workflow slide pairs narrative bullets with a real UI capture (right side).',
  ], 0.55, 1.45, 12, 5.5, 13);

  // ——— PART A FLEETCO ———
  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Public site & portal entry', 'website-home', [
    'Prospects land on fleetcomanagement.org — pricing, platform tour, contact.',
    'FleetCo staff use /login with @fleetcomanagement.org (or executive) accounts.',
    'Brokers use separate signup; customers are provisioned by FleetCo (not self-serve SaaS checkout alone).',
    'After login, sidebar shows all modules allowed for role (owner > executive > fleet manager > coordinator).',
  ], 'Marketing site — entry to client portal');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Staff login & dashboard', 'login', [
    'Email + password authentication; JWT session stored client-side.',
    'First login may force password change (temp password from welcome email).',
    'Dashboard KPIs summarize fleet health — drill into modules from cards/feed.',
    'Executives additionally use Executive View for cross-customer metrics.',
  ], 'Portal login screen');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Dashboard (internal home)', 'portal-dashboard', [
    'At-a-glance: active units, loads in motion, fuel spend, maintenance due, inspections, HOS flags.',
    'FleetCo users with no customer_id see aggregate or select Customer view in sidebar dropdown.',
    'Customer view sets X-Customer-Context — edits save to that customer’s data (amber banner).',
    'Payment-due / paused overlays appear when subscription billing is past due.',
  ], 'Admin dashboard after login');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Customers & provisioning', 'portal-customers', [
    'Add customer company — contact, fleet size, MC/DOT, subscription plan (Per Unit default).',
    'Payment collected flag required before activation (business rule in provisionCustomer).',
    'Create portal login — temp password, welcome email, PendingAccount until first login.',
    'Assign FleetCo fleet manager / coordinator to account; message customer in-app.',
    'Team tab: create internal users (executive, fleet manager, coordinator, tech).',
  ], 'Customers & Team hub');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Fleet units (all customers or view-as)', 'portal-fleet', [
    'FleetCo admin: Add Vehicle / Add Trailer with full modal (assign customer, driver, VIN decode).',
    'Coordinator: can edit status & use customer wizard when not admin.',
    'Specs & Parts, History, Docs, Manuals per unit; bulk CSV import top-right on many pages.',
    'Fleet Map (Operations) shows live GPS for clocked-in drivers company-wide.',
  ], 'Fleet Units list');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Work orders — shop & manager flow', 'portal-workorders', [
    'FleetCo manager creates RO or assigns to shop queue; tech uses Mechanic modal.',
    'Lifecycle: intake → estimate → awaiting_approval → customer authorization → open → complete.',
    'Manager approves estimates; can reject back to mechanic with notes.',
    'Internal staff bypass customer-only intake UI — full Work Order modal when needed.',
    'Bulk upload CSV available on this page for mass RO import.',
  ], 'Work Orders / shop queue');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Repairs dashboard (downtime)', 'portal-repairs', [
    'Executive view of active repair cost and units down (in-shop statuses).',
    'Priority filters on active RO list; links to manage all work orders.',
    'Used internally to monitor shop throughput and customer SLA conversations.',
  ], 'Repairs Dashboard KPIs');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Maintenance & parts', 'portal-maintenance', [
    'Preventive schedules — mileage/date triggers, overdue highlighting.',
    'Calendar view for scheduled work across fleet.',
    'Parts inventory ties into WO parts lines for job costing.',
    'Service templates standardize brake jobs, PMs, etc.',
  ], 'Preventive maintenance');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Parts & VIN research', 'portal-parts', [
    'Stock levels, part numbers, unit costs; request POs from accounting flow.',
    'Vehicle Parts Research — VIN context, accessories, recall awareness.',
    'Vendors & Contracts module for shop rates and discounts (separate nav item).',
  ], 'Parts inventory');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Load board & dispatch', 'portal-loads', [
    'Create freight records, assign driver/truck/trailer, track status to delivered.',
    'Load marketplace / broker flows for executive marketplace module.',
    'Weigh scale fields; open Google Maps from load.',
    'Customer view: only that customer’s loads visible.',
  ], 'Load Board');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Accounting & reports', 'portal-accounting', [
    'Chart of accounts, journal entries, POs, payroll runs, 1099 tracking.',
    'Reports Center — export Excel by category (fuel, maintenance, compliance).',
    'SLT Billing — per-customer subscription status and Stripe portal session (if configured).',
  ], 'Accounting center');

  addScreenshotSlide(pptx, 'Part A · FleetCo staff', 'Reports export hub', 'portal-reports', [
    'Centralized exports for audits and management meetings.',
    'Date ranges and column selection on supported reports.',
    'Complements Executive dashboard for board-ready data pulls.',
  ], 'Reports Center');

  addTextOnlySlide(pptx, 'Part A · FleetCo staff', 'Staff-only tools (no screenshot)', [
    {
      heading: 'Senior leadership (SLT)',
      items: [
        'Load Marketplace executive view, Customer Insights analytics, SLT Billing, domain email admin.',
        'Data Backup / datastore tools, FleetCo Marketing AI hub, autopilot & outbox (local-first without API keys).',
        'Company email provisioning via functions; competitive analysis & dev feedback pages.',
      ],
    },
    {
      heading: 'How staff should operate day-to-day',
      items: [
        'Provision customer → assign manager → customer view to verify sidebar → seed units/ROs as needed.',
        'Shop: work awaiting_estimate queue first; managers clear awaiting_approval daily.',
        'After each deploy: restart API process so new routes (e.g. WO comments) are live.',
      ],
    },
  ]);

  // ——— PART B CUSTOMER ———
  addScreenshotSlide(pptx, 'Part B · Customer portal', 'Customer login experience', 'login', [
    'Customers use email from welcome letter (e.g. customer owner at their company domain or Gmail).',
    'Same /login URL as staff — role determines sidebar after auth (customer_id on user record).',
    'Forced password change on first login; Module Preferences trim sidebar sections.',
  ], 'Shared login — role decides experience');

  addScreenshotSlide(pptx, 'Part B · Customer portal', 'Customer dashboard', 'portal-dashboard', [
    'Getting Started checklist — add unit, invite driver, log fuel, create load.',
    'Tiles: My Vehicles, Active Loads, Amount Owed, Total Paid.',
    'Outstanding invoices & fleet list with status chips.',
    'Label shows “Customer Portal” / Dashboard (not Admin Dashboard).',
  ], 'Customer owner dashboard (same route, scoped data)');

  addScreenshotSlide(pptx, 'Part B · Customer portal', 'My fleet — edit status', 'portal-fleet', [
    'Customer owner / fleet manager / coordinator / parts manager: Edit on unit card.',
    'Change status Active ↔ In Shop ↔ Waiting for Parts etc.; update odometer & notes.',
    'Add Vehicle Info wizard (not full admin assign-customer modal).',
    'Cannot see other companies’ units — API filters by customer_id.',
  ], 'Fleet Units — customer scoped');

  addScreenshotSlide(pptx, 'Part B · Customer portal', 'Fleet repairs (customer ROs)', 'portal-workorders', [
    'Header: “Fleet repairs” — New repair order opens intake modal (complaint, odometer, unit).',
    'Customer edits own ROs in awaiting_estimate / awaiting_authorization.',
    'Approves estimate when status awaiting_approval (owner/fleet manager roles).',
    'Authorization signature panel before shop starts when required.',
    'HR/Driver roles: view + comments only (server returns 403 on PATCH).',
  ], 'Customer work orders list');

  addScreenshotSlide(pptx, 'Part B · Customer portal', 'Repairs dashboard (customer)', 'portal-repairs', [
    'Sees only their fleet’s active ROs and downtime costs.',
    'Validates that scoping works — same page as staff but filtered entities.',
  ], 'Customer repairs KPIs');

  addScreenshotSlide(pptx, 'Part B · Customer portal', 'Loads & operations', 'portal-loads', [
    'Customer fleet manager/coordinator: create and track loads for their fleet.',
    'Drivers assigned from their driver roster.',
    'My Delivery Route for last-mile if enabled in modules.',
  ], 'Customer load board');

  addScreenshotSlide(pptx, 'Part B · Customer portal', 'Maintenance visibility', 'portal-maintenance', [
    'Parts manager & fleet roles: PM schedules for their units.',
    'Inspections & pre-trip visible if Compliance/Maintenance modules enabled.',
    'Cannot access FleetCo Customers page or SLT tools.',
  ], 'Customer maintenance view');

  addScreenshotSlide(pptx, 'Part B · Customer portal', 'Finance & subscription', 'portal-accounting', [
    'Invoices scoped to customer_id; subscription page for payment method (Stripe when live).',
    'Reports exports for their data only — fuel, maintenance, etc.',
    'Accounting depth depends on role — owner sees Finance module if enabled.',
  ], 'Customer finance modules');

  addTextOnlySlide(pptx, 'Part B · Customer portal', 'Customer team & roles', [
    {
      heading: 'My Team (customer_owner / HR / fleet manager)',
      items: [
        'Invite: HR, fleet manager, coordinator, parts manager, driver.',
        'Each role gets default sidebar modules (owner can tune via Module Preferences).',
        'HR & drivers: repair orders comment-only — good for “driver reported noise” notes.',
      ],
    },
    {
      heading: 'Support path',
      items: [
        'Messages module — chat with FleetCo account rep.',
        'Customer Manual in app / PDF user manual on website.',
        `Email ${BRAND.supportEmail} · ${BRAND.phone}.`,
      ],
    },
  ]);

  // ——— PART C DRIVER ———
  addScreenshotSlide(pptx, 'Part C · Driver app', 'Driver home (mobile)', 'driver-home', [
    'Drivers use /driver/login — mobile web or Android app.',
    'Tiles: clock, route, loads, HOS, inspections, fuel, dashcam, messages.',
    'Capabilities depend on customer toggles (dual camera, safety AI, etc.).',
  ], 'Driver app home');

  addScreenshotSlide(pptx, 'Part C · Driver app', 'Time clock & GPS', 'driver-clock', [
    'Must pick truck (and optional trailer) before clock-in — prevents double booking.',
    'GPS position ~every 30s while clocked in → Fleet Map & Route Dashboard.',
    'Clock-out stops location sharing.',
  ], 'Time clock & vehicle selection');

  // ——— PART D GAPS ———
  addTextOnlySlide(pptx, 'Part D · Improvements', 'Infrastructure & reliability (needs work)', [
    {
      heading: 'Data & deploy',
      items: [
        'Primary store is file/SQLite-style JSON — requires persistent volume on Render/Railway or data resets on deploy.',
        'Uploads/dashcam media warn on redeploy without persistent disk or object storage (S3-compatible).',
        'API must be restarted after releases — stale process caused missing WO comment route in past.',
        'DEPLOYMENT docs mention SQLite volume; confirm production matches (backup schedule, restore drill).',
      ],
    },
    {
      heading: 'Testing & QA',
      items: [
        'No automated E2E suite in CI — rely on scripts/customer-portal-audit.mjs and manual QA.',
        'Add Playwright/Cypress for login, RO lifecycle, customer scoping regression.',
        'Production seed/demo accounts (e.g. Roby) should be scripted after each major release.',
      ],
    },
  ]);

  addTextOnlySlide(pptx, 'Part D · Improvements', 'Integrations (optional / incomplete)', [
    {
      heading: 'Requires configuration',
      items: [
        'LLM / Site Commander AI — stub responses until AI provider env vars set; marketing has local outbox fallback.',
        'Stripe — subscription portal & checkout need keys for fully automated billing.',
        'LiveKit — live office dashcam view; recording works locally without it.',
        'SMTP/Resend — welcome & password emails; otherwise manual temp password delivery.',
        'Google OAuth — redirects to email registration in standalone mode (not full SSO).',
      ],
    },
    {
      heading: 'Industry integrations (roadmap)',
      items: [
        'ELD portal UI exists; deep integration with major ELD vendors (Samsara, Motive, etc.) not one-click.',
        'True telematics ingest (automatic odometer, engine faults) vs manual entry.',
        'Accounting export to QuickBooks/Xero — manual Excel today.',
      ],
    },
  ]);

  addTextOnlySlide(pptx, 'Part D · Improvements', 'Product & UX gaps', [
    {
      heading: 'Repair orders',
      items: [
        'Customer email notifications on status change (estimate ready, approval needed) — verify automated emails end-to-end.',
        'PDF RO / invoice packet for customer authorization records.',
        'Clearer difference between Work Orders vs Repairs Dashboard for new customers (onboarding copy).',
        'Policy: Bulk CSV WO import for customers — enable or hide by role.',
      ],
    },
    {
      heading: 'Portal polish',
      items: [
        'Some slides in text-only capabilities deck were blank — this deck embeds PNGs; refresh screenshots regularly.',
        'Customer view banner — train staff to always verify customer context before edits.',
        'Module sprawl — consider simplified “Starter sidebar” preset for small fleets (≤5 units).',
        'Accessibility (WCAG) and mobile tablet layout for portal not formally audited.',
      ],
    },
  ]);

  addTextOnlySlide(pptx, 'Part D · Improvements', 'Security & compliance (hardening)', [
    {
      heading: 'Done / in progress',
      items: [
        'JWT auth, customer entity scoping, HR/driver WO PATCH blocks, vehicle reassignment blocks.',
        'Immutable marketplace records; customer view delete guards on User/Customer.',
      ],
    },
    {
      heading: 'Recommended next',
      items: [
        'Pen test before large customer pilots; rate limiting on auth endpoints.',
        'Audit log for executive actions (provision, delete user, datastore restore).',
        'SOC2-style backup encryption documentation for enterprise sales.',
        'Secrets rotation playbook (JWT_SECRET, Stripe, SMTP).',
      ],
    },
  ]);

  addTextOnlySlide(pptx, 'Part D · Improvements', 'Suggested priority roadmap', [
    {
      heading: 'P0 — Before wide customer pilot',
      items: [
        'Persistent production datastore + uploads; deploy restart checklist.',
        'Automated customer-portal-audit in CI against staging.',
        'Email notifications for RO approval chain.',
        'Demo tenant + seed script on production.',
      ],
    },
    {
      heading: 'P1 — Revenue & retention',
      items: [
        'Stripe billing fully wired; dunning emails for past_due.',
        'Customer onboarding wizard (first 7 days) in-app.',
        'Mobile portal responsive pass for fleet managers on phone.',
      ],
    },
    {
      heading: 'P2 — Scale & differentiation',
      items: [
        'ELD/telematics partner API; AI provider for predictive maintenance hints.',
        'White-label/custom domain per customer; multi-language if needed.',
      ],
    },
  ]);

  slide = addSlideBase(pptx, 'Appendix', 'Regenerate & assets', true);
  addBullets(slide, [
    `Screenshots folder: ${FRAMES_DIR}`,
    'Refresh all captures: npm run marketing:deep-dive -- --refresh',
    'Full PDF manual with same shots: npm run marketing:manual',
    'Text capabilities deck: npm run marketing:capabilities',
    `Download: ${BRAND.url}/marketing/FleetCo-System-Deep-Dive-Review.pptx`,
  ], 0.55, 1.45, 12, 5.5, 12);

  slideNum += 1;
  slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addText('Review complete', { x: 0.7, y: 2.4, w: 12, fontSize: 34, bold: true, color: WHITE, align: 'center' });
  slide.addText('Use Part D to prioritize sprints · Schedule live walkthrough with engineering', {
    x: 0.7,
    y: 3.35,
    w: 12,
    fontSize: 14,
    color: 'CBD5E1',
    align: 'center',
  });
  slide.addText(BRAND.supportEmail, { x: 0.7, y: 4.1, w: 12, fontSize: 16, color: AMBER, align: 'center' });
  footer(slide);

  await pptx.writeFile({ fileName: outFile });
  fs.copyFileSync(outFile, path.join(publicDir, 'FleetCo-System-Deep-Dive-Review.pptx'));
  fs.copyFileSync(outFile, path.join(os.homedir(), 'Downloads', 'FleetCo-System-Deep-Dive-Review.pptx'));

  console.log(`Slides: ${slideNum}`);
  console.log('Wrote:', outFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

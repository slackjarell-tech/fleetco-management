/**
 * FleetCo — detailed system capabilities review deck.
 * Run: npm run marketing:capabilities
 */
import PptxGenJS from 'pptxgenjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import { BRAND } from '../marketing/brand.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'marketing');
const outFile = path.join(outDir, 'FleetCo-System-Capabilities-Review.pptx');
const publicDir = path.join(__dirname, '..', 'public', 'marketing');

const NAVY = '0F172A';
const AMBER = 'F59E0B';
const SLATE = '64748B';
const WHITE = 'FFFFFF';
const LIGHT = 'F8FAFC';

let slideNum = 0;

function footer(slide) {
  slide.addText(`${BRAND.shortName}  ·  ${BRAND.url}  ·  ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}  ·  Slide ${slideNum}`, {
    x: 0.5,
    y: 7.05,
    w: 12.3,
    h: 0.35,
    fontSize: 9,
    color: SLATE,
    align: 'center',
  });
}

function section(pptx, label, title, subtitle = null, dark = false) {
  slideNum += 1;
  const slide = pptx.addSlide();
  slide.background = { color: dark ? NAVY : LIGHT };
  slide.addText(label.toUpperCase(), {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 11,
    bold: true,
    color: AMBER,
    charSpace: 2,
  });
  slide.addText(title, {
    x: 0.6,
    y: 1.0,
    w: 12,
    h: 0.9,
    fontSize: 30,
    bold: true,
    color: dark ? WHITE : NAVY,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6,
      y: 1.95,
      w: 11.5,
      h: 0.8,
      fontSize: 13,
      color: dark ? 'CBD5E1' : SLATE,
    });
  }
  footer(slide);
  return slide;
}

function bullets(slide, items, opts = {}) {
  const { x = 0.7, y = 2.35, w = 11.8, h = 4.55, fontSize = 13, color = NAVY } = opts;
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })),
    { x, y, w, h, fontSize, color, valign: 'top', lineSpacingMultiple: 1.12 },
  );
}

function twoCol(slide, leftTitle, leftItems, rightTitle, rightItems, startY = 2.15) {
  slide.addText(leftTitle, { x: 0.7, y: startY, w: 5.9, h: 0.35, fontSize: 12, bold: true, color: NAVY });
  bullets(slide, leftItems, { x: 0.7, y: startY + 0.42, w: 5.9, h: 4.35, fontSize: 11 });
  slide.addText(rightTitle, { x: 6.75, y: startY, w: 5.9, h: 0.35, fontSize: 12, bold: true, color: NAVY });
  bullets(slide, rightItems, { x: 6.75, y: startY + 0.42, w: 5.9, h: 4.35, fontSize: 11 });
}

function tableSlide(pptx, label, title, headers, rows) {
  const slide = section(pptx, label, title);
  const tableRows = [
    headers.map((h) => ({ text: h, options: { bold: true, fill: { color: 'E2E8F0' } } })),
    ...rows.map((row) => row.map((cell) => ({ text: cell }))),
  ];
  slide.addTable(tableRows, {
    x: 0.55,
    y: 2.2,
    w: 12.2,
    colW: [2.2, 4.8, 5.2],
    fontSize: 10,
    border: { type: 'solid', color: 'CBD5E1', pt: 0.5 },
    autoPage: false,
  });
  return slide;
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const pptx = new PptxGenJS();
  pptx.author = BRAND.company;
  pptx.company = BRAND.shortName;
  pptx.title = 'FleetCo — System Capabilities Review (Detailed)';
  pptx.subject = 'Comprehensive platform capability reference';
  pptx.layout = 'LAYOUT_WIDE';

  slideNum = 0;
  let slide = pptx.addSlide();
  slideNum = 1;
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: '100%', fill: { color: AMBER } });
  slide.addText('System Capabilities Review', { x: 0.7, y: 1.85, w: 12, h: 0.9, fontSize: 38, bold: true, color: WHITE });
  slide.addText('Detailed reference — portal, driver app, API & roles', { x: 0.7, y: 2.75, w: 11, h: 0.5, fontSize: 17, color: 'CBD5E1' });
  slide.addText(`${BRAND.url}  ·  ${BRAND.pricing?.[0]?.price || '$35/unit/mo'}  ·  ${BRAND.location}`, { x: 0.7, y: 3.55, w: 11, fontSize: 13, color: AMBER });
  slide.addText('Generated from live codebase + System Manual  ·  Confidential', { x: 0.7, y: 6.45, w: 11, h: 0.3, fontSize: 10, color: SLATE });
  footer(slide);

  slide = section(pptx, 'Contents', 'What this deck covers');
  bullets(slide, [
    'Platform architecture & deployment model',
    'User types, roles, and permission model (FleetCo vs customer vs driver)',
    'Full portal module catalog (sidebar sections)',
    'Deep dives: Fleet, Repair Orders, Maintenance, Operations, Compliance, Finance',
    'Driver mobile app feature list',
    'Billing, provisioning, security, integrations & optional services',
    'Recent releases, demo/pilot tooling, and how to review the live system',
  ], { fontSize: 14 });

  slide = section(pptx, 'Architecture', 'How the system is built', null, true);
  twoCol(
    slide,
    'Frontend',
    [
      'React 18 + Vite + Tailwind + shadcn/ui components',
      'Single SPA: public site, /login portal, /driver mobile shell',
      'Role-based navigation via sidebar module preferences',
      'Customer context header for FleetCo “view as customer”',
      'Production build served with API (e.g. Render / IONOS)',
    ],
    'Backend',
    [
      'Node.js Express API on port 3001 (JWT auth)',
      'Entity store (JSON file / persistent disk) — Users, Customers, Vehicles, Loads, WorkOrders, etc.',
      'Server functions: provisionCustomer, createUserAccount, decodeVin, welcome email',
      'Background schedulers: marketing autopilot, payments overdue, dashcam retention, carrier payments',
      'Uploads folder for documents, dashcam media (configure object storage for prod durability)',
    ],
  );

  slide = section(pptx, 'Access surfaces', 'URLs & entry points');
  bullets(slide, [
    `Public website & pricing: ${BRAND.url}`,
    `Customer / staff portal login: ${BRAND.url}/login`,
    'Driver app login: /driver/login (also native Android — org.fleetcomanagement.driver)',
    'Broker signup: /broker-signup · Load board marketplace for freight brokers',
    'Materials: System Manual, Customer Manual, Marketing Gallery, downloadable PDF manual & decks',
    'API health: /api/public-settings · Authenticated CRUD: /api/entities/:type',
  ]);

  tableSlide(pptx, 'Roles', 'FleetCo internal roles (no customer_id)', ['Role', 'Typical duties', 'Portal access'], [
    ['Owner', 'Full platform, billing, datastore, domain email, employee creation', 'All modules + SLT-only tools'],
    ['Executive', 'Cross-customer analytics, payroll, strategic ops', 'Executive dashboard, most modules'],
    ['Fleet Manager', 'Customer provisioning, account management, approvals', 'Customers, billing, full ops on accounts'],
    ['Fleet Coordinator', 'Day-to-day ops, document review, customer view', 'Ops/fleet/maintenance; customer view mode'],
    ['Tech (shop)', 'Mechanic queue, estimates, parts on work orders', 'Work orders (mechanic modal), maintenance'],
  ]);

  tableSlide(pptx, 'Roles', 'Customer portal roles (customer_id set)', ['Role', 'Typical duties', 'Restrictions'], [
    ['Customer Owner', 'Company admin, billing, team, approve repair estimates', 'Full customer modules; no other customers’ data'],
    ['Customer Fleet Manager', 'Fleet, loads, repair orders, drivers', 'Same as owner minus some team assign rules'],
    ['Fleet Coordinator', 'Dispatch-style ops, add vehicles (wizard)', 'No executive/FleetCo tools'],
    ['Parts Manager', 'Maintenance, parts, edit unit status', 'Focused maintenance sidebar'],
    ['HR', 'Workforce visibility', 'Repair orders: view + comments only (API enforced)'],
    ['Driver', 'Field use via driver app; optional portal read', 'Comment-only on WOs if using portal; assigned units'],
  ]);

  slide = section(pptx, 'Portal catalog', 'Sidebar modules (by section)', 'Visibility filtered per role & module preferences', true);
  bullets(slide, [
    'Dashboard — Admin, Executive, FleetCo Payroll, Customer Insights (internal)',
    'Operations — Load Board, Route Builder/Dashboard, My Delivery Route, Fleet Map, Yard, PD Command Tower',
    'Fleet — Fleet Units, Fleet P&L, Vehicle TCO, Repairs Dashboard, Work Orders, Diagnostics',
    'Maintenance — PM schedules, Calendar, Pre-Trip, Inspections, Service Templates, Parts, VIN Research, Vendors',
    'Drivers & Payroll — Drivers, Hiring Hub, Scorecards, Driver Media, Payroll, Time Clock',
    'Compliance — ELD, HOS logs, Compliance Tracker, IFTA, Incidents',
    'Finance — Invoices, Accounting, Fuel Stations/Audits, Driver Scans, Reports, Subscription, SLT Billing',
    'Other — Customers/Team, Messages, Site Commander AI, Marketing Hub, Gallery, Dev Feedback',
  ], { fontSize: 11, y: 2.5, h: 4.4 });

  slide = section(pptx, 'Dashboard', 'Dashboards & KPIs — detail');
  twoCol(
    slide,
    'Admin / staff dashboard',
    [
      'Active vehicles & trailers count',
      'Open / in-transit loads',
      'Fuel spend period summary',
      'Maintenance due & overdue counts',
      'Pending inspections & HOS violation flags',
      'Activity feed & drill-through links to modules',
    ],
    'Customer dashboard',
    [
      'Welcome + getting-started checklist (fleet, drivers, fuel, loads)',
      'My vehicles, active loads, amount owed vs paid',
      'Outstanding invoices list with status badges',
      'My fleet unit list with status chips',
      'Module preferences & notification prefs in sidebar footer',
    ],
  );

  slide = section(pptx, 'Fleet units', 'Fleet Units page — detailed', null, true);
  bullets(slide, [
    'Tabs: Vehicles (power units) vs Trailers — search by unit #, make, model, VIN, trailer type',
    'Add Vehicle / Add Trailer (FleetCo admin) or Add Vehicle Info wizard (customers & coordinators)',
    'Per-card actions: Specs & Parts, History, Docs, Manuals (staff), Edit, Delete (staff only)',
    'Vehicle fields: equipment class, map color, license plate, odometer, purchase price/date, assigned driver/customer',
    'VIN Decode calls NHTSA — auto-fill make/model/year; surfaces open recalls on decode',
    'Estimated book value from purchase price & age (straight-line style depreciation display)',
    'Status values: Active, Inactive, In Shop, Waiting for Parts, Out of Service, Pending Inspection, Leased Out, Retired, Sold',
    'Customers & FleetCo employees: Edit → change status and operational fields (scoped to their fleet)',
  ]);

  slide = section(pptx, 'Fleet map', 'Live tracking & map visuals');
  bullets(slide, [
    'Fleet Map shows clocked-in drivers with GPS (≈30s updates while on clock)',
    'Vehicle map colors: driveable, support needed, in shop — configurable per unit',
    'Speed, heading, trails; circles/rectangles for geofence-style views',
    'Trailer assignment at Time Clock sign-in — links power unit + trailer on map',
    'Route Dashboard integrates live driver positions with stop completion %',
    'Privacy: location only while clocked in; permission prompt on driver device',
  ]);

  slide = section(pptx, 'Repair orders', 'RO lifecycle — step by step', null, true);
  bullets(slide, [
    '1 Check-in / Intake — customer or staff: unit, odometer, complaint (verbatim), contact, condition notes',
    '2 Diagnosis / Estimate — mechanic: tasks, parts, labor, shop notes → status awaiting_estimate → awaiting_approval',
    '3 Internal approval — fleet manager or customer owner approves $ total',
    '4 Customer authorization — signature panel when require_customer_authorization; then status open',
    '5 Repair — in progress, parts ordered, awaiting parts',
    '6 Complete / invoice — completed status, costs roll to Repairs Dashboard & vehicle history',
    'UI: RepairOrderPhaseBar, WorkOrderIntakeModal, MechanicWorkOrderModal, WorkOrderDetail authorization panel',
    'Customer portal label: “Fleet repairs”; HR/driver: comment panel + POST /api/work-orders/:id/comments only',
  ]);

  slide = section(pptx, 'Work orders', 'Statuses & queues');
  twoCol(
    slide,
    'Status list',
    [
      'awaiting_estimate — Diagnosis / estimate',
      'awaiting_approval — Internal review',
      'awaiting_authorization — Awaiting customer OK',
      'open — Authorized, ready for shop',
      'in_progress, parts_ordered, awaiting_parts',
      'completed, cancelled',
    ],
    'Views',
    [
      'Work Orders list — filters, search, bulk CSV (where enabled)',
      'Repairs Dashboard — KPI cards, active RO list, downtime cost by unit',
      'Mechanic shop queue — tech role filtered queue',
      'Pending approval banner for approver roles',
      'Completed repair spend rollup',
    ],
  );

  slide = section(pptx, 'Maintenance', 'PM, parts & shop support — detail', null, true);
  bullets(slide, [
    'Preventive Maintenance — intervals by miles/date; overdue highlighting',
    'Maintenance Calendar — month view of scheduled/completed events',
    'Pre-Trip Checklist & Inspections — DVIR workflow, defects, manager sign-off, PDF export',
    'Service Templates — named checklists (tasks + estimated hours) applied to new WOs',
    'Parts Inventory — qty, cost, supplier; tie parts to work orders for true job cost',
    'Vehicle Parts Research — accessories, fitment, recall awareness from VIN context',
    'Vendors & Contracts — labor rates, parts discounts, scale certification, contract expiry alerts',
    'Diagnostics page — log DTCs, severity, link to vehicle and resolution notes',
  ]);

  slide = section(pptx, 'Load board', 'Freight operations — detail');
  bullets(slide, [
    'Create loads: load #, origin/destination, pickup/delivery dates, rate, miles, weight, commodity',
    'Assign driver, truck, trailer; track status Available → Assigned → In Transit → Delivered',
    'Customer-scoped loads when logged in as portal user; FleetCo sees all or customer view',
    'Load marketplace visibility & audit events for executive marketplace module',
    'Weigh scale capture — axle weights, ticket metadata per load',
    'Google Maps / navigation links from load records',
    'Broker accounts: separate signup, billing path, marketplace participation',
  ]);

  slide = section(pptx, 'Routing & POD', 'Last-mile & delivery', null, true);
  bullets(slide, [
    'Route Builder — create routes, add/reorder stops, bulk CSV import, map visualization',
    'Assign driver + vehicle to route; daily route instances',
    'My Delivery Route (driver) — stop list, instructions, mark complete/fail',
    'Proof of delivery — photo/signature capture where configured (virtual POD options per customer)',
    'Route Dashboard — all routes for date, progress bars, live driver dots with speed',
    'PD Command Tower — map-centric dispatch for P&D operations (advanced module)',
    'Yard Management — yard placements and unit tracking (yard module)',
  ]);

  slide = section(pptx, 'Fuel & IFTA', 'Fuel module — detail');
  twoCol(
    slide,
    'Fuel logging',
    [
      'Fuel Audits page — entries by vehicle/driver/date',
      'Gallons, PPG, total, odometer, location, fuel type (diesel/gas/DEF)',
      'Receipt attachments for audit trail',
      'Driver app fuel entry for field capture',
    ],
    'IFTA & stations',
    [
      'Fuel Stations map — diesel/DEF pricing layers',
      'Periodic price refresh; prediction charts where enabled',
      'IFTA Dashboard — quarterly jurisdiction splits',
      'Export-oriented reporting for filing workflows',
      'Driver fuel cards & station finder in driver shell',
    ],
  );

  slide = section(pptx, 'Drivers & HR', 'People operations — detail', null, true);
  bullets(slide, [
    'Drivers page — roster, status, assigned vehicle, contact, documents',
    'Driver Scorecards — on-time, fuel, safety, violations (configurable metrics display)',
    'Screening / compliance fields — MVR, drug test, background check expirations',
    'Hiring Hub — job postings, applications, applicant nurture autopilot (server scheduler)',
    'Time Clock — select truck + optional trailer before clock-in; blocks double-booking unit',
    'Driver Payroll Summary & Payroll runs — multiple pay types (mile, stop, hourly, salary, 1099/W2)',
    'FleetCo Payroll — separate module for internal FleetCo employees (executive/HR roles)',
  ]);

  slide = section(pptx, 'Compliance', 'Regulatory & safety — detail');
  bullets(slide, [
    'HOS / ELD Logs — off/sleeper/driving/on-duty segments; draft → submitted → reviewed',
    'Rule hints for 11-hour, 14-hour, 70-hour cycles (advisory in UI)',
    'Compliance Tracker — expiring CDL, med card, registrations, inspections',
    'Incident Reports — severity, CSA points, insurance claim tracking, corrective actions',
    'ELD Portal — entry to ELD-related workflows (integration-ready structure)',
    'Inspection types: pre/post-trip, annual DOT, brake, tire, safety, emissions',
  ]);

  slide = section(pptx, 'Finance', 'Money & reporting — detail', null, true);
  bullets(slide, [
    'Invoices — line items, sent/paid/overdue, customer_id scoped',
    'Accounting — chart of accounts, journal entries, purchase orders, payroll runs, 1099 tracking',
    'Reports Center — categorized exports (fuel, maintenance, financial, compliance, operations)',
    'Excel (.xlsx) downloads; master workbook style exports where configured',
    'Subscription entity — per-unit plan, monthly/yearly term, payment collected flags',
    'Stripe customer portal session (when keys configured) for payment method updates',
    'SLT Billing — per-customer billing detail for owner/executive/fleet manager',
    'system_paused overlay when customer subscription past due',
  ]);

  slide = section(pptx, 'Customers', 'Provisioning & team — detail');
  bullets(slide, [
    'Customers page — company profile, MC/DOT, fleet size, assigned FleetCo managers',
    'provisionCustomer function — plan, term, payment collected, subscription record, portal login',
    'Welcome email + temp password; PendingAccount until first login password change',
    'My Team (customer) — invite users with roles: HR, fleet manager, coordinator, parts, driver',
    'Module preferences per user — which sidebar sections appear',
    'Notification preferences — billing, loads, maintenance, compliance, messages toggles',
    'Customer analytics — portal page visits tracked for Customer Insights (internal)',
  ]);

  slide = section(pptx, 'Driver app', 'Mobile feature matrix', null, true);
  twoCol(
    slide,
    'Core screens',
    [
      '/driver — home summary',
      'Time Clock — vehicle + trailer + GPS',
      'My Route / Navigation',
      'Load Board (assigned loads)',
      'Messages with dispatch',
    ],
    'Safety & compliance',
    [
      'HOS report entry',
      'Inspections & pre-trip',
      'Incident reports',
      'Dashcam record/upload',
      'Shared videos library',
      'Work orders — view status, comments (role-based)',
      'Fuel, fuel cards, fuel stations, barcode scan',
    ],
  );

  slide = section(pptx, 'Media & dashcam', 'Driver media pipeline');
  bullets(slide, [
    'Dashcam sessions & frames stored under server uploads (configure persistent disk / S3 for prod)',
    'Driving safety events entity for AI/rule-based flags when enabled per customer',
    'Live stream sessions — optional LiveKit for office live view when env vars set',
    'Retention scheduler — auto-delete old recordings (e.g. 15-day policy)',
    'Driver Media admin page — review customer driver uploads',
    'Customer toggles: dual camera, auto dashcam on driving, safety AI features',
  ]);

  slide = section(pptx, 'AI & marketing', 'SLT marketing stack — detail', null, true);
  bullets(slide, [
    'Site Commander AI — portal assistant with tool actions (entity queries, guidance)',
    'Public marketing chat — rule/guide bot without keys; optional LLM when configured',
    'SLT Marketing Hub — dashboard, autopilot tick, daily lead report scheduler',
    'Local-first mode — marketing outbox for drafts (manual send without API keys)',
    'Marketing autopilot — nurture schedules, social draft generation (CST cron jobs)',
    'Marketing Gallery — pitch deck, client deck, capabilities deck, PDF manual downloads',
    'Competitive analysis, advertisement planner, dev feedback capture pages',
  ]);

  slide = section(pptx, 'Security', 'Auth & multi-tenant isolation');
  twoCol(
    slide,
    'Authentication',
    [
      'Email/password login, JWT access tokens',
      'Forgot password / reset token flow',
      'must_change_password on first login',
      'Google OAuth stub → email registration in standalone mode',
      'Driver vs portal login routes separated',
    ],
    'Authorization',
    [
      'entityScope — filter lists by customer_id & vehicle fleet index',
      'X-Customer-Context for staff impersonation',
      'Work order: HR/driver PATCH/DELETE blocked; comments API only',
      'Vehicle: customer role gate on PATCH; no cross-customer reassignment',
      'Immutable marketplace booking records (no edit/delete)',
    ],
  );

  slide = section(pptx, 'Integrations', 'Optional & configured services', null, true);
  bullets(slide, [
    'Stripe — subscription checkout & customer billing portal',
    'LiveKit — live dashcam streaming to office',
    'LLM provider — verifyAiProvider; stub if unset',
    'SMTP / email functions — welcome, password reset, marketing guides',
    'VIN decode — NHTSA API via decodeVin function',
    'Google Maps links — navigation from loads/routes (client-side)',
    'IONOS / Render deployment docs in repo (DEPLOYMENT.md, DEPLOYMENT-IONOS.md)',
  ]);

  slide = section(pptx, 'Operations tooling', 'Scripts & QA helpers');
  bullets(slide, [
    'scripts/customer-portal-audit.mjs — provision test customer, HR comment test, PATCH guard test',
    'scripts/provision-demo-roby.mjs — demo account for Roby Morgan template',
    'scripts/seed-demo-roby.mjs — FC101/FC102 units, sample ROs, load, invoice',
    'npm run marketing:manual — Puppeteer screenshots + PDF user manual',
    'npm run marketing:capabilities — regenerates this PowerPoint',
    'npm run marketing:deck / marketing:pitch — client & investor decks',
  ]);

  slide = section(pptx, 'Pricing', 'Commercial model (reference)', BRAND.pricing?.[0]?.detail || '', true);
  bullets(slide, [
    `Per Unit plan: ${BRAND.pricing?.[0]?.price || '$35/unit/month'} — ${BRAND.pricing?.[0]?.detail || 'full portal + driver app'}`,
    'Annual billing: 5% discount (per brand config)',
    'Enterprise: 50+ units, custom integrations & account team',
    'Payment collected flag required before customer activation in provisioning flow',
    'Unit count drives subscription_amount on Customer + Subscription entities',
  ]);

  slide = section(pptx, 'Recent releases', 'Shipped on main (representative)');
  bullets(slide, [
    'Repair order lifecycle UI + workOrderWorkflow.js status model',
    'workOrderComments.js + POST /api/work-orders/:id/comments',
    'Customer fleet Edit + fleetUnitAccess for FleetCo employee parity',
    'Repairs Dashboard down-status logic (in-shop vs estimate queue)',
    'Fleet map colors, trailer assignment, speed/trails',
    'Marketing local mode, outbox, internal/public guide bots',
  ]);

  slide = section(pptx, 'Review live', 'How to evaluate the system', null, true);
  bullets(slide, [
    `1 Log in at ${BRAND.url}/login as customer or staff test account`,
    '2 Walk Fleet → Edit status → Work Orders → create RO → Repairs Dashboard',
    '3 Switch Customer view (staff) to see exact customer sidebar scope',
    '4 Driver app: /driver/login on phone or Android APK from Play internal track',
    '5 Read in-app System Manual (/portal) or PDF FleetCo-User-Manual.pdf',
    '6 Run customer-portal-audit.mjs after each deploy to verify API guards',
  ]);

  slide = section(pptx, 'Downloads', 'Related documents');
  bullets(slide, [
    'FleetCo-System-Capabilities-Review.pptx — this detailed deck',
    'FleetCo-Client-Presentation.pptx — 8-slide client sales deck',
    'FleetCo-Business-Pitch-Deck.pptx — investor/business pitch',
    'FleetCo-User-Manual.pdf — screenshot-based user guide',
    `Support: ${BRAND.supportEmail} · ${BRAND.phone} · ${BRAND.location}`,
  ]);

  slideNum += 1;
  slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: AMBER } });
  slide.addText('End of review', { x: 0.7, y: 2.3, w: 12, h: 0.7, fontSize: 36, bold: true, color: WHITE, align: 'center' });
  slide.addText('Regenerate: npm run marketing:capabilities', { x: 0.7, y: 3.3, w: 12, h: 0.4, fontSize: 14, color: 'CBD5E1', align: 'center' });
  slide.addText(BRAND.email, { x: 0.7, y: 4.0, w: 12, h: 0.4, fontSize: 18, color: AMBER, align: 'center' });
  footer(slide);

  await pptx.writeFile({ fileName: outFile });

  const publicFile = path.join(publicDir, 'FleetCo-System-Capabilities-Review.pptx');
  fs.copyFileSync(outFile, publicFile);
  const downloads = path.join(os.homedir(), 'Downloads', 'FleetCo-System-Capabilities-Review.pptx');
  fs.copyFileSync(outFile, downloads);

  console.log(`Wrote ${slideNum} slides`);
  console.log('Wrote:', outFile);
  console.log('Public:', publicFile);
  console.log('Downloads:', downloads);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

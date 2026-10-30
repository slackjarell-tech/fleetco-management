/**
 * Load stress demo data + audit each portal tab's backing APIs.
 * Usage:
 *   node scripts/portal-tab-audit.mjs [--production] [--no-seed]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTION = process.argv.includes('--production');
const NO_SEED = process.argv.includes('--no-seed');
const BASE = PRODUCTION ? 'https://fleetcomanagement.org' : 'http://localhost:3001';

const OWNER = {
  email: process.env.FLEETCO_OWNER_EMAIL || 'jarell.slack@fleetcomanagement.org',
  password: process.env.FLEETCO_OWNER_PASSWORD || 'FleetCo2026!',
};

/** Portal tabs → primary data sources to verify */
const TABS = [
  { section: 'Dashboard', tab: 'Admin Dashboard', path: '/portal', entities: ['Vehicle', 'Load', 'WorkOrder'], notes: 'KPI cards aggregate entities' },
  { section: 'Dashboard', tab: 'Executive View', path: '/portal/executive', entities: ['Customer', 'Invoice', 'Load'], extra: [{ method: 'GET', url: '/api/entities/Customer' }] },
  { section: 'Dashboard', tab: 'FleetCo Payroll', path: '/portal/fleetco-payroll', entities: ['PayrollRecord', 'TimeClockEntry'] },
  { section: 'Dashboard', tab: 'Customer Insights', path: '/portal/customer-insights', entities: ['Customer', 'PortalActivity'] },
  { section: 'Operations', tab: 'Load Board', path: '/portal/loads', entities: ['Load'] },
  { section: 'Operations', tab: 'PD Command Tower', path: '/portal/pd-command', entities: ['DeliveryRoute', 'DeliveryStop'] },
  { section: 'Operations', tab: 'Route Builder', path: '/portal/route-builder', entities: ['DeliveryRoute'] },
  { section: 'Operations', tab: 'Route Dashboard', path: '/portal/route-dashboard', entities: ['DriverLocation', 'DeliveryRoute'] },
  { section: 'Operations', tab: 'My Delivery Route', path: '/portal/my-route', entities: ['DeliveryRoute', 'DeliveryStop'] },
  { section: 'Operations', tab: 'Navigation', path: '/portal/navigation', entities: ['DriverLocation'] },
  { section: 'Operations', tab: 'Fleet Map', path: '/portal/fleet-map', entities: ['DriverLocation', 'Vehicle'] },
  { section: 'Operations', tab: 'Yard Management', path: '/portal/yard-management', entities: ['Yard', 'YardPlacement'] },
  { section: 'Fleet', tab: 'Fleet Units', path: '/portal/fleet', entities: ['Vehicle', 'VehicleDocument', 'VehicleAccessory'] },
  { section: 'Fleet', tab: 'Fleet P&L', path: '/portal/fleetpnl', entities: ['Vehicle', 'Load', 'WorkOrder', 'FuelLog'] },
  { section: 'Fleet', tab: 'Vehicle TCO', path: '/portal/tco', entities: ['Vehicle', 'FuelLog', 'WorkOrder', 'Load'] },
  { section: 'Fleet', tab: 'Repairs Dashboard', path: '/portal/repairs', entities: ['WorkOrder', 'Vehicle'] },
  { section: 'Fleet', tab: 'Work Orders', path: '/portal/workorders', entities: ['WorkOrder'] },
  { section: 'Fleet', tab: 'Diagnostics', path: '/portal/diagnostics', entities: ['DiagnosticCode'] },
  { section: 'Maintenance', tab: 'Preventive Maint.', path: '/portal/maintenance', entities: ['MaintenanceSchedule'] },
  { section: 'Maintenance', tab: 'Maint. Calendar', path: '/portal/calendar', entities: ['MaintenanceSchedule', 'WorkOrder'] },
  { section: 'Maintenance', tab: 'Pre-Trip Checklist', path: '/portal/pretrip', entities: ['Inspection'] },
  { section: 'Maintenance', tab: 'Inspections', path: '/portal/inspections', entities: ['Inspection'] },
  { section: 'Maintenance', tab: 'Service Templates', path: '/portal/service-templates', entities: ['ServiceTemplate'] },
  { section: 'Maintenance', tab: 'Parts Inventory', path: '/portal/parts', entities: ['PartInventory'] },
  { section: 'Maintenance', tab: 'Vehicle Parts Research', path: '/portal/vehicle-lookup', entities: ['Vehicle'] },
  { section: 'Maintenance', tab: 'Vendors & Contracts', path: '/portal/vendors', entities: ['Vendor'] },
  { section: 'Drivers & Payroll', tab: 'Drivers', path: '/portal/drivers', entities: ['User'] },
  { section: 'Drivers & Payroll', tab: 'Hiring Hub', path: '/portal/hiring', entities: [] },
  { section: 'Drivers & Payroll', tab: 'Driver Scorecards', path: '/portal/scorecard', entities: ['Load', 'FuelLog'] },
  { section: 'Drivers & Payroll', tab: 'Driver Media', path: '/portal/driver-media', entities: ['DashcamSession', 'LiveStreamSession'] },
  { section: 'Drivers & Payroll', tab: 'Driver Payroll', path: '/portal/driver-payroll', entities: ['PayrollRecord'] },
  { section: 'Drivers & Payroll', tab: 'Payroll', path: '/portal/payroll', entities: ['PayrollRecord'] },
  { section: 'Drivers & Payroll', tab: 'Time Clock', path: '/portal/timeclock', entities: ['TimeClockEntry'] },
  { section: 'Compliance', tab: 'ELD Portal', path: '/portal/eld', entities: ['HOSLog'] },
  { section: 'Compliance', tab: 'HOS / ELD Logs', path: '/portal/hos', entities: ['HOSLog'] },
  { section: 'Compliance', tab: 'Compliance Tracker', path: '/portal/compliance', entities: ['ScreeningRecord'] },
  { section: 'Compliance', tab: 'IFTA Dashboard', path: '/portal/ifta', entities: ['FuelLog'] },
  { section: 'Compliance', tab: 'Incident Reports', path: '/portal/incidents', entities: ['Incident'] },
  { section: 'Finance', tab: 'Invoices', path: '/portal/invoices', entities: ['Invoice'] },
  { section: 'Finance', tab: 'Accounting', path: '/portal/accounting', entities: ['Invoice', 'Load'] },
  { section: 'Finance', tab: 'Fuel Stations', path: '/portal/fuel-stations', entities: ['FuelStation'] },
  { section: 'Finance', tab: 'Fuel Audits', path: '/portal/fuel', entities: ['FuelLog'] },
  { section: 'Finance', tab: 'Driver Scans', path: '/portal/driver-scans', entities: ['BarcodeScan'] },
  { section: 'Finance', tab: 'Reports', path: '/portal/reports', entities: ['Vehicle', 'Load', 'WorkOrder', 'FuelLog'] },
  { section: 'Other', tab: 'Customers & Team', path: '/portal/customers', entities: ['Customer', 'User'] },
  { section: 'Other', tab: 'Messages', path: '/portal/messages', entities: ['Message'] },
  { section: 'Other', tab: 'Site Commander AI', path: '/portal/assistant', entities: [] },
  { section: 'Help', tab: 'Customer Manual', path: '/portal/manual', entities: [] },
];

const results = [];

function record(tab, status, message, detail = '') {
  results.push({ tab: tab.path, label: tab.tab, section: tab.section, status, message, detail });
}

async function req(url, opts = {}) {
  const res = await fetch(`${BASE}${url}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 300); }
  return { status: res.status, data, ok: res.ok };
}

async function login() {
  const r = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER.email, password: OWNER.password }),
  });
  if (!r.ok) throw new Error(r.data?.error || `Login failed ${r.status}`);
  return r.data.access_token;
}

async function authed(token, url, opts = {}) {
  return req(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
}

async function main() {
  console.log('Portal tab audit —', BASE);

  const health = await req('/api/public-settings');
  if (!health.ok) {
    console.error('API not reachable. Start: npm run dev');
    process.exit(1);
  }

  const token = await login();

  if (!NO_SEED) {
    const seed = await authed(token, '/api/functions/seedDemoData', {
      method: 'POST',
      body: JSON.stringify({ stress: true, fillGaps: true, ensureDrivers: true }),
    });
    if (!seed.ok) {
      console.warn('Stress seed failed:', seed.data);
    } else {
      console.log('Seed:', seed.data?.message, seed.data?.summary || '');
    }
  }

  const entityCounts = {};
  const types = [...new Set(TABS.flatMap((t) => t.entities))];
  for (const type of types) {
    const r = await authed(token, `/api/entities/${type}`);
    if (!r.ok) {
      entityCounts[type] = { error: r.status, detail: r.data };
    } else {
      entityCounts[type] = { count: Array.isArray(r.data) ? r.data.length : 0 };
    }
  }

  for (const tab of TABS) {
    const problems = [];
    for (const type of tab.entities) {
      const info = entityCounts[type];
      if (!info) continue;
      if (info.error) problems.push(`${type} API ${info.error}`);
      else if (info.count === 0) problems.push(`${type} empty (0 rows)`);
    }

    if (problems.length === 0 && tab.entities.length === 0) {
      record(tab, 'manual', 'No entity probe — review UI manually', tab.path);
    } else if (problems.length === 0) {
      const counts = tab.entities.map((t) => `${t}:${entityCounts[t].count}`).join(', ');
      record(tab, 'ok', 'Data present', counts);
    } else if (problems.some((p) => p.includes('API'))) {
      record(tab, 'broken', problems.join('; '), tab.path);
    } else {
      record(tab, 'empty', problems.join('; '), tab.path);
    }
  }

  const outPath = path.join(__dirname, 'portal-tab-audit-results.json');
  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    entityCounts,
    summary: {
      ok: results.filter((r) => r.status === 'ok').length,
      empty: results.filter((r) => r.status === 'empty').length,
      broken: results.filter((r) => r.status === 'broken').length,
      manual: results.filter((r) => r.status === 'manual').length,
    },
    results,
    loginHint: { portal: `${BASE.replace('3001', '5173')}/login`, email: OWNER.email },
  };

  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log('\n=== TAB BY TAB ===\n');
  let lastSection = '';
  for (const r of results) {
    if (r.section !== lastSection) {
      console.log(`\n## ${r.section}`);
      lastSection = r.section;
    }
    const icon = r.status === 'ok' ? '✓' : r.status === 'broken' ? '✗' : r.status === 'empty' ? '○' : '?';
    console.log(`  ${icon} ${r.label} (${r.tab}) — ${r.message}${r.detail ? ` [${r.detail}]` : ''}`);
  }
  console.log('\nSummary:', report.summary);
  console.log('Full JSON:', outPath);
  console.log('\nSign in:', report.loginHint.portal, 'as', OWNER.email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

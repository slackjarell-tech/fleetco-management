/**
 * Portal tab audit — entity counts per sidebar tab (server-side).
 */
import { listEntities } from './db.js';
import { sendEmail } from './email.js';

const TABS = [
  { section: 'Dashboard', tab: 'Admin Dashboard', path: '/portal', entities: ['Vehicle', 'Load', 'WorkOrder'] },
  { section: 'Dashboard', tab: 'Executive View', path: '/portal/executive', entities: ['Customer', 'Invoice', 'Load'] },
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

function entityCountsMap() {
  const types = [...new Set(TABS.flatMap((t) => t.entities))];
  const counts = {};
  for (const type of types) {
    try {
      counts[type] = listEntities(type).length;
    } catch {
      counts[type] = -1;
    }
  }
  return counts;
}

export function runPortalTabAudit() {
  const counts = entityCountsMap();
  const results = [];

  for (const tab of TABS) {
    const problems = [];
    for (const type of tab.entities) {
      const n = counts[type];
      if (n === -1) problems.push(`${type} API error`);
      else if (n === 0) problems.push(`${type} empty (0 rows)`);
    }
    let status = 'ok';
    let message = 'Data present';
    let detail = tab.entities.map((t) => `${t}:${counts[t]}`).join(', ');
    if (tab.entities.length === 0) {
      status = 'manual';
      message = 'No entity probe — review UI manually';
      detail = tab.path;
    } else if (problems.some((p) => p.includes('error'))) {
      status = 'broken';
      message = problems.join('; ');
      detail = tab.path;
    } else if (problems.length) {
      status = 'empty';
      message = problems.join('; ');
      detail = tab.path;
    }
    results.push({ section: tab.section, label: tab.tab, tab: tab.path, status, message, detail });
  }

  const summary = {
    ok: results.filter((r) => r.status === 'ok').length,
    empty: results.filter((r) => r.status === 'empty').length,
    broken: results.filter((r) => r.status === 'broken').length,
    manual: results.filter((r) => r.status === 'manual').length,
  };

  return {
    generatedAt: new Date().toISOString(),
    entityCounts: counts,
    summary,
    results,
  };
}

function buildHtml(report) {
  const broken = report.results.filter((r) => r.status === 'broken');
  const empty = report.results.filter((r) => r.status === 'empty');
  const manual = report.results.filter((r) => r.status === 'manual');
  const list = (items, title, color) => {
    if (!items.length) return `<p><strong>${title}:</strong> none</p>`;
    return `<h3 style="color:${color}">${title} (${items.length})</h3><ul>${items.map((r) => `<li><strong>${r.section} → ${r.label}</strong>: ${r.message}</li>`).join('')}</ul>`;
  };
  return `
    <h1>FleetCo Portal Tab Audit</h1>
    <p>${report.generatedAt}</p>
    <p><strong>Summary:</strong> ${report.summary.ok} OK · ${report.summary.empty} empty · ${report.summary.broken} broken · ${report.summary.manual} manual</p>
    ${list(broken, 'Broken', '#dc2626')}
    ${list(empty, 'Empty / thin data', '#d97706')}
    ${list(manual, 'Manual UI review', '#2563eb')}
    <p>Deploy commit on main includes stress seed: invoke <code>seedDemoData</code> with <code>{ "stress": true }</code> as owner to load test data.</p>
  `;
}

function buildText(report) {
  const lines = [`FleetCo Portal Tab Audit — ${report.generatedAt}`, ''];
  for (const status of ['broken', 'empty', 'manual']) {
    lines.push(`=== ${status.toUpperCase()} ===`);
    for (const r of report.results.filter((x) => x.status === status)) {
      lines.push(`- [${r.section}] ${r.label}: ${r.message}`);
    }
    lines.push('');
  }
  lines.push(`OK tabs: ${report.summary.ok}`);
  return lines.join('\n');
}

export async function runPortalTabAuditAndEmail(body = {}) {
  const to = body.to || 'jarell.slack@fleetcomanagement.org';
  const report = runPortalTabAudit();
  const subject = `[FleetCo] Portal audit — ${report.summary.broken} broken, ${report.summary.empty} empty`;
  const email = await sendEmail({
    to,
    subject,
    html: buildHtml(report),
    text: buildText(report),
  });
  return { report, email };
}

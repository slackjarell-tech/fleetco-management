/**
 * Full API functions smoke test — every invokeFunction endpoint
 * Usage: node scripts/full-functions-test.mjs           → localhost:3001
 *        node scripts/full-functions-test.mjs --production → fleetcomanagement.org
 */
const BASE = process.argv.includes('--production')
  ? 'https://fleetcomanagement.org'
  : 'http://localhost:3001';

const ALL_FUNCTIONS = [
  { name: 'decodeVin', body: { vin: '1HGBH41JXMN109186' }, expectOk: true },
  { name: 'submitInquiry', body: { name: 'Test', email: 'test@test.com', message: 'audit' }, expectOk: true },
  { name: 'predictFuelPrices', body: {}, expectOk: true },
  { name: 'simulateDrivers', body: { action: 'reset' }, expectOk: true },
  { name: 'createCheckout', body: { planName: 'Starter', billingTerm: 'monthly' }, expectOk: true },
  { name: 'refreshFuelPrices', body: {}, expectOk: true },
  { name: 'sendNotification', body: { type: 'test', entityId: 'x' }, expectOk: true },
  { name: 'createUserAccount', body: {}, expectOk: false, note: 'needs body' },
  { name: 'provisionCustomer', body: {}, expectOk: false },
  { name: 'createDomainEmail', body: {}, expectOk: false },
  { name: 'sendCustomerTestLogin', body: {}, expectOk: false },
  { name: 'getBillingAlerts', body: {}, expectOk: true },
  { name: 'recordCustomerPayment', body: {}, expectOk: false },
  { name: 'setCustomerPause', body: {}, expectOk: false },
  { name: 'seedDemoData', body: {}, expectOk: true, roles: ['owner'] },
  { name: 'startDashcamSession', body: {}, expectOk: false },
  { name: 'stopDashcamSession', body: {}, expectOk: false },
  { name: 'captureDashcamFrame', body: {}, expectOk: false },
];

const ENTITIES = [
  'Customer', 'DriverLocation', 'DiagnosticCode', 'FuelLog', 'DeliveryRoute',
  'DeliveryStop', 'HOSLog', 'FuelStation', 'Inquiry', 'Incident', 'Inspection',
  'Invoice', 'Load', 'MaintenanceSchedule', 'Message', 'PartInventory',
  'PayrollRecord', 'PendingAccount', 'ScreeningRecord', 'ServiceTemplate',
  'DomainEmail', 'PaymentReminder', 'BarcodeScan', 'DashcamSession', 'DashcamFrame',
  'Subscription', 'UsageFeedback', 'Vehicle', 'VehicleDocument', 'Vendor',
  'TimeClockEntry', 'WorkOrder', 'User',
];

const DRIVER_ROUTES = [
  '/driver', '/driver/clock', '/driver/route', '/driver/scan', '/driver/dashcam',
  '/driver/loads', '/driver/navigation', '/driver/messages',
];

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 300); }
  return { status: res.status, data, ok: res.ok };
}

async function login(email, password) {
  const r = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return r.ok ? { token: r.data.access_token, user: r.data.user } : { error: r.data?.error };
}

async function authed(path, token, opts = {}) {
  return req(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

async function main() {
  const report = { base: BASE, timestamp: new Date().toISOString(), logins: [], entities: [], functions: [], workflows: [], driverRoutes: [], summary: {} };

  const health = await req('/api/public-settings');
  if (!health.ok) {
    console.log(JSON.stringify({ fatal: `Server not reachable at ${BASE}` }, null, 2));
    process.exit(1);
  }

  const accounts = [
    { label: 'owner', email: 'jarrell@fleetcomanagement.org', password: 'FleetCo2026!' },
    { label: 'executive', email: 'admin@fleetco.com', password: 'admin123' },
    { label: 'manager', email: 'manager@fleetco.com', password: 'demo123' },
    { label: 'driver', email: 'driver1@fleetco.com', password: 'demo123' },
  ];

  const tokens = {};
  for (const acct of accounts) {
    const r = await login(acct.email, acct.password);
    report.logins.push({ ...acct, ok: !!r.token, role: r.user?.role, error: r.error || null });
    if (r.token) tokens[acct.label] = { token: r.token, user: r.user };
  }

  const owner = tokens.owner;
  const driver = tokens.driver;
  if (!owner) {
    console.log(JSON.stringify({ fatal: 'Owner login failed', report }, null, 2));
    process.exit(1);
  }

  for (const entity of ENTITIES) {
    const r = await authed(`/api/entities/${entity}`, owner.token);
    report.entities.push({ entity, ok: r.ok, status: r.status, count: Array.isArray(r.data) ? r.data.length : null, error: r.ok ? null : r.data?.error || r.data });
  }

  for (const fn of ALL_FUNCTIONS) {
    const token = fn.roles?.includes('owner') ? owner.token : owner.token;
    const r = await authed(`/api/functions/${fn.name}`, token, { method: 'POST', body: JSON.stringify(fn.body) });
    const ok = fn.expectOk ? r.ok : !r.ok || fn.note;
    report.functions.push({
      fn: fn.name,
      ok,
      status: r.status,
      expected: fn.expectOk ? 'success' : 'reject_or_optional',
      error: r.ok ? null : (r.data?.error || r.data),
      sample: r.ok && typeof r.data === 'object' ? Object.keys(r.data) : null,
    });
  }

  // Workflow: billing alerts
  const billing = await authed('/api/functions/getBillingAlerts', owner.token, { method: 'POST', body: '{}' });
  report.workflows.push({ test: 'getBillingAlerts', ok: billing.ok, summary: billing.data?.summary });

  // Workflow: dashcam session (driver)
  if (driver) {
    const start = await authed('/api/functions/startDashcamSession', driver.token, {
      method: 'POST',
      body: JSON.stringify({ mode: 'view_ahead', intervalSec: 5, mountNotes: 'Below rearview mirror' }),
    });
    report.workflows.push({ test: 'startDashcamSession (driver)', ok: start.ok, sessionId: start.data?.session?.id, error: start.data?.error });

    if (start.ok && start.data?.session?.id) {
      const stop = await authed('/api/functions/stopDashcamSession', driver.token, {
        method: 'POST',
        body: JSON.stringify({ sessionId: start.data.session.id }),
      });
      report.workflows.push({ test: 'stopDashcamSession', ok: stop.ok, frameCount: stop.data?.session?.frame_count });
    }
  }

  // Driver SPA routes
  for (const route of DRIVER_ROUTES) {
    const r = await req(route);
    report.driverRoutes.push({ route, ok: r.status === 200, status: r.status });
  }

  report.summary = {
    loginsOk: report.logins.filter((l) => l.ok).length,
    entitiesOk: report.entities.filter((e) => e.ok).length,
    entitiesTotal: report.entities.length,
    functionsRegistered: report.functions.filter((f) => f.status !== 404).length,
    functionsTotal: report.functions.length,
    workflowsOk: report.workflows.filter((w) => w.ok).length,
    driverRoutesOk: report.driverRoutes.filter((r) => r.ok).length,
  };

  console.log(JSON.stringify(report, null, 2));
  const failed = report.entities.filter((e) => !e.ok).length + report.workflows.filter((w) => !w.ok).length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: e.message }));
  process.exit(1);
});

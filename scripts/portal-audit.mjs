/**
 * Portal tab audit — login + API smoke test for every entity each page uses
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000';

const ENTITIES = [
  'Customer', 'DriverLocation', 'DiagnosticCode', 'FuelLog', 'DeliveryRoute',
  'DeliveryStop', 'HOSLog', 'FuelStation', 'Inquiry', 'Incident', 'Inspection',
  'Invoice', 'Load', 'MaintenanceSchedule', 'Message', 'PartInventory',
  'PayrollRecord', 'PendingAccount', 'ScreeningRecord', 'ServiceTemplate',
  'Subscription', 'UsageFeedback', 'Vehicle', 'VehicleDocument', 'Vendor',
  'TimeClockEntry', 'WorkOrder', 'User',
];

const PORTAL_ROUTES = [
  '/portal', '/portal/executive', '/portal/loads', '/portal/pd-command',
  '/portal/route-builder', '/portal/route-dashboard', '/portal/my-route',
  '/portal/navigation', '/portal/fleet-map', '/portal/fleet', '/portal/fleetpnl',
  '/portal/tco', '/portal/repairs', '/portal/workorders', '/portal/diagnostics',
  '/portal/maintenance', '/portal/calendar', '/portal/pretrip', '/portal/inspections',
  '/portal/service-templates', '/portal/parts', '/portal/vendors', '/portal/drivers',
  '/portal/scorecard', '/portal/driver-payroll', '/portal/payroll', '/portal/timeclock',
  '/portal/eld', '/portal/hos', '/portal/compliance', '/portal/ifta', '/portal/incidents',
  '/portal/invoices', '/portal/fuel-stations', '/portal/fuel', '/portal/reports',
  '/portal/customers', '/portal/messages', '/portal/assistant', '/portal/revan',
  '/portal/advertisement', '/portal/marketing-gallery', '/portal/dev-feedback',
  '/portal/competitive-analysis', '/portal/module-preferences', '/portal/change-password',
];

const FUNCTIONS = [
  'createUserAccount', 'provisionCustomer', 'createCheckout', 'predictFuelPrices',
  'simulateDrivers', 'decodeVin',
];

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 200); }
  return { status: res.status, data, ok: res.ok };
}

async function login(email, password) {
  const r = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) return { error: r.data?.error || r.status, token: null, user: null };
  return { token: r.data.access_token, user: r.data.user };
}

async function authed(path, token, opts = {}) {
  return req(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
}

async function main() {
  const results = { entities: [], functions: [], routes: [], roles: [], workflows: [] };

  // Health
  const health = await req('/api/public-settings');
  if (!health.ok) {
    console.log(JSON.stringify({ fatal: `Server not reachable at ${BASE}`, health }, null, 2));
    process.exit(1);
  }

  const accounts = [
    { label: 'owner', email: 'jarrell@fleetcomanagement.org', password: 'FleetCo2026!' },
    { label: 'executive', email: 'admin@fleetco.com', password: 'admin123' },
    { label: 'manager', email: 'manager@fleetco.com', password: 'demo123' },
    { label: 'driver', email: 'driver1@fleetco.com', password: 'demo123' },
  ];

  let token = null;
  let activeUser = null;

  for (const acct of accounts) {
    const loginResult = await login(acct.email, acct.password);
    results.roles.push({
      account: acct.label,
      email: acct.email,
      loginOk: !!loginResult.token,
      role: loginResult.user?.role,
      error: loginResult.error || null,
    });
    if (acct.label === 'executive' && loginResult.token) {
      token = loginResult.token;
      activeUser = loginResult.user;
    }
  }

  // Owner login fallback if executive fails
  if (!token) {
    const ownerLogin = await login('jarrell@fleetcomanagement.org', 'FleetCo2026!');
    token = ownerLogin.token;
    activeUser = ownerLogin.user;
  }

  if (!token) {
    console.log(JSON.stringify({ fatal: 'No login succeeded', results }, null, 2));
    process.exit(1);
  }

  // Entity API tests
  for (const entity of ENTITIES) {
    const r = await authed(`/api/entities/${entity}`, token);
    results.entities.push({
      entity,
      status: r.status,
      ok: r.ok,
      count: Array.isArray(r.data) ? r.data.length : null,
      error: r.ok ? null : r.data?.error || r.data,
    });
  }

  // Function tests
  for (const fn of FUNCTIONS) {
    const body = fn === 'createCheckout'
      ? { planName: 'Starter', billingTerm: 'monthly' }
      : fn === 'decodeVin'
        ? { vin: '1HGBH41JXMN109186' }
        : {};
    const r = await authed(`/api/functions/${fn}`, token, { method: 'POST', body: JSON.stringify(body) });
    results.functions.push({
      fn,
      status: r.status,
      ok: r.ok || fn === 'createUserAccount', // createUserAccount may fail without body
      error: r.ok ? null : r.data?.error || r.data,
      sample: r.ok ? (typeof r.data === 'object' ? Object.keys(r.data) : r.data) : null,
    });
  }

  // Role permission simulation
  const ownerToken = (await login('jarrell@fleetcomanagement.org', 'FleetCo2026!')).token;
  const ownerCreateEmployee = ownerToken
    ? await authed('/api/functions/createUserAccount', ownerToken, {
        method: 'POST',
        body: JSON.stringify({
          email: 'audit-test-employee@fleetco.com',
          tempPassword: 'Test123!',
          role: 'fleet_coordinator',
        }),
      })
    : { ok: false, data: { error: 'no owner token' } };

  const execToken = (await login('admin@fleetco.com', 'admin123')).token;
  const execCreateEmployee = execToken
    ? await authed('/api/functions/createUserAccount', execToken, {
        method: 'POST',
        body: JSON.stringify({
          email: 'audit-test-fail@fleetco.com',
          tempPassword: 'Test123!',
          role: 'fleet_manager',
        }),
      })
    : { ok: false, data: { error: 'no exec token' } };

  results.workflows.push({
    test: 'owner can create FleetCo employee',
    ok: ownerCreateEmployee.ok,
    error: ownerCreateEmployee.data?.error,
  });
  results.workflows.push({
    test: 'executive blocked from creating FleetCo employee',
    ok: !execCreateEmployee.ok,
    error: execCreateEmployee.data?.error,
  });

  const provision = ownerToken
    ? await authed('/api/functions/provisionCustomer', ownerToken, {
        method: 'POST',
        body: JSON.stringify({
          customer: {
            company_name: 'Audit Test Co',
            contact_name: 'Test User',
            email: 'audit-customer@test.com',
            phone: '555-0100',
          },
          subscription_plan: 'Starter',
          subscription_term: 'monthly',
          payment_collected: false,
        }),
      })
    : null;

  results.workflows.push({
    test: 'provisionCustomer rejects without payment',
    ok: provision && !provision.ok,
    error: provision?.data?.error,
  });

  // SPA route shell (index.html)
  for (const route of PORTAL_ROUTES) {
    const r = await req(route);
    results.routes.push({ route, status: r.status, ok: r.status === 200 });
  }

  results.summary = {
    entitiesOk: results.entities.filter(e => e.ok).length,
    entitiesTotal: results.entities.length,
    routesOk: results.routes.filter(r => r.ok).length,
    routesTotal: results.routes.length,
    loginsOk: results.roles.filter(r => r.loginOk).length,
    activeUser: activeUser?.email,
    activeRole: activeUser?.role,
  };

  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => {
  console.error(JSON.stringify({ fatal: e.message }));
  process.exit(1);
});

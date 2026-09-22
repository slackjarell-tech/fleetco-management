/**
 * Provision a test customer and exercise customer portal APIs.
 * Usage: node scripts/customer-portal-audit.mjs [--production]
 */
const BASE = process.argv.includes('--production')
  ? 'https://fleetcomanagement.org'
  : 'http://localhost:3001';

const OWNER = { email: 'jarell.slack@fleetcomanagement.org', password: 'FleetCo2026!' };
const STAMP = Date.now().toString(36);
const CUSTOMER_EMAIL = `audit.customer.${STAMP}@example.com`;
const CUSTOMER_PASS = `AuditFleet${STAMP.slice(-4)}!`;

const issues = [];

function issue(severity, area, message, detail = '') {
  issues.push({ severity, area, message, detail });
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 500); }
  return { status: res.status, data, ok: res.ok };
}

async function login(email, password) {
  const r = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) return { error: r.data?.error || r.status };
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

async function invoke(token, name, body) {
  return authed(`/api/functions/${encodeURIComponent(name)}`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function main() {
  console.log('Audit base:', BASE);

  const health = await req('/api/public-settings');
  if (!health.ok) {
    issue('critical', 'server', 'API not reachable', BASE);
    console.log(JSON.stringify({ issues }, null, 2));
    process.exit(1);
  }

  const owner = await login(OWNER.email, OWNER.password);
  if (owner.error) {
    issue('critical', 'auth', 'Owner login failed', owner.error);
    console.log(JSON.stringify({ issues }, null, 2));
    process.exit(1);
  }

  const prov = await invoke(owner.token, 'provisionCustomer', {
    customer: {
      company_name: `Audit Fleet ${STAMP}`,
      contact_name: 'Portal Audit User',
      email: CUSTOMER_EMAIL,
      phone: '555-0100',
      fleet_size: '3',
      status: 'active',
    },
    subscription_plan: 'Per Unit',
    subscription_term: 'monthly',
    payment_collected: true,
    createLogin: true,
    tempPassword: CUSTOMER_PASS,
  });

  if (!prov.ok) {
    issue('critical', 'provision', 'Could not create test customer', JSON.stringify(prov.data));
    console.log(JSON.stringify({ issues, credentials: null }, null, 2));
    process.exit(1);
  }

  const customerId = prov.data?.customer?.id;
  console.log('Created customer:', customerId, CUSTOMER_EMAIL);

  const veh = await authed('/api/entities/Vehicle', owner.token, {
    method: 'POST',
    body: JSON.stringify({
      unit_number: `AUD-${STAMP.slice(-4)}`,
      make: 'Freightliner',
      model: 'Cascadia',
      year: 2022,
      unit_type: 'truck',
      status: 'active',
      assigned_customer_id: customerId,
      customer_id: customerId,
      odometer: 125000,
      vin: '1FUJGHDV8NLAA1234',
      license_plate: 'TX-AUDIT1',
    }),
  });
  if (!veh.ok) issue('high', 'fleet', 'Could not create vehicle for customer', JSON.stringify(veh.data));

  const cust = await login(CUSTOMER_EMAIL, CUSTOMER_PASS);
  if (cust.error) {
    issue('critical', 'auth', 'Customer login failed after provision', cust.error);
  } else {
    const me = await authed('/api/auth/me', cust.token);
    if (!me.data?.customer_id) issue('high', 'auth', 'Customer /me missing customer_id');

    const checks = [
      ['GET', '/api/entities/Vehicle'],
      ['GET', '/api/entities/WorkOrder'],
      ['GET', '/api/entities/Load'],
      ['GET', '/api/entities/DriverLocation'],
      ['GET', '/api/entities/User'],
    ];
    for (const [method, path] of checks) {
      const r = await authed(path, cust.token, { method });
      if (r.status === 403) issue('medium', 'api', `Customer forbidden: ${path}`);
      else if (!r.ok) issue('high', 'api', `${path} failed`, String(r.status));
    }

    const woCreate = await authed('/api/entities/WorkOrder', cust.token, {
      method: 'POST',
      body: JSON.stringify({
        wo_number: `RO-${STAMP}`,
        title: 'Audit brake complaint',
        complaint: 'Brakes squeal when stopping from highway speed',
        vehicle_id: veh.data?.id,
        customer_id: customerId,
        status: 'awaiting_estimate',
        opened_date: new Date().toISOString().split('T')[0],
        service_tasks: [],
        parts: [],
      }),
    });
    if (!woCreate.ok) issue('high', 'workorders', 'Customer cannot create work order', JSON.stringify(woCreate.data));

    const hrUser = await invoke(owner.token, 'createUserAccount', {
      email: `audit.hr.${STAMP}@example.com`,
      tempPassword: CUSTOMER_PASS,
      role: 'customer_hr',
      customerId,
      fullName: 'Audit HR',
      sendWelcomeEmail: false,
    });
    if (!hrUser.ok) issue('medium', 'team', 'Could not create HR user for comment test', JSON.stringify(hrUser.data));

    if (hrUser.ok && woCreate.ok) {
      const hrLogin = await login(`audit.hr.${STAMP}@example.com`, CUSTOMER_PASS);
      if (hrLogin.error) {
        issue('high', 'auth', 'HR login failed', hrLogin.error);
      } else {
        const comment = await authed(`/api/work-orders/${woCreate.data.id}/comments`, hrLogin.token, {
          method: 'POST',
          body: JSON.stringify({ comment_text: 'Driver reported issue after long haul.' }),
        });
        if (!comment.ok) issue('high', 'workorders', 'HR comment endpoint failed', JSON.stringify(comment.data));

        const hrPatch = await authed(`/api/entities/WorkOrder/${woCreate.data.id}`, hrLogin.token, {
          method: 'PATCH',
          body: JSON.stringify({ title: 'Hacked' }),
        });
        if (hrPatch.ok) issue('critical', 'security', 'HR should not PATCH work orders');
        else if (hrPatch.status !== 403) issue('medium', 'security', 'Unexpected HR PATCH status', String(hrPatch.status));
      }
    }
  }

  console.log(JSON.stringify({
    credentials: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASS, customerId },
    issueCount: issues.length,
    issues,
  }, null, 2));
}

main().catch((e) => {
  issue('critical', 'script', e.message);
  console.log(JSON.stringify({ issues }, null, 2));
  process.exit(1);
});

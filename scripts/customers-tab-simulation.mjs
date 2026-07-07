/**
 * Customers tab simulation — list customers, provision test prospect, verify login
 */
const BASE = process.env.BASE_URL || 'https://fleetcomanagement.org';
const TEST_EMAIL = process.env.TEST_CUSTOMER_EMAIL || 'demo.prospect@example.com';
const TEST_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD || 'DemoProspect2026!';

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
  return r.ok ? { token: r.data.access_token, user: r.data.user } : { error: r.data?.error || r.status };
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
  const report = {
    base: BASE,
    timestamp: new Date().toISOString(),
    steps: [],
    summary: {},
  };

  const push = (step, ok, detail = {}) => {
    report.steps.push({ step, ok, ...detail });
  };

  // 1. Health
  const health = await req('/api/public-settings');
  if (!health.ok) {
    push('server_health', false, { error: health.data });
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  push('server_health', true);

  // 2. Owner login
  const owner = await login('jarrell@fleetcomanagement.org', 'FleetCo2026!');
  if (!owner.token) {
    push('owner_login', false, { error: owner.error });
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  push('owner_login', true, { role: owner.user?.role, email: owner.user?.email });

  // 3. List customers (what the Customers tab loads)
  const customersRes = await authed('/api/entities/Customer?sort=-created_date', owner.token);
  const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
  push('list_customers', customersRes.ok, {
    count: customers.length,
    statuses: customers.reduce((acc, c) => {
      acc[c.status || 'unknown'] = (acc[c.status || 'unknown'] || 0) + 1;
      return acc;
    }, {}),
    sample: customers.slice(0, 3).map(c => ({ company: c.company_name, status: c.status, email: c.email })),
  });

  // 4. List users & pending accounts
  const usersRes = await authed('/api/entities/User', owner.token);
  const users = Array.isArray(usersRes.data) ? usersRes.data : [];
  push('list_users', usersRes.ok, { count: users.length });

  const pendingRes = await authed('/api/entities/PendingAccount', owner.token);
  const pending = Array.isArray(pendingRes.data) ? pendingRes.data : [];
  push('list_pending_accounts', pendingRes.ok, { count: pending.length });

  // 5. Seed demo if empty
  if (customers.length === 0) {
    const seed = await authed('/api/functions/seedDemoData', owner.token, { method: 'POST', body: '{}' });
    push('seed_demo_data', seed.ok, {
      created: seed.data?.created,
      summary: seed.data?.summary,
      error: seed.ok ? null : seed.data?.error || seed.data,
    });
    if (seed.ok) {
      const afterSeed = await authed('/api/entities/Customer?sort=-created_date', owner.token);
      const seeded = Array.isArray(afterSeed.data) ? afterSeed.data : [];
      push('customers_after_seed', afterSeed.ok, { count: seeded.length });
    }
  }

  // 6. Provision test potential customer with portal login
  const provision = await authed('/api/functions/provisionCustomer', owner.token, {
    method: 'POST',
    body: JSON.stringify({
      customer: {
        company_name: 'Simulation Prospect Transport',
        contact_name: 'Alex Demo',
        email: TEST_EMAIL,
        phone: '(555) 010-9999',
        city: 'Dallas',
        state: 'TX',
        status: 'prospect',
        notes: 'Created by customers-tab simulation for test login',
      },
      subscription_plan: 'Starter',
      subscription_term: 'monthly',
      payment_collected: true,
      createLogin: true,
      tempPassword: TEST_PASSWORD,
    }),
  });

  const provisionOk = provision.ok;
  push('provision_test_customer', provisionOk, {
    error: provisionOk ? null : provision.data?.error || provision.data,
    message: provision.data?.message,
    customerId: provision.data?.customer?.id,
  });

  // 7. Verify customer login works
  let customerLoginOk = false;
  let custLogin = null;
  if (provisionOk) {
    custLogin = await login(TEST_EMAIL, TEST_PASSWORD);
    customerLoginOk = !!custLogin.token;
    push('test_customer_login', customerLoginOk, {
      email: TEST_EMAIL,
      role: custLogin.user?.role,
      customer_id: custLogin.user?.customer_id,
      error: custLogin.error || null,
    });
  }

  // 8. Customer portal view — customers tab as customer user (should see team tab only)
  if (customerLoginOk) {
    const custCustomers = await authed('/api/entities/Customer', custLogin.token);
    const custList = Array.isArray(custCustomers.data) ? custCustomers.data : [];
    push('customer_sees_customers_list', custCustomers.ok, {
      count: custList.length,
      note: 'Customer role typically should not see all customers — UI hides tab',
    });
  }

  const refreshed = await authed('/api/entities/Customer?sort=-created_date', owner.token);
  const allCustomers = Array.isArray(refreshed.data) ? refreshed.data : [];

  // 9. Send test login to prospect (Peak Transport Co)
  const peak = allCustomers.find(c => c.company_name === 'Peak Transport Co') || allCustomers.find(c => c.status === 'prospect');
  if (peak) {
    const testLogin = await authed('/api/functions/sendCustomerTestLogin', owner.token, {
      method: 'POST',
      body: JSON.stringify({ customerId: peak.id }),
    });
    push('send_customer_test_login', testLogin.ok, {
      prospect: peak.company_name,
      email: testLogin.data?.email,
      tempPassword: testLogin.data?.tempPassword,
      error: testLogin.ok ? null : testLogin.data?.error || testLogin.data,
    });
    if (testLogin.ok && testLogin.data?.email) {
      const prospectLogin = await login(testLogin.data.email, testLogin.data.tempPassword);
      push('prospect_test_login_works', !!prospectLogin.token, {
        email: testLogin.data.email,
        role: prospectLogin.user?.role,
        error: prospectLogin.error || null,
      });
    }
  }

  report.summary = {
    customersVisible: allCustomers.length || customers.length,
    testCustomerProvisioned: provisionOk,
    testLoginWorks: customerLoginOk,
    testCredentials: provisionOk ? { email: TEST_EMAIL, password: TEST_PASSWORD } : null,
    blankTabLikelyCause: customers.length === 0
      ? 'No Customer records in database — run seed or add customer via Add Customer'
      : 'Fleet managers/coordinators only see assigned customers — assign a manager on each account',
  };

  const managerLogin = await login('manager@fleetco.com', 'demo123');
  if (managerLogin.token) {
    const mgrCustomers = await authed('/api/entities/Customer?sort=-created_date', managerLogin.token);
    const mgrList = Array.isArray(mgrCustomers.data) ? mgrCustomers.data : [];
    push('fleet_manager_customer_view', mgrCustomers.ok, {
      count: mgrList.length,
      note: mgrList.length === 0 ? 'Manager sees blank tab — customers need assigned_manager_id' : 'Manager can see assigned customers',
    });
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: e.message, stack: e.stack }));
  process.exit(1);
});

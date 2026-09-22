/**
 * Demo customer: Roby Morgan
 * Usage: node scripts/provision-demo-roby.mjs [--production]
 */
const PRODUCTION = process.argv.includes('--production');
const BASE = PRODUCTION ? 'https://fleetcomanagement.org' : 'http://localhost:3001';

const OWNER_EMAIL = process.env.FLEETCO_OWNER_EMAIL || 'jarell.slack@fleetcomanagement.org';
const OWNER_PASS = process.env.FLEETCO_OWNER_PASSWORD || '';

const DEMO = {
  company_name: 'Morgan Demo Fleet',
  contact_name: 'Roby Morgan',
  email: 'roby.morgan88@gmail.com',
  phone: '555-0199',
  fleet_size: '5',
  status: 'active',
};

const TEMP_PASS = process.env.DEMO_TEMP_PASSWORD || `DemoFleet${Date.now().toString(36).slice(-6)}!`;

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
  return { status: res.status, data, ok: res.ok };
}

async function main() {
  if (!OWNER_PASS) {
    console.error('Set FLEETCO_OWNER_PASSWORD (and optionally FLEETCO_OWNER_EMAIL) in the environment.');
    process.exit(1);
  }

  const login = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASS }),
  });
  if (!login.ok) {
    console.error('Owner login failed:', login.data?.error || login.status);
    process.exit(1);
  }
  const token = login.data.access_token;

  const authed = (path, opts = {}) => req(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });

  const existing = await authed('/api/entities/User');
  const dup = Array.isArray(existing.data)
    && existing.data.find((u) => u.email?.toLowerCase() === DEMO.email.toLowerCase());
  if (dup) {
    console.log(JSON.stringify({
      base: BASE,
      message: 'Portal user already exists for this email',
      email: DEMO.email,
      customer_id: dup.customer_id,
      loginUrl: PRODUCTION ? 'https://fleetcomanagement.org/login' : 'http://localhost:5173/login',
      note: 'Use Forgot password or resend welcome from Customers if needed.',
    }, null, 2));
    return;
  }

  const prov = await authed('/api/functions/provisionCustomer', {
    method: 'POST',
    body: JSON.stringify({
      customer: DEMO,
      subscription_plan: 'Per Unit',
      subscription_term: 'monthly',
      payment_collected: true,
      createLogin: true,
      tempPassword: TEMP_PASS,
    }),
  });

  if (!prov.ok) {
    console.error('Provision failed:', JSON.stringify(prov.data, null, 2));
    process.exit(1);
  }

  const customerId = prov.data?.customer?.id;

  const veh = await authed('/api/entities/Vehicle', {
    method: 'POST',
    body: JSON.stringify({
      unit_number: 'DEMO-101',
      make: 'Chevrolet',
      model: 'Silverado 1500',
      year: 2024,
      unit_type: 'truck',
      status: 'active',
      assigned_customer_id: customerId,
      customer_id: customerId,
      odometer: 42000,
      vin: '1GCPABEK9TZ304056',
      license_plate: 'TX-DEMO1',
    }),
  });

  console.log(JSON.stringify({
    base: BASE,
    customerId,
    company: DEMO.company_name,
    portalLogin: {
      url: PRODUCTION ? 'https://fleetcomanagement.org/login' : 'http://localhost:5173/login',
      email: DEMO.email,
      temporaryPassword: TEMP_PASS,
    },
    demoVehicle: veh.ok ? { id: veh.data?.id, unit: 'DEMO-101' } : { error: veh.data },
    colleagueSteps: [
      'Sign in with email + temporary password above',
      'Set a new password when prompted',
      'Open Fleet → edit unit status; Work Orders → New repair order',
    ],
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Create a personal FleetCo Driver login (production or local).
 *
 * Usage:
 *   node scripts/create-personal-driver.mjs
 *
 * Env:
 *   BASE_URL=https://fleetcomanagement.org
 *   OWNER_EMAIL=jarell.slack@fleetcomanagement.org
 *   OWNER_PASSWORD=...
 *   DRIVER_EMAIL=jarrell.driver@fleetco.com
 *   DRIVER_PASSWORD=FleetCo2026!
 *   DRIVER_NAME=JaRell Slack
 *   DRIVER_PHONE=3609521249
 */
const BASE = process.env.BASE_URL || 'https://fleetcomanagement.org';

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'jarell.slack@fleetcomanagement.org';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || process.env.OWNER_BOOTSTRAP_PASSWORD || 'FleetCo2026!';

const DRIVER_EMAIL = (process.env.DRIVER_EMAIL || 'jarrell.driver@fleetco.com').trim().toLowerCase();
const DRIVER_PASSWORD = process.env.DRIVER_PASSWORD || 'FleetCo2026!';
const DRIVER_NAME = process.env.DRIVER_NAME || 'JaRell Slack';
const DRIVER_PHONE = process.env.DRIVER_PHONE || '3609521249';

async function main() {
  let loginRes;
  try {
    loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
    });
  } catch (err) {
    console.error(`Cannot reach ${BASE}`);
    console.error(err.message);
    process.exit(1);
  }

  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Owner login failed:', loginData.error || loginRes.status);
    console.error('Set OWNER_PASSWORD or run: node scripts/create-personal-driver-local.mjs');
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${loginData.access_token}`,
  };

  const seedRes = await fetch(`${BASE}/api/functions/seedDemoData`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ensureDrivers: true, ensurePersonalDriver: true, fillGaps: true }),
  });
  const seedData = await seedRes.json();
  if (seedRes.ok) {
    console.log('Personal driver ensured on server.');
    console.log('\n--- FleetCo Driver login ---');
    console.log('URL:      ', `${BASE}/driver/login`);
    console.log('Email:    ', DRIVER_EMAIL);
    console.log('Password: ', DRIVER_PASSWORD);
    console.log('Phone:    ', DRIVER_PHONE);
    return;
  }

  console.warn('seedDemoData failed, trying direct User API...', seedData.error);

  const customersRes = await fetch(`${BASE}/api/entities/Customer`, { headers });
  const customers = await customersRes.json();
  const customerId = customers[0]?.id || null;

  const existingRes = await fetch(`${BASE}/api/entities/User`, { headers });
  const users = await existingRes.json();
  const existing = Array.isArray(users) ? users.find((u) => u.email?.toLowerCase() === DRIVER_EMAIL) : null;

  if (existing) {
    await fetch(`${BASE}/api/entities/User/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        full_name: DRIVER_NAME,
        role: 'driver',
        phone: DRIVER_PHONE,
        customer_id: customerId || existing.customer_id,
        status: 'active',
        password: DRIVER_PASSWORD,
      }),
    });
    console.log('Updated existing driver account.');
  } else {
    await fetch(`${BASE}/api/entities/User`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: DRIVER_EMAIL,
        password: DRIVER_PASSWORD,
        full_name: DRIVER_NAME,
        role: 'driver',
        phone: DRIVER_PHONE,
        customer_id: customerId,
      }),
    });
    console.log('Created new driver account.');
  }

  console.log('\n--- FleetCo Driver login ---');
  console.log('URL:      ', `${BASE}/login?app=driver`);
  console.log('Email:    ', DRIVER_EMAIL);
  console.log('Password: ', DRIVER_PASSWORD);
  console.log('Phone:    ', DRIVER_PHONE);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

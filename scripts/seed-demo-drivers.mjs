/**
 * Ensure 5 demo driver accounts on production (owner login required).
 *
 * Usage:
 *   node scripts/seed-demo-drivers.mjs
 *
 * Env (optional):
 *   BASE_URL=https://fleetcomanagement.org
 *   OWNER_EMAIL=jarell.slack@fleetcomanagement.org
 *   OWNER_PASSWORD=...  (or OWNER_BOOTSTRAP_PASSWORD)
 */
const BASE = process.env.BASE_URL || 'https://fleetcomanagement.org';

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'jarell.slack@fleetcomanagement.org';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || process.env.OWNER_BOOTSTRAP_PASSWORD || 'FleetCo2026!';

async function main() {
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData.error || loginRes.status);
    console.error('Set OWNER_PASSWORD or OWNER_BOOTSTRAP_PASSWORD, then retry.');
    process.exit(1);
  }

  const seedRes = await fetch(`${BASE}/api/functions/seedDemoData`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.access_token}`,
    },
    body: JSON.stringify({ ensureDrivers: true, fillGaps: true }),
  });
  const seedData = await seedRes.json();
  if (!seedRes.ok) {
    console.error('Seed failed:', seedData.error || seedRes.status);
    process.exit(1);
  }

  console.log(seedData.message || 'Demo drivers ensured');
  if (seedData.drivers?.length) {
    console.log('\n| # | Name | Email | Password | Driver # | Login URL |');
    console.log('|---|------|-------|----------|----------|-----------|');
    for (const d of seedData.drivers) {
      console.log(`| ${d.number} | ${d.name} | ${d.email} | ${d.password} | ${d.driverNumber} | ${d.loginUrl} |`);
    }
  } else {
    console.log(JSON.stringify(seedData, null, 2));
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

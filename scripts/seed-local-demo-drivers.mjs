/**
 * Seed demo driver accounts on a local dev server.
 *
 * Usage:
 *   npm run dev          # in another terminal
 *   node scripts/seed-local-demo-drivers.mjs
 *
 * Env (optional):
 *   BASE_URL=http://localhost:5173
 *   OWNER_EMAIL=jarell.slack@fleetcomanagement.org
 *   OWNER_PASSWORD=FleetCo2026!
 */
const BASE = process.env.BASE_URL || 'http://localhost:5173';

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'jarell.slack@fleetcomanagement.org';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || process.env.OWNER_BOOTSTRAP_PASSWORD || 'FleetCo2026!';

async function main() {
  let loginRes;
  try {
    loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
    });
  } catch (err) {
    console.error(`Cannot reach ${BASE} — start the dev server first: npm run dev`);
    console.error(err.message);
    process.exit(1);
  }

  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData.error || loginRes.status);
    console.error('Try OWNER_EMAIL / OWNER_PASSWORD for your local store.');
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

  console.log(seedData.message || 'Local demo drivers ready');
  console.log('\nDriver app URL:', `${BASE}/login?app=driver`);
  console.log('\n| # | Email | Password |');
  console.log('|---|-------|----------|');
  for (let i = 1; i <= 5; i += 1) {
    console.log(`| ${i} | driver${i}@fleetco.com | demo123 |`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

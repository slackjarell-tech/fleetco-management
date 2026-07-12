/**
 * Seed full demo data on production (owner login required)
 * Usage: node scripts/seed-production-demo.mjs [--fill-gaps-only]
 */
const BASE = 'https://fleetcomanagement.org';
const fillGapsOnly = process.argv.includes('--fill-gaps-only');

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
    console.error('Set OWNER_BOOTSTRAP_PASSWORD on Render, redeploy, then retry.');
    process.exit(1);
  }

  const seedRes = await fetch(`${BASE}/api/functions/seedDemoData`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.access_token}`,
    },
    body: JSON.stringify(fillGapsOnly ? { fillGaps: true } : { fillGaps: true }),
  });
  const seedData = await seedRes.json();
  console.log(JSON.stringify(seedData, null, 2));
  process.exit(seedRes.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

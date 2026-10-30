/**
 * Flood demo data for full portal review + slackjarell@gmail.com customer login.
 * Usage:
 *   node scripts/flood-demo-review.mjs [--production]
 * Env (production owner optional):
 *   FLEETCO_OWNER_EMAIL, FLEETCO_OWNER_PASSWORD
 *   or executive: admin@fleetco.com / admin123
 */
const PRODUCTION = process.argv.includes('--production');
const BASE = PRODUCTION ? 'https://fleetcomanagement.org' : 'http://localhost:3001';

const LOGIN_EMAIL =
  process.env.FLEETCO_OWNER_EMAIL ||
  process.env.SEED_LOGIN_EMAIL ||
  (PRODUCTION ? 'admin@fleetco.com' : 'jarell.slack@fleetcomanagement.org');
const LOGIN_PASSWORD =
  process.env.FLEETCO_OWNER_PASSWORD ||
  process.env.SEED_LOGIN_PASSWORD ||
  (PRODUCTION ? 'admin123' : 'FleetCo2026!');

async function main() {
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });
  const loginData = await login.json();
  if (!login.ok) {
    console.error('Login failed:', loginData.error || login.status);
    console.error('Set SEED_LOGIN_EMAIL / SEED_LOGIN_PASSWORD or FLEETCO_OWNER_*');
    process.exit(1);
  }

  const seed = await fetch(`${BASE}/api/functions/seedDemoData`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.access_token}`,
    },
    body: JSON.stringify({ flood: true }),
  });
  const data = await seed.json();
  console.log(JSON.stringify(data, null, 2));
  if (!seed.ok) process.exit(1);

  console.log('\n=== CUSTOMER REVIEW LOGIN ===');
  console.log('URL:', `${BASE.replace(/3001$/, '5173')}/login`.replace('https://fleetcomanagement.org:5173', 'https://fleetcomanagement.org'));
  console.log('Email:', data.logins?.customerPortal?.email || 'slackjarell@gmail.com');
  console.log('Password:', data.review?.portalPassword || data.logins?.customerPortal?.password || 'DemoReview2026!');
  console.log('\n=== FLEETCO OWNER ===');
  console.log('Email: jarell.slack@fleetcomanagement.org (or admin@fleetco.com executive on prod)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

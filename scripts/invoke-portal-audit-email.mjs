/**
 * Invoke runPortalTabAuditAndEmail on local or production API (uses server Resend).
 * Usage:
 *   FLEETCO_OWNER_PASSWORD=... node scripts/invoke-portal-audit-email.mjs [--production] [--stress]
 */
const PRODUCTION = process.argv.includes('--production');
const STRESS = process.argv.includes('--stress');
const BASE = PRODUCTION ? 'https://fleetcomanagement.org' : 'http://localhost:3001';
const EMAIL = process.argv.find((a) => a.startsWith('--to='))?.split('=')[1] || 'jarell.slack@fleetcomanagement.org';
const OWNER = process.env.FLEETCO_OWNER_EMAIL || 'jarell.slack@fleetcomanagement.org';
const PASS = process.env.FLEETCO_OWNER_PASSWORD || '';

async function main() {
  if (!PASS) {
    console.error('Set FLEETCO_OWNER_PASSWORD');
    process.exit(1);
  }
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER, password: PASS }),
  });
  const loginData = await login.json();
  if (!login.ok) {
    console.error('Login failed:', loginData.error || login.status);
    process.exit(1);
  }
  const res = await fetch(`${BASE}/api/functions/runPortalTabAuditAndEmail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.access_token}`,
    },
    body: JSON.stringify({ to: EMAIL, stress: STRESS }),
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

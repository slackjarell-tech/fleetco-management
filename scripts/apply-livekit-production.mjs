/**
 * Save LiveKit credentials to production via FleetCo API (no Render dashboard).
 *
 * Usage:
 *   LIVEKIT_URL=wss://xxx.livekit.cloud \
 *   LIVEKIT_API_KEY=APIxxx \
 *   LIVEKIT_API_SECRET=secret \
 *   FLEETCO_EMAIL=your@email.com \
 *   FLEETCO_PASSWORD=yourpassword \
 *   node scripts/apply-livekit-production.mjs
 */
const BASE = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';
const url = (process.env.LIVEKIT_URL || '').trim();
const apiKey = (process.env.LIVEKIT_API_KEY || '').trim();
const apiSecret = (process.env.LIVEKIT_API_SECRET || '').trim();
const email = process.env.FLEETCO_EMAIL || process.env.EMAIL;
const password = process.env.FLEETCO_PASSWORD || process.env.PASSWORD;

async function main() {
  if (!url || !apiKey || !apiSecret || !email || !password) {
    console.error('\nMissing required env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, FLEETCO_EMAIL, FLEETCO_PASSWORD\n');
    process.exit(1);
  }

  console.log(`\n=== Apply LiveKit to ${BASE} ===\n`);

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginRes.json().catch(() => ({}));
  const token = login.access_token || login.token;
  if (!loginRes.ok || !token) {
    console.error('Login failed:', login.error || loginRes.status);
    process.exit(1);
  }

  const saveRes = await fetch(`${BASE}/api/functions/saveLiveKitSettings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url, apiKey, apiSecret }),
  });
  const save = await saveRes.json().catch(() => ({}));
  if (!saveRes.ok) {
    console.error('Save failed:', save.error || saveRes.status);
    process.exit(1);
  }

  console.log('✓', save.message || 'LiveKit saved');
  console.log('  URL:', save.url);
  console.log('  Source:', save.source);
  console.log('\nDrivers will use LiveKit live streaming on next recording start.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

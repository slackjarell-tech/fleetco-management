/**
 * Inspect production datastore health (no secrets).
 * Usage: node scripts/production-datastore-inspect.mjs
 */
const BASE = process.argv.includes('--local')
  ? 'http://localhost:3001'
  : 'https://fleetcomanagement.org';

const OWNER_EMAIL = process.env.OWNER_EMAIL;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD;

if (!OWNER_EMAIL || !OWNER_PASSWORD) {
  console.error('Set OWNER_EMAIL and OWNER_PASSWORD env vars to inspect production.');
  process.exit(1);
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text.slice(0, 200);
  }
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log(`=== Production datastore inspect (${BASE}) ===\n`);

  const health = await req('/api/public-settings');
  console.log('API health:', health.status, health.ok ? 'OK' : 'FAIL');

  const login = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
  });

  if (!login.ok) {
    console.error('Owner login failed:', login.data?.error || login.data);
    process.exit(1);
  }

  const token = login.data.access_token;
  const headers = { Authorization: `Bearer ${token}` };

  const stats = await req('/api/admin/datastore', { headers });
  console.log('\nDatastore stats:');
  console.log(JSON.stringify(stats.data?.stats || stats.data, null, 2));

  const customers = await req('/api/entities/Customer', { headers });
  const users = await req('/api/entities/User', { headers });

  const customerList = Array.isArray(customers.data) ? customers.data : [];
  const userList = Array.isArray(users.data) ? users.data : [];

  console.log(`\nCustomers: ${customerList.length}`);
  customerList.forEach((c) => console.log(`  - ${c.company_name || c.id}`));

  console.log(`\nUsers: ${userList.length}`);
  userList.forEach((u) => console.log(`  - ${u.email} (${u.role})`));

  const s = stats.data?.stats || {};
  const issues = [];
  if (s.postgres === false) {
    issues.push('DATABASE_URL not set — Postgres is NOT connected (data lost on redeploy)');
  }
  if (s.backend === 'file') {
    issues.push('Running file-only backend — link fleetco-db Postgres in Render');
  }
  if ((s.customerCount ?? 0) === 0) {
    issues.push('Zero customers in live database');
  }
  if ((s.userCount ?? 0) < 2) {
    issues.push('Very few users — team accounts may be missing');
  }

  if (issues.length) {
    console.log('\n⚠ Issues:');
    issues.forEach((i) => console.log(`  - ${i}`));
    process.exit(2);
  }

  console.log('\n✓ Datastore looks healthy.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Live test: Revan places an interactive Jarvis call.
 * Usage: node scripts/test-revan-call.mjs [phone]
 * Env: server/local.env or TWILIO_* + PUBLIC_APP_URL
 */
import { loadLocalEnv } from '../server/loadEnv.js';
loadLocalEnv();
import { seedDatabase } from '../server/seed.js';
import { filterUsers, updateUser } from '../server/db.js';
import { callExecutive } from '../server/revanComms.js';
import { twilioConfigured } from '../server/twilioClient.js';

const phoneArg = process.argv[2] || '3609521249';

async function main() {
  const { initDatabase } = await import('../server/storePersist.js');
  await initDatabase();
  seedDatabase();

  if (!twilioConfigured()) {
    console.error('FAIL: Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.');
    process.exit(1);
  }

  process.env.PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';
  process.env.REVAN_EXECUTIVE_PHONE = process.env.REVAN_EXECUTIVE_PHONE || '+13609521249';

  let exec = filterUsers({}).find((u) => ['owner', 'executive'].includes(u.role));
  if (!exec) {
    console.error('FAIL: No owner/executive user in database.');
    process.exit(1);
  }

  exec = updateUser(exec.id, { phone: phoneArg });
  console.log(`Executive: ${exec.email} → phone ${phoneArg}`);
  console.log(`PUBLIC_APP_URL: ${process.env.PUBLIC_APP_URL}`);

  const mockReq = {
    get(name) {
      if (name === 'host') return 'fleetcomanagement.org';
      if (name === 'x-forwarded-proto') return 'https';
      return null;
    },
    protocol: 'https',
  };

  const result = await callExecutive(exec, { slot: 'manual', req: mockReq });
  console.log('\nResult:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\nPASS: Twilio accepted the call. Your phone should ring shortly.');
    process.exit(0);
  }

  console.error('\nFAIL:', result.error || result.message || 'call not placed');
  process.exit(1);
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
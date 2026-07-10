/**
 * Test Resend email configuration.
 * Local:  RESEND_API_KEY=re_xxx node scripts/test-email-config.mjs --to you@example.com
 * Prod:   node scripts/test-email-config.mjs --production --to you@example.com
 */
import { getEmailConfigStatus, sendEmail } from '../server/email.js';

const args = process.argv.slice(2);
const production = args.includes('--production');
const toIdx = args.indexOf('--to');
const to = toIdx >= 0 ? args[toIdx + 1] : process.env.TEST_EMAIL_TO;

if (production) {
  process.env.APP_ORIGIN = 'https://fleetcomanagement.org';
}

const status = getEmailConfigStatus();
console.log('Email config:', status);

if (!status.configured) {
  console.error('\nRESEND_API_KEY is not set.');
  console.error('Add it to Render → fleetco-management → Environment, then redeploy.');
  process.exit(1);
}

if (!to) {
  console.error('\nUsage: node scripts/test-email-config.mjs --to recipient@example.com');
  process.exit(1);
}

const result = await sendEmail({
  to,
  subject: 'FleetCo email test',
  html: '<p>If you received this, FleetCo transactional email is working.</p>',
  text: 'If you received this, FleetCo transactional email is working.',
});

console.log('\nResult:', result);

if (!result.success) {
  if (result.hint) console.error('\nHint:', result.hint);
  process.exit(1);
}

console.log('\nTest email sent successfully.');

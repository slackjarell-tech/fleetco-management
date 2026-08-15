/**
 * Send Groq setup instructions via Resend.
 * Production (Render Shell): node scripts/send-groq-setup-email.mjs --to you@example.com
 */
import { sendGroqSetupEmail } from '../server/groqSetupEmail.js';

const args = process.argv.slice(2);
const toIdx = args.indexOf('--to');
const to = toIdx >= 0 ? args[toIdx + 1] : process.env.OWNER_EMAIL || 'support@fleetcomanagement.org';

const result = await sendGroqSetupEmail(to);
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);

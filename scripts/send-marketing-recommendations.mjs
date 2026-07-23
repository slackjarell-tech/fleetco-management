/**
 * Email FleetCo marketing platform recommendations (HubSpot, Apollo, etc.)
 * Usage: node scripts/send-marketing-recommendations.mjs --to jarell.slack@fleetcomanagement.org
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendMarketingPlatformGuideEmail } from '../server/marketingPlatformGuideEmail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const args = process.argv.slice(2);
const toIdx = args.indexOf('--to');
const to = toIdx >= 0 ? args[toIdx + 1] : 'jarell.slack@fleetcomanagement.org';

const result = await sendMarketingPlatformGuideEmail(to);

console.log('To:', to);
console.log('Result:', result);

if (!result.success) {
  if (result.hint) console.error('Hint:', result.hint);
  process.exit(1);
}

console.log('Marketing recommendations email sent.');

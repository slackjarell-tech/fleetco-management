/**
 * Validate LiveKit credentials and print Render env setup steps.
 *
 * Usage (after creating keys at cloud.livekit.io → Project → Settings → Keys):
 *   node scripts/configure-livekit.mjs --url wss://xxx.livekit.cloud --key APIxxx --secret xxx
 *
 * Or set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in the environment first:
 *   node scripts/configure-livekit.mjs
 *
 * Optional: write a local .env snippet (never committed):
 *   node scripts/configure-livekit.mjs --write-env
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AccessToken } from 'livekit-server-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RENDER_SERVICE = 'fleetco-management';
const PROD_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { writeEnv: false };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--write-env') out.writeEnv = true;
    else if (a === '--url') out.url = args[++i];
    else if (a === '--key') out.key = args[++i];
    else if (a === '--secret') out.secret = args[++i];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function normalizeUrl(raw) {
  let url = (raw || '').trim();
  if (!url) return '';
  if (url.startsWith('https://')) url = url.replace('https://', 'wss://');
  if (url.startsWith('http://')) url = url.replace('http://', 'ws://');
  return url;
}

async function validateCredentials(url, apiKey, apiSecret) {
  const token = new AccessToken(apiKey, apiSecret, {
    identity: 'fleetco-setup-test',
    ttl: '5m',
  });
  token.addGrant({
    roomJoin: true,
    room: 'fleetco-setup-test',
    canPublish: true,
    canSubscribe: true,
  });
  const jwt = await token.toJwt();
  if (!jwt || jwt.length < 20) {
    throw new Error('Could not generate a LiveKit access token — check API key and secret');
  }
  return jwt;
}

function printRenderSteps(url, apiKey) {
  console.log('\n=== Add these on Render ===\n');
  console.log('1. Open https://dashboard.render.com/');
  console.log(`2. Select service: ${RENDER_SERVICE}`);
  console.log('3. Environment → Add Environment Variable\n');
  console.log(`   LIVEKIT_URL=${url}`);
  console.log(`   LIVEKIT_API_KEY=${apiKey}`);
  console.log('   LIVEKIT_API_SECRET=<paste your secret from LiveKit dashboard>\n');
  console.log('4. Save Changes → Manual Deploy → Deploy latest commit');
  console.log(`5. Verify: npm run go-live:check:prod  (or ${PROD_URL}/api/system/live-status)\n`);
  console.log('6. Sign out/in on the driver app — Start Recording should appear.\n');
}

function printSignupSteps() {
  console.log('\n=== LiveKit Cloud signup (one-time) ===\n');
  console.log('1. Go to https://cloud.livekit.io/ and sign in (Google/GitHub/email)');
  console.log('2. Create a project — name it e.g. "fleetco-production"');
  console.log('3. Open the project → Settings → Keys');
  console.log('4. Click "Create key" (or use the default key)');
  console.log('5. Copy: WebSocket URL, API Key, and API Secret');
  console.log('6. Run this script again with --url, --key, and --secret\n');
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log('Usage: node scripts/configure-livekit.mjs [--url wss://...] [--key API...] [--secret ...] [--write-env]');
    process.exit(0);
  }

  const url = normalizeUrl(args.url || process.env.LIVEKIT_URL);
  const apiKey = (args.key || process.env.LIVEKIT_API_KEY || '').trim();
  const apiSecret = (args.secret || process.env.LIVEKIT_API_SECRET || '').trim();

  console.log('\n=== FleetCo LiveKit setup ===\n');

  if (!url || !apiKey || !apiSecret) {
    printSignupSteps();
    console.log('Missing credentials. Provide all three:\n');
    console.log('  node scripts/configure-livekit.mjs --url wss://YOUR.livekit.cloud --key APIxxx --secret xxx\n');
    process.exit(1);
  }

  if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
    console.error('LIVEKIT_URL must be a WebSocket URL (wss://your-project.livekit.cloud)');
    process.exit(1);
  }

  try {
    await validateCredentials(url, apiKey, apiSecret);
    console.log('✓ LiveKit credentials valid — test token generated successfully');
  } catch (err) {
    console.error('✗ LiveKit validation failed:', err.message);
    process.exit(1);
  }

  printRenderSteps(url, apiKey);

  if (args.writeEnv) {
    const envPath = path.join(ROOT, '.env.local');
    const snippet = [
      '# LiveKit — local dev only (do not commit)',
      `LIVEKIT_URL=${url}`,
      `LIVEKIT_API_KEY=${apiKey}`,
      `LIVEKIT_API_SECRET=${apiSecret}`,
      '',
    ].join('\n');
    fs.writeFileSync(envPath, snippet);
    console.log(`Wrote ${envPath} for local testing (gitignored).\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

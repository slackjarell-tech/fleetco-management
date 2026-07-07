/**
 * Generate client video + email (or send existing files only).
 * Run: npm run marketing:send
 *      node scripts/email-client-presentation.mjs --to slackjarell@gmail.com --send-only
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BRAND } from '../marketing/brand.js';
import { sendEmail, fileAttachment } from '../server/email.js';
import { execSync } from 'child_process';

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
const sendOnly = args.includes('--send-only');
const toArgIdx = args.indexOf('--to');
const TO = toArgIdx >= 0 ? args[toArgIdx + 1] : (process.env.CLIENT_PRESENTATION_TO || 'jarrell@fleetcomanagement.org');
const DECK = path.join(ROOT, 'marketing', 'FleetCo-Client-Presentation.pptx');
const VIDEO = path.join(ROOT, 'marketing', 'FleetCo-Client-Presentation.mp4');

async function main() {
  if (!sendOnly) {
    console.log('Generating PowerPoint deck…');
    execSync('node scripts/generate-client-deck.js', { stdio: 'inherit', cwd: ROOT });
    console.log('Generating video presentation…');
    execSync('node scripts/generate-client-video.mjs', { stdio: 'inherit', cwd: ROOT });
  } else if (!fs.existsSync(VIDEO)) {
    throw new Error(`Video not found: ${VIDEO}. Run without --send-only first.`);
  }

  const attachments = [];
  if (fs.existsSync(VIDEO)) attachments.push(fileAttachment(VIDEO));
  if (fs.existsSync(DECK)) attachments.push(fileAttachment(DECK));

  const videoMb = fs.existsSync(VIDEO) ? (fs.statSync(VIDEO).size / (1024 * 1024)).toFixed(1) : '?';
  const videoUrl = `${BRAND.url}/marketing/FleetCo-Client-Presentation.mp4`;
  const deckUrl = `${BRAND.url}/marketing/FleetCo-Client-Presentation.pptx`;

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;color:#0F172A">
      <p>Hi JaRell,</p>
      <p>Your <strong>FleetCo client presentation</strong> is ready to share with potential customers.</p>
      <h2 style="color:#F59E0B">What's included</h2>
      <ul>
        <li><strong>Video walkthrough</strong> (${videoMb} MB) — public website, executive portal, and mobile driver app</li>
        <li><strong>PowerPoint deck</strong> — 8-slide pitch with pricing and ROI</li>
      </ul>
      <p>Both files are attached. After deploy they will also be available at:</p>
      <ul>
        <li><a href="${videoUrl}">${videoUrl}</a></li>
        <li><a href="${deckUrl}">${deckUrl}</a></li>
      </ul>
      <p style="margin-top:24px;color:#64748B;font-size:14px">
        ${BRAND.company} · ${BRAND.phone} · ${BRAND.location}
      </p>
    </div>`;

  const text = `FleetCo client presentation ready.\nVideo: ${videoUrl}\nDeck: ${deckUrl}\nAttachments included if email delivery succeeded.`;

  console.log(`Sending to ${TO}…`);
  const result = await sendEmail({
    to: TO,
    subject: 'FleetCo Client Video Presentation — Website & Driver App',
    html,
    text,
    attachments,
  });

  if (result.skipped) {
    console.log('\n--- Email not sent (RESEND_API_KEY missing) ---');
    console.log(`Video saved: ${VIDEO}`);
    console.log(`Deck saved:  ${DECK}`);
    console.log('Add RESEND_API_KEY to .env and re-run with --send-only');
    process.exit(2);
  }

  console.log('Email sent successfully.', result.id || '');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

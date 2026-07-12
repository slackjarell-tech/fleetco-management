/**
 * Transactional email via Resend (set RESEND_API_KEY on the server).
 */
import fs from 'fs';
import path from 'path';

const SANDBOX_FROM = 'FleetCo Management <onboarding@resend.dev>';

function normalizeEnv(value) {
  if (!value || typeof value !== 'string') return '';
  let v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export function getResendApiKey() {
  return normalizeEnv(process.env.RESEND_API_KEY);
}

export function getEmailFromAddress() {
  const configured = normalizeEnv(process.env.EMAIL_FROM);
  if (process.env.RESEND_SANDBOX === 'true') {
    return SANDBOX_FROM;
  }
  return configured || 'FleetCo Management <support@fleetcomanagement.org>';
}

export function emailErrorHint(message = '') {
  const msg = message.toLowerCase();
  if (msg.includes('api key') || msg.includes('unauthorized') || msg.includes('invalid')) {
    return 'Check RESEND_API_KEY in Render → Environment. Copy the full key from resend.com/api-keys (starts with re_). Redeploy after saving.';
  }
  if (msg.includes('domain') || msg.includes('verify') || msg.includes('not allowed')) {
    return 'Verify fleetcomanagement.org in Resend → Domains (add DNS records in IONOS). Or set RESEND_SANDBOX=true and EMAIL_FROM=onboarding@resend.dev to test (sends only to your Resend account email).';
  }
  if (msg.includes('sandbox') || msg.includes('testing')) {
    return 'Resend sandbox mode: you can only send to the email address on your Resend account until your domain is verified.';
  }
  return 'See Render logs for [email failed] details, or run: node scripts/test-email-config.mjs --production';
}

export function getEmailConfigStatus() {
  const key = getResendApiKey();
  return {
    configured: !!key,
    keyPrefix: key ? `${key.slice(0, 8)}…` : null,
    from: getEmailFromAddress(),
    sandbox: process.env.RESEND_SANDBOX === 'true',
    publicAppUrl: normalizeEnv(process.env.PUBLIC_APP_URL) || normalizeEnv(process.env.APP_ORIGIN) || 'https://fleetcomanagement.org',
  };
}

let resendClient = null;
let resendClientKey = null;

async function getResend() {
  const key = getResendApiKey();
  if (!key) return null;
  if (!resendClient || resendClientKey !== key) {
    const { Resend } = await import('resend');
    resendClient = new Resend(key);
    resendClientKey = key;
  }
  return resendClient;
}

export async function sendEmail({ to, subject, html, text, attachments = [], cc, bcc, replyTo }) {
  const resend = await getResend();
  if (!resend) {
    console.log('[email skipped — no RESEND_API_KEY]', { to, subject });
    return { success: false, skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  const from = getEmailFromAddress();
  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text: text || undefined,
  };

  if (replyTo) payload.reply_to = replyTo;
  if (cc) payload.cc = Array.isArray(cc) ? cc : [cc];
  if (bcc) payload.bcc = Array.isArray(bcc) ? bcc : [bcc];

  if (attachments.length) {
    payload.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
    }));
  }

  try {
    const result = await resend.emails.send(payload);
    if (result.error) {
      const errorMsg = result.error.message || JSON.stringify(result.error);
      console.error('[email failed]', { to, from, subject, error: errorMsg });
      return {
        success: false,
        error: errorMsg,
        hint: emailErrorHint(errorMsg),
        from,
      };
    }
    console.log('[email sent]', { to, from, subject, id: result.data?.id });
    return { success: true, id: result.data?.id, from };
  } catch (err) {
    const errorMsg = err.message || String(err);
    console.error('[email failed]', { to, from, subject, error: errorMsg });
    return {
      success: false,
      error: errorMsg,
      hint: emailErrorHint(errorMsg),
      from,
    };
  }
}

export function fileAttachment(filePath, filename) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`Attachment not found: ${abs}`);
  return { filename: filename || path.basename(abs), content: fs.readFileSync(abs) };
}

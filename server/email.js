/**
 * Transactional email via Resend (optional — set RESEND_API_KEY).
 */
import fs from 'fs';
import path from 'path';

const FROM = process.env.EMAIL_FROM || 'FleetCo Management <info@fleetcomanagement.org>';

let resendClient = null;

async function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) {
    const { Resend } = await import('resend');
    resendClient = new Resend(key);
  }
  return resendClient;
}

export async function sendEmail({ to, subject, html, text, attachments = [] }) {
  const resend = await getResend();
  if (!resend) {
    console.log('[email skipped — no RESEND_API_KEY]', { to, subject, attachments: attachments.map((a) => a.filename) });
    return { success: false, skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  const payload = {
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  };

  if (attachments.length) {
    payload.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
    }));
  }

  const result = await resend.emails.send(payload);
  if (result.error) throw new Error(result.error.message || JSON.stringify(result.error));
  console.log('[email sent]', { to, subject, id: result.data?.id });
  return { success: true, id: result.data?.id };
}

export function fileAttachment(filePath, filename) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`Attachment not found: ${abs}`);
  return { filename: filename || path.basename(abs), content: fs.readFileSync(abs) };
}

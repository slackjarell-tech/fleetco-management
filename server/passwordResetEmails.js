import { sendEmail } from './email.js';

export function buildPasswordResetEmailHtml({ fullName, resetUrl }) {
  const greeting = fullName ? `Hi ${fullName},` : 'Hi,';
  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;color:#0F172A;line-height:1.5">
      <p>${greeting}</p>
      <p>We received a request to reset your FleetCo Management portal password.</p>
      <p style="margin:24px 0">
        <a href="${resetUrl}" style="display:inline-block;background:#F59E0B;color:#0F172A;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">
          Reset my password
        </a>
      </p>
      <p style="color:#64748B;font-size:14px">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
      <p style="color:#64748B;font-size:13px;word-break:break-all">Or copy this link: ${resetUrl}</p>
      <p style="margin-top:24px;color:#64748B;font-size:14px">
        Fleetco Management LLC · (360) 952-1249<br/>
        <a href="mailto:info@fleetcomanagement.org">info@fleetcomanagement.org</a>
      </p>
    </div>`;
}

export function buildPasswordResetEmailText({ fullName, resetUrl }) {
  const greeting = fullName ? `Hi ${fullName},` : 'Hi,';
  return [
    greeting,
    '',
    'We received a request to reset your FleetCo Management portal password.',
    '',
    `Reset link (expires in 1 hour): ${resetUrl}`,
    '',
    'If you did not request this, you can ignore this email.',
    '',
    'FleetCo Management · info@fleetcomanagement.org',
  ].join('\n');
}

export async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  return sendEmail({
    to,
    subject: 'Reset your FleetCo Management password',
    html: buildPasswordResetEmailHtml({ fullName, resetUrl }),
    text: buildPasswordResetEmailText({ fullName, resetUrl }),
  });
}

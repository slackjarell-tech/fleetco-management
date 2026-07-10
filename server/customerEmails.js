import { sendEmail } from './email.js';
import { NOTIFICATION_PREF_LABELS } from './notificationPreferences.js';

const APP_URL = (process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org').replace(/\/$/, '');
const LOGIN_URL = `${APP_URL}/login`;
const PREFS_URL = `${APP_URL}/portal/notification-preferences`;

function enabledPrefLines(prefs) {
  return Object.entries(prefs)
    .filter(([, enabled]) => enabled)
    .map(([key]) => NOTIFICATION_PREF_LABELS[key] || key);
}

export function buildWelcomeEmailText({ companyName, contactName, email, tempPassword, notificationPrefs }) {
  const greeting = contactName ? `Hi ${contactName},` : 'Hi,';
  const enabled = enabledPrefLines(notificationPrefs);
  return [
    greeting,
    '',
    `Welcome to FleetCo Management! Your portal account for ${companyName} is ready.`,
    '',
    `Portal: ${LOGIN_URL}`,
    `Email: ${email}`,
    `Temporary password: ${tempPassword}`,
    '',
    'Please sign in and change your password after your first login.',
    'From there you can add drivers and team members under Customers & Team → My Team.',
    '',
    'Email notifications enabled for your account:',
    ...enabled.map((line) => `• ${line}`),
    '',
    `Manage notification preferences anytime: ${PREFS_URL}`,
    '',
    'FleetCo Management · (360) 952-1249 · info@fleetcomanagement.org',
  ].join('\n');
}

export function buildWelcomeEmailHtml({ companyName, contactName, email, tempPassword, notificationPrefs }) {
  const greeting = contactName ? `Hi ${contactName},` : 'Hi,';
  const enabled = enabledPrefLines(notificationPrefs);
  const prefList = enabled.map((line) => `<li>${line}</li>`).join('');

  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;color:#0F172A;line-height:1.5">
      <p>${greeting}</p>
      <p>Welcome to <strong>FleetCo Management</strong>! Your portal account for <strong>${companyName}</strong> is ready.</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>Portal:</strong> <a href="${LOGIN_URL}">${LOGIN_URL}</a></p>
        <p style="margin:0 0 8px"><strong>Email:</strong> ${email}</p>
        <p style="margin:0"><strong>Temporary password:</strong> <code style="background:#FFF7ED;padding:2px 6px;border-radius:4px">${tempPassword}</code></p>
      </div>
      <p>Please sign in and <strong>change your password</strong> after your first login. From there you can add drivers and team members under <em>Customers &amp; Team → My Team</em>.</p>
      <h3 style="color:#F59E0B;margin-bottom:8px">Your notification settings</h3>
      <p style="margin-top:0;color:#64748B;font-size:14px">You'll receive email for the items below. You can change these anytime in the portal.</p>
      <ul style="padding-left:20px">${prefList}</ul>
      <p style="margin-top:24px">
        <a href="${PREFS_URL}" style="display:inline-block;background:#F59E0B;color:#0F172A;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">
          Manage notification preferences
        </a>
      </p>
      <p style="margin-top:24px;color:#64748B;font-size:14px">
        Fleetco Management LLC · (360) 952-1249 · Dallas, TX<br/>
        <a href="mailto:info@fleetcomanagement.org">info@fleetcomanagement.org</a>
      </p>
    </div>`;
}

export async function sendWelcomeSignupEmail({ to, companyName, contactName, tempPassword, notificationPrefs, cc, bcc }) {
  const html = buildWelcomeEmailHtml({ companyName, contactName, email: to, tempPassword, notificationPrefs });
  const text = buildWelcomeEmailText({ companyName, contactName, email: to, tempPassword, notificationPrefs });
  return sendEmail({
    to,
    cc,
    bcc,
    subject: `Welcome to FleetCo Management — your portal is ready`,
    html,
    text,
  });
}

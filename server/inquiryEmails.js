import { sendEmail } from './email.js';

const DEFAULT_INQUIRY_INBOX = 'support@fleetcomanagement.org';

function normalizeEnv(value) {
  if (!value || typeof value !== 'string') return '';
  let v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export function getInquiryInbox() {
  return (
    normalizeEnv(process.env.INQUIRY_TO)
    || normalizeEnv(process.env.SUPPORT_EMAIL)
    || DEFAULT_INQUIRY_INBOX
  );
}

function field(label, value) {
  const display = value?.trim?.() ? value.trim() : '—';
  return { label, value: display };
}

function buildFields(inquiry) {
  return [
    field('Name', inquiry.name),
    field('Email', inquiry.email),
    field('Phone', inquiry.phone),
    field('Company', inquiry.company),
    field('Fleet size', inquiry.fleet_size),
    field('Service interest', inquiry.service_interest),
    field('Message', inquiry.message),
  ];
}

export function buildInquiryNotificationText(inquiry) {
  const lines = buildFields(inquiry).map(({ label, value }) => `${label}: ${value}`);
  return [
    'New service inquiry from fleetcomanagement.org',
    '',
    ...lines,
    '',
    `Inquiry ID: ${inquiry.id}`,
    `Submitted: ${inquiry.created_date || new Date().toISOString()}`,
  ].join('\n');
}

export function buildInquiryNotificationHtml(inquiry) {
  const customerEmail = inquiry.email?.trim() || '';
  const rows = buildFields(inquiry)
    .map(
      ({ label, value }) => {
        const cell = label === 'Email' && customerEmail
          ? `<a href="mailto:${customerEmail}">${value.replace(/</g, '&lt;')}</a>`
          : value.replace(/</g, '&lt;');
        return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-weight:600;color:#475569;width:140px;vertical-align:top">${label}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#0F172A;white-space:pre-wrap">${cell}</td>
        </tr>`;
      },
    )
    .join('');

  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;color:#0F172A;line-height:1.5">
      <h2 style="margin:0 0 8px;color:#0F172A">New service inquiry</h2>
      <p style="margin:0 0 12px;color:#64748B">A visitor submitted a consultation or services inquiry on fleetcomanagement.org.</p>
      ${customerEmail ? `<p style="margin:0 0 20px"><a href="mailto:${customerEmail}" style="display:inline-block;background:#F59E0B;color:#0F172A;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px">Reply to ${inquiry.name || 'customer'}</a></p>` : ''}
      <table style="width:100%;border-collapse:collapse;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden">
        ${rows}
      </table>
      <p style="margin:20px 0 0;color:#64748B;font-size:13px">
        Inquiry ID: ${inquiry.id}<br/>
        Hit <strong>Reply</strong> in your mail app to respond — replies go to ${customerEmail || 'the customer'}.
      </p>
    </div>`;
}

export async function sendInquiryNotificationEmail(inquiry) {
  const to = getInquiryInbox();
  const subjectParts = [inquiry.service_interest, inquiry.company, inquiry.name].filter(Boolean);
  const subject = `FleetCo inquiry${subjectParts.length ? ` — ${subjectParts[0]}` : ''}`;

  return sendEmail({
    to,
    replyTo: inquiry.email,
    subject,
    html: buildInquiryNotificationHtml(inquiry),
    text: buildInquiryNotificationText(inquiry),
  });
}

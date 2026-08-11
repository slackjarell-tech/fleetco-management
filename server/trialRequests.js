import { createEntity } from './db.js';
import { sendEmail } from './email.js';
import { getInquiryInbox } from './inquiryEmails.js';

export async function submitTrialRequest(body) {
  const { name, email, company, fleet_size, phone, message, source } = body;
  if (!name || !email) throw new Error('Name and email are required');

  const req = createEntity('TrialRequest', {
    name,
    email: email.trim().toLowerCase(),
    company: company || '',
    fleet_size: fleet_size || '',
    phone: phone || '',
    message: message || '',
    source: source || 'website',
    status: 'pending',
  });

  const inbox = getInquiryInbox();
  await sendEmail({
    to: inbox,
    replyTo: email,
    subject: `Trial / demo request — ${name}`,
    text: [
      'New trial or demo sandbox request',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company || '—'}`,
      `Fleet size: ${fleet_size || '—'}`,
      `Phone: ${phone || '—'}`,
      `Source: ${source || 'website'}`,
      '',
      message || '',
      '',
      `Request ID: ${req.id}`,
    ].join('\n'),
  }).catch(() => {});

  return { success: true, id: req.id };
}

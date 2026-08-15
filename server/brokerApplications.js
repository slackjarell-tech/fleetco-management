import { createEntity, filterEntities, getEntity, updateEntity, nowIso } from './db.js';
import { sendEmail } from './email.js';
import { getInquiryInbox } from './inquiryEmails.js';
import { requireLoadBoardFeeAcknowledgment } from './loadBoardFeeAcknowledgment.js';

export async function submitBrokerApplication(body) {
  const {
    company_name,
    contact_name,
    email,
    phone,
    mc_number,
    dot_number,
    loads_per_week,
    equipment_types,
    message,
  } = body;

  if (!company_name || !contact_name || !email) {
    throw new Error('Company name, contact name, and email are required');
  }
  requireLoadBoardFeeAcknowledgment(body);

  const app = createEntity('BrokerApplication', {
    company_name,
    contact_name,
    email: email.trim().toLowerCase(),
    phone: phone || '',
    mc_number: mc_number || '',
    dot_number: dot_number || '',
    loads_per_week: loads_per_week || '',
    equipment_types: equipment_types || '',
    message: message || '',
    status: 'pending',
    load_board_fee_acknowledged: true,
    load_board_fee_acknowledged_at: nowIso(),
  });

  const inbox = getInquiryInbox();
  await sendEmail({
    to: inbox,
    replyTo: email,
    subject: `Broker application — ${company_name}`,
    text: [
      'New freight broker application',
      '',
      `Company: ${company_name}`,
      `Contact: ${contact_name}`,
      `Email: ${email}`,
      `Phone: ${phone || '—'}`,
      `MC#: ${mc_number || '—'}`,
      `DOT#: ${dot_number || '—'}`,
      `Loads/week: ${loads_per_week || '—'}`,
      `Equipment: ${equipment_types || '—'}`,
      '',
      message || '',
      '',
      `Application ID: ${app.id}`,
    ].join('\n'),
    html: `<p>New broker application from <strong>${company_name}</strong>.</p><p>Contact: ${contact_name} &lt;${email}&gt;</p><p>Review in portal → Broker Applications.</p>`,
  }).catch(() => {});

  return { success: true, id: app.id };
}

export function listBrokerApplications(user) {
  if (!user || !['owner', 'executive', 'fleet_manager'].includes(user.role)) {
    throw new Error('SLT access required');
  }
  return filterEntities('BrokerApplication', {}, '-created_date', 200);
}

export function updateBrokerApplicationStatus(user, { id, status, notes }) {
  if (!user || !['owner', 'executive', 'fleet_manager'].includes(user.role)) {
    throw new Error('SLT access required');
  }
  const app = getEntity('BrokerApplication', id);
  if (!app) throw new Error('Application not found');
  const updated = updateEntity('BrokerApplication', id, {
    status,
    review_notes: notes || '',
    reviewed_at: nowIso(),
    reviewed_by: user.email,
  });
  return { success: true, application: updated };
}

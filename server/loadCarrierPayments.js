import {
  filterEntities,
  getEntity,
  listEntities,
  listUsers,
  nowIso,
  updateEntity,
} from './db.js';
import { sendEmail } from './email.js';
import { isFleetCoInternal } from './roles.js';

export const CARRIER_PAYMENT_TERMS = ['net_7', 'net_15'];

export const PAYMENT_TERM_DAYS = {
  net_7: 7,
  net_15: 15,
};

export const CARRIER_PAYMENT_STATUSES = [
  'awaiting_delivery',
  'pending',
  'sent',
  'paid',
  'overdue',
  'disputed',
];

const TICK_MS = 60 * 60 * 1000;
const APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';

export function isFreightBrokerUser(user) {
  return user?.role === 'freight_broker';
}

export function loadRequiresCarrierPaymentTerms(user) {
  return isFreightBrokerUser(user);
}

export function validateCarrierPaymentTerms(terms) {
  if (!terms || !CARRIER_PAYMENT_TERMS.includes(terms)) {
    throw new Error('Carrier payment terms are required — choose Net 7 or Net 15');
  }
  return terms;
}

export function paymentTermsLabel(terms) {
  if (terms === 'net_7') return 'Net 7';
  if (terms === 'net_15') return 'Net 15';
  return terms || '—';
}

export function computePaymentDueAt(deliveredAt, terms) {
  const days = PAYMENT_TERM_DAYS[terms];
  if (!deliveredAt || !days) return null;
  const due = new Date(deliveredAt);
  due.setUTCDate(due.getUTCDate() + days);
  return due.toISOString();
}

export function brokerHasBlockingPaymentIssues(customerId) {
  if (!customerId) return false;
  return countOverdueBrokerLoads(customerId) > 0;
}

export function countOverdueBrokerLoads(customerId) {
  if (!customerId) return 0;
  const loads = filterEntities('Load', { status: 'delivered' });
  return loads.filter((l) =>
    l.customer_id === customerId
    && ['overdue', 'disputed'].includes(l.carrier_payment_status),
  ).length;
}

export function assertBrokerCanPostLoad(user) {
  if (!loadRequiresCarrierPaymentTerms(user)) return;
  if (brokerHasBlockingPaymentIssues(user.customer_id)) {
    throw new Error(
      'You cannot post new loads until overdue or disputed carrier payments are resolved. Contact FleetCo support or pay carriers on open loads.',
    );
  }
}

function brokerEmailsForLoad(load) {
  const emails = [];
  if (load.posted_by_user_id) {
    const poster = listUsers().find((u) => u.id === load.posted_by_user_id);
    if (poster?.email) emails.push(poster.email);
  }
  if (load.customer_id) {
    const customer = getEntity('Customer', load.customer_id);
    if (customer?.contact_email) emails.push(customer.contact_email);
    listUsers()
      .filter((u) => u.customer_id === load.customer_id && u.role === 'freight_broker' && u.email)
      .forEach((u) => emails.push(u.email));
  }
  return [...new Set(emails.filter(Boolean))];
}

export async function sendBrokerPaymentReminder(load) {
  const recipients = brokerEmailsForLoad(load);
  if (!recipients.length) return { sent: false, reason: 'no_recipients' };

  const due = load.carrier_payment_due_at
    ? new Date(load.carrier_payment_due_at).toLocaleDateString('en-US', { dateStyle: 'medium' })
    : '—';
  const amount = Number(load.carrier_payout_amount ?? load.rate) || 0;
  const terms = paymentTermsLabel(load.carrier_payment_terms);

  const subject = `Payment due in 2 days — Load #${load.load_number} (${terms})`;
  const html = `
    <p>Reminder: carrier payment for <strong>Load #${load.load_number}</strong> is due in 2 days.</p>
    <ul>
      <li>Route: ${load.origin || '—'} → ${load.destination || '—'}</li>
      <li>Terms: ${terms}</li>
      <li>Due date: ${due}</li>
      <li>Amount: <strong>$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></li>
    </ul>
    <p>Pay the carrier and mark the load paid on the FleetCo load board. Unpaid loads after the due date are escalated to FleetCo SLT.</p>
    <p><a href="${APP_URL}/portal/loads">Open Load Board</a></p>
  `;

  await sendEmail({ to: recipients, subject, html, text: `${subject}\nDue ${due} · $${amount.toFixed(2)}\n${APP_URL}/portal/loads` });
  updateEntity('Load', load.id, { carrier_payment_reminder_sent_at: nowIso() });
  return { sent: true, recipients };
}

export function checkPaymentReminders() {
  const now = Date.now();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const windowMs = 60 * 60 * 1000;
  let sent = 0;

  const loads = filterEntities('Load', { status: 'delivered' });
  for (const load of loads) {
    if (!load.carrier_payment_terms || !load.carrier_payment_due_at) continue;
    if (load.carrier_payment_reminder_sent_at) continue;
    if (!['pending', 'sent'].includes(load.carrier_payment_status || 'pending')) continue;

    const dueMs = new Date(load.carrier_payment_due_at).getTime();
    const reminderTarget = dueMs - twoDaysMs;
    if (now < reminderTarget - windowMs || now > dueMs) continue;

    sendBrokerPaymentReminder(load).catch((err) => {
      console.warn('[carrier-payments] reminder failed', load.id, err.message);
    });
    sent += 1;
  }

  return { sent };
}

export function prepareLoadForCreate(payload, user) {
  assertBrokerCanPostLoad(user);
  const next = { ...payload };
  if (loadRequiresCarrierPaymentTerms(user)) {
    next.carrier_payment_terms = validateCarrierPaymentTerms(next.carrier_payment_terms);
    next.carrier_payment_status = 'awaiting_delivery';
    next.posting_source = 'broker';
    next.posted_by_user_id = user.id;
  }
  return next;
}

export function validateLoadForUpdate(existing, patch, user) {
  const next = { ...patch };

  if (loadRequiresCarrierPaymentTerms(user) || existing.carrier_payment_terms) {
    if (next.carrier_payment_terms !== undefined) {
      next.carrier_payment_terms = validateCarrierPaymentTerms(next.carrier_payment_terms);
    } else if (!existing.carrier_payment_terms && loadRequiresCarrierPaymentTerms(user)) {
      throw new Error('Carrier payment terms are required — choose Net 7 or Net 15');
    }
  }

  if (existing.carrier_payment_status === 'paid' && next.carrier_payment_status && next.carrier_payment_status !== 'paid') {
    throw new Error('Cannot change payment status after carrier confirmed payment');
  }

  return next;
}

export function initCarrierPaymentOnDelivery(load, deliveredAt) {
  if (!load?.carrier_payment_terms) return {};
  const carrierId = load.booked_by_customer_id || load.assigned_customer_id;
  if (!carrierId) return {};

  return {
    carrier_payment_status: 'pending',
    carrier_payment_due_at: computePaymentDueAt(deliveredAt, load.carrier_payment_terms),
  };
}

function isLoadPoster(user, load) {
  if (!user || !load) return false;
  if (isFleetCoInternal(user.role)) return true;
  if (load.posted_by_user_id === user.id) return true;
  if (load.customer_id && user.customer_id === load.customer_id) return true;
  return false;
}

function isLoadCarrier(user, load) {
  if (!user || !load) return false;
  const carrierId = load.booked_by_customer_id || load.assigned_customer_id;
  if (user.customer_id && carrierId && user.customer_id === carrierId) return true;
  if (load.booked_by_user_id === user.id) return true;
  return false;
}

function assertDeliveredBrokerLoad(load) {
  if (load.status !== 'delivered') throw new Error('Load must be delivered before updating carrier payment');
  if (!load.carrier_payment_terms) throw new Error('This load has no carrier payment terms');
  if (!load.booked_by_customer_id && !load.assigned_customer_id) {
    throw new Error('No carrier assigned on this load');
  }
}

export function markCarrierPaymentSent(user, { loadId, notes }) {
  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');
  if (!isLoadPoster(user, load)) throw new Error('Only the load poster can mark payment sent');
  assertDeliveredBrokerLoad(load);
  if (load.carrier_payment_status === 'paid') throw new Error('Payment already confirmed by carrier');

  const updated = updateEntity('Load', loadId, {
    carrier_payment_status: 'sent',
    carrier_payment_sent_at: nowIso(),
    carrier_payment_sent_notes: notes?.trim() || '',
    carrier_payment_sent_by: user.id,
  });
  return { success: true, load: updated };
}

export function confirmCarrierPaymentReceived(user, { loadId, notes }) {
  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');
  if (!isLoadCarrier(user, load)) throw new Error('Only the assigned carrier can confirm payment');
  assertDeliveredBrokerLoad(load);
  if (load.carrier_payment_status === 'paid') return { success: true, load, already: true };

  const updated = updateEntity('Load', loadId, {
    carrier_payment_status: 'paid',
    carrier_paid_at: nowIso(),
    carrier_paid_confirmed_by: user.id,
    carrier_payment_confirm_notes: notes?.trim() || '',
  });
  return { success: true, load: updated };
}

export function reportCarrierPaymentMissing(user, { loadId, notes }) {
  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');
  if (!isLoadCarrier(user, load)) throw new Error('Only the assigned carrier can report missing payment');
  assertDeliveredBrokerLoad(load);
  if (load.carrier_payment_status === 'paid') throw new Error('Payment already confirmed');

  const updated = updateEntity('Load', loadId, {
    carrier_payment_status: 'disputed',
    carrier_payment_disputed_at: nowIso(),
    carrier_payment_dispute_notes: notes?.trim() || 'Carrier reported payment not received',
    carrier_payment_disputed_by: user.id,
  });

  notifySltCarrierPaymentIssue(updated, 'disputed').catch((err) => {
    console.warn('[carrier-payments] SLT dispute alert failed', err.message);
  });

  return { success: true, load: updated };
}

export function resolveCarrierPaymentDispute(user, { loadId, resolution, notes }) {
  if (!isFleetCoInternal(user.role) && user.role !== 'fleet_manager') {
    throw new Error('SLT access required');
  }
  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');

  const status = resolution === 'paid' ? 'paid' : 'overdue';
  const patch = {
    carrier_payment_status: status,
    carrier_payment_resolved_at: nowIso(),
    carrier_payment_resolved_by: user.id,
    carrier_payment_resolution_notes: notes?.trim() || '',
  };
  if (status === 'paid') {
    patch.carrier_paid_at = nowIso();
    patch.carrier_paid_confirmed_by = user.id;
  }

  const updated = updateEntity('Load', loadId, patch);
  return { success: true, load: updated };
}

export function getSltPaymentAlertRecipients() {
  const extra = (process.env.SLT_PAYMENT_ALERT_EMAILS || process.env.SLT_MARKETING_REPORT_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const fromUsers = listUsers()
    .filter((u) => ['owner', 'executive', 'fleet_manager'].includes(u.role) && u.email)
    .map((u) => u.email);
  const fallback = process.env.SLT_INBOX || 'support@fleetcomanagement.org';
  return [...new Set([...fromUsers, ...extra, fallback])];
}

function customerLabel(customers, id) {
  if (!id) return '—';
  const c = customers.find((x) => x.id === id);
  return c?.company_name || c?.contact_name || id.slice(0, 8);
}

function userLabel(users, id) {
  if (!id) return '—';
  return users.find((u) => u.id === id)?.full_name || users.find((u) => u.id === id)?.email || '—';
}

export async function notifySltCarrierPaymentIssue(load, reason = 'overdue') {
  const customers = listEntities('Customer');
  const users = listEntities('User');
  const recipients = getSltPaymentAlertRecipients();
  if (!recipients.length) return { sent: false, reason: 'no_recipients' };

  const broker = customerLabel(customers, load.customer_id);
  const carrier = customerLabel(customers, load.booked_by_customer_id || load.assigned_customer_id);
  const terms = paymentTermsLabel(load.carrier_payment_terms);
  const due = load.carrier_payment_due_at
    ? new Date(load.carrier_payment_due_at).toLocaleDateString('en-US', { dateStyle: 'medium' })
    : '—';
  const amount = Number(load.carrier_payout_amount ?? load.rate) || 0;

  const subject = reason === 'disputed'
    ? `[FleetCo SLT] Carrier payment dispute — Load #${load.load_number}`
    : `[FleetCo SLT] Overdue carrier payment — Load #${load.load_number}`;

  const headline = reason === 'disputed'
    ? 'A carrier reported they have not received payment on agreed terms.'
    : 'A broker has not paid the carrier by the agreed payment terms.';

  const html = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto">
      <h2 style="color:#b45309">Carrier payment — SLT action needed</h2>
      <p>${headline}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#64748b">Load</td><td><strong>#${load.load_number}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Route</td><td>${load.origin || '—'} → ${load.destination || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Broker / poster</td><td>${broker}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Carrier</td><td>${carrier}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Payment terms</td><td>${terms}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Due date</td><td>${due}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Amount owed</td><td><strong>$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Status</td><td>${load.carrier_payment_status || '—'}</td></tr>
        ${load.carrier_payment_dispute_notes ? `<tr><td style="padding:6px 0;color:#64748b">Carrier note</td><td>${load.carrier_payment_dispute_notes}</td></tr>` : ''}
      </table>
      <p><a href="${APP_URL}/portal/load-marketplace" style="background:#f59e0b;color:#0f172a;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Open Load Marketplace (SLT)</a></p>
      <p style="color:#94a3b8;font-size:12px">Poster contact: ${userLabel(users, load.posted_by_user_id)} · Booked by: ${userLabel(users, load.booked_by_user_id)}</p>
    </div>
  `;

  const text = [
    headline,
    `Load #${load.load_number}: ${load.origin} → ${load.destination}`,
    `Broker: ${broker} · Carrier: ${carrier}`,
    `Terms: ${terms} · Due: ${due} · Amount: $${amount.toFixed(2)}`,
    `Status: ${load.carrier_payment_status}`,
    load.carrier_payment_dispute_notes ? `Note: ${load.carrier_payment_dispute_notes}` : '',
    `${APP_URL}/portal/load-marketplace`,
  ].filter(Boolean).join('\n');

  const result = await sendEmail({ to: recipients, subject, html, text });
  return { sent: true, result, recipients };
}

export function checkOverdueCarrierPayments() {
  const now = Date.now();
  const loads = filterEntities('Load', { status: 'delivered' });
  let flagged = 0;

  for (const load of loads) {
    if (!load.carrier_payment_terms) continue;
    if (!load.carrier_payment_due_at) continue;
    if (load.carrier_payment_status === 'paid') continue;
    if (new Date(load.carrier_payment_due_at).getTime() > now) continue;
    if (!['pending', 'sent', 'overdue'].includes(load.carrier_payment_status || 'pending')) continue;
    if (load.carrier_payment_slt_notified_at && load.carrier_payment_status === 'overdue') continue;

    const wasPending = load.carrier_payment_status !== 'overdue';
    updateEntity('Load', load.id, {
      carrier_payment_status: 'overdue',
      carrier_payment_overdue_at: load.carrier_payment_overdue_at || nowIso(),
    });

    if (!load.carrier_payment_slt_notified_at) {
      updateEntity('Load', load.id, { carrier_payment_slt_notified_at: nowIso() });
      notifySltCarrierPaymentIssue({ ...load, carrier_payment_status: 'overdue' }, 'overdue').catch((err) => {
        console.warn('[carrier-payments] overdue SLT alert failed', load.id, err.message);
      });
      flagged += 1;
    } else if (wasPending) {
      flagged += 1;
    }
  }

  return { checked: loads.length, flagged };
}

let schedulerTimer = null;

export function startCarrierPaymentScheduler() {
  if (process.env.CARRIER_PAYMENT_SCHEDULER_DISABLED === 'true') return;
  if (schedulerTimer) return;

  const tick = () => {
    try {
      const overdue = checkOverdueCarrierPayments();
      const reminders = checkPaymentReminders();
      if (overdue.flagged > 0) {
        console.log(`[carrier-payments] flagged ${overdue.flagged} overdue load(s) for SLT`);
      }
      if (reminders.sent > 0) {
        console.log(`[carrier-payments] sent ${reminders.sent} payment reminder(s) to brokers`);
      }
    } catch (err) {
      console.warn('[carrier-payments] scheduler tick failed', err.message);
    }
  };

  tick();
  schedulerTimer = setInterval(tick, TICK_MS);
  console.log('[carrier-payments] overdue payment scheduler started');
}

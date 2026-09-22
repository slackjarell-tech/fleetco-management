/**
 * In-app marketing notifications and outbox (replaces email when no Resend key).
 */
import { createEntity, getEntity, listEntities, nowIso, updateEntity } from './db.js';

const SLT_ROLES = ['owner', 'executive', 'fleet_manager'];

export function notifySltMarketing({ subject, body, inquiryId, category = 'marketing' }) {
  const msg = createEntity('Message', {
    subject: subject || 'Marketing update',
    body: body || '',
    from_user: 'Marketing Autopilot',
    to_role: 'slt_marketing',
    category,
    inquiry_id: inquiryId || '',
    read: false,
    created_date: nowIso(),
  });

  createEntity('MarketingActivityLog', {
    action: 'in_app_notify',
    inquiry_id: inquiryId || '',
    actor_email: 'autopilot@fleetco',
    details: JSON.stringify({ subject, message_id: msg.id }),
    created_at: nowIso(),
  });

  return msg;
}

export function queueMarketingOutbox({
  type = 'nurture',
  inquiry_id,
  to_email,
  subject,
  body_text,
  body_html,
  nurture_step,
  lead_name,
}) {
  const item = createEntity('MarketingOutbox', {
    type,
    inquiry_id: inquiry_id || '',
    to_email: to_email || '',
    lead_name: lead_name || '',
    subject: subject || '',
    body_text: body_text || '',
    body_html: body_html || '',
    nurture_step: nurture_step ?? null,
    status: 'pending',
    created_at: nowIso(),
    due_at: nowIso(),
  });

  createEntity('MarketingActivityLog', {
    action: 'outbox_queued',
    inquiry_id: inquiry_id || '',
    actor_email: 'autopilot@fleetco',
    details: JSON.stringify({ outbox_id: item.id, type, step: nurture_step }),
    created_at: nowIso(),
  });

  return item;
}

export function listMarketingOutbox({ status = 'pending', limit = 50 } = {}) {
  let items = listEntities('MarketingOutbox', '-created_at', limit * 2);
  if (status) items = items.filter((i) => i.status === status);
  return items.slice(0, limit);
}

export function markOutboxSent(outboxId, userEmail) {
  const item = getEntity('MarketingOutbox', outboxId);
  if (!item) throw new Error('Outbox item not found');
  return updateEntity('MarketingOutbox', outboxId, {
    status: 'sent_manual',
    sent_at: nowIso(),
    sent_by: userEmail || '',
  });
}

export function dismissOutbox(outboxId, userEmail) {
  const item = getEntity('MarketingOutbox', outboxId);
  if (!item) throw new Error('Outbox item not found');
  return updateEntity('MarketingOutbox', outboxId, {
    status: 'dismissed',
    sent_at: nowIso(),
    sent_by: userEmail || '',
  });
}

export function notifyNewLead(inquiry) {
  const lines = [
    `New lead: ${inquiry.name}`,
    inquiry.email,
    inquiry.company ? `Company: ${inquiry.company}` : null,
    inquiry.fleet_size ? `Fleet: ${inquiry.fleet_size}` : null,
    inquiry.source === 'marketing_ai' ? 'Source: Website AI chat' : `Source: ${inquiry.source || 'contact form'}`,
    '',
    inquiry.message?.slice(0, 500) || '',
    '',
    'Open FleetCo Marketing AI → list interested leads',
  ].filter(Boolean).join('\n');

  return notifySltMarketing({
    subject: `New lead — ${inquiry.name}`,
    body: lines,
    inquiryId: inquiry.id,
    category: 'new_lead',
  });
}

export function saveDailyDigest({ reportDate, text, html, counts }) {
  const digest = createEntity('MarketingDailyDigest', {
    report_date: reportDate,
    body_text: text,
    body_html: html,
    interested_count: counts?.interested ?? 0,
    new_today_count: counts?.newToday ?? 0,
    created_at: nowIso(),
  });

  notifySltMarketing({
    subject: `Daily lead digest — ${reportDate} (${counts?.interested ?? 0} interested)`,
    body: text.slice(0, 2000),
    category: 'daily_digest',
  });

  return digest;
}

export function getLatestDailyDigest() {
  return listEntities('MarketingDailyDigest', '-created_at', 1)[0] || null;
}

export function countUnreadMarketingMessages(user) {
  if (!user || !SLT_ROLES.includes(user.role)) return 0;
  return listEntities('Message', '-created_date', 200)
    .filter((m) => (m.to_role === 'slt_marketing' || m.category === 'marketing') && !m.read).length;
}

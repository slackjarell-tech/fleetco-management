import {
  createEntity,
  filterEntities,
  getEntity,
  listEntities,
  listUsers,
  nowIso,
  updateEntity,
} from './db.js';
import { sendEmail } from './email.js';

export const SLT_MARKETING_ROLES = new Set(['owner', 'executive', 'fleet_manager']);

export const LEAD_STATUSES = [
  'new',
  'interested',
  'contacted',
  'call_scheduled',
  'qualified',
  'won',
  'lost',
];

const INTEREST_KEYWORDS = /interested|demo|quote|pricing|fleet|consult|call|schedule|learn more/i;

export function assertSltMarketingAccess(user) {
  if (!user || !SLT_MARKETING_ROLES.has(user.role)) {
    throw new Error('SLT access required (owner, executive, or fleet manager)');
  }
}

export function defaultCalendarUrl() {
  return process.env.SLT_SALES_CALENDAR_URL || 'https://fleetcomanagement.org/contact';
}

export function getSocialConfigStatus() {
  return {
    facebook: !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
    linkedin: !!process.env.LINKEDIN_ACCESS_TOKEN,
    instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    x: !!(process.env.X_API_KEY && process.env.X_API_SECRET),
  };
}

function enrichInquiryLead(inquiry) {
  let lead_status = inquiry.lead_status || inquiry.status || 'new';
  if (lead_status === 'new' && INTEREST_KEYWORDS.test(inquiry.message || '')) {
    lead_status = 'interested';
  }
  if (inquiry.status === 'contacted' && lead_status === 'new') {
    lead_status = 'contacted';
  }
  return {
    ...inquiry,
    lead_status,
    interest_score: inquiry.interest_score ?? (lead_status === 'interested' ? 70 : lead_status === 'qualified' ? 90 : 40),
  };
}

export function syncInquiryLeadFields() {
  const inquiries = listEntities('Inquiry');
  let updated = 0;
  for (const inq of inquiries) {
    const enriched = enrichInquiryLead(inq);
    const patch = {};
    if (!inq.lead_status && enriched.lead_status) patch.lead_status = enriched.lead_status;
    if (inq.lead_status !== enriched.lead_status && enriched.lead_status !== 'new') {
      patch.lead_status = enriched.lead_status;
    }
    if (Object.keys(patch).length) {
      updateEntity('Inquiry', inq.id, patch);
      updated += 1;
    }
  }
  return updated;
}

export function listMarketingLeads({ status, limit = 50 } = {}) {
  syncInquiryLeadFields();
  let items = listEntities('Inquiry', '-updated_date', limit);
  items = items.map(enrichInquiryLead);
  if (status) {
    items = items.filter((l) => l.lead_status === status);
  }
  return items;
}

export function updateMarketingLead(user, { inquiryId, lead_status, notes, assigned_to }) {
  assertSltMarketingAccess(user);
  const inquiry = getEntity('Inquiry', inquiryId);
  if (!inquiry) throw new Error('Lead not found');

  const patch = {};
  if (lead_status) {
    if (!LEAD_STATUSES.includes(lead_status)) throw new Error(`Invalid lead_status. Use: ${LEAD_STATUSES.join(', ')}`);
    patch.lead_status = lead_status;
    if (lead_status === 'contacted') patch.status = 'contacted';
  }
  if (notes !== undefined) patch.lead_notes = notes;
  if (assigned_to !== undefined) patch.assigned_to = assigned_to;

  const updated = updateEntity('Inquiry', inquiryId, patch);
  createEntity('MarketingActivityLog', {
    action: 'update_lead',
    inquiry_id: inquiryId,
    actor_email: user.email,
    details: JSON.stringify(patch),
    created_at: nowIso(),
  });
  return enrichInquiryLead(updated);
}

export function queueSocialPost(user, { platform, content, scheduled_at, auto_publish = false }) {
  assertSltMarketingAccess(user);
  if (!platform || !content?.trim()) throw new Error('platform and content are required');
  const allowed = ['facebook', 'linkedin', 'instagram', 'x'];
  if (!allowed.includes(platform)) throw new Error(`platform must be one of: ${allowed.join(', ')}`);

  const post = createEntity('MarketingSocialPost', {
    platform,
    content: content.trim(),
    status: auto_publish ? 'approved' : 'draft',
    scheduled_at: scheduled_at || '',
    created_by: user.email,
    created_at: nowIso(),
    published_at: '',
    external_id: '',
    error: '',
  });

  createEntity('MarketingActivityLog', {
    action: 'queue_social',
    inquiry_id: '',
    actor_email: user.email,
    details: JSON.stringify({ post_id: post.id, platform }),
    created_at: nowIso(),
  });

  return post;
}

async function publishToFacebook(content) {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) {
    return { success: false, mode: 'manual', reason: 'Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN to auto-post' };
  }
  const url = `https://graph.facebook.com/v21.0/${pageId}/feed`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: content, access_token: token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, mode: 'api', error: data.error?.message || res.statusText };
  }
  return { success: true, mode: 'api', external_id: data.id || '' };
}

export async function approveSocialPost(user, { postId, publishNow = true }) {
  assertSltMarketingAccess(user);
  const post = getEntity('MarketingSocialPost', postId);
  if (!post) throw new Error('Social post not found');

  updateEntity('MarketingSocialPost', postId, {
    status: 'approved',
    approved_by: user.email,
    approved_at: nowIso(),
  });

  if (!publishNow) {
    return { success: true, post: getEntity('MarketingSocialPost', postId), published: false };
  }

  let publishResult = { success: false, mode: 'manual', reason: 'Platform not connected' };
  if (post.platform === 'facebook') {
    publishResult = await publishToFacebook(post.content);
  } else {
    publishResult = {
      success: false,
      mode: 'manual',
      reason: `Auto-post for ${post.platform} is not configured — copy is ready for manual publish`,
    };
  }

  const ts = nowIso();
  if (publishResult.success) {
    updateEntity('MarketingSocialPost', postId, {
      status: 'posted',
      published_at: ts,
      external_id: publishResult.external_id || '',
      error: '',
    });
  } else if (publishResult.mode === 'manual') {
    updateEntity('MarketingSocialPost', postId, {
      status: 'manual',
      error: publishResult.reason || '',
    });
  } else {
    updateEntity('MarketingSocialPost', postId, {
      status: 'failed',
      error: publishResult.error || 'Publish failed',
    });
  }

  return {
    success: true,
    post: getEntity('MarketingSocialPost', postId),
    publishResult,
  };
}

export function scheduleSalesCall(user, body) {
  assertSltMarketingAccess(user);
  const {
    inquiry_id,
    lead_name,
    lead_email,
    scheduled_at,
    meeting_link,
    notes,
  } = body;

  if (!scheduled_at) throw new Error('scheduled_at is required (ISO datetime)');
  if (!inquiry_id && (!lead_name || !lead_email)) {
    throw new Error('Provide inquiry_id or lead_name + lead_email');
  }

  let name = lead_name;
  let email = lead_email;
  if (inquiry_id) {
    const inq = getEntity('Inquiry', inquiry_id);
    if (!inq) throw new Error('Inquiry not found');
    name = name || inq.name;
    email = email || inq.email;
    updateEntity('Inquiry', inquiry_id, { lead_status: 'call_scheduled' });
  }

  const call = createEntity('MarketingScheduledCall', {
    inquiry_id: inquiry_id || '',
    lead_name: name,
    lead_email: email,
    scheduled_at,
    meeting_link: meeting_link || defaultCalendarUrl(),
    notes: notes || '',
    status: 'scheduled',
    created_by: user.email,
    created_at: nowIso(),
  });

  createEntity('MarketingActivityLog', {
    action: 'schedule_call',
    inquiry_id: inquiry_id || '',
    actor_email: user.email,
    details: JSON.stringify({ call_id: call.id, scheduled_at }),
    created_at: nowIso(),
  });

  return call;
}

export async function sendLeadEmail(user, { inquiry_id, to, subject, html, text }) {
  assertSltMarketingAccess(user);
  let recipient = to;
  let inquiry = null;
  if (inquiry_id) {
    inquiry = getEntity('Inquiry', inquiry_id);
    if (!inquiry) throw new Error('Inquiry not found');
    recipient = recipient || inquiry.email;
  }
  if (!recipient) throw new Error('Recipient email required');
  if (!subject) throw new Error('subject is required');

  const calendarUrl = defaultCalendarUrl();
  const bodyText =
    text ||
    [
      `Hi ${inquiry?.name || 'there'},`,
      '',
      'Thank you for your interest in FleetCo Management.',
      '',
      `Schedule a call with our team: ${calendarUrl}`,
      '',
      '— FleetCo SLT',
    ].join('\n');

  const bodyHtml =
    html ||
    `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px"><p>${bodyText.replace(/\n/g, '<br/>')}</p></div>`;

  const result = await sendEmail({
    to: recipient,
    subject,
    html: bodyHtml,
    text: bodyText,
  });

  if (inquiry_id && result.success) {
    updateEntity('Inquiry', inquiry_id, { lead_status: 'contacted', status: 'contacted' });
  }

  createEntity('MarketingActivityLog', {
    action: 'send_email',
    inquiry_id: inquiry_id || '',
    actor_email: user.email,
    details: JSON.stringify({ to: recipient, subject, emailSent: !!result.success }),
    created_at: nowIso(),
  });

  return { ...result, to: recipient };
}

export function getMarketingDashboard(user) {
  assertSltMarketingAccess(user);
  syncInquiryLeadFields();

  const leads = listMarketingLeads({ limit: 200 });
  const interested = leads.filter((l) =>
    ['interested', 'contacted', 'call_scheduled', 'qualified'].includes(l.lead_status),
  );
  const newLeads = leads.filter((l) => l.lead_status === 'new');
  const aiLeads = leads.filter((l) => l.source === 'marketing_ai');
  const socialQueue = listEntities('MarketingSocialPost', '-created_at', 30);
  const upcomingCalls = filterEntities('MarketingScheduledCall', { status: 'scheduled' })
    .sort((a, b) => (a.scheduled_at || '').localeCompare(b.scheduled_at || ''))
    .slice(0, 20);
  const recentActivity = listEntities('MarketingActivityLog', '-created_at', 25);

  const todayChicago = chicagoDateKey(new Date());
  const reportSentToday = filterEntities('MarketingReportRun', { report_date: todayChicago }, null, 1)[0];

  return {
    success: true,
    summary: {
      total_leads: leads.length,
      interested_count: interested.length,
      new_count: newLeads.length,
      marketing_ai_leads: aiLeads.length,
      social_draft: socialQueue.filter((p) => p.status === 'draft').length,
      social_scheduled: socialQueue.filter((p) => ['approved', 'manual'].includes(p.status)).length,
      upcoming_calls: upcomingCalls.length,
    },
    interested_leads: interested.slice(0, 50),
    new_leads: newLeads.slice(0, 20),
    social_queue: socialQueue,
    upcoming_calls: upcomingCalls,
    recent_activity: recentActivity,
    social_config: getSocialConfigStatus(),
    daily_report: {
      timezone: 'America/Chicago',
      send_time: '15:00',
      report_sent_today: !!reportSentToday,
      last_run: reportSentToday || null,
    },
    calendar_url: defaultCalendarUrl(),
  };
}

export function getSltReportRecipients() {
  const extra = (process.env.SLT_MARKETING_REPORT_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const fromUsers = listUsers()
    .filter((u) => SLT_MARKETING_ROLES.has(u.role) && u.email)
    .map((u) => u.email);
  return [...new Set([...fromUsers, ...extra])];
}

function chicagoDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return parts;
}

function chicagoTimeParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = {};
  fmt.formatToParts(date).forEach((p) => {
    if (p.type !== 'literal') parts[p.type] = p.value;
  });
  return parts;
}

export function buildDailyLeadReportContent() {
  syncInquiryLeadFields();
  const leads = listMarketingLeads({ limit: 500 });
  const interested = leads.filter((l) =>
    ['interested', 'contacted', 'call_scheduled', 'qualified'].includes(l.lead_status),
  );
  const newToday = leads.filter((l) => {
    const created = (l.created_date || l.created_at || '').slice(0, 10);
    return created === chicagoDateKey(new Date()) && l.lead_status !== 'lost';
  });
  const calls = filterEntities('MarketingScheduledCall', { status: 'scheduled' })
    .filter((c) => (c.scheduled_at || '').slice(0, 10) >= chicagoDateKey(new Date()))
    .slice(0, 15);

  const lines = [
    'FleetCo SLT — Daily lead report (3:00 PM CST)',
    `Date: ${chicagoDateKey(new Date())}`,
    '',
    `Interested / active pipeline: ${interested.length}`,
    `New leads today: ${newToday.length}`,
    `Upcoming scheduled calls: ${calls.length}`,
    '',
    '— Interested leads —',
  ];

  if (!interested.length) {
    lines.push('(none flagged interested yet)');
  } else {
    for (const l of interested.slice(0, 40)) {
      lines.push(`• ${l.name} <${l.email}> — ${l.lead_status} — ${(l.message || '').slice(0, 120)}`);
    }
  }

  if (newToday.length) {
    lines.push('', '— New today —');
    for (const l of newToday) {
      lines.push(`• ${l.name} <${l.email}> — ${l.lead_status}`);
    }
  }

  if (calls.length) {
    lines.push('', '— Upcoming calls —');
    for (const c of calls) {
      lines.push(`• ${c.lead_name} — ${c.scheduled_at} — ${c.meeting_link || defaultCalendarUrl()}`);
    }
  }

  lines.push('', `Portal: ${process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org'}/portal/slt-marketing`);

  const text = lines.join('\n');
  const html = `<pre style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.5">${text.replace(/</g, '&lt;')}</pre>`;
  return { text, html, counts: { interested: interested.length, newToday: newToday.length, calls: calls.length } };
}

export async function runDailyLeadReport({ force = false } = {}) {
  const reportDate = chicagoDateKey(new Date());
  const existing = filterEntities('MarketingReportRun', { report_date: reportDate }, null, 1)[0];
  if (existing && !force) {
    return { success: true, skipped: true, reason: 'Report already sent today', report_date: reportDate };
  }

  const recipients = getSltReportRecipients();
  if (!recipients.length) {
    return { success: false, error: 'No SLT report recipients (configure owner/executive/fleet_manager users or SLT_MARKETING_REPORT_EMAILS)' };
  }

  const { text, html, counts } = buildDailyLeadReportContent();
  const subject = `FleetCo SLT lead report — ${reportDate} (${counts.interested} interested)`;

  const emailResult = await sendEmail({
    to: recipients,
    subject,
    html,
    text,
  });

  const run = createEntity('MarketingReportRun', {
    report_date: reportDate,
    sent_at: nowIso(),
    recipient_count: recipients.length,
    interested_count: counts.interested,
    email_success: !!emailResult.success,
    error: emailResult.error || '',
  });

  console.log('[slt-marketing] daily report', reportDate, recipients.length, emailResult.success ? 'sent' : 'failed');

  return {
    success: !!emailResult.success,
    skipped: false,
    report_date: reportDate,
    recipients,
    counts,
    emailResult,
    run,
  };
}

export function shouldRunDailyReportNow(date = new Date()) {
  const { hour, minute } = chicagoTimeParts(date);
  const h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  return h === 15 && m === 0;
}

export function startSltMarketingScheduler() {
  const tick = async () => {
    try {
      if (!shouldRunDailyReportNow()) return;
      await runDailyLeadReport();
    } catch (err) {
      console.error('[slt-marketing scheduler]', err.message);
    }
  };
  setInterval(tick, 60_000);
  console.log('[slt-marketing] Daily lead report scheduled for 3:00 PM America/Chicago');
}

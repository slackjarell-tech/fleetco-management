/**
 * FleetCo Marketing Autopilot — local-first lead nurture, social drafts, SLT alerts.
 * No HubSpot/Apollo/API keys: in-app notifications + outbox copy for manual send.
 * Optional email/LLM when MARKETING_LOCAL_ONLY=false and keys are set.
 */
import {
  createEntity,
  filterEntities,
  getEntity,
  listEntities,
  nowIso,
  updateEntity,
} from './db.js';
import { sendEmail } from './email.js';
import { getResendApiKey } from './email.js';
import { NURTURE_SEQUENCE } from './marketingEmailTemplates.js';
import { pickSocialTemplate } from './marketingKnowledge.js';
import {
  approveSocialPost,
  defaultCalendarUrl,
  syncInquiryLeadFields,
} from './sltMarketing.js';
import { isLocalMarketingMode } from './marketingLocalMode.js';
import {
  notifyNewLead,
  queueMarketingOutbox,
} from './marketingInApp.js';
import { sendInquiryNotificationEmail } from './inquiryEmails.js';

const APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';
const TICK_MS = 15 * 60 * 1000;

export function isAutopilotEnabled() {
  return process.env.MARKETING_AUTOPILOT_DISABLED !== 'true';
}

function hoursSince(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

function shouldSkipLead(lead) {
  if (lead.autopilot_paused) return true;
  if (['won', 'lost', 'qualified'].includes(lead.lead_status)) return true;
  if (!lead.email?.includes('@')) return true;
  return false;
}

function nextNurtureStep(lead) {
  const current = lead.nurture_step || 0;
  const next = NURTURE_SEQUENCE.find((s) => s.step === current + 1);
  if (!next) return null;
  const anchor = lead.last_nurture_at || lead.created_date || lead.captured_at;
  if (hoursSince(anchor) < next.delayHours) return null;
  return next;
}

async function deliverNurtureStep(lead, stepConfig) {
  const { text, html } = stepConfig.build(lead);
  const subject = typeof stepConfig.subject === 'function'
    ? stepConfig.subject(lead)
    : stepConfig.subject;

  const local = isLocalMarketingMode() || !getResendApiKey();

  if (local) {
    const outbox = queueMarketingOutbox({
      type: 'nurture',
      inquiry_id: lead.id,
      to_email: lead.email,
      lead_name: lead.name,
      subject,
      body_text: text,
      body_html: html,
      nurture_step: stepConfig.step,
    });
    return { success: true, mode: 'outbox', outbox_id: outbox.id, subject, step: stepConfig.step };
  }

  const result = await sendEmail({
    to: lead.email,
    subject,
    html,
    text,
    replyTo: 'support@fleetcomanagement.org',
  });

  if (!result.success) {
    const outbox = queueMarketingOutbox({
      type: 'nurture',
      inquiry_id: lead.id,
      to_email: lead.email,
      lead_name: lead.name,
      subject,
      body_text: text,
      body_html: html,
      nurture_step: stepConfig.step,
    });
    return { success: true, mode: 'outbox_fallback', outbox_id: outbox.id, subject, step: stepConfig.step, emailError: result.error };
  }

  return { ...result, mode: 'email', subject, step: stepConfig.step };
}

export async function enrollLeadInAutopilot(inquiryId) {
  if (!isAutopilotEnabled()) return { enrolled: false, reason: 'disabled' };

  const inquiry = getEntity('Inquiry', inquiryId);
  if (!inquiry) return { enrolled: false, reason: 'not_found' };

  const patch = {
    lead_status: inquiry.lead_status || 'interested',
    nurture_step: inquiry.nurture_step || 0,
    autopilot_enrolled_at: inquiry.autopilot_enrolled_at || nowIso(),
  };
  if (!inquiry.lead_status || inquiry.lead_status === 'new') {
    patch.lead_status = 'interested';
  }
  updateEntity('Inquiry', inquiryId, patch);

  createEntity('MarketingActivityLog', {
    action: 'autopilot_enroll',
    inquiry_id: inquiryId,
    actor_email: 'autopilot@fleetco',
    details: JSON.stringify({ lead_status: patch.lead_status }),
    created_at: nowIso(),
  });

  const tickResult = await processLeadNurture(getEntity('Inquiry', inquiryId));
  return { enrolled: true, inquiryId, tickResult };
}

async function processLeadNurture(lead) {
  if (shouldSkipLead(lead)) return { skipped: true };

  const step = nextNurtureStep(lead);
  if (!step) return { skipped: true, reason: 'not_due' };

  const delivery = await deliverNurtureStep(lead, step);

  const patch = {
    nurture_step: step.step,
    last_nurture_at: nowIso(),
    lead_status: lead.lead_status === 'new' ? 'contacted' : lead.lead_status,
  };
  if (step.step === 1 && delivery.success) {
    patch.status = 'contacted';
    patch.lead_status = 'contacted';
  }
  updateEntity('Inquiry', lead.id, patch);

  createEntity('MarketingActivityLog', {
    action: 'autopilot_nurture',
    inquiry_id: lead.id,
    actor_email: 'autopilot@fleetco',
    details: JSON.stringify({
      step: step.step,
      name: step.name,
      mode: delivery.mode,
      outbox_id: delivery.outbox_id || '',
    }),
    created_at: nowIso(),
  });

  return {
    leadId: lead.id,
    step: step.step,
    mode: delivery.mode,
    outboxQueued: delivery.mode?.includes('outbox'),
  };
}

async function processAllNurture() {
  syncInquiryLeadFields();
  const leads = listEntities('Inquiry', '-created_date', 500);
  const results = [];
  for (const lead of leads) {
    if (shouldSkipLead(lead)) continue;
    if (!lead.autopilot_enrolled_at && (lead.nurture_step || 0) === 0) {
      updateEntity('Inquiry', lead.id, {
        autopilot_enrolled_at: nowIso(),
        lead_status: lead.lead_status === 'new' ? 'interested' : lead.lead_status,
      });
    }
    const r = await processLeadNurture(getEntity('Inquiry', lead.id));
    if (r && !r.skipped) results.push(r);
  }
  return results;
}

const WEEKLY_SOCIAL_THEMES = [
  { platform: 'facebook', topic: 'FleetCo all-in-one portal for owner-operators and small fleets' },
  { platform: 'linkedin', topic: 'FleetCo Driver mobile app — dashcam, routes, fuel, payroll sync' },
  { platform: 'facebook', topic: 'Cut fleet admin time — maintenance, IFTA, and compliance in one place' },
];

function generateSocialCopy(platform, topic) {
  const base = pickSocialTemplate(platform);
  if (topic && topic.length > 20) {
    return `${topic}\n\n${APP_URL}\n\n#fleetmanagement #trucking #FleetCo`;
  }
  return base;
}

function weekId(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

async function runWeeklySocialDrafts() {
  const key = weekId(new Date());
  const existing = listEntities('MarketingActivityLog', '-created_at', 50)
    .find((a) => a.action === 'autopilot_social_week' && String(a.details || '').includes(key));
  if (existing) return { skipped: true, reason: 'already_ran_this_week' };

  const posts = [];
  for (const theme of WEEKLY_SOCIAL_THEMES) {
    const content = generateSocialCopy(theme.platform, theme.topic);
    const post = createEntity('MarketingSocialPost', {
      platform: theme.platform,
      content,
      status: 'draft',
      source: 'autopilot',
      created_at: nowIso(),
      scheduled_at: nowIso(),
    });
    posts.push(post);
  }

  createEntity('MarketingActivityLog', {
    action: 'autopilot_social_week',
    inquiry_id: '',
    actor_email: 'autopilot@fleetco',
    details: JSON.stringify({ weekKey: key, count: posts.length }),
    created_at: nowIso(),
  });

  return { success: true, posts: posts.length, weekKey: key };
}

function isMondayMorningChicago(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  });
  const parts = {};
  fmt.formatToParts(date).forEach((p) => { if (p.type !== 'literal') parts[p.type] = p.value; });
  return parts.weekday === 'Mon' && parseInt(parts.hour, 10) === 9;
}

async function processScheduledSocialPosts() {
  if (isLocalMarketingMode()) return [];
  const now = nowIso();
  const due = listEntities('MarketingSocialPost', '-created_at', 100)
    .filter((p) => p.status === 'approved' && p.scheduled_at && p.scheduled_at <= now);
  const results = [];
  for (const post of due.slice(0, 5)) {
    try {
      const r = await approveSocialPost(
        { email: 'autopilot@fleetco', role: 'owner' },
        { postId: post.id, publishNow: true },
      );
      results.push({ post_id: post.id, published: r.publishResult?.success });
    } catch (err) {
      results.push({ post_id: post.id, error: err.message });
    }
  }
  return results;
}

export async function runAutopilotTick() {
  if (!isAutopilotEnabled()) {
    return { success: true, skipped: true, reason: 'autopilot_disabled' };
  }

  const started = nowIso();
  const nurtureResults = await processAllNurture();
  const scheduledPosts = await processScheduledSocialPosts();

  let socialResult = { skipped: true };
  if (isMondayMorningChicago()) {
    socialResult = await runWeeklySocialDrafts();
  }

  const run = createEntity('MarketingAutopilotRun', {
    started_at: started,
    finished_at: nowIso(),
    nurture_count: nurtureResults.length,
    social: socialResult.skipped ? 'skipped' : 'drafted',
    nurture_details: JSON.stringify(nurtureResults.slice(0, 20)),
  });

  return {
    success: true,
    run,
    nurture: nurtureResults,
    social: socialResult,
    scheduled_posts: scheduledPosts,
  };
}

export function getAutopilotStatus() {
  syncInquiryLeadFields();
  const leads = listEntities('Inquiry', '-created_date', 500);
  const enrolled = leads.filter((l) => l.autopilot_enrolled_at);
  const dueNow = leads.filter((l) => !shouldSkipLead(l) && nextNurtureStep(l));
  const lastRun = listEntities('MarketingAutopilotRun', '-started_at', 1)[0];
  const recentActivity = listEntities('MarketingActivityLog', '-created_at', 15)
    .filter((a) => (a.actor_email || '').includes('autopilot'));
  const pendingOutbox = listEntities('MarketingOutbox', '-created_at', 200)
    .filter((o) => o.status === 'pending');

  return {
    enabled: isAutopilotEnabled(),
    local_mode: isLocalMarketingMode(),
    enrolled_count: enrolled.length,
    due_now: dueNow.length,
    outbox_pending: pendingOutbox.length,
    nurture_steps: NURTURE_SEQUENCE.map((s) => ({ step: s.step, name: s.name, delayHours: s.delayHours })),
    last_run: lastRun || null,
    recent_activity: recentActivity,
    calendar_url: defaultCalendarUrl(),
  };
}

export function startMarketingAutopilotScheduler() {
  const tick = async () => {
    try {
      const result = await runAutopilotTick();
      if (result.nurture?.length) {
        console.log('[marketing-autopilot] nurture processed:', result.nurture.length);
      }
    } catch (err) {
      console.error('[marketing-autopilot]', err.message);
    }
  };

  setTimeout(tick, 30_000);
  setInterval(tick, TICK_MS);
  console.log('[marketing-autopilot] Scheduler active (local-first) — nurture every 15m, social drafts Monday 9am CST');
}

export async function onNewLead(inquiry) {
  if (!inquiry?.id) return;

  if (isLocalMarketingMode() || !getResendApiKey()) {
    notifyNewLead(inquiry);
  } else {
    try {
      await sendInquiryNotificationEmail(inquiry);
    } catch { /* fallback in-app */ }
    notifyNewLead(inquiry);
  }

  return enrollLeadInAutopilot(inquiry.id);
}

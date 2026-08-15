/**
 * FleetCo Marketing Autopilot — autonomous lead nurture, social drafts, and SLT alerts.
 * No HubSpot/Apollo required: Groq (free) + Resend + our Inquiry store.
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
import { getAiStatus } from './aiProvider.js';
import { simpleLLM } from './aiAgent.js';
import { sendInquiryNotificationEmail } from './inquiryEmails.js';
import { NURTURE_SEQUENCE } from './marketingEmailTemplates.js';
import {
  defaultCalendarUrl,
  syncInquiryLeadFields,
} from './sltMarketing.js';

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

async function maybePersonalizeIntro(lead, templateText) {
  const status = getAiStatus();
  if (!status.configured || !status.healthy) return templateText;
  try {
    const result = await simpleLLM({
      prompt: `Write 2 short sentences to personalize a follow-up email for a trucking fleet prospect.
Name: ${lead.name}. Company: ${lead.company || 'unknown'}. Fleet size: ${lead.fleet_size || 'unknown'}.
Their message: ${(lead.message || '').slice(0, 300)}
Interest: ${lead.service_interest || 'fleet software'}
Be professional, no hype. Output ONLY the 2 sentences, no subject line.`,
    });
    const extra = result.content || result.description;
    if (extra && extra.length > 20 && extra.length < 500) {
      return `${extra}\n\n${templateText}`;
    }
  } catch {
    /* template only */
  }
  return templateText;
}

export async function sendNurtureEmail(lead, stepConfig) {
  const { text, html } = stepConfig.build(lead);
  let bodyText = text;
  if (stepConfig.step === 1) {
    bodyText = await maybePersonalizeIntro(lead, text);
  }
  const subject = typeof stepConfig.subject === 'function'
    ? stepConfig.subject(lead)
    : stepConfig.subject;

  let bodyHtml = html;
  if (stepConfig.step === 1 && bodyText !== text) {
    const intro = bodyText.split('\n\n')[0];
    bodyHtml = html.replace('</p>', `</p><p>${intro}</p>`, 1);
  }

  const result = await sendEmail({
    to: lead.email,
    subject,
    html: bodyHtml,
    text: bodyText,
    replyTo: 'support@fleetcomanagement.org',
  });

  return { ...result, subject, step: stepConfig.step };
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

  const emailResult = await sendNurtureEmail(lead, step);

  const patch = {
    nurture_step: step.step,
    last_nurture_at: nowIso(),
    lead_status: lead.lead_status === 'new' ? 'contacted' : lead.lead_status,
  };
  if (step.step === 1 && emailResult.success) {
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
      emailSent: !!emailResult.success,
      error: emailResult.error || emailResult.reason || '',
    }),
    created_at: nowIso(),
  });

  return { leadId: lead.id, step: step.step, emailSent: !!emailResult.success };
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

async function generateSocialCopy(topic) {
  const status = getAiStatus();
  const fallback = `${topic}\n\nLearn more: ${APP_URL}\n\n#fleetmanagement #trucking #FleetCo`;
  if (!status.configured || !status.healthy) return fallback;

  try {
    const result = await simpleLLM({
      prompt: `Write a short social media post (max 280 chars) for FleetCo Management, a B2B fleet SaaS for owner-operators.
Topic: ${topic}
Include fleetcomanagement.org. Professional tone. No hashtag spam — max 3 hashtags.`,
    });
    const text = (result.content || result.description || '').trim();
    if (text.length > 40) return text.slice(0, 500);
  } catch { /* fallback */ }
  return fallback;
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
    const content = await generateSocialCopy(theme.topic);
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

export async function runAutopilotTick() {
  if (!isAutopilotEnabled()) {
    return { success: true, skipped: true, reason: 'autopilot_disabled' };
  }

  const started = nowIso();
  const nurtureResults = await processAllNurture();

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

  return {
    enabled: isAutopilotEnabled(),
    enrolled_count: enrolled.length,
    due_now: dueNow.length,
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
        console.log('[marketing-autopilot] nurture emails sent:', result.nurture.length);
      }
    } catch (err) {
      console.error('[marketing-autopilot]', err.message);
    }
  };

  setTimeout(tick, 30_000);
  setInterval(tick, TICK_MS);
  console.log('[marketing-autopilot] Scheduler active — nurture every 15m, social drafts Monday 9am CST');
}

export async function onNewLead(inquiry) {
  if (!inquiry?.id) return;
  try {
    await sendInquiryNotificationEmail(inquiry);
  } catch { /* logged elsewhere */ }
  return enrollLeadInAutopilot(inquiry.id);
}

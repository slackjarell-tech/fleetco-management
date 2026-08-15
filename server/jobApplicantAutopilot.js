/**
 * Applicant email nurture — runs with marketing autopilot tick or standalone.
 */
import { createEntity, getEntity, listEntities, nowIso, updateEntity } from './db.js';
import { sendEmail } from './email.js';
import { APPLICANT_NURTURE_SEQUENCE, buildNewApplicantAlertHtml } from './jobApplicantEmails.js';

const TICK_MS = 15 * 60 * 1000;

function hoursSince(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

function shouldSkipApplicant(app) {
  if (app.autopilot_paused) return true;
  if (['hired', 'rejected', 'withdrawn'].includes(app.application_status)) return true;
  if (!app.email?.includes('@')) return true;
  return false;
}

function nextNurtureStep(app) {
  const current = app.nurture_step || 0;
  const next = APPLICANT_NURTURE_SEQUENCE.find((s) => s.step === current + 1);
  if (!next) return null;
  const anchor = app.last_nurture_at || app.created_at;
  if (hoursSince(anchor) < next.delayHours) return null;
  return next;
}

async function sendApplicantNurture(app, stepConfig, job, company) {
  const { text, html } = stepConfig.build(app, job, company);
  const subject = typeof stepConfig.subject === 'function'
    ? stepConfig.subject(app, job)
    : stepConfig.subject;

  return sendEmail({
    to: app.email,
    subject,
    html,
    text,
    replyTo: company?.email || company?.contact_email || 'support@fleetcomanagement.org',
  });
}

export async function notifyHiringTeam(application, job, company) {
  const to = job?.contact_email || company?.email || company?.contact_email || process.env.INQUIRY_TO || 'support@fleetcomanagement.org';
  return sendEmail({
    to,
    subject: `New applicant: ${application.name} — ${job?.title || 'Job posting'}`,
    html: buildNewApplicantAlertHtml(application, job, company),
    text: `${application.name} <${application.email}> applied for ${job?.title}. Review: ${process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org'}/portal/hiring`,
  });
}

export async function enrollApplicantInAutopilot(applicationId) {
  const app = getEntity('JobApplication', applicationId);
  if (!app) return { enrolled: false, reason: 'not_found' };

  if (!app.autopilot_enrolled_at) {
    updateEntity('JobApplication', applicationId, {
      autopilot_enrolled_at: nowIso(),
      application_status: app.application_status || 'new',
    });
  }

  const refreshed = getEntity('JobApplication', applicationId);
  const result = await processApplicantNurture(refreshed);
  return { enrolled: true, applicationId, tickResult: result };
}

async function processApplicantNurture(app) {
  if (shouldSkipApplicant(app)) return { skipped: true };

  const step = nextNurtureStep(app);
  if (!step) return { skipped: true, reason: 'not_due' };

  const job = getEntity('JobPosting', app.job_posting_id);
  const company = job?.customer_id ? getEntity('Customer', job.customer_id) : null;

  const emailResult = await sendApplicantNurture(app, step, job, company);

  updateEntity('JobApplication', app.id, {
    nurture_step: step.step,
    last_nurture_at: nowIso(),
    application_status: app.application_status === 'new' ? 'reviewed' : app.application_status,
  });

  createEntity('MarketingActivityLog', {
    action: 'job_applicant_nurture',
    inquiry_id: app.id,
    actor_email: 'job_autopilot@fleetco',
    details: JSON.stringify({
      step: step.step,
      job_posting_id: app.job_posting_id,
      emailSent: !!emailResult.success,
    }),
    created_at: nowIso(),
  });

  return { applicationId: app.id, step: step.step, emailSent: !!emailResult.success };
}

export async function runJobApplicantAutopilotTick() {
  if (process.env.JOB_AUTOPILOT_DISABLED === 'true') {
    return { success: true, skipped: true, reason: 'disabled' };
  }

  const apps = listEntities('JobApplication', '-created_at', 500);
  const results = [];
  for (const app of apps) {
    if (shouldSkipApplicant(app)) continue;
    if (!app.autopilot_enrolled_at) {
      updateEntity('JobApplication', app.id, { autopilot_enrolled_at: nowIso() });
    }
    const r = await processApplicantNurture(getEntity('JobApplication', app.id));
    if (r && !r.skipped) results.push(r);
  }
  return { success: true, nurture: results };
}

export function startJobApplicantAutopilotScheduler() {
  const tick = async () => {
    try {
      const result = await runJobApplicantAutopilotTick();
      if (result.nurture?.length) {
        console.log('[job-applicant-autopilot] emails sent:', result.nurture.length);
      }
    } catch (err) {
      console.error('[job-applicant-autopilot]', err.message);
    }
  };
  setTimeout(tick, 45_000);
  setInterval(tick, TICK_MS);
  console.log('[job-applicant-autopilot] Scheduler active — applicant nurture every 15m');
}

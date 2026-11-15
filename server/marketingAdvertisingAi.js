/**
 * Rule-based "Advertising AI" — runs 24/7 on the server with zero LLM/API cost.
 * Rotates ICP segments, drafts social posts, and queues outreach angles for SLT.
 */
import { createEntity, listEntities, nowIso } from './db.js';
import {
  buildOutreachAngleText,
  buildSegmentSocialCopy,
  listTargetCompanies,
  pickDailyTargetFocus,
  TARGET_SEGMENTS,
} from './marketingTargetCompanies.js';
import { notifySltMarketing } from './marketingInApp.js';

const PLATFORMS = ['linkedin', 'facebook', 'linkedin', 'x'];

function chicagoDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function dailyRunExists(dateKey) {
  return listEntities('MarketingActivityLog', '-created_at', 80).some(
    (a) => a.action === 'advertising_ai_daily' && String(a.details || '').includes(`"dateKey":"${dateKey}"`),
  );
}

export function getAdvertisingAiStatus() {
  const today = chicagoDateKey();
  const last = listEntities('MarketingActivityLog', '-created_at', 30)
    .find((a) => a.action === 'advertising_ai_daily');
  const companies = listTargetCompanies({ limit: 200 });
  return {
    mode: 'rule_based',
    cost: 'zero_api',
    runs_24_7: true,
    scheduler: 'marketing-autopilot every 15 minutes',
    target_segments: TARGET_SEGMENTS.length,
    target_examples: companies.length,
    ran_today: dailyRunExists(today),
    last_daily_run: last || null,
    today_focus: pickDailyTargetFocus(),
  };
}

/**
 * Once per Chicago calendar day: social draft + SLT outreach brief.
 */
export async function runDailyAdvertisingAi() {
  const dateKey = chicagoDateKey();
  if (dailyRunExists(dateKey)) {
    return { skipped: true, reason: 'already_ran_today', dateKey };
  }

  const { segment, example } = pickDailyTargetFocus();
  const platform = PLATFORMS[new Date().getDate() % PLATFORMS.length];
  const content = buildSegmentSocialCopy({ segment, example, platform });
  const outreach = buildOutreachAngleText({ segment, example });

  const post = createEntity('MarketingSocialPost', {
    platform,
    content,
    status: 'draft',
    source: 'advertising_ai',
    topic: `${segment.id}:${example.id}`,
    created_at: nowIso(),
    scheduled_at: nowIso(),
  });

  notifySltMarketing({
    subject: `Advertising AI — today’s ICP: ${example.name}`,
    body: outreach,
    category: 'advertising_ai',
  });

  createEntity('MarketingActivityLog', {
    action: 'advertising_ai_daily',
    inquiry_id: '',
    actor_email: 'advertising_ai@fleetco',
    details: JSON.stringify({
      dateKey,
      segment_id: segment.id,
      example_id: example.id,
      platform,
      social_post_id: post.id,
    }),
    created_at: nowIso(),
  });

  return {
    success: true,
    dateKey,
    segment: segment.label,
    example: example.name,
    platform,
    social_post_id: post.id,
  };
}

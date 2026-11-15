/**
 * Scheduled Jarvis briefings to owner/executive via portal Messages.
 */
import { createEntity, filterUsers, listEntities, nowIso } from './db.js';
import { buildExecutiveBriefing } from './revanBriefing.js';

function chicagoDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function chicagoHourMinute(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = {};
  fmt.formatToParts(date).forEach((p) => { if (p.type !== 'literal') parts[p.type] = p.value; });
  return { hour: parseInt(parts.hour, 10), minute: parseInt(parts.minute, 10) };
}

function briefingAlreadySent(dateKey, slot) {
  return listEntities('MarketingActivityLog', '-created_at', 40).some(
    (a) => a.action === 'revan_briefing' && String(a.details || '').includes(`"${dateKey}"`) && String(a.details || '').includes(`"${slot}"`),
  );
}

function executiveUsers() {
  return filterUsers({}).filter((u) => ['owner', 'executive'].includes(u.role) && u.status !== 'suspended');
}

export async function deliverRevanBriefing(slot, { force = false } = {}) {
  const dateKey = chicagoDateKey();
  if (!force && briefingAlreadySent(dateKey, slot)) {
    return { skipped: true, reason: 'already_sent', dateKey, slot };
  }

  const execs = executiveUsers();
  if (!execs.length) return { skipped: true, reason: 'no_executive_users' };

  const primary = execs[0];
  const { markdown, summary } = await buildExecutiveBriefing({ user: primary, slot });
  const subject = slot === 'morning'
    ? `Revan — Morning briefing (${dateKey})`
    : `Revan — Evening briefing (${dateKey})`;

  const messages = [];
  for (const exec of execs) {
    const msg = createEntity('Message', {
      subject,
      body: markdown,
      from_user: 'Revan',
      to_user_id: exec.id,
      to_role: '',
      category: 'revan_briefing',
      read: false,
      created_date: nowIso(),
    });
    messages.push(msg);
  }

  createEntity('MarketingActivityLog', {
    action: 'revan_briefing',
    inquiry_id: '',
    actor_email: 'revan@fleetco',
    details: JSON.stringify({ dateKey, slot, recipient_count: execs.length, summary: summary?.fleet }),
    created_at: nowIso(),
  });

  console.log(`[revan] ${slot} briefing sent to ${execs.length} executive(s)`);
  return { success: true, dateKey, slot, messages: messages.length };
}

function shouldRunSlot(slot) {
  const { hour, minute } = chicagoHourMinute();
  if (minute > 10) return false;
  if (slot === 'morning' && hour === 7) return true;
  if (slot === 'evening' && hour === 18) return true;
  return false;
}

export function startRevanScheduler() {
  if (process.env.REVAN_BRIEFINGS_DISABLED === 'true') {
    console.log('[revan] Executive briefings disabled (REVAN_BRIEFINGS_DISABLED)');
    return;
  }
  const tick = async () => {
    try {
      if (shouldRunSlot('morning')) await deliverRevanBriefing('morning');
      if (shouldRunSlot('evening')) await deliverRevanBriefing('evening');
    } catch (err) {
      console.error('[revan scheduler]', err.message);
    }
  };
  setInterval(tick, 60_000);
  setTimeout(tick, 45_000);
  console.log('[revan] Jarvis briefings scheduled — 7:00 AM & 6:00 PM America/Chicago → Messages');
}
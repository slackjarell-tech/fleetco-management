/**
 * Executive briefings for Revan — Jarvis-style status reports to owner/executive.
 */
import { filterEntities, filterUsers, getSiteSettings, listEntities } from './db.js';
import { getProductionReadiness } from './productionReadiness.js';
import { getAutopilotStatus } from './marketingAutopilot.js';
import { getAdvertisingAiStatus } from './marketingAdvertisingAi.js';
import { getMarketingDashboard } from './sltMarketing.js';
import { marketingFactsMarkdown } from './marketingKnowledge.js';
import { getEmailConfigStatus } from './email.js';
import { getAiStatus } from './aiProvider.js';

const APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';

function chicagoGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hour12: false }).format(new Date()),
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export async function buildExecutiveBriefing({ user, slot = 'manual' } = {}) {
  const readiness = await getProductionReadiness({ verifyAi: false });
  const down = (readiness.checks || []).filter((c) => !c.live);

  let marketing = null;
  try {
    marketing = getMarketingDashboard(user);
  } catch {
    marketing = null;
  }

  const autopilot = getAutopilotStatus();
  const adAi = getAdvertisingAiStatus();
  const site = getSiteSettings();
  const customers = listEntities('Customer', null, 500);
  const prospects = customers.filter((c) => c.status === 'prospect').length;
  const activeCustomers = customers.filter((c) => c.status === 'active').length;
  const overdueWO = filterEntities('WorkOrder', { status: 'open' }).filter((w) => {
    if (!w.due_date) return false;
    return new Date(w.due_date) < new Date();
  }).length;
  const newInquiries = filterEntities('Inquiry', { lead_status: 'new' }).length;
  const interested = filterEntities('Inquiry', { lead_status: 'interested' }).length;

  const summary = {
    slot,
    generated_at: new Date().toISOString(),
    fleet: {
      vehicles: listEntities('Vehicle', null, 500).length,
      open_work_orders: filterEntities('WorkOrder', { status: 'open' }).length,
      overdue_work_orders: overdueWO,
      active_customers: activeCustomers,
      prospects,
    },
    leads: {
      new: newInquiries,
      interested,
      marketing_ai_leads: marketing?.summary?.marketing_ai_leads ?? 0,
      outbox_pending: marketing?.summary?.outbox_pending ?? autopilot.outbox_pending ?? 0,
    },
    marketing: {
      autopilot_enrolled: marketing?.summary?.autopilot_enrolled ?? autopilot.enrolled_count,
      due_nurture: autopilot.due_now,
      advertising_ai_ran_today: adAi?.ran_today,
    },
    website: {
      url: APP_URL,
      hero: site?.hero_title_line1 || site?.hero_title_highlight || '(default)',
      contact_email: site?.contact_email || 'support@fleetcomanagement.org',
    },
    systems: {
      issues: down.map((c) => `${c.label}: ${c.detail}`),
      email: getEmailConfigStatus().configured,
      ai: getAiStatus().configured,
    },
  };

  const actions = [];
  if (newInquiries > 0) actions.push(`Review **${newInquiries}** new lead(s) — Marketing AI or Customers.`);
  if (overdueWO > 0) actions.push(`**${overdueWO}** open work order(s) past due — Maintenance module.`);
  if (summary.leads.outbox_pending > 0) actions.push(`**${summary.leads.outbox_pending}** nurture email(s) in outbox — copy/send from SLT Marketing.`);
  if (down.length) actions.push(`Fix **${down.length}** production config item(s) — say "system health" for detail.`);
  if (!adAi?.ran_today) actions.push('Run **business autopilot** to refresh advertising AI daily draft.');
  if (!actions.length) actions.push('All quiet — optional: ask Revan to audit fleet or draft homepage copy.');

  const greeting = chicagoGreeting();
  const markdown = [
    `**${greeting}, ${user?.full_name?.split(' ')[0] || 'Boss'}.** Revan executive briefing (${slot}).`,
    '',
    '**FleetCo pulse**',
    `- Fleet: **${summary.fleet.vehicles}** vehicles · **${summary.fleet.open_work_orders}** open WOs · **${overdueWO}** overdue`,
    `- Customers: **${summary.fleet.active_customers}** active · **${prospects}** prospects`,
    `- Leads: **${newInquiries}** new · **${interested}** interested · **${summary.leads.marketing_ai_leads}** from website AI`,
    '',
    '**Growth engine**',
    `- Autopilot: **${summary.marketing.autopilot_enrolled}** enrolled · **${summary.marketing.due_nurture}** nurture due now`,
    `- Outbox: **${summary.leads.outbox_pending}** pending · Advertising AI today: **${summary.marketing.advertising_ai_ran_today ? 'yes' : 'pending'}**`,
    '',
    '**Public site**',
    `- ${APP_URL} — hero: "${summary.website.hero}"`,
    '',
    '**Systems**',
    summary.systems.issues.length
      ? summary.systems.issues.map((i) => `- ⚠ ${i}`).join('\n')
      : '- All core checks green (or optional keys not set).',
    '',
    '**Recommended actions**',
    ...actions.map((a) => `- ${a}`),
    '',
    '_Revan runs marketing autopilot every 15m. Briefings at 7:00 AM and 6:00 PM Central land in Messages._',
    '',
    marketingFactsMarkdown(),
  ].join('\n');

  return { summary, markdown, recommended_actions: actions };
}
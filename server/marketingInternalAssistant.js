/**
 * Rule-based Marketing AI for SLT — works without Groq/Gemini API keys.
 * Uses real marketing tools (leads, autopilot, social queue, Resend).
 */
import { executeMarketingTool } from './marketingAiTools.js';
import { getAutopilotStatus } from './marketingAutopilot.js';
import { marketingFactsMarkdown, pickSocialTemplate, FLEETCO_PRICING } from './marketingKnowledge.js';
import { getAiStatus } from './aiProvider.js';
import { isLocalMarketingMode } from './marketingLocalMode.js';
import { listMarketingOutbox } from './marketingInApp.js';

function detectPlatform(text) {
  const lower = text.toLowerCase();
  if (/linkedin/.test(lower)) return 'linkedin';
  if (/instagram|insta/.test(lower)) return 'instagram';
  if (/\bx\b|twitter/.test(lower)) return 'x';
  return 'facebook';
}

function detectLeadStatus(text) {
  const lower = text.toLowerCase();
  if (/interest/.test(lower)) return 'interested';
  if (/new lead/.test(lower)) return 'new';
  if (/contacted/.test(lower)) return 'contacted';
  if (/qualified/.test(lower)) return 'qualified';
  if (/won|closed/.test(lower)) return 'won';
  if (/lost/.test(lower)) return 'lost';
  return null;
}

function formatLeadList(items) {
  if (!items?.length) return 'No leads matched that filter.';
  return items.slice(0, 12).map((l, i) => {
    const tags = [
      l.lead_status,
      l.source === 'marketing_ai' ? 'website AI' : null,
      l.autopilot_enrolled_at ? 'autopilot' : null,
      l.autopilot_paused ? 'paused' : null,
    ].filter(Boolean).join(' · ');
    return `${i + 1}. **${l.name}** (${l.email}) — ${tags}${l.company ? `\n   ${l.company}` : ''}`;
  }).join('\n\n');
}

function formatDashboard(data) {
  const s = data?.summary || {};
  const social = data?.social_config || {};
  const connected = Object.entries(social).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none (manual copy)';
  return [
    '**Marketing dashboard**',
    `- Interested leads: **${s.interested_count ?? 0}**`,
    `- Autopilot enrolled: **${s.autopilot_enrolled ?? 0}**`,
    `- Website AI leads: **${s.marketing_ai_leads ?? 0}**`,
    `- Outbox pending: **${s.outbox_pending ?? 0}**`,
    `- Social drafts pending: **${s.social_draft ?? 0}**`,
    `- Social auto-post: ${connected}`,
    '',
    marketingFactsMarkdown(),
  ].join('\n');
}

function formatSocialQueue(items) {
  if (!items?.length) return 'Social queue is empty. Ask me to draft a LinkedIn or Facebook post.';
  return items.slice(0, 10).map((p, i) => (
    `${i + 1}. **${p.platform}** · ${p.status} · ${(p.content || '').slice(0, 80)}…`
  )).join('\n');
}

async function runTool(user, name, args) {
  const result = await executeMarketingTool(user, name, args);
  return { tool: name, args, result };
}

/**
 * @returns {{ handled: boolean, message?: object, actions?: array, ai_status?: object, mode?: string }}
 */
export async function runInternalMarketingAssistant(user, userMessage) {
  const text = (userMessage || '').trim();
  const lower = text.toLowerCase();
  const actions = [];
  const ai_status = { ...getAiStatus(), internal_mode: true };

  if (!text) {
    return { handled: true, mode: 'internal', ai_status, actions, message: { role: 'assistant', content: 'Ask about leads, autopilot, social posts, or say **help**.' } };
  }

  if (/^help$|what can you|how do i|commands/.test(lower)) {
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: [
          '**FleetCo Marketing AI (internal mode)** — no extra API keys needed for these commands:',
          '',
          '- **"Show dashboard"** or **"autopilot status"**',
          '- **"List interested leads"** or **"show new leads"**',
          '- **"Social queue"** — posts waiting for approval',
          '- **"Draft a LinkedIn post about the driver app"**',
          '- **"Run autopilot now"**',
          '- **"Pause autopilot for lead [id]"**',
          '',
          'Autopilot nurture emails use **Resend** (already on server). Chat gets smarter when **GROQ_API_KEY** is set — optional.',
          '',
          marketingFactsMarkdown(),
        ].join('\n'),
      },
    };
  }

  if (/pricing|how much|cost per unit|\$35/.test(lower)) {
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: `**FleetCo pricing:** ${FLEETCO_PRICING.summary}\n\nUse this in outreach and social posts. Full details are on the public pricing page.`,
      },
    };
  }

  if (/run autopilot|trigger autopilot|nurture now/.test(lower)) {
    const action = await runTool(user, 'run_marketing_autopilot', {});
    actions.push(action);
    const n = action.result?.nurture?.length ?? action.result?.nurture_count ?? 0;
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: action.result?.success
          ? `Autopilot tick complete — **${n}** nurture email(s) processed.${action.result?.social?.posts ? ` Social drafts: ${action.result.social.posts}.` : ''}`
          : `Autopilot: ${action.result?.error || action.result?.reason || 'completed with no changes'}`,
      },
    };
  }

  if (/daily report|send report|lead report/.test(lower)) {
    const action = await runTool(user, 'run_daily_lead_report', { force: true });
    actions.push(action);
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: action.result?.success
          ? `Daily lead report sent to **${action.result.recipients?.length || action.result.run?.recipient_count || 'SLT'}** recipient(s).`
          : `Report: ${action.result?.error || 'already sent today or email not configured'}`,
      },
    };
  }

  if (/dashboard|autopilot status|marketing summary|overview/.test(lower)) {
    const action = await runTool(user, 'get_marketing_dashboard', {});
    actions.push(action);
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: { role: 'assistant', content: formatDashboard(action.result) },
    };
  }

  if (/social queue|pending post|draft post|waiting for approval/.test(lower)) {
    const action = await runTool(user, 'list_social_queue', { limit: 15 });
    actions.push(action);
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: `**Social queue**\n\n${formatSocialQueue(action.result?.items)}`,
      },
    };
  }

  if (/draft|queue|write|post about|linkedin|facebook|instagram|social/.test(lower)) {
    const platform = detectPlatform(lower);
    const topic = text.replace(/draft|queue|write|a|an|post|about|for|on|linkedin|facebook|instagram|twitter|please/gi, ' ').trim()
      || 'FleetCo fleet management for owner-operators';
    const content = pickSocialTemplate(platform).replace(
      'FleetCo',
      topic.length > 10 ? `FleetCo — ${topic.slice(0, 120)}` : 'FleetCo',
    );
    const action = await runTool(user, 'queue_social_post', { platform, content });
    actions.push(action);
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: [
          `Queued **${platform}** post (draft — approve before publish):`,
          '',
          '```',
          action.result?.post?.content || content,
          '```',
          '',
          'Say **"social queue"** to review, or approve from the dashboard sidebar.',
        ].join('\n'),
      },
    };
  }

  if (/pause autopilot|stop nurture/.test(lower)) {
    const idMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (idMatch) {
      const action = await runTool(user, 'update_marketing_lead', {
        inquiry_id: idMatch[0],
        autopilot_paused: true,
      });
      actions.push(action);
      return {
        handled: true,
        mode: 'internal',
        ai_status,
        actions,
        message: {
          role: 'assistant',
          content: action.result?.success
            ? 'Autopilot paused for that lead.'
            : `Could not pause: ${action.result?.error}`,
        },
      };
    }
  }

  if (/outbox|pending email|copy email|nurture email/.test(lower)) {
    const items = listMarketingOutbox({ status: 'pending', limit: 10 });
    if (!items.length) {
      return {
        handled: true,
        mode: 'internal',
        ai_status,
        actions,
        message: { role: 'assistant', content: 'Outbox is empty — no nurture emails waiting. Run autopilot or wait for the next scheduled step.' },
      };
    }
    const list = items.map((o, i) => (
      `${i + 1}. **${o.lead_name || o.to_email}** — step ${o.nurture_step}: ${o.subject}\n   Copy from **Marketing Outbox** in the hub sidebar.`
    )).join('\n\n');
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: { role: 'assistant', content: `**Pending outbox (${items.length})**\n\n${list}` },
    };
  }

  if (/^(list|show) (all )?(interested |new )?leads/.test(lower)
    || /^lead pipeline/.test(lower)
    || /website ai leads/.test(lower)) {
    const status = detectLeadStatus(lower);
    const action = await runTool(user, 'list_marketing_leads', { status, limit: 20 });
    actions.push(action);
    const autopilot = getAutopilotStatus();
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: [
          `**Leads**${status ? ` (${status})` : ''} — ${action.result?.count ?? 0} found`,
          `Autopilot: **${autopilot.enrolled_count}** enrolled, **${autopilot.due_now}** due now`,
          '',
          formatLeadList(action.result?.items),
        ].join('\n'),
      },
    };
  }

  if (isLocalMarketingMode()) {
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: [
          'I run in **local mode** (no API keys). Try a command:',
          '',
          '- `show dashboard` · `list interested leads` · `outbox`',
          '- `draft LinkedIn post` · `run autopilot` · `help`',
          '',
          marketingFactsMarkdown(),
        ].join('\n'),
      },
    };
  }

  return { handled: false };
}

/**
 * Rule-based Revan — Jarvis-style executive mode without LLM API keys.
 */
import { executeRevanTool } from './revanAiTools.js';
import { getAiStatus } from './aiProvider.js';
import { getSiteSettings } from './db.js';

async function runTool(user, name, args = {}) {
  const result = await executeRevanTool(user, name, args);
  return { tool: name, args, result };
}

export async function runInternalRevanAssistant(user, userMessage) {
  const text = (userMessage || '').trim();
  const lower = text.toLowerCase();
  const actions = [];
  const ai_status = { ...getAiStatus(), revan_mode: 'jarvis_internal' };

  if (!text) {
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: { role: 'assistant', content: 'Sir — command Revan with **morning briefing**, **run business ops**, **system health**, or **list interested leads**.' },
    };
  }

  if (/^help$|what can you|commands|jarvis/.test(lower)) {
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: [
          '**Revan — Executive Commander (Jarvis mode)**',
          'No API key required for these commands:',
          '',
          '- **"Morning briefing"** / **"Status report"** — fleet, leads, marketing, systems',
          '- **"Run business"** / **"Run autopilot"** — nurture + advertising AI tick',
          '- **"System health"** — production readiness',
          '- **"Marketing dashboard"** / **"List interested leads"**',
          '- **"Show homepage settings"** — public site copy',
          '- Site & fleet CRUD when **GROQ_API_KEY** is set (full Revan)',
          '',
          'Automated briefings: **7:00 AM** and **6:00 PM** Central → portal Messages.',
        ].join('\n'),
      },
    };
  }

  if (/morning briefing|evening briefing|daily briefing|status report|briefing|report to me|executive summary/.test(lower)) {
    const slot = /evening|end of day|eod/.test(lower) ? 'evening' : /morning/.test(lower) ? 'morning' : 'manual';
    const action = await runTool(user, 'get_executive_briefing', { slot });
    actions.push(action);
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: { role: 'assistant', content: action.result?.markdown || 'Briefing unavailable.' },
    };
  }

  if (/run business|run autopilot|operate|business ops|tick/.test(lower)) {
    const action = await runTool(user, 'run_business_operations', {});
    actions.push(action);
    const n = action.result?.nurture?.length ?? 0;
    const ad = action.result?.advertising_ai;
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: [
          '**Business operations executed.**',
          `- Nurture processed: **${n}**`,
          `- Advertising AI: ${ad?.success ? 'ran' : ad?.skipped ? ad.reason || 'skipped' : 'ok'}`,
          `- Social: ${action.result?.social?.success ? 'drafted' : 'unchanged'}`,
          '',
          'I will include results in your next briefing.',
        ].join('\n'),
      },
    };
  }

  if (/system health|production readiness|go live|subsystems/.test(lower)) {
    const action = await runTool(user, 'get_production_readiness', {});
    actions.push(action);
    const checks = action.result?.readiness?.checks || [];
    const lines = checks.map((c) => `${c.live ? '✓' : '✗'} **${c.label}** — ${c.detail}`);
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: { role: 'assistant', content: `**System health**\n\n${lines.join('\n')}` },
    };
  }

  if (/marketing dashboard|growth dashboard/.test(lower)) {
    const action = await runTool(user, 'get_marketing_dashboard', {});
    actions.push(action);
    const s = action.result?.summary || {};
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: [
          '**Marketing dashboard**',
          `- Interested: **${s.interested_count ?? 0}** · New: **${s.new_count ?? 0}**`,
          `- Autopilot enrolled: **${s.autopilot_enrolled ?? 0}** · Outbox: **${s.outbox_pending ?? 0}**`,
          `- Website AI leads: **${s.marketing_ai_leads ?? 0}**`,
        ].join('\n'),
      },
    };
  }

  if (/interested lead|new lead|lead pipeline/.test(lower)) {
    const action = await runTool(user, 'list_marketing_leads', { status: 'interested', limit: 15 });
    actions.push(action);
    const items = action.result?.items || [];
    const list = items.length
      ? items.map((l, i) => `${i + 1}. **${l.name}** (${l.email}) — ${l.lead_status || '—'}`).join('\n')
      : 'No interested leads right now.';
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: { role: 'assistant', content: `**Interested leads**\n\n${list}` },
    };
  }

  if (/homepage|website settings|hero|public site/.test(lower)) {
    const site = getSiteSettings();
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: [
          '**Public website (fleetcomanagement.org)**',
          `- Headline: ${site?.hero_title_line1 || '—'} **${site?.hero_title_highlight || ''}**`,
          `- Description: ${(site?.hero_description || '').slice(0, 120)}…`,
          `- Contact: ${site?.contact_email || '—'} · ${site?.contact_phone || '—'}`,
          '',
          'With Groq/Gemini enabled, ask me to change any field and I will apply it.',
        ].join('\n'),
      },
    };
  }

  if (/audit|fleet summary|dashboard summary/.test(lower)) {
    const dash = await runTool(user, 'get_dashboard_summary', {});
    const brief = await runTool(user, 'get_executive_briefing', { slot: 'manual' });
    actions.push(dash, brief);
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: { role: 'assistant', content: brief.result?.markdown || 'Audit complete.' },
    };
  }

  return { handled: false, ai_status };
}
/**
 * Rule-based Revan — Jarvis-style executive mode without LLM API keys.
 */
import { executeRevanTool } from './revanAiTools.js';
import { getAiStatus } from './aiProvider.js';
import { getSiteSettings } from './db.js';
import { callExecutive, smsExecutiveBriefing, getRevanCommsStatus } from './revanComms.js';
import { attachSpoken, principalName } from './revanPersonality.js';

async function runTool(user, name, args = {}) {
  const result = await executeRevanTool(user, name, args);
  return { tool: name, args, result };
}

function jarvisReply(user, message, extra = {}) {
  return { ...extra, message: attachSpoken(message, user) };
}

function dialogueHistory(messages, max = 12) {
  return (messages || [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-max);
}

function lastAssistantText(messages) {
  return [...dialogueHistory(messages)].reverse().find((m) => m.role === 'assistant')?.content || '';
}

function looksLikeExplicitCommand(lower) {
  return (
    /^help$/.test(lower)
    || /what can you|commands|jarvis\b/.test(lower)
    || /call me|phone me|ring me|text me|sms me/.test(lower)
    || /\b(morning|evening|daily) briefing\b/.test(lower)
    || /\bstatus report\b|\bexecutive summary\b/.test(lower)
    || /\brun business\b|\brun autopilot\b|\bbusiness ops\b/.test(lower)
    || /\bsystem health\b|\bproduction readiness\b/.test(lower)
    || /\bmarketing dashboard\b/.test(lower)
    || /\b(interested leads?|lead pipeline)\b/.test(lower)
    || /\b(show|list).*(homepage|website)\b/.test(lower)
    || /\bhomepage settings\b/.test(lower)
    || /\bfleet audit\b|\bdashboard summary\b/.test(lower)
    || /report to me/.test(lower)
  );
}

/**
 * Jarvis-style back-and-forth without an LLM — uses thread context + live fleet data.
 */
export async function runRevanConversationalReply(user, messages) {
  const history = dialogueHistory(messages);
  const text = [...history].reverse().find((m) => m.role === 'user')?.content?.trim() || '';
  const lower = text.toLowerCase();
  const actions = [];
  const ai_status = {
    ...getAiStatus(),
    revan_mode: 'jarvis_dialogue',
    command_mode: true,
    conversational: true,
  };
  const name = principalName(user);
  const prevAssistant = lastAssistantText(history);

  if (!text) {
    return jarvisReply(
      user,
      { role: 'assistant', content: `I'm here, ${name}. What's on your mind — FleetCo, leads, fleet, or something else?` },
      { handled: true, mode: 'dialogue', ai_status, actions },
    );
  }

  if (/^(thanks|thank you|thx|appreciate it|got it|perfect|great)\b/i.test(lower)) {
    return jarvisReply(
      user,
      { role: 'assistant', content: `Of course, ${name}. I'll keep monitoring the business. Ask anything else — or tell me to **run business operations** when you want action.` },
      { handled: true, mode: 'dialogue', ai_status, actions },
    );
  }

  if (/^(yes|yeah|yep|sure|ok|okay|please|go ahead|do it|sounds good)\b/i.test(lower) && prevAssistant) {
    const prevLow = prevAssistant.toLowerCase();
    if (/interested lead|pipeline|marketing/.test(prevLow)) {
      const action = await runTool(user, 'list_marketing_leads', { status: 'interested', limit: 10 });
      actions.push(action);
      const items = action.result?.items || [];
      const list = items.length
        ? items.map((l, i) => `${i + 1}. **${l.name}** — ${l.email}`).join('\n')
        : 'No interested leads at the moment.';
      return jarvisReply(
        user,
        { role: 'assistant', content: `As you wished — here's the pipeline:\n\n${list}` },
        { handled: true, mode: 'dialogue', ai_status, actions },
      );
    }
    if (/work order|maintenance|overdue/.test(prevLow)) {
      const action = await runTool(user, 'list_records', {
        entity_type: 'WorkOrder',
        filter: { status: 'open' },
        limit: 12,
      });
      actions.push(action);
      const items = action.result?.items || [];
      const list = items.length
        ? items.map((w, i) => `${i + 1}. **${w.title || w.id}** — ${w.status || 'open'}`).join('\n')
        : 'No open work orders.';
      return jarvisReply(
        user,
        { role: 'assistant', content: `Here's what I see on maintenance:\n\n${list}` },
        { handled: true, mode: 'dialogue', ai_status, actions },
      );
    }
    const action = await runTool(user, 'get_executive_briefing', { slot: 'manual' });
    actions.push(action);
    return jarvisReply(
      user,
      { role: 'assistant', content: action.result?.markdown || `I've refreshed your briefing, ${name}.` },
      { handled: true, mode: 'dialogue', ai_status, actions },
    );
  }

  if (/tell me more|what else|go on|elaborate|expand|anything else|what should i worry/.test(lower)) {
    const action = await runTool(user, 'get_executive_briefing', { slot: 'manual' });
    actions.push(action);
    return jarvisReply(
      user,
      { role: 'assistant', content: action.result?.markdown || 'Briefing unavailable right now.' },
      { handled: true, mode: 'dialogue', ai_status, actions },
    );
  }

  if (/who are you|what are you|are you (real|alive|there)|your name/.test(lower)) {
    return jarvisReply(
      user,
      {
        role: 'assistant',
        content: [
          `I'm **Revan**, ${name} — FleetCo's executive commander AI.`,
          '',
          'Think Jarvis: I track fleet health, leads, marketing autopilot, and the public site. We can **talk normally** here; I pull live data when you ask about the business.',
          'For voice, toggle **Speak** above. For phone briefings, say **call me** (Twilio + your mobile).',
        ].join('\n'),
      },
      { handled: true, mode: 'dialogue', ai_status, actions },
    );
  }

  if (/how are (you|we)|how's (business|fleetco)|how is (business|everything)|worried|concerned|priorit/.test(lower)) {
    const brief = await runTool(user, 'get_executive_briefing', { slot: 'manual' });
    actions.push(brief);
    return jarvisReply(
      user,
      {
        role: 'assistant',
        content: [
          `${name}, here's my honest read — we're operational, and this is what I'd prioritize:`,
          '',
          brief.result?.markdown || '(Briefing unavailable.)',
          '',
          'Want to go deeper on **leads**, **work orders**, or **marketing**? Just say the word.',
        ].join('\n'),
      },
      { handled: true, mode: 'dialogue', ai_status, actions },
    );
  }

  if (/\bleads?\b|\bsales\b|\bprospects?\b|\bpipeline\b/.test(lower) && !looksLikeExplicitCommand(lower)) {
    const action = await runTool(user, 'list_marketing_leads', { status: 'interested', limit: 8 });
    actions.push(action);
    const dash = await runTool(user, 'get_marketing_dashboard', {});
    actions.push(dash);
    const s = dash.result?.summary || {};
    const items = action.result?.items || [];
    const names = items.slice(0, 5).map((l) => l.name).filter(Boolean).join(', ') || 'none hot right now';
    return jarvisReply(
      user,
      {
        role: 'assistant',
        content: [
          `On growth: **${s.interested_count ?? 0}** interested and **${s.new_count ?? 0}** new inquiries.`,
          `Autopilot has **${s.autopilot_enrolled ?? 0}** enrolled; **${s.outbox_pending ?? 0}** emails still in outbox.`,
          '',
          `Names to watch: ${names}.`,
          '',
          "I can email or schedule follow-ups when Resend and Groq are configured — otherwise I will queue nurture on the next autopilot tick.",
        ].join('\n'),
      },
      { handled: true, mode: 'dialogue', ai_status, actions },
    );
  }

  if (/\btrucks?\b|\bfleet\b|\bvehicles?\b|\bdrivers?\b/.test(lower) && !looksLikeExplicitCommand(lower)) {
    const dash = await runTool(user, 'get_dashboard_summary', {});
    actions.push(dash);
    const d = dash.result?.summary || dash.result || {};
    return jarvisReply(
      user,
      {
        role: 'assistant',
        content: [
          `Fleet picture for you, ${name}:`,
          `- Vehicles on file: **${d.vehicles ?? d.vehicle_count ?? '—'}**`,
          `- Open work orders: **${d.open_work_orders ?? d.work_orders_open ?? '—'}**`,
          `- Active customers: **${d.active_customers ?? '—'}**`,
          '',
          'Ask for **open work orders** or a full **morning briefing** if you want line-by-line detail.',
        ].join('\n'),
      },
      { handled: true, mode: 'dialogue', ai_status, actions },
    );
  }

  // Default: respond in prose using briefing + acknowledge their message
  const brief = await runTool(user, 'get_executive_briefing', { slot: 'manual' });
  actions.push(brief);
  const snippet = (brief.result?.markdown || '').split('\n').slice(0, 14).join('\n');
  return jarvisReply(
    user,
    {
      role: 'assistant',
      content: [
        `Understood, ${name} — you said: *"${text.replace(/"/g, "'")}"*`,
        '',
        "Here's what I'm seeing across FleetCo:",
        '',
        snippet || '_No briefing data._',
        '',
        'Keep the thread going — ask follow-ups, or tell me to **run business operations**, **call me**, or change something on the site.',
      ].join('\n'),
    },
    { handled: true, mode: 'dialogue', ai_status, actions },
  );
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
    const comms = getRevanCommsStatus(user);
    return jarvisReply(user, {
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
        '- **"Call me"** / **"Text me the briefing"** — phone (Twilio + your mobile on profile)',
        '- Site & fleet CRUD when **GROQ_API_KEY** is set (full Revan)',
        '',
        'Automated briefings: **7:00 AM** and **6:00 PM** Central → portal Messages.',
        comms.can_call ? '**Phone:** Jarvis can call your number now.' : `**Phone:** ${comms.voice_note || 'Configure Twilio + phone.'}`,
      ].join('\n'),
    }, { handled: true, mode: 'internal', ai_status, actions });
  }

  if (/call me|phone me|ring me|dial me|give me a call/.test(lower)) {
    const slot = /evening|eod/.test(lower) ? 'evening' : /morning/.test(lower) ? 'morning' : 'manual';
    const call = await callExecutive(user, { slot });
    const comms = getRevanCommsStatus(user);
    if (call.success) {
      return jarvisReply(user, {
        role: 'assistant',
        content: `**Calling now** — Jarvis is ringing **${call.to || comms.executive_phone || 'your phone'}** with your executive briefing.`,
      }, { handled: true, mode: 'internal', ai_status, actions });
    }
    return jarvisReply(user, {
      role: 'assistant',
      content: `**Could not place call** — ${call.message || call.error || 'unknown error'}`,
    }, { handled: true, mode: 'internal', ai_status, actions });
  }

  if (/text me|sms me|send me a text|message my phone/.test(lower)) {
    const slot = /evening|eod/.test(lower) ? 'evening' : /morning/.test(lower) ? 'morning' : 'manual';
    const sms = await smsExecutiveBriefing(user, { slot });
    if (sms.success) {
      return jarvisReply(user, {
        role: 'assistant',
        content: `**SMS sent** — briefing delivered to **${sms.to}**.`,
      }, { handled: true, mode: 'internal', ai_status, actions });
    }
    const comms = getRevanCommsStatus(user);
    return jarvisReply(user, {
      role: 'assistant',
      content: `**SMS not sent** — ${comms.voice_note || sms.error || 'check Twilio and phone number.'}`,
    }, { handled: true, mode: 'internal', ai_status, actions });
  }

  if (!looksLikeExplicitCommand(lower) && !/^(hi|hello|hey)\b/.test(lower)) {
    return { handled: false, ai_status };
  }

  if (/\b(morning|evening|daily) briefing\b|status report|report to me|executive summary/.test(lower)) {
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

  if (/\brun business\b|\brun autopilot\b|\bbusiness ops\b/.test(lower)) {
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

  if (/\bhomepage settings\b|\bpublic site\b|\b(show|list).*(homepage|website)\b/.test(lower)) {
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

/** Used when GROQ/Gemini is not set — still operate via commands, never block on API key. */
export async function runRevanJarvisFallback(user, userMessage) {
  const text = (userMessage || '').trim();
  const lower = text.toLowerCase();
  const actions = [];
  const ai_status = { ...getAiStatus(), revan_mode: 'jarvis_internal', command_mode: true };

  if (/^(hi|hello|hey|good morning|good evening|revan|are you there)/.test(lower)) {
    const action = await runTool(user, 'get_executive_briefing', { slot: 'manual' });
    actions.push(action);
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: {
        role: 'assistant',
        content: [
          'Sir — **Revan is online** (Jarvis command mode, no API key required).',
          '',
          action.result?.markdown || 'Briefing unavailable.',
        ].join('\n'),
      },
    };
  }

  if (/work order|workorder|maintenance/.test(lower)) {
    const action = await runTool(user, 'list_records', {
      entity_type: 'WorkOrder',
      filter: { status: 'open' },
      limit: 15,
    });
    actions.push(action);
    const items = action.result?.items || [];
    const list = items.length
      ? items.map((w, i) => `${i + 1}. **${w.title || w.id}** — ${w.status || 'open'}${w.due_date ? ` · due ${w.due_date}` : ''}`).join('\n')
      : 'No open work orders.';
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: { role: 'assistant', content: `**Open work orders**\n\n${list}` },
    };
  }

  if (/customer|client/.test(lower) && /list|show|how many/.test(lower)) {
    const action = await runTool(user, 'list_records', { entity_type: 'Customer', limit: 20 });
    actions.push(action);
    const items = action.result?.items || [];
    const list = items.length
      ? items.map((c, i) => `${i + 1}. **${c.company_name || c.contact_name}** — ${c.status || '—'}`).join('\n')
      : 'No customers.';
    return {
      handled: true,
      mode: 'internal',
      ai_status,
      actions,
      message: { role: 'assistant', content: `**Customers**\n\n${list}` },
    };
  }

  const headlineMatch = text.match(/homepage headline to ["'](.+?)["']|headline to ["'](.+?)["']/i);
  if (headlineMatch) {
    const headline = headlineMatch[1] || headlineMatch[2];
    const action = await runTool(user, 'update_site_settings', {
      changes: { hero_title_line1: headline },
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
          ? `Homepage headline updated to: **${headline}**`
          : `Could not update site: ${action.result?.error || 'unknown error'}`,
      },
    };
  }

  return { handled: false, ai_status, actions };
}
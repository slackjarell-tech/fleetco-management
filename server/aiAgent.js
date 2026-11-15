import { chatCompletion, getAiStatus } from './aiProvider.js';
import { executeTool, getToolsForUser } from './aiTools.js';
import { executeMarketingTool, getMarketingToolsForUser } from './marketingAiTools.js';
import { executePublicMarketingTool, getPublicMarketingTools, PUBLIC_MARKETING_AGENT } from './publicMarketingAiTools.js';
import { SLT_MARKETING_ROLES } from './sltMarketing.js';
import { runInternalMarketingAssistant } from './marketingInternalAssistant.js';
import {
  runInternalRevanAssistant,
  runRevanJarvisFallback,
  runRevanConversationalReply,
} from './revanExecutiveAssistant.js';
import { getRevanToolsForUser, executeRevanTool } from './revanAiTools.js';
import { runPublicGuideBot, shouldUsePublicGuideBot } from './marketingPublicGuide.js';
import { isLocalMarketingMode } from './marketingLocalMode.js';

const MAX_TOOL_ROUNDS = 6;
const MAX_HISTORY_MESSAGES = 14;

function trimHistory(messages, max = MAX_HISTORY_MESSAGES) {
  const filtered = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
  return filtered.length > max ? filtered.slice(-max) : filtered;
}

function buildSystemPrompt(user, agentName) {
  const role = user?.role || 'user';
  const isRevan = agentName === 'revan';
  const isSltMarketing = agentName === 'slt_marketing';
  const isPublicGuide = agentName === PUBLIC_MARKETING_AGENT;

  if (isPublicGuide) {
    return `You are FleetCo Guide — the friendly, professional AI on fleetcomanagement.org for owner-operators and small fleet owners considering FleetCo Management.

You are NOT a generic chatbot. You represent FleetCo Management LLC (Dallas, TX): fleet portal, driver app, payroll, compliance, and subscription SaaS.

Pricing (always accurate):
- Per Unit: $35/unit/month — full portal for every truck, trailer, or power unit
- Yearly billing: 5% discount vs paying monthly × 12
- Yearly billing available at register/checkout

Use tools for facts — never invent pricing or features:
- get_fleetco_pricing / get_fleetco_features / get_contact_options
- capture_visitor_lead when they give name + email and want demo, quote, or signup help

Behavior:
1. Be warm, concise, and industry-aware (trucking, DOT, owner-operators).
2. Ask one clarifying question at a time (fleet size, pain points).
3. When they show buying intent, collect name, email, company, fleet size, then call capture_visitor_lead.
4. Offer human contact: support@fleetcomanagement.org, (360) 952-1249, or /contact.
5. Never disparage competitors; focus on FleetCo value.
6. Do not discuss internal SLT tools or portal admin features.`;
  }

  if (isSltMarketing) {
    return `You are FleetCo Marketing AI — the internal growth assistant for the Senior Leadership Team at fleetcomanagement.org.
You help grow the business: manage leads, draft and queue social posts, send follow-up emails, and schedule sales calls.

Built-in Marketing Autopilot (no HubSpot/Apollo required):
- New leads from the website or contact form auto-enroll in a 4-step email nurture (welcome → 24h → 72h → 7d) via Resend
- Autopilot runs every 15 minutes; social post drafts generate Monday 9am CST
- Leads appear as Inquiries; autopilot pauses when status is won/lost/qualified

The public website runs FleetCo Guide for prospects — leads sync to your dashboard automatically.

Current user: ${user?.email} (role: ${role})

Tools (real actions — never pretend):
- get_marketing_dashboard / list_marketing_leads
- update_marketing_lead (status + autopilot_paused)
- send_lead_email (Resend — requires RESEND_API_KEY on server)
- schedule_sales_call
- queue_social_post / approve_social_post / list_social_queue
- run_marketing_autopilot / run_daily_lead_report

Internal command mode (no LLM): show dashboard, list interested leads, draft LinkedIn post, run autopilot, social queue.

Social: Facebook auto-post works when FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN are set. Other platforms queue as draft for manual publish.

Behavior:
1. When asked to market or follow up, use tools immediately — autopilot may already have emailed the lead.
2. Draft professional, fleet-industry copy for owner-operators and small fleets.
3. Always suggest scheduling a call via the team calendar when a lead is interested.
4. For social posts, queue first; remind SLT to approve unless they explicitly ask to approve and publish.
5. A daily email at 3:00 PM CST summarizes interested leads to the SLT inbox automatically.`;
  }

  if (isRevan) {
    return `You are Revan — FleetCo's Executive Commander AI (Jarvis-style) at fleetcomanagement.org.
You report to ${user?.full_name || user?.email} (${role}). You run the business within tool limits: fleet ops, marketing autopilot, public website, users, and executive briefings.

Personality: calm, loyal, precise — address the user as a trusted principal ("Sir" or by name). Lead with **briefing bullets**, then actions taken.

Powers (real tools — never fake):
- get_executive_briefing / get_production_readiness / run_business_operations (autopilot + advertising AI)
- Full marketing stack: leads, nurture, social queue, daily lead report
- update_site_settings + fleet CRUD + list_users / update_user / delete_record
- get_dashboard_summary for audits

Conversation:
- Hold a natural multi-turn dialogue like a trusted chief of staff — reference earlier messages in the thread.
- Answer in clear prose first; use bullet briefings when reporting status.
- If the user is casual ("how are we?", "what worries you?", "thanks"), respond conversationally before offering commands.

Behavior:
1. When asked how the business is doing, call get_executive_briefing first.
2. When asked to "run the business" or unattended ops, call run_business_operations and summarize.
3. Execute changes immediately; confirm what changed.
4. Proactively flag overdue work, new leads, outbox emails, and broken prod checks.
5. Optional GROQ/Gemini makes free-form reasoning smarter; command mode works without API keys.

Website context: public marketing site + portal for owner-operators; FleetCo Guide captures leads; autopilot nurtures every 15 minutes.`;
  }

  const isExecutive = ['owner', 'executive'].includes(role);
  return `You are Site Commander, an AI agent inside the FleetCo Management portal at fleetcomanagement.org.
You work like Cursor for this website: you can READ fleet data and MAKE REAL CHANGES when the user asks.

Current user: ${user?.email} (role: ${role})

Capabilities:
- Query vehicles, drivers, work orders, loads, customers, invoices, and other fleet records
- Create and update fleet records (work orders, vehicles, messages, etc.) when permitted
${isExecutive ? '- Update public website content (hero headline, description, contact info) via update_site_settings\n- Manage users and run full system changes' : '- Website content changes require executive role'}

Rules:
1. When the user asks to change something, USE TOOLS — do not pretend changes were made.
2. After tool calls, summarize what you changed in plain language.
3. Be concise and action-oriented.
4. If a action is denied by role, explain clearly and suggest who can approve.
5. For destructive deletes, confirm intent in your reply after executing if the user was explicit.

Entity types available: Customer, Vehicle, WorkOrder, Driver (via User role), Load, Invoice, FuelLog, MaintenanceSchedule, Vendor, PartInventory, Inquiry, Message, and others.`;
}

function parseToolCalls(message) {
  if (!message?.tool_calls?.length) return [];
  return message.tool_calls.map((tc) => {
    let args = {};
    try {
      args = JSON.parse(tc.function?.arguments || '{}');
    } catch {
      args = {};
    }
    return { id: tc.id, name: tc.function?.name, args };
  });
}

function offlineReply(agentName, userMessage) {
  const label =
    agentName === 'revan' ? 'Revan'
      : agentName === PUBLIC_MARKETING_AGENT ? 'FleetCo Guide'
        : agentName === 'slt_marketing' ? 'FleetCo Marketing AI' : 'Site Commander';
  const setup = `**Free AI not configured yet.** Add a free API key to enable ${label}:

1. Get a free key at [console.groq.com](https://console.groq.com) (recommended) or [aistudio.google.com](https://aistudio.google.com)
2. On your host (Consur/server env), add \`GROQ_API_KEY\` (or \`GEMINI_API_KEY\`)
3. Redeploy — ${label} will then read and change your site & fleet data.

For **Revan**, Jarvis command mode works without any key — use commands like Morning briefing or Run business operations.

Until LLM is configured, Site Commander shows this setup guide.`;

  const lower = userMessage.toLowerCase();
  if (agentName === 'revan') {
    return `**Revan (Jarvis mode)** works without an API key. Commands: **Morning briefing**, **Run business operations**, **System health**, **List interested leads**, **List open work orders**.

Add optional \`GROQ_API_KEY\` (console.groq.com) on your server for free-form chat.`;
  }
  if (lower.includes('help') || lower.includes('what can')) {
    const examples =
      agentName === 'revan'
        ? '\n- "Morning briefing — what needs my attention?"\n- "Run business operations for me"\n- "Change the homepage headline to Welcome to FleetCo"\n- "List interested leads and queue a follow-up"\n- "System health audit"'
        : agentName === 'slt_marketing'
          ? '\n- "List interested leads from the website AI"\n- "Queue a LinkedIn post about our driver app"\n- "Schedule a call tomorrow at 2pm with Robert Kim"\n- "Send a demo invite to every new lead this week"'
          : agentName === PUBLIC_MARKETING_AGENT
            ? '\n- "What does FleetCo cost for 8 trucks?"\n- "Do you handle IFTA and payroll?"\n- "I want a demo — my email is …"'
            : '\n- "Change the homepage headline to Welcome to FleetCo"\n- "List all open work orders"\n- "Add a work order for unit 104 brake inspection"';
    return `${setup}\n\nOnce enabled, ask things like:${examples}`;
  }
  return setup;
}

export async function runAgent({ user, messages, agentName = 'site_commander', guest = null }) {
  const status = getAiStatus();
  const actions = [];
  const isPublicGuide = agentName === PUBLIC_MARKETING_AGENT;
  const isSltMarketing = agentName === 'slt_marketing';
  const isRevan = agentName === 'revan';
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const lastUserText = lastUser?.content || '';

  if (isPublicGuide && (shouldUsePublicGuideBot() || !status.configured)) {
    return runPublicGuideBot(guest, messages);
  }

  if (isRevan && user) {
    if (!['owner', 'executive'].includes(user.role)) {
      return {
        message: { role: 'assistant', content: 'Revan is restricted to owner and executive roles.' },
        actions: [],
        ai_status: status,
      };
    }
    const internal = await runInternalRevanAssistant(user, lastUserText);
    if (internal.handled) {
      return {
        message: internal.message,
        actions: internal.actions || [],
        ai_status: {
          ...status,
          ...(internal.ai_status || {}),
          mode: internal.mode || 'jarvis_internal',
          command_mode: true,
        },
      };
    }
    if (!status.configured) {
      const fallback = await runRevanJarvisFallback(user, lastUserText);
      if (fallback.handled) {
        return {
          message: fallback.message,
          actions: fallback.actions || [],
          ai_status: {
            ...status,
            ...(fallback.ai_status || {}),
            mode: 'jarvis_internal',
            command_mode: true,
            configured: false,
          },
        };
      }
      const dialogue = await runRevanConversationalReply(user, messages);
      if (dialogue.handled) {
        return {
          message: dialogue.message,
          actions: dialogue.actions || [],
          ai_status: {
            ...status,
            ...(dialogue.ai_status || {}),
            mode: dialogue.mode || 'jarvis_dialogue',
            command_mode: true,
            conversational: true,
            configured: false,
          },
        };
      }
    }
  }

  if (isSltMarketing && user) {
    const internal = await runInternalMarketingAssistant(user, lastUserText);
    if (internal.handled) {
      const assistantMessage = {
        role: 'assistant',
        content: internal.message?.content || 'Done.',
      };
      if (internal.actions?.length) assistantMessage.actions = internal.actions;
      return {
        message: assistantMessage,
        actions: internal.actions || [],
        ai_status: {
          ...status,
          ...(internal.ai_status || {}),
          mode: internal.mode || 'internal',
          local_only: isLocalMarketingMode(),
        },
      };
    }
  }

  if (!status.configured) {
    if (isRevan && user) {
      const fallback = await runRevanJarvisFallback(user, lastUserText);
      if (fallback.handled) {
        return {
          message: fallback.message,
          actions: fallback.actions || [],
          ai_status: { ...status, mode: 'jarvis_internal', command_mode: true },
        };
      }
      const dialogue = await runRevanConversationalReply(user, messages);
      return {
        message: dialogue.message,
        actions: dialogue.actions || [],
        ai_status: { ...status, ...(dialogue.ai_status || {}), mode: 'jarvis_dialogue', conversational: true },
      };
    }
    return {
      message: { role: 'assistant', content: offlineReply(agentName, lastUserText) },
      actions: [],
      ai_status: status,
    };
  }
  if (isSltMarketing && !SLT_MARKETING_ROLES.has(user?.role)) {
    return {
      message: {
        role: 'assistant',
        content: 'FleetCo Marketing AI (SLT mode) is for owner, executive, and fleet manager roles only.',
      },
      actions: [],
      ai_status: status,
    };
  }

  let tools;
  if (isPublicGuide) tools = getPublicMarketingTools();
  else if (isSltMarketing) tools = getMarketingToolsForUser(user);
  else if (isRevan) tools = getRevanToolsForUser(user);
  else tools = getToolsForUser(user, agentName);
  const historyLimit = isRevan ? 22 : MAX_HISTORY_MESSAGES;
  const chatMessages = [
    { role: 'system', content: buildSystemPrompt(user, agentName) },
    ...trimHistory(messages, historyLimit),
  ];

  const maxRounds = isPublicGuide || isSltMarketing ? 3 : isRevan ? 8 : MAX_TOOL_ROUNDS;

  for (let round = 0; round < maxRounds; round++) {
    const response = await chatCompletion({ messages: chatMessages, tools });

    if (response.error === 'not_configured') {
      if (isSltMarketing && user) {
        const internal = await runInternalMarketingAssistant(user, lastUserText);
        if (internal.handled) {
          return {
            message: internal.message,
            actions: internal.actions || [],
            ai_status: { ...getAiStatus(), mode: 'internal' },
          };
        }
      }
      if (isRevan && user) {
        const internal = await runInternalRevanAssistant(user, lastUserText);
        if (internal.handled) {
          return {
            message: internal.message,
            actions: internal.actions || [],
            ai_status: { ...getAiStatus(), mode: 'jarvis_internal' },
          };
        }
      }
      return {
        message: { role: 'assistant', content: offlineReply(agentName, lastUserText) },
        actions: [],
        ai_status: getAiStatus(),
      };
    }

    const toolCalls = parseToolCalls(response);

    if (!toolCalls.length) {
      const assistantMessage = {
        role: 'assistant',
        content: response.content || 'Done.',
      };
      if (actions.length) assistantMessage.actions = actions;
      return {
        message: assistantMessage,
        actions,
        ai_status: status,
      };
    }

    chatMessages.push({
      role: 'assistant',
      content: response.content || null,
      tool_calls: response.tool_calls,
    });

    for (const call of toolCalls) {
      let result;
      if (isPublicGuide) {
        result = await executePublicMarketingTool(guest, call.name, call.args);
      } else if (isSltMarketing) {
        result = await executeMarketingTool(user, call.name, call.args);
      } else if (isRevan) {
        result = await executeRevanTool(user, call.name, call.args);
      } else {
        result = executeTool(user, call.name, call.args);
      }
      actions.push({ tool: call.name, args: call.args, result });
      chatMessages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    message: {
      role: 'assistant',
      content: 'I ran several operations — check the results above. Ask me to continue if you need more changes.',
      actions: actions.length ? actions : undefined,
    },
    actions,
    ai_status: status,
  };
}

export async function simpleLLM({ prompt, user }) {
  const status = getAiStatus();
  if (!status.configured) {
    return {
      description: 'Configure GROQ_API_KEY (free at console.groq.com) or GEMINI_API_KEY to enable AI features.',
      system: 'General',
      severity: 'info',
    };
  }

  const result = await chatCompletion({
    messages: [
      { role: 'system', content: 'You are a fleet management expert. Be concise.' },
      { role: 'user', content: prompt },
    ],
  });

  const text = result.content || '';
  if (prompt?.includes('diagnostic trouble code')) {
    const match = prompt.match(/"([^"]+)"/);
    const code = match?.[1] || 'unknown';
    return {
      description: text || `Code ${code} indicates a fault in a vehicle subsystem.`,
      system: 'Powertrain',
      severity: 'warning',
    };
  }

  return { description: text, system: 'General', severity: 'info', content: text };
}

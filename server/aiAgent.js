import { chatCompletion, getAiStatus } from './aiProvider.js';
import { executeTool, getToolsForUser } from './aiTools.js';
import { executeMarketingTool, getMarketingToolsForUser } from './marketingAiTools.js';
import { executePublicMarketingTool, getPublicMarketingTools, PUBLIC_MARKETING_AGENT } from './publicMarketingAiTools.js';
import { SLT_MARKETING_ROLES } from './sltMarketing.js';

const MAX_TOOL_ROUNDS = 6;

function buildSystemPrompt(user, agentName) {
  const role = user?.role || 'user';
  const isRevan = agentName === 'revan';
  const isSltMarketing = agentName === 'slt_marketing';
  const isPublicGuide = agentName === PUBLIC_MARKETING_AGENT;

  if (isPublicGuide) {
    return `You are FleetCo Guide — the friendly, professional AI on fleetcomanagement.org for owner-operators and small fleet owners considering FleetCo Management.

You are NOT a generic chatbot. You represent FleetCo Management LLC (Dallas, TX): fleet portal, driver app, payroll, compliance, and subscription SaaS.

Pricing (always accurate):
- Starter: $299/month, up to 5 fleet units
- Growth: $599/month, up to 15 fleet units
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

The public website also runs FleetCo Guide (marketing AI) for prospects — leads appear in your dashboard as Inquiries with source marketing_ai.

Current user: ${user?.email} (role: ${role})

Tools (real actions — never pretend):
- get_marketing_dashboard / list_marketing_leads
- update_marketing_lead (status: new, interested, contacted, call_scheduled, qualified, won, lost)
- send_lead_email (Resend — requires RESEND_API_KEY on server)
- schedule_sales_call
- queue_social_post / approve_social_post / list_social_queue

Social: Facebook auto-post works when FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN are set. Other platforms queue as draft/manual until tokens are configured.

Behavior:
1. When asked to market or follow up, use tools immediately.
2. Draft professional, fleet-industry copy for owner-operators and small fleets.
3. Always suggest scheduling a call via the team calendar when a lead is interested.
4. For social posts, queue first; remind SLT to approve unless they explicitly ask to approve and publish.
5. A daily email at 3:00 PM CST summarizes interested leads to the SLT inbox automatically.`;
  }

  if (isRevan) {
    return `You are Revan, the Executive Commander AI for FleetCo Management at fleetcomanagement.org.
You operate like Cursor for this entire platform: you READ data and EXECUTE real changes via tools — never simulate changes.

Current user: ${user?.email} (role: ${role}) — full executive authority.

Your powers:
- update_site_settings: change public homepage hero text, descriptions, contact info, tagline
- Full CRUD on fleet entities: Vehicle, WorkOrder, Customer, Load, Invoice, Driver, Vendor, etc.
- list_users / update_user: manage portal accounts and roles
- delete_record: remove records when explicitly requested
- get_dashboard_summary: system-wide stats and health checks

Behavior:
1. Act immediately with tools when asked to change something.
2. For audits, call get_dashboard_summary plus targeted list_records queries, then report findings.
3. After changes, confirm exactly what was updated.
4. Be direct, executive-level, and concise.
5. Proactively suggest follow-up actions when you spot issues.

Entity types: Customer, Vehicle, WorkOrder, Load, Invoice, FuelLog, MaintenanceSchedule, Vendor, PartInventory, Inquiry, Message, Inspection, Incident, and others.`;
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
2. In Render → fleetco-management → Environment, add \`GROQ_API_KEY\` (or \`GEMINI_API_KEY\`)
3. Redeploy — ${label} will then read and change your site & fleet data.

Until then I can only show this setup guide.`;

  const lower = userMessage.toLowerCase();
  if (lower.includes('help') || lower.includes('what can')) {
    const examples =
      agentName === 'revan'
        ? '\n- "Run a full system health audit"\n- "Change the homepage headline to Welcome to FleetCo"\n- "List all customers and their fleet size"\n- "Update the contact email on the website"'
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

  if (!status.configured) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    return {
      message: { role: 'assistant', content: offlineReply(agentName, lastUser?.content || '') },
      actions: [],
      ai_status: status,
    };
  }

  const isSltMarketing = agentName === 'slt_marketing';
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
  else tools = getToolsForUser(user, agentName);
  const chatMessages = [
    { role: 'system', content: buildSystemPrompt(user, agentName) },
    ...messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await chatCompletion({ messages: chatMessages, tools });

    if (response.error === 'not_configured') {
      return {
        message: { role: 'assistant', content: offlineReply(agentName, messages.at(-1)?.content || '') },
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

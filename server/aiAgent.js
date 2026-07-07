import { chatCompletion, getAiStatus } from './aiProvider.js';
import { executeTool, getToolsForUser } from './aiTools.js';

const MAX_TOOL_ROUNDS = 6;

function buildSystemPrompt(user, agentName) {
  const role = user?.role || 'user';
  const isRevan = agentName === 'revan';

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

  const isExecutive = role === 'executive';
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
  const label = agentName === 'revan' ? 'Revan' : 'Site Commander';
  const setup = `**Free AI not configured yet.** Add a free API key to enable ${label}:

1. Get a free key at [console.groq.com](https://console.groq.com) (recommended) or [aistudio.google.com](https://aistudio.google.com)
2. In Render → fleetco-management → Environment, add \`GROQ_API_KEY\` (or \`GEMINI_API_KEY\`)
3. Redeploy — ${label} will then read and change your site & fleet data.

Until then I can only show this setup guide.`;

  const lower = userMessage.toLowerCase();
  if (lower.includes('help') || lower.includes('what can')) {
    const examples = agentName === 'revan'
      ? '\n- "Run a full system health audit"\n- "Change the homepage headline to Welcome to FleetCo"\n- "List all customers and their fleet size"\n- "Update the contact email on the website"'
      : '\n- "Change the homepage headline to Welcome to FleetCo"\n- "List all open work orders"\n- "Add a work order for unit 104 brake inspection"';
    return `${setup}\n\nOnce enabled, ask things like:${examples}`;
  }
  return setup;
}

export async function runAgent({ user, messages, agentName = 'site_commander' }) {
  const status = getAiStatus();
  const actions = [];

  if (!status.configured) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    return {
      message: { role: 'assistant', content: offlineReply(agentName, lastUser?.content || '') },
      actions: [],
      ai_status: status,
    };
  }

  const tools = getToolsForUser(user, agentName);
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
      const result = executeTool(user, call.name, call.args);
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

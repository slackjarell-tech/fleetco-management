import { TOOL_DEFINITIONS, executeTool } from './aiTools.js';
import { MARKETING_TOOL_DEFINITIONS, executeMarketingTool } from './marketingAiTools.js';
import { buildExecutiveBriefing } from './revanBriefing.js';
import { runAutopilotTick } from './marketingAutopilot.js';
import { getProductionReadiness } from './productionReadiness.js';

export const REVAN_EXTRA_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_executive_briefing',
      description: 'Jarvis-style executive briefing: fleet, leads, marketing autopilot, website, production health, recommended actions.',
      parameters: {
        type: 'object',
        properties: {
          slot: { type: 'string', description: 'morning, evening, or manual' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_business_operations',
      description: 'Run scheduled business ops: marketing autopilot tick (nurture, advertising AI, social drafts).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_production_readiness',
      description: 'Full production / subsystem health (email, Stripe, AI, database, autopilot).',
      parameters: { type: 'object', properties: {} },
    },
  },
];

const MARKETING_TOOL_NAMES = new Set(MARKETING_TOOL_DEFINITIONS.map((t) => t.function.name));
const BASE_TOOL_NAMES = new Set(TOOL_DEFINITIONS.map((t) => t.function.name));
const REVAN_EXTRA_NAMES = new Set(REVAN_EXTRA_TOOLS.map((t) => t.function.name));

export function getRevanToolsForUser(user) {
  if (!['owner', 'executive'].includes(user?.role)) {
    return TOOL_DEFINITIONS.filter((t) =>
      ['get_dashboard_summary', 'list_records', 'get_record', 'get_executive_briefing'].includes(t.function.name),
    );
  }
  return [...TOOL_DEFINITIONS, ...MARKETING_TOOL_DEFINITIONS, ...REVAN_EXTRA_TOOLS];
}

export async function executeRevanTool(user, name, args) {
  if (REVAN_EXTRA_NAMES.has(name)) {
    switch (name) {
      case 'get_executive_briefing': {
        const brief = await buildExecutiveBriefing({ user, slot: args?.slot || 'manual' });
        return { success: true, ...brief };
      }
      case 'run_business_operations': {
        const result = await runAutopilotTick();
        return { success: true, ...result };
      }
      case 'get_production_readiness': {
        const readiness = await getProductionReadiness({ verifyAi: true });
        return { success: true, readiness };
      }
      default:
        return { success: false, error: `Unknown Revan tool: ${name}` };
    }
  }
  if (MARKETING_TOOL_NAMES.has(name)) {
    return executeMarketingTool(user, name, args || {});
  }
  if (BASE_TOOL_NAMES.has(name)) {
    return executeTool(user, name, args || {});
  }
  return { success: false, error: `Unknown tool: ${name}` };
}
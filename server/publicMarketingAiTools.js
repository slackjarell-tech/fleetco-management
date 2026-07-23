import { createEntity, nowIso } from './db.js';
import { SUBSCRIPTION_PLANS } from './roles.js';
import { sendInquiryNotificationEmail } from './inquiryEmails.js';
import { defaultCalendarUrl } from './sltMarketing.js';

export const PUBLIC_MARKETING_AGENT = 'fleetco_guide';

export const PUBLIC_MARKETING_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_fleetco_pricing',
      description: 'Return FleetCo subscription plans, fleet limits, and monthly pricing for owner-operators and small fleets.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_fleetco_features',
      description: 'Summarize FleetCo portal capabilities: fleet, payroll, compliance, billing, driver app, etc.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Optional focus: payroll, compliance, fleet, billing, drivers' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_contact_options',
      description: 'Phone, email, contact page, and sales calendar link for human follow-up.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'capture_visitor_lead',
      description: 'Save a prospect lead from the chat. Creates an inquiry for the FleetCo SLT team. Use when they share email and interest in demo/pricing/signup.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          company: { type: 'string' },
          phone: { type: 'string' },
          fleet_size: { type: 'string' },
          message: { type: 'string' },
          interest: { type: 'string', description: 'e.g. Starter plan, demo, payroll module' },
        },
        required: ['name', 'email', 'message'],
      },
    },
  },
];

const FEATURE_BLOCKS = {
  fleet: 'Fleet units, work orders, maintenance, yard management, fleet map, TCO and P&L.',
  payroll: 'Driver payroll, time clock, direct deposit export, HR tax profiles for US states.',
  compliance: 'ELD/HOS, IFTA, inspections, pre-trip, incident reports, compliance tracker.',
  billing: 'Self-service subscription billing via Stripe; Starter $299/mo (up to 5 units), Growth $599/mo (up to 15).',
  drivers: 'Driver app (Android), scorecards, messaging, route and load tools.',
  default: 'All-in-one owner-operator and small-fleet portal: operations, fleet, payroll, compliance, and finance in one place.',
};

export function getPublicMarketingTools() {
  return PUBLIC_MARKETING_TOOL_DEFINITIONS;
}

export async function executePublicMarketingTool(_guest, name, args) {
  switch (name) {
    case 'get_fleetco_pricing':
      return {
        success: true,
        plans: Object.entries(SUBSCRIPTION_PLANS).map(([plan, cfg]) => ({
          plan,
          monthly_usd: cfg.monthly,
          max_fleet_units: cfg.fleetMax,
          yearly_note: 'Yearly billing available with discount at checkout',
        })),
        signup: 'https://fleetcomanagement.org/register',
        billing_page: 'https://fleetcomanagement.org/portal/billing',
      };

    case 'get_fleetco_features': {
      const topic = (args.topic || 'default').toLowerCase();
      const key = Object.keys(FEATURE_BLOCKS).find((k) => topic.includes(k)) || 'default';
      return { success: true, topic: key, summary: FEATURE_BLOCKS[key], website: 'https://fleetcomanagement.org' };
    }

    case 'get_contact_options':
      return {
        success: true,
        email: 'support@fleetcomanagement.org',
        phone: '(360) 952-1249',
        contact_page: 'https://fleetcomanagement.org/contact',
        register: 'https://fleetcomanagement.org/register',
        calendar: defaultCalendarUrl(),
      };

    case 'capture_visitor_lead': {
      const email = (args.email || '').trim().toLowerCase();
      const name = (args.name || '').trim();
      const message = (args.message || '').trim();
      if (!name || !email || !message) {
        return { success: false, error: 'name, email, and message are required' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Invalid email address' };
      }

      const fullMessage = [
        args.interest ? `Interest: ${args.interest}` : null,
        args.fleet_size ? `Fleet size: ${args.fleet_size}` : null,
        message,
        '',
        '(Captured via FleetCo Marketing AI on website)',
      ].filter(Boolean).join('\n');

      const inquiry = createEntity('Inquiry', {
        name,
        email,
        phone: args.phone || '',
        company: args.company || '',
        fleet_size: args.fleet_size || '',
        service_interest: args.interest || 'Marketing AI chat',
        message: fullMessage,
        status: 'new',
        lead_status: 'interested',
        source: 'marketing_ai',
        captured_at: nowIso(),
      });

      let emailSent = false;
      try {
        const notify = await sendInquiryNotificationEmail(inquiry);
        emailSent = !!notify.success;
      } catch {
        emailSent = false;
      }

      return {
        success: true,
        inquiry_id: inquiry.id,
        emailSent,
        message: 'Lead saved — a FleetCo team member will follow up soon.',
      };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

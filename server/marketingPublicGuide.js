/**
 * Rule-based FleetCo Guide for the public website — no LLM API keys.
 */
import { executePublicMarketingTool } from './publicMarketingAiTools.js';
import { FLEETCO_PRICING, FLEETCO_FEATURES } from './marketingKnowledge.js';
import { isLocalMarketingMode } from './marketingLocalMode.js';

function extractEmail(text) {
  const m = (text || '').match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  return m ? m[0].toLowerCase() : null;
}

function extractName(text, email) {
  const beforeEmail = email ? text.split(email)[0] : text;
  const nameMatch = beforeEmail.match(/(?:i'?m|my name is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch) return nameMatch[1].trim();
  const words = beforeEmail.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length <= 4) return words.slice(0, 2).join(' ');
  return 'Website Visitor';
}

function extractFleetSize(text) {
  const m = (text || '').match(/(\d+)\s*(?:truck|unit|vehicle|power|trailer)/i);
  return m ? m[1] : '';
}

function formatPricing(data) {
  return [
    '**FleetCo pricing**',
    `- **$${data.price_per_unit_monthly_usd}/unit/month** for every truck, trailer, or power unit`,
    `- **${data.yearly_discount_percent}% off** when billed annually`,
    `- Example: 5 units ≈ $${data.example_5_units_monthly}/month`,
    '',
    `[View pricing](${data.signup?.replace('/register', '/pricing') || 'https://fleetcomanagement.org/pricing'}) · [Start free trial](https://fleetcomanagement.org/register)`,
  ].join('\n');
}

function formatFeatures(data) {
  return [
    `**FleetCo — ${data.topic}**`,
    data.summary,
    '',
    'Ask about **pricing**, **payroll**, **driver app**, **compliance**, or **contact** options.',
  ].join('\n');
}

function formatContact(data) {
  return [
    '**Contact FleetCo**',
    `- Email: ${data.email}`,
    `- Phone: ${data.phone}`,
    `- [Contact form](${data.contact_page})`,
    `- [Book a call / demo](${data.calendar})`,
    '',
    'Share your **name and email** in chat and we\'ll save your request for our team.',
  ].join('\n');
}

function menuReply() {
  return [
    'Hi — I\'m **FleetCo Guide**. I can help with:',
    '',
    '- **Pricing** — $35/unit/month, 5% off annual',
    '- **Features** — fleet, payroll, compliance, driver app',
    '- **Demo / contact** — phone, email, book a call',
    '',
    'What size fleet are you running?',
  ].join('\n');
}

/**
 * @returns {{ message: object, actions: array, ai_status: object }}
 */
export async function runPublicGuideBot(guest, messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = (lastUser?.content || '').trim();
  const lower = text.toLowerCase();
  const actions = [];
  const ai_status = { configured: true, healthy: true, provider: 'local', mode: 'rule_based' };

  if (!text || /^(hi|hello|hey|help|start)/.test(lower)) {
    return { message: { role: 'assistant', content: menuReply() }, actions, ai_status };
  }

  const email = extractEmail(text);
  const wantsDemo = /demo|quote|call|sign up|signup|interested|contact me|reach out|get started/.test(lower);

  if (email && (wantsDemo || text.length > 40)) {
    const name = extractName(text, email);
    const result = await executePublicMarketingTool(guest, 'capture_visitor_lead', {
      name,
      email,
      message: text,
      fleet_size: extractFleetSize(text),
      interest: wantsDemo ? 'demo request via chat' : 'website chat',
    });
    actions.push({ tool: 'capture_visitor_lead', args: { name, email }, result });
    if (result.success) {
      return {
        message: {
          role: 'assistant',
          content: [
            `Thanks, **${name.split(' ')[0]}** — we saved your request.`,
            '',
            'Our team will follow up inside FleetCo Marketing AI (usually same business day).',
            '',
            `Meanwhile: [Book a demo](https://fleetcomanagement.org/contact) or call **(360) 952-1249**.`,
          ].join('\n'),
        },
        actions,
        ai_status,
      };
    }
  }

  if (/price|pricing|cost|how much|\$|unit|month|annual|yearly|plan/.test(lower)) {
    const result = await executePublicMarketingTool(guest, 'get_fleetco_pricing', {});
    actions.push({ tool: 'get_fleetco_pricing', args: {}, result });
    return { message: { role: 'assistant', content: formatPricing(result) }, actions, ai_status };
  }

  if (/payroll|driver|eld|hos|ifta|compliance|inspection|dashcam|route|fleet map|feature|what do you|what can/.test(lower)) {
    let topic = 'default';
    if (/payroll/.test(lower)) topic = 'payroll';
    else if (/driver|app|dashcam/.test(lower)) topic = 'drivers';
    else if (/eld|hos|ifta|compliance|inspection/.test(lower)) topic = 'compliance';
    else if (/fleet|truck|trailer|maintenance/.test(lower)) topic = 'fleet';
    const result = await executePublicMarketingTool(guest, 'get_fleetco_features', { topic });
    actions.push({ tool: 'get_fleetco_features', args: { topic }, result });
    return { message: { role: 'assistant', content: formatFeatures(result) }, actions, ai_status };
  }

  if (/contact|phone|email|call|human|talk to|support|demo/.test(lower)) {
    const result = await executePublicMarketingTool(guest, 'get_contact_options', {});
    actions.push({ tool: 'get_contact_options', args: {}, result });
    return { message: { role: 'assistant', content: formatContact(result) }, actions, ai_status };
  }

  if (/owner.operator|small fleet|trucking|dot|carrier/.test(lower)) {
    return {
      message: {
        role: 'assistant',
        content: [
          'FleetCo is built for **owner-operators and small fleets** (roughly 1–50 units).',
          '',
          FLEETCO_FEATURES.default,
          '',
          FLEETCO_PRICING.summary,
          '',
          'Want **pricing** details or to **request a demo**? Say the word, or send your name and email.',
        ].join('\n'),
      },
      actions,
      ai_status,
    };
  }

  return {
    message: {
      role: 'assistant',
      content: [
        'I can help with **pricing**, **features**, or **booking a demo**.',
        '',
        menuReply(),
      ].join('\n'),
    },
    actions,
    ai_status,
  };
}

export function shouldUsePublicGuideBot() {
  return isLocalMarketingMode();
}

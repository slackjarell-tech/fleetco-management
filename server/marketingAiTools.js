import {
  approveSocialPost,
  getMarketingDashboard,
  listMarketingLeads,
  queueSocialPost,
  scheduleSalesCall,
  sendLeadEmail,
  updateMarketingLead,
  assertSltMarketingAccess,
} from './sltMarketing.js';
import { listEntities } from './db.js';

export const MARKETING_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_marketing_dashboard',
      description: 'Summary of leads, social queue, scheduled calls, and social account connection status.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_marketing_leads',
      description: 'List website/referral leads (Inquiries) with marketing status.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter: new, interested, contacted, call_scheduled, qualified, won, lost' },
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_marketing_lead',
      description: 'Update lead pipeline status or notes on an inquiry.',
      parameters: {
        type: 'object',
        properties: {
          inquiry_id: { type: 'string' },
          lead_status: { type: 'string' },
          notes: { type: 'string' },
          assigned_to: { type: 'string' },
        },
        required: ['inquiry_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_lead_email',
      description: 'Send a marketing or follow-up email to a lead via Resend. Updates lead to contacted when inquiry_id is set.',
      parameters: {
        type: 'object',
        properties: {
          inquiry_id: { type: 'string' },
          to: { type: 'string' },
          subject: { type: 'string' },
          text: { type: 'string' },
          html: { type: 'string' },
        },
        required: ['subject'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_sales_call',
      description: 'Schedule a sales call with a lead and mark inquiry as call_scheduled.',
      parameters: {
        type: 'object',
        properties: {
          inquiry_id: { type: 'string' },
          lead_name: { type: 'string' },
          lead_email: { type: 'string' },
          scheduled_at: { type: 'string', description: 'ISO datetime' },
          meeting_link: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['scheduled_at'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'queue_social_post',
      description: 'Draft a social post for Facebook, LinkedIn, Instagram, or X. Requires human approval before publish unless auto_publish is true.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['facebook', 'linkedin', 'instagram', 'x'] },
          content: { type: 'string' },
          scheduled_at: { type: 'string' },
          auto_publish: { type: 'boolean' },
        },
        required: ['platform', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'approve_social_post',
      description: 'Approve a queued social post and attempt to publish (Facebook if token configured; otherwise marks manual).',
      parameters: {
        type: 'object',
        properties: {
          post_id: { type: 'string' },
          publish_now: { type: 'boolean' },
        },
        required: ['post_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_social_queue',
      description: 'List recent social posts in the marketing queue.',
      parameters: {
        type: 'object',
        properties: { limit: { type: 'number' } },
      },
    },
  },
];

export function getMarketingToolsForUser(user) {
  try {
    assertSltMarketingAccess(user);
    return MARKETING_TOOL_DEFINITIONS;
  } catch {
    return [];
  }
}

export async function executeMarketingTool(user, name, args) {
  try {
    assertSltMarketingAccess(user);
  } catch (err) {
    return { success: false, error: err.message };
  }

  switch (name) {
    case 'get_marketing_dashboard':
      return getMarketingDashboard(user);

    case 'list_marketing_leads': {
      const items = listMarketingLeads({ status: args.status, limit: Math.min(args.limit || 25, 50) });
      return { success: true, count: items.length, items };
    }

    case 'update_marketing_lead': {
      const item = updateMarketingLead(user, {
        inquiryId: args.inquiry_id,
        lead_status: args.lead_status,
        notes: args.notes,
        assigned_to: args.assigned_to,
      });
      return { success: true, item };
    }

    case 'send_lead_email':
      return sendLeadEmail(user, {
        inquiry_id: args.inquiry_id,
        to: args.to,
        subject: args.subject,
        text: args.text,
        html: args.html,
      });

    case 'schedule_sales_call': {
      const call = scheduleSalesCall(user, {
        inquiry_id: args.inquiry_id,
        lead_name: args.lead_name,
        lead_email: args.lead_email,
        scheduled_at: args.scheduled_at,
        meeting_link: args.meeting_link,
        notes: args.notes,
      });
      return { success: true, call };
    }

    case 'queue_social_post': {
      const post = queueSocialPost(user, {
        platform: args.platform,
        content: args.content,
        scheduled_at: args.scheduled_at,
        auto_publish: args.auto_publish,
      });
      return { success: true, post };
    }

    case 'approve_social_post':
      return approveSocialPost(user, { postId: args.post_id, publishNow: args.publish_now !== false });

    case 'list_social_queue': {
      const limit = Math.min(args.limit || 20, 50);
      const items = listEntities('MarketingSocialPost', '-created_at', limit);
      return { success: true, count: items.length, items };
    }

    default:
      return { success: false, error: `Unknown marketing tool: ${name}` };
  }
}

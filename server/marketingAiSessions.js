import { randomUUID } from 'crypto';

const publicConversations = new Map();
const rateBuckets = new Map();

const MAX_MESSAGES_PER_HOUR = 40;
const MAX_MESSAGE_LENGTH = 2000;
const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000;

function guestKey(req) {
  const header = (req.headers['x-marketing-guest'] || '').trim();
  if (header && header.length >= 8 && header.length <= 64) return header;
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  return `ip:${ip}`;
}

function checkRateLimit(key) {
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + 3600000 };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 3600000;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  return bucket.count <= MAX_MESSAGES_PER_HOUR;
}

function pruneOldConversations() {
  const cutoff = Date.now() - CONVERSATION_TTL_MS;
  for (const [id, conv] of publicConversations.entries()) {
    if (new Date(conv.updated_at).getTime() < cutoff) publicConversations.delete(id);
  }
}

export function createPublicMarketingConversation(guestId) {
  pruneOldConversations();
  const id = randomUUID();
  const conversation = {
    id,
    agent_name: 'fleetco_guide',
    guest_id: guestId,
    messages: [{
      role: 'assistant',
      content: 'Hi — I\'m the FleetCo assistant. I can explain our fleet portal, pricing ($299–$599/mo), and help you request a demo or get started. What size fleet are you running?',
    }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  publicConversations.set(id, conversation);
  return conversation;
}

export function getPublicMarketingConversation(id, guestId) {
  const conv = publicConversations.get(id);
  if (!conv || conv.guest_id !== guestId) return null;
  return conv;
}

export function appendPublicMessage(req, conversationId, content) {
  const guestId = guestKey(req);
  if (!checkRateLimit(guestId)) {
    return { error: 'Too many messages — please wait an hour or use our contact form.', status: 429 };
  }

  const text = (content || '').trim();
  if (!text) return { error: 'Message required', status: 400 };
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`, status: 400 };
  }

  const conversation = getPublicMarketingConversation(conversationId, guestId);
  if (!conversation) return { error: 'Conversation not found', status: 404 };

  conversation.messages.push({ role: 'user', content: text });
  conversation.updated_at = new Date().toISOString();

  return { conversation, guestId };
}

export { guestKey };

import { randomUUID } from 'crypto';
import { createEntity, getEntity, listEntities, nowIso, updateEntity } from './db.js';

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
  const cutoff = new Date(Date.now() - CONVERSATION_TTL_MS).toISOString();
  const stale = listEntities('MarketingConversation', '-updated_at', 200)
    .filter((c) => (c.updated_at || c.created_at || '') < cutoff);
  for (const conv of stale.slice(0, 50)) {
    updateEntity('MarketingConversation', conv.id, { archived: true });
  }
}

function parseMessages(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const WELCOME = 'Hi — I\'m the FleetCo assistant. I can explain our fleet portal, pricing ($299–$599/mo), and help you request a demo or get started. What size fleet are you running?';

export function createPublicMarketingConversation(guestId) {
  pruneOldConversations();
  const id = randomUUID();
  const ts = nowIso();
  const messages = [{ role: 'assistant', content: WELCOME }];
  const conversation = createEntity('MarketingConversation', {
    id,
    agent_name: 'fleetco_guide',
    guest_id: guestId,
    messages: JSON.stringify(messages),
    created_at: ts,
    updated_at: ts,
    archived: false,
  });
  return toClientConversation(conversation);
}

export function getPublicMarketingConversation(id, guestId) {
  const conv = getEntity('MarketingConversation', id);
  if (!conv || conv.guest_id !== guestId || conv.archived) return null;
  return toClientConversation(conv);
}

function toClientConversation(stored) {
  return {
    id: stored.id,
    agent_name: stored.agent_name || 'fleetco_guide',
    guest_id: stored.guest_id,
    messages: parseMessages(stored.messages),
    created_at: stored.created_at,
    updated_at: stored.updated_at,
  };
}

export function savePublicMarketingConversation(conversation) {
  updateEntity('MarketingConversation', conversation.id, {
    messages: JSON.stringify(conversation.messages),
    updated_at: conversation.updated_at || nowIso(),
  });
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
  conversation.updated_at = nowIso();
  savePublicMarketingConversation(conversation);

  return { conversation, guestId };
}

export { guestKey };

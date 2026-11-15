/**
 * Phone / SMS agent turns — two-way Jarvis like Luke's live call demo.
 */
import { filterUsers } from './db.js';
import { normalizeE164 } from './twilioClient.js';
import { runInternalRevanAssistant, runRevanJarvisFallback, runRevanConversationalReply } from './revanExecutiveAssistant.js';
import { markdownToSpoken } from './revanPersonality.js';
import { appendRevanMemoryTurn, getRevanMemoryThread } from './revanMemory.js';
import { getAiStatus } from './aiProvider.js';

export function findExecutiveByPhone(phone) {
  const target = normalizeE164(phone);
  if (!target) return null;
  const execs = filterUsers({}).filter(
    (u) => ['owner', 'executive'].includes(u.role) && u.status !== 'suspended',
  );
  const match = execs.find((u) => normalizeE164(u.phone) === target);
  if (match) return match;
  const env = normalizeE164(process.env.REVAN_EXECUTIVE_PHONE);
  if (env && env === target && execs.length) return execs[0];
  return execs[0] || null;
}

function shortForVoice(text, max = 420) {
  const spoken = markdownToSpoken(text);
  if (spoken.length <= max) return spoken;
  return `${spoken.slice(0, max - 3)}...`;
}

export async function revanTurnFromUtterance(user, utterance, { channel = 'voice' } = {}) {
  const text = String(utterance || '').trim();
  if (!user) {
    return {
      content: 'Revan could not verify your executive account.',
      spoken: 'Revan could not verify your executive account.',
      messages: [],
    };
  }

  const prior = getRevanMemoryThread(user.id).flatMap((t) => [
    { role: 'user', content: t.user },
    { role: 'assistant', content: t.assistant },
  ]);
  const messages = [...prior.slice(-16), { role: 'user', content: text }];

  let assistantContent = '';
  let assistantMessage = null;

  const internal = await runInternalRevanAssistant(user, text);
  if (internal.handled) {
    assistantMessage = internal.message;
    assistantContent = internal.message?.content || '';
  } else {
    const status = getAiStatus();
    if (!status.configured) {
      const fb = await runRevanJarvisFallback(user, text);
      if (fb.handled) {
        assistantMessage = fb.message;
        assistantContent = fb.message?.content || '';
      } else {
        const dialogue = await runRevanConversationalReply(user, messages);
        assistantMessage = dialogue.message;
        assistantContent = dialogue.message?.content || '';
      }
    } else {
      const { runAgent } = await import('./aiAgent.js');
      const result = await runAgent({ user, messages, agentName: 'revan' });
      assistantMessage = result.message;
      assistantContent = result.message?.content || '';
    }
  }

  if (!assistantContent) {
    assistantContent = 'At your service. What should I handle next?';
  }

  appendRevanMemoryTurn(user.id, text, assistantContent);

  const spoken = shortForVoice(
    assistantMessage?.spoken || assistantContent,
    channel === 'sms' ? 1400 : 420,
  );

  return {
    content: assistantContent,
    spoken,
    messages: [...messages, { role: 'assistant', content: assistantContent }],
  };
}
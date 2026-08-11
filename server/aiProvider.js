const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Free tier: 70B hits 12k TPM quickly; 8B instant has much higher limits and is fine for chat.
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
const DEFAULT_GROQ_MAX_TOKENS = 1024;

function groqModel() {
  return process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
}

function groqMaxTokens() {
  const n = Number(process.env.GROQ_MAX_TOKENS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GROQ_MAX_TOKENS;
}

function parseRetryAfterSeconds(message) {
  const match = String(message || '').match(/try again in ([\d.]+)s/i);
  return match ? Math.ceil(parseFloat(match[1])) + 1 : 8;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGroqRateLimit(status, message) {
  return status === 429 || /rate limit reached/i.test(String(message || ''));
}

let healthCache = { at: 0, healthy: null, error: null };
const HEALTH_TTL_MS = 5 * 60 * 1000;

export function getAiStatus() {
  if (process.env.GROQ_API_KEY) {
    return {
      configured: true,
      provider: 'groq',
      model: groqModel(),
      healthy: healthCache.healthy,
      health_error: healthCache.error,
      health_checked_at: healthCache.at ? new Date(healthCache.at).toISOString() : null,
    };
  }
  if (process.env.GEMINI_API_KEY) {
    return {
      configured: true,
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      healthy: healthCache.healthy,
      health_error: healthCache.error,
      health_checked_at: healthCache.at ? new Date(healthCache.at).toISOString() : null,
    };
  }
  return { configured: false, provider: null, model: null, healthy: false, health_error: null };
}

export async function verifyAiProvider({ force = false } = {}) {
  const status = getAiStatus();
  if (!status.configured) {
    healthCache = { at: Date.now(), healthy: false, error: 'not_configured' };
    return { ...status, healthy: false, health_error: 'not_configured' };
  }

  if (!force && healthCache.at && Date.now() - healthCache.at < HEALTH_TTL_MS) {
    return { ...status, healthy: healthCache.healthy, health_error: healthCache.error };
  }

  try {
    const msg = await chatCompletion({
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
    });
    if (msg.error === 'not_configured') {
      healthCache = { at: Date.now(), healthy: false, error: 'not_configured' };
    } else if (!msg.content && !msg.tool_calls) {
      healthCache = { at: Date.now(), healthy: false, error: 'empty_response' };
    } else {
      healthCache = { at: Date.now(), healthy: true, error: null };
    }
  } catch (err) {
    healthCache = { at: Date.now(), healthy: false, error: err.message || 'verify_failed' };
  }

  return {
    ...getAiStatus(),
    healthy: healthCache.healthy,
    health_error: healthCache.error,
  };
}

async function chatGroq({ messages, tools, model }) {
  const body = {
    model: model || groqModel(),
    messages,
    temperature: 0.4,
    max_tokens: groqMaxTokens(),
  };
  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  let lastMessage = 'Groq API error';
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return data.choices?.[0]?.message || { role: 'assistant', content: 'No response from AI.' };
    }

    lastMessage = data?.error?.message || `Groq API error (${res.status})`;
    if (isGroqRateLimit(res.status, lastMessage) && attempt < 2) {
      await sleep(parseRetryAfterSeconds(lastMessage) * 1000);
      continue;
    }
    if (isGroqRateLimit(res.status, lastMessage)) {
      throw new Error(
        'FleetCo AI is briefly busy (free Groq limit). Please wait 30 seconds and send your message again.',
      );
    }
    throw new Error(lastMessage);
  }

  throw new Error(lastMessage);
}

function toGeminiContents(messages) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
    }));
}

async function chatGemini({ messages, model }) {
  const system = messages.find((m) => m.role === 'system')?.content || '';
  const contents = toGeminiContents(messages);
  if (system && contents[0]?.role === 'user') {
    contents[0].parts[0].text = `${system}\n\n${contents[0].parts[0].text}`;
  }

  const modelId = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const res = await fetch(`${GEMINI_URL(modelId)}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini API error (${res.status})`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return { role: 'assistant', content: text || 'No response from AI.' };
}

export async function chatCompletion(params) {
  const status = getAiStatus();
  if (!status.configured) {
    return {
      role: 'assistant',
      content: null,
      error: 'not_configured',
    };
  }

  if (status.provider === 'groq') {
    return chatGroq({ ...params, model: status.model });
  }
  return chatGemini({ ...params, model: status.model });
}

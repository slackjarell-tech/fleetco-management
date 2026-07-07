const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export function getAiStatus() {
  if (process.env.GROQ_API_KEY) {
    return { configured: true, provider: 'groq', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' };
  }
  if (process.env.GEMINI_API_KEY) {
    return { configured: true, provider: 'gemini', model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' };
  }
  return { configured: false, provider: null, model: null };
}

async function chatGroq({ messages, tools, model }) {
  const body = {
    model: model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.4,
    max_tokens: 4096,
  };
  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Groq API error (${res.status})`);
  }
  return data.choices?.[0]?.message || { role: 'assistant', content: 'No response from AI.' };
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

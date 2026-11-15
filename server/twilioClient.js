/**
 * Shared Twilio SMS + voice (used by Revan Jarvis outbound calls).
 */

function normalizeE164(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (s.startsWith('+')) return `+${s.replace(/\D/g, '')}`;
  const digits = s.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.length >= 10 ? `+${digits}` : null;
}

function escapeXml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function twilioConfigured() {
  return !!(
    process.env.TWILIO_ACCOUNT_SID
    && process.env.TWILIO_AUTH_TOKEN
    && process.env.TWILIO_FROM_NUMBER
  );
}

export function getTwilioFromNumber() {
  return process.env.TWILIO_FROM_NUMBER || null;
}

export async function sendSms({ to, body }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const dest = normalizeE164(to);

  if (!sid || !token || !from) {
    return { sent: false, reason: 'missing_twilio_env' };
  }
  if (!dest) {
    return { sent: false, reason: 'invalid_phone' };
  }
  if (!body?.trim()) {
    return { sent: false, reason: 'empty_body' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: dest, From: from, Body: body.slice(0, 1500) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Twilio SMS error ${res.status}`);
  }
  return { sent: true, sid: data.sid, to: dest };
}

export async function placeVoiceCall({ to, sayText }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const dest = normalizeE164(to);
  const text = String(sayText || '').trim().slice(0, 1200);

  if (!sid || !token || !from) {
    return { placed: false, reason: 'missing_twilio_env' };
  }
  if (!dest) {
    return { placed: false, reason: 'invalid_phone' };
  }
  if (!text) {
    return { placed: false, reason: 'empty_script' };
  }

  const voice = process.env.TWILIO_POLLY_VOICE || 'Polly.Matthew';
  const twiml = `<Response><Say voice="${voice}">${escapeXml(text)}</Say><Pause length="1"/><Say voice="${voice}">Revan standing by. Goodbye.</Say></Response>`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: dest, From: from, Twiml: twiml }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Twilio voice error ${res.status}`);
  }
  return { placed: true, sid: data.sid, to: dest };
}

export { normalizeE164 };
/**
 * Twilio voice + SMS webhooks — inbound/outbound two-way Jarvis calls.
 */
import jwt from 'jsonwebtoken';
import { findExecutiveByPhone, revanTurnFromUtterance } from './revanPhoneAgent.js';
import { twilioConfigured, getTwilioFromNumber, escapeXml, placeVoiceCallUrl } from './twilioClient.js';

const callSessions = new Map();

function voiceName() {
  return process.env.TWILIO_POLLY_VOICE || 'Polly.Matthew';
}

export function syntheticRevanReq() {
  const base = (process.env.PUBLIC_APP_URL || process.env.APP_ORIGIN || 'https://fleetcomanagement.org').replace(/\/$/, '');
  try {
    const host = new URL(base).host;
    return {
      get(name) {
        if (name === 'host') return host;
        if (name === 'x-forwarded-proto') return 'https';
        return null;
      },
      protocol: 'https',
    };
  } catch {
    return { get: () => null, protocol: 'https' };
  }
}

function apiBase(req) {
  const env = (process.env.PUBLIC_APP_URL || process.env.APP_ORIGIN || '').replace(/\/$/, '');
  if (env) return env;
  if (!req?.get) return 'https://fleetcomanagement.org';
  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  return host ? `${proto}://${host}` : '';
}

function gatherUrl(req, extra = '') {
  return `${apiBase(req)}/api/twilio/revan/voice/gather${extra}`;
}

function twimlGatherSay(spoken, req, callSid) {
  const action = gatherUrl(req, callSid ? `?CallSid=${encodeURIComponent(callSid)}` : '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voiceName()}">${escapeXml(spoken)}</Say>
  <Gather input="speech" action="${escapeXml(action)}" speechTimeout="auto" language="en-US" method="POST" />
  <Say voice="${voiceName()}">I will be here when you need me. Goodbye.</Say>
</Response>`;
}

export function signRevanOutboundToken(userId) {
  const secret = process.env.JWT_SECRET || 'fleet-pulse-dev-secret-change-in-production';
  return jwt.sign({ sub: userId, purpose: 'revan_outbound_voice' }, secret, { expiresIn: '15m' });
}

export function verifyRevanOutboundToken(token) {
  const secret = process.env.JWT_SECRET || 'fleet-pulse-dev-secret-change-in-production';
  try {
    const payload = jwt.verify(token, secret);
    if (payload.purpose !== 'revan_outbound_voice') return null;
    return payload.sub;
  } catch {
    return null;
  }
}

function sessionForCall(callSid, from) {
  let s = callSessions.get(callSid);
  if (!s) {
    const user = findExecutiveByPhone(from);
    s = { user, started: Date.now() };
    callSessions.set(callSid, s);
    setTimeout(() => callSessions.delete(callSid), 45 * 60 * 1000);
  }
  return s;
}

export async function handleRevanVoiceInbound(req, res) {
  res.type('text/xml');
  if (!twilioConfigured()) {
    res.send(`<Response><Say>Revan phone line is not configured yet.</Say></Response>`);
    return;
  }
  const from = req.body?.From || '';
  const callSid = req.body?.CallSid || '';
  const user = findExecutiveByPhone(from);
  if (!user) {
    res.send(`<Response><Say>Revan does not recognize this number. Save your mobile in the FleetCo portal first.</Say></Response>`);
    return;
  }
  sessionForCall(callSid, from);
  const greeting = `Hi, this is Revan. How may I help you today, ${user.full_name?.split(' ')[0] || 'Sir'}?`;
  res.send(twimlGatherSay(greeting, req, callSid));
}

export async function handleRevanVoiceOutbound(req, res) {
  res.type('text/xml');
  const userId = verifyRevanOutboundToken(req.query?.token);
  if (!userId) {
    res.send(`<Response><Say>Revan call authorization failed.</Say></Response>`);
    return;
  }
  const { findUserById } = await import('./db.js');
  const user = findUserById(userId);
  const callSid = req.body?.CallSid || req.query?.CallSid || '';
  if (user) sessionForCall(callSid, user.phone);
  const greet = user
    ? `Revan calling. Good ${new Date().getHours() < 12 ? 'morning' : 'evening'}, ${user.full_name?.split(' ')[0] || 'Sir'}. What would you like to know?`
    : 'Revan online.';
  res.send(twimlGatherSay(greet, req, callSid));
}

export async function handleRevanVoiceGather(req, res) {
  res.type('text/xml');
  const speech = (req.body?.SpeechResult || '').trim();
  const callSid = req.body?.CallSid || req.query?.CallSid || '';
  const from = req.body?.From || '';
  const session = sessionForCall(callSid, from);
  const user = session?.user || findExecutiveByPhone(from);

  if (!speech) {
    res.send(twimlGatherSay('I did not catch that. Please repeat.', req, callSid));
    return;
  }

  if (/goodbye|hang up|that is all|that's all|bye revan/i.test(speech)) {
    res.send(`<Response><Say voice="${voiceName()}">Understood. Revan standing by. Goodbye.</Say></Response>`);
    callSessions.delete(callSid);
    return;
  }

  try {
    const turn = await revanTurnFromUtterance(user, speech, { channel: 'voice' });
    res.send(twimlGatherSay(turn.spoken, req, callSid));
  } catch (err) {
    console.error('[revan voice gather]', err.message);
    res.send(twimlGatherSay('Sorry, I hit a fault. Try again in a moment.', req, callSid));
  }
}

export async function handleRevanSmsInbound(req, res) {
  res.type('text/xml');
  const body = (req.body?.Body || '').trim();
  const from = req.body?.From || '';
  const user = findExecutiveByPhone(from);
  if (!body) {
    res.send('<Response></Response>');
    return;
  }
  if (!user) {
    res.send('<Response><Message>Revan: unknown number. Add your phone in the FleetCo portal under Revan.</Message></Response>');
    return;
  }
  try {
    const turn = await revanTurnFromUtterance(user, body, { channel: 'sms' });
    res.send(`<Response><Message>${escapeXml(turn.spoken.slice(0, 1500))}</Message></Response>`);
  } catch (err) {
    res.send('<Response><Message>Revan: temporary error. Try again shortly.</Message></Response>');
  }
}

export function getInboundJarvisLineStatus() {
  const from = getTwilioFromNumber();
  return {
    inbound_number: from,
    inbound_instructions: from
      ? `Call or text ${from} from your saved executive mobile to talk to Revan live.`
      : null,
    webhooks: {
      voice: '/api/twilio/revan/voice',
      voice_gather: '/api/twilio/revan/voice/gather',
      sms: '/api/twilio/revan/sms',
    },
  };
}

export async function placeInteractiveOutboundCall(user, req) {
  const token = signRevanOutboundToken(user.id);
  const base = apiBase(req) || (process.env.PUBLIC_APP_URL || '').replace(/\/$/, '');
  if (!base) {
    return { placed: false, reason: 'no_public_url' };
  }
  const url = `${base}/api/twilio/revan/voice/outbound?token=${encodeURIComponent(token)}`;
  const { resolveExecutivePhone } = await import('./revanComms.js');
  const to = resolveExecutivePhone(user);
  if (!to) return { placed: false, reason: 'no_phone' };
  return placeVoiceCallUrl({ to, url });
}
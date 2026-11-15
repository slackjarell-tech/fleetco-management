import { buildExecutiveBriefing } from './revanBriefing.js';
import { normalizeE164, placeVoiceCall, sendSms, twilioConfigured, getTwilioFromNumber } from './twilioClient.js';
import { jarvisOpenLine, markdownToSpoken } from './revanPersonality.js';

export function resolveExecutivePhone(user) {
  const fromUser = normalizeE164(user?.phone);
  if (fromUser) return fromUser;
  const env = normalizeE164(process.env.REVAN_EXECUTIVE_PHONE || process.env.REVAN_CALL_PHONE);
  return env;
}

export function getRevanCommsStatus(user) {
  const phone = resolveExecutivePhone(user);
  const from = getTwilioFromNumber();
  const inbound = {
    inbound_number: from,
    inbound_instructions: from
      ? `Call or text ${from} from your saved executive mobile — two-way Jarvis (voice + SMS).`
      : null,
    webhook_paths: ['/api/twilio/revan/voice', '/api/twilio/revan/sms'],
  };
  return {
    twilio_configured: twilioConfigured(),
    from_number: twilioConfigured() ? getTwilioFromNumber() : null,
    executive_phone: phone,
    can_call: twilioConfigured() && !!phone,
    can_sms: twilioConfigured() && !!phone,
    inbound_jarvis: inbound,
    voice_note: !twilioConfigured()
      ? 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER on server for phone calls.'
      : !phone
        ? 'Add your mobile on Profile or set REVAN_EXECUTIVE_PHONE on server.'
        : null,
  };
}

export async function spokenBriefForUser(user, slot = 'manual') {
  const { markdown, summary } = await buildExecutiveBriefing({ user, slot });
  const core = markdownToSpoken(markdown);
  const f = summary?.fleet;
  const tail = f
    ? ` Fleet snapshot: ${f.active_customers ?? 0} active customers, ${f.open_work_orders ?? 0} open work orders.`
    : '';
  const script = `${jarvisOpenLine(user)} Here is your briefing.${tail} ${core}`.slice(0, 1150);
  return { script, markdown, summary };
}

export async function callExecutive(user, { slot = 'manual', script, req } = {}) {
  const to = resolveExecutivePhone(user);
  if (!to) {
    return {
      success: false,
      error: 'no_phone',
      message: 'No phone on file. Update **Profile → phone** or set **REVAN_EXECUTIVE_PHONE** on the server.',
    };
  }
  if (!twilioConfigured()) {
    return {
      success: false,
      error: 'twilio_not_configured',
      message: 'Twilio is not configured. Add **TWILIO_ACCOUNT_SID**, **TWILIO_AUTH_TOKEN**, and **TWILIO_FROM_NUMBER** on Consur, then redeploy.',
    };
  }

  let sayText = script;
  if (!sayText) {
    const brief = await spokenBriefForUser(user, slot);
    const intro = `${jarvisOpenLine(user)} Revan calling with a quick briefing.`;
    const core = markdownToSpoken(brief.markdown || '').slice(0, 700);
    sayText = `${intro} ${core}`.slice(0, 1150);
  }

  const useInteractive = process.env.REVAN_INTERACTIVE_CALLS === 'true';
  if (useInteractive && twilioConfigured()) {
    try {
      const { placeInteractiveOutboundCall, syntheticRevanReq } = await import('./revanVoiceWebhook.js');
      const interactive = await placeInteractiveOutboundCall(user, req || syntheticRevanReq());
      if (interactive.placed) {
        return { success: true, call_sid: interactive.sid, to: interactive.to, interactive: true };
      }
    } catch (err) {
      console.warn('[revan] interactive call fallback', err.message);
    }
  }

  const result = await placeVoiceCall({ to, sayText });
  if (!result.placed) {
    return { success: false, error: result.reason || 'call_failed' };
  }
  return { success: true, call_sid: result.sid, to: result.to, interactive: false };
}

export async function smsExecutiveBriefing(user, { slot = 'manual', body } = {}) {
  const to = resolveExecutivePhone(user);
  if (!to) {
    return { success: false, error: 'no_phone' };
  }
  if (!twilioConfigured()) {
    return { success: false, error: 'twilio_not_configured' };
  }

  let text = body;
  if (!text) {
    const { markdown } = await buildExecutiveBriefing({ user, slot });
    text = `Revan briefing — ${markdownToSpoken(markdown).slice(0, 1400)}`;
  }

  const result = await sendSms({ to, body: text });
  if (!result.sent) {
    return { success: false, error: result.reason || 'sms_failed' };
  }
  return { success: true, sid: result.sid, to: result.to };
}
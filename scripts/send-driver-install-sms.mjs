/**
 * Send FleetCo Driver install link via SMS (Twilio).
 *
 * Usage:
 *   node scripts/send-driver-install-sms.mjs 3609521249
 *
 * Env (required for actual send):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER   e.g. +12065551234
 *
 * Optional:
 *   INSTALL_URL — defaults to Play internal test + PWA fallback
 */
const phoneArg = process.argv[2] || process.env.SMS_TO || '3609521249';
const to = phoneArg.startsWith('+') ? phoneArg : `+1${phoneArg.replace(/\D/g, '')}`;

const PLAY_URL = process.env.VITE_DRIVER_APP_ANDROID_URL
  || 'https://play.google.com/apps/internaltest/4701271726337402202';
const PWA_URL = process.env.INSTALL_PWA_URL || 'https://fleetcomanagement.org/driver/login';

const body = `FleetCo Driver app — install on your phone:\n\nAndroid (Play test): ${PLAY_URL}\n\nOr open in browser: ${PWA_URL}\n\nLogin details were created separately. — FleetCo`;

async function sendTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    return { sent: false, reason: 'missing_twilio_env' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Twilio error ${res.status}`);
  }
  return { sent: true, sid: data.sid };
}

async function main() {
  console.log(`To: ${to}`);
  console.log('\nMessage preview:\n');
  console.log(body);
  console.log('');

  try {
    const result = await sendTwilio();
    if (result.sent) {
      console.log(`SMS sent successfully (Twilio SID: ${result.sid})`);
      return;
    }
    console.log('Twilio not configured — copy the link above and text it manually, or set:');
    console.log('  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER');
  } catch (err) {
    console.error('SMS failed:', err.message);
    console.log('\nManual fallback — send this link to your phone:');
    console.log(PWA_URL);
    process.exit(1);
  }
}

main();

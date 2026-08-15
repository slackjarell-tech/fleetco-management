import { defaultCalendarUrl } from './sltMarketing.js';

const APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';

export const NURTURE_SEQUENCE = [
  {
    step: 1,
    delayHours: 0,
    name: 'welcome',
    subject: (lead) => `Thanks for reaching out, ${firstName(lead)} — FleetCo Management`,
    build: (lead) => welcomeEmail(lead),
  },
  {
    step: 2,
    delayHours: 24,
    name: 'value',
    subject: () => 'How fleets cut admin time with FleetCo (portal + driver app)',
    build: (lead) => valueEmail(lead),
  },
  {
    step: 3,
    delayHours: 72,
    name: 'driver_app',
    subject: () => 'Your drivers on one app — routes, fuel, dashcam, payroll',
    build: (lead) => driverAppEmail(lead),
  },
  {
    step: 4,
    delayHours: 168,
    name: 'final',
    subject: (lead) => `${firstName(lead)}, still exploring fleet software?`,
    build: (lead) => finalEmail(lead),
  },
];

function firstName(lead) {
  return (lead.name || 'there').split(' ')[0];
}

function wrapHtml(body) {
  return `
<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;color:#0f172a;line-height:1.6">
  ${body}
  <p style="margin-top:28px;font-size:13px;color:#64748b">
    FleetCo Management LLC · Dallas, TX<br/>
    <a href="${APP_URL}">fleetcomanagement.org</a> · support@fleetcomanagement.org · (360) 952-1249
  </p>
</div>`;
}

function welcomeEmail(lead) {
  const cal = defaultCalendarUrl();
  const text = [
    `Hi ${firstName(lead)},`,
    '',
    'Thank you for your interest in FleetCo Management.',
    '',
    'We help owner-operators and small fleets run operations, compliance, payroll, and driver tools in one portal — $35/unit/month (5% off when billed annually).',
    '',
    `Schedule a quick demo: ${cal}`,
    `Or explore pricing: ${APP_URL}/pricing`,
    '',
    '— The FleetCo Team',
  ].join('\n');

  const html = wrapHtml(`
    <p>Hi ${firstName(lead)},</p>
    <p>Thank you for reaching out to <strong>FleetCo Management</strong>.</p>
    <p>We help owner-operators and small fleets manage operations, DOT compliance, payroll, and a mobile driver app — <strong>$35/unit/month</strong> (5% off annual billing).</p>
    <p style="margin:24px 0">
      <a href="${cal}" style="display:inline-block;background:#f59e0b;color:#0f172a;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px">Book a free demo</a>
    </p>
    <p><a href="${APP_URL}/pricing">View plans & pricing</a></p>
  `);

  return { text, html };
}

function valueEmail(lead) {
  const cal = defaultCalendarUrl();
  const text = [
    `Hi ${firstName(lead)},`,
    '',
    'FleetCo replaces spreadsheets and disconnected apps with one fleet portal:',
    '• Work orders, maintenance, and yard management',
    '• Driver payroll, time clock, and tax profiles',
    '• IFTA, inspections, HOS, and incident tracking',
    '• Subscription billing — $35/unit/mo, 5% off yearly',
    '',
    `Questions? Reply to this email or book a call: ${cal}`,
    '',
    '— FleetCo',
  ].join('\n');

  const html = wrapHtml(`
    <p>Hi ${firstName(lead)},</p>
    <p>Many fleets we talk to are juggling spreadsheets, fuel cards, and payroll in separate places. <strong>FleetCo</strong> brings it together:</p>
    <ul>
      <li>Fleet maintenance, work orders & yard map</li>
      <li>Driver payroll, time clock & HR tax profiles</li>
      <li>IFTA, inspections, HOS & compliance tracker</li>
      <li>Mobile driver app — routes, fuel, dashcam, messaging</li>
    </ul>
    <p><strong>$35/unit/month</strong> · save 5% with annual billing</p>
    <p><a href="${cal}">Schedule a 15-minute walkthrough</a></p>
  `);

  return { text, html };
}

function driverAppEmail(lead) {
  const cal = defaultCalendarUrl();
  const text = [
    `Hi ${firstName(lead)},`,
    '',
    'Your drivers can clock in, run routes, log fuel with receipts, use dashcam/ELD tools, and message dispatch — synced to your FleetCo portal in real time.',
    '',
    `Try the driver login: ${APP_URL}/driver/login`,
    `Book a demo: ${cal}`,
    '',
    '— FleetCo',
  ].join('\n');

  const html = wrapHtml(`
    <p>Hi ${firstName(lead)},</p>
    <p>Our <strong>FleetCo Driver</strong> app keeps field teams connected to your portal:</p>
    <ul>
      <li>Time clock & HOS</li>
      <li>Delivery routes & package scan</li>
      <li>Fuel logs with receipt photos</li>
      <li>Dashcam / ELD capture</li>
      <li>Direct messaging with your team</li>
    </ul>
    <p><a href="${APP_URL}/driver-app">Learn about the driver app</a> · <a href="${cal}">Book a demo</a></p>
  `);

  return { text, html };
}

function finalEmail(lead) {
  const cal = defaultCalendarUrl();
  const text = [
    `Hi ${firstName(lead)},`,
    '',
    'Just checking in — if fleet software is still on your radar, we would love to show you FleetCo live.',
    '',
    `Book anytime: ${cal}`,
    `Or reply with your fleet size and biggest pain point — we will point you to the right plan.`,
    '',
    '— FleetCo Team',
  ].join('\n');

  const html = wrapHtml(`
    <p>Hi ${firstName(lead)},</p>
    <p>Just checking in — if you are still evaluating fleet management software, we would love to give you a quick live tour.</p>
    <p><a href="${cal}">Pick a time on our calendar</a>, or reply with your fleet size and top challenge.</p>
  `);

  return { text, html };
}

export function getNurtureStepConfig(stepNumber) {
  return NURTURE_SEQUENCE.find((s) => s.step === stepNumber) || null;
}

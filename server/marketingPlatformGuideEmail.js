import { sendEmail } from './email.js';

export function marketingPlatformGuideContent() {
  const subject = 'FleetCo — Built-in Marketing Autopilot (no HubSpot required)';

  const html = `
<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;color:#1e293b;line-height:1.55">
  <h1 style="color:#0f172a;font-size:22px">FleetCo Marketing Autopilot</h1>
  <p>Your marketing stack runs inside FleetCo — no HubSpot, Apollo, or other paid CRM required for core lead nurture.</p>

  <h2 style="color:#0f172a;font-size:17px;margin-top:28px">What runs automatically</h2>
  <ul>
    <li><strong>FleetCo Guide</strong> — public website AI chat (free Groq/Gemini)</li>
    <li><strong>Lead capture</strong> — contact form + chat → Inquiry pipeline</li>
    <li><strong>4-step email nurture</strong> — welcome, 24h, 72h, 7-day follow-up via Resend</li>
    <li><strong>Weekly social drafts</strong> — AI-generated posts queued for SLT approval</li>
    <li><strong>Daily SLT report</strong> — 3:00 PM CST interested-lead summary</li>
  </ul>

  <h2 style="color:#0f172a;font-size:17px;margin-top:28px">Optional upgrades (paid)</h2>
  <p>Only if you outgrow the built-in system:</p>
  <ul>
    <li>Facebook auto-post — set FACEBOOK_PAGE_ID + token (free API)</li>
    <li>LinkedIn/X tokens — optional for auto-publish</li>
    <li>HubSpot or Apollo — outbound prospecting at scale (not required for inbound)</li>
  </ul>

  <h2 style="color:#0f172a;font-size:17px;margin-top:28px">Environment keys</h2>
  <ul>
    <li><code>GROQ_API_KEY</code> — free AI chat (console.groq.com)</li>
    <li><code>RESEND_API_KEY</code> — nurture + notification emails</li>
    <li><code>MARKETING_AUTOPILOT_DISABLED=true</code> — pause autopilot only</li>
  </ul>

  <p style="margin-top:32px;font-size:13px;color:#64748b">FleetCo Management · fleetcomanagement.org/portal/slt-marketing</p>
</div>
`;

  const text = `FleetCo Marketing Autopilot — built-in, no HubSpot required.

• Website AI chat (FleetCo Guide)
• Auto lead nurture (4 emails via Resend)
• Weekly social drafts + daily SLT report
• Optional: Facebook token for auto-post

Keys: GROQ_API_KEY (free), RESEND_API_KEY

— FleetCo Management`;

  return { subject, html, text };
}

export async function sendMarketingPlatformGuideEmail(to) {
  const { subject, html, text } = marketingPlatformGuideContent();
  return sendEmail({ to, subject, html, text });
}
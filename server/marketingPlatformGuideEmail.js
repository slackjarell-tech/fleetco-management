import { sendEmail } from './email.js';

export function marketingPlatformGuideContent() {
  const subject = 'FleetCo — Marketing platform recommendations (replace SLT Marketing AI)';

  const html = `
<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;color:#1e293b;line-height:1.55">
  <h1 style="color:#0f172a;font-size:22px">Marketing platform recommendations</h1>
  <p>Summary of proven alternatives to the in-portal SLT Marketing AI (GROQ), for FleetCo B2B fleet SaaS ($299–$599/mo).</p>

  <h2 style="color:#0f172a;font-size:17px;margin-top:28px">Recommended stack</h2>

  <h3 style="color:#0369a1;font-size:15px">1. HubSpot Marketing + Sales Hub</h3>
  <p><strong>Best for:</strong> Website leads → email nurture → demo → Stripe signup.</p>
  <ul>
    <li>3× more inbound leads in 6 months (HubSpot 2025 ROI Report)</li>
    <li>94% more deals closed (Sales Hub users)</li>
    <li>~505% avg ROI over 3 years</li>
    <li>Marketing automation median: $5.44 return per $1 spent</li>
  </ul>
  <p><a href="https://www.hubspot.com/roi">hubspot.com/roi</a></p>

  <h3 style="color:#0369a1;font-size:15px">2. Apollo.io</h3>
  <p><strong>Best for:</strong> Outbound email/LinkedIn to fleet owners and ops managers.</p>
  <ul>
    <li>2.37% email-to-meeting conversion (Tolly study; industry avg 0.5–1.5%)</li>
    <li>45% open rate (vs 27–40% benchmark)</li>
    <li>~$59–$149/user/mo</li>
  </ul>
  <p><a href="https://www.apollo.io">apollo.io</a></p>

  <h3 style="color:#0369a1;font-size:15px">3. PartnerStack</h3>
  <p><strong>Best for:</strong> Agency/affiliate/reseller partners.</p>
  <ul>
    <li>200%+ YoY partner revenue (Omnisend)</li>
    <li>45% of Keap customers via partners</li>
    <li>Mature SaaS: 30–50% of ARR from channel</li>
  </ul>
  <p><a href="https://partnerstack.com">partnerstack.com</a></p>

  <h3 style="color:#0369a1;font-size:15px">4. Conversion Interactive Agency</h3>
  <p>Trucking-native partner — 6× applications, 27% lower cost-per-hire (Lead Assist).</p>
  <p><a href="https://conversionia.com/lead-assist">conversionia.com/lead-assist</a></p>

  <h3 style="color:#0369a1;font-size:15px">5. CarrieX</h3>
  <p>FMCSA carrier database — 4.5M+ records for B2B trucking sales.</p>
  <p><a href="https://carriex.io">carriex.io</a></p>

  <h2 style="color:#0f172a;font-size:17px;margin-top:28px">Suggested combo</h2>
  <ol>
    <li><strong>HubSpot</strong> — inbound + CRM</li>
    <li><strong>Apollo.io</strong> — outbound</li>
    <li><strong>PartnerStack</strong> — partners (optional)</li>
    <li><strong>CarrieX</strong> — trucking lists (optional)</li>
  </ol>
  <p><strong>Budget:</strong> ~$1,200–2,500/mo vs custom AI + engineering.</p>

  <h2 style="color:#0f172a;font-size:17px;margin-top:28px">Replace in portal</h2>
  <ul>
    <li>SLT Marketing AI → HubSpot + Apollo</li>
    <li>Manual Resend from AI → HubSpot email</li>
    <li>3 PM lead report → HubSpot dashboard</li>
  </ul>

  <p style="margin-top:32px;font-size:13px;color:#64748b">FleetCo Management · fleetcomanagement.org</p>
</div>
`;

  const text = `FleetCo marketing platform recommendations

1. HubSpot — inbound + CRM (hubspot.com/roi)
2. Apollo.io — outbound (apollo.io)
3. PartnerStack — partners (partnerstack.com)
4. Conversion IA — trucking (conversionia.com)
5. CarrieX — FMCSA data (carriex.io)

Combo: HubSpot + Apollo (~$1,200–2,500/mo). Replace SLT Marketing AI.

— FleetCo Management`;

  return { subject, html, text };
}

export async function sendMarketingPlatformGuideEmail(to) {
  if (!to) throw new Error('Recipient email is required');
  const { subject, html, text } = marketingPlatformGuideContent();
  return sendEmail({
    to,
    subject,
    html,
    text,
    replyTo: 'support@fleetcomanagement.org',
  });
}

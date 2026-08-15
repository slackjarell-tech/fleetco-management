import { sendEmail } from './email.js';

const STEPS_HTML = `
<h2 style="color:#0f172a">Enable FleetCo AI (Groq) on Render</h2>
<p>Follow these steps so <strong>Ask FleetCo AI</strong>, marketing chat, and AI-personalized lead emails work in production.</p>
<ol style="line-height:1.8">
  <li>Open <a href="https://console.groq.com/keys">console.groq.com/keys</a> and sign in (Google or GitHub).</li>
  <li>Click <strong>Create API Key</strong> → copy the key (starts with <code>gsk_</code>).</li>
  <li>Open <a href="https://dashboard.render.com/web/srv-d96kuocvikkc73en5t3g/env">Render → fleetco-management → Environment</a>.</li>
  <li>Click <strong>Edit</strong> → find <code>GROQ_API_KEY</code> → paste the new key (no quotes).</li>
  <li>Optional: set <code>GROQ_MODEL</code> to <code>llama-3.1-8b-instant</code> (free tier default).</li>
  <li>Click <strong>Save, rebuild, and deploy</strong>.</li>
  <li>After deploy (~2 min), verify: <a href="https://fleetcomanagement.org/api/marketing-ai/status">/api/marketing-ai/status</a> should show <code>"healthy": true</code>.</li>
</ol>
<p><strong>Alternative:</strong> use <code>GEMINI_API_KEY</code> from Google AI Studio instead of Groq.</p>
<p><strong>Already working without Groq:</strong> lead nurture emails (Resend), autopilot scheduler, SLT daily lead report.</p>
<p style="color:#64748b;font-size:13px">FleetCo Management · Dallas, TX · support@fleetcomanagement.org</p>
`;

const STEPS_TEXT = `Enable FleetCo AI (Groq) on Render

1. Open https://console.groq.com/keys and sign in.
2. Create API Key — copy it (starts with gsk_).
3. Render → fleetco-management → Environment → Edit.
4. Set GROQ_API_KEY to the new key (no quotes).
5. Save, rebuild, and deploy.
6. Verify: https://fleetcomanagement.org/api/marketing-ai/status shows healthy: true.

Alternative: GEMINI_API_KEY from Google AI Studio.

Already live without Groq: 4-step lead nurture emails, autopilot scheduler, SLT daily reports.
`;

export async function sendGroqSetupEmail(to) {
  if (!to?.includes('@')) {
    return { success: false, error: 'invalid_recipient' };
  }
  return sendEmail({
    to,
    subject: 'FleetCo — Enable AI chat & marketing (Groq setup steps)',
    html: STEPS_HTML,
    text: STEPS_TEXT,
    replyTo: 'support@fleetcomanagement.org',
  });
}

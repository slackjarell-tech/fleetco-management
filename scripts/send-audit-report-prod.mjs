/**
 * Send portal-tab-audit-results.json via production sendSystemEmail (Resend on server).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TO = process.argv.find((a) => a.startsWith('--to='))?.split('=')[1] || 'jarell.slack@fleetcomanagement.org';
const BASE = 'https://fleetcomanagement.org';
const EMAIL = process.env.FLEETCO_AUDIT_LOGIN_EMAIL || 'admin@fleetco.com';
const PASS = process.env.FLEETCO_AUDIT_LOGIN_PASSWORD || 'admin123';
const RESULTS = path.join(__dirname, 'portal-tab-audit-results.json');

function buildHtml(report) {
  const broken = report.results.filter((r) => r.status === 'broken');
  const empty = report.results.filter((r) => r.status === 'empty');
  const manual = report.results.filter((r) => r.status === 'manual');
  const list = (items, title, color) => {
    if (!items.length) return `<p><strong>${title}:</strong> none</p>`;
    return `<h3 style="color:${color}">${title} (${items.length})</h3><ul>${items
      .map(
        (r) =>
          `<li><strong>${r.section} → ${r.label}</strong>: ${r.message}${r.detail ? ` (${r.detail})` : ''}</li>`,
      )
      .join('')}</ul>`;
  };
  return `<div style="font-family:system-ui,sans-serif;max-width:640px">
    <h1>FleetCo Portal Tab Audit</h1>
    <p>Generated ${report.generatedAt}<br/>Environment: ${report.base}</p>
    <p><strong>Summary:</strong> ${report.summary.ok} OK · ${report.summary.empty} empty · ${report.summary.broken} broken · ${report.summary.manual} manual</p>
    ${list(broken, 'Broken (fix first)', '#dc2626')}
    ${list(empty, 'Empty or thin data', '#d97706')}
    ${list(manual, 'Manual review', '#2563eb')}
    <p>Portal: <a href="${BASE}/login">${BASE}/login</a></p>
  </div>`;
}

function buildText(report) {
  const lines = [`FleetCo Portal Tab Audit — ${report.generatedAt}`, `Base: ${report.base}`, ''];
  for (const status of ['broken', 'empty', 'manual', 'ok']) {
    const items = report.results.filter((r) => r.status === status);
    lines.push(`=== ${status.toUpperCase()} (${items.length}) ===`);
    for (const r of items) {
      lines.push(`- [${r.section}] ${r.label}: ${r.message} ${r.detail || ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

async function main() {
  if (!fs.existsSync(RESULTS)) {
    console.error('Missing', RESULTS, '— run portal-tab-audit.mjs first');
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const loginData = await login.json();
  if (!login.ok) {
    console.error('Login failed:', loginData.error || login.status);
    process.exit(1);
  }
  const subject = `[FleetCo] Portal audit — ${report.summary.broken} broken, ${report.summary.empty} empty (production)`;
  const res = await fetch(`${BASE}/api/functions/sendSystemEmail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.access_token}`,
    },
    body: JSON.stringify({
      to: TO,
      subject,
      html: buildHtml(report),
      text: buildText(report),
    }),
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  if (!res.ok || !data.success) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

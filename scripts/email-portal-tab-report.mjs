/**
 * Run portal tab audit (optionally on production) and email summary.
 * Usage:
 *   node scripts/email-portal-tab-report.mjs [--production] [--no-seed]
 * Requires RESEND_API_KEY in .env or server env (see scripts/test-email-config.mjs).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { sendEmail, fileAttachment } from '../server/email.js';
import { BRAND } from '../marketing/brand.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const PRODUCTION = process.argv.includes('--production');
const TO = process.env.PORTAL_AUDIT_EMAIL_TO || 'jarell.slack@fleetcomanagement.org';
const RESULTS = path.join(__dirname, 'portal-tab-audit-results.json');

function buildReportHtml(report) {
  const broken = report.results.filter((r) => r.status === 'broken');
  const empty = report.results.filter((r) => r.status === 'empty');
  const manual = report.results.filter((r) => r.status === 'manual');
  const ok = report.results.filter((r) => r.status === 'ok');

  const row = (items, title, color) => {
    if (!items.length) return `<p><strong>${title}:</strong> none</p>`;
    return `
      <h3 style="color:${color};margin:16px 0 8px;">${title} (${items.length})</h3>
      <ul style="margin:0 0 12px;padding-left:20px;">
        ${items.map((r) => `<li><strong>${r.section} → ${r.label}</strong> — ${r.message}${r.detail ? ` <em>(${r.detail})</em>` : ''}</li>`).join('')}
      </ul>`;
  };

  return `
    <div style="font-family:system-ui,sans-serif;max-width:640px;color:#0f172a;">
      <h1 style="font-size:20px;">FleetCo Portal Tab Audit</h1>
      <p style="color:#64748b;font-size:14px;">Generated ${report.generatedAt}<br/>Environment: ${report.base}</p>
      <p style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:14px;">
        <strong>Summary:</strong> ${ok.length} OK · ${empty.length} empty/thin data · ${broken.length} broken API · ${manual.length} manual UI review
      </p>
      ${row(broken, 'Broken (fix first)', '#dc2626')}
      ${row(empty, 'Empty or thin data (UI may look blank)', '#d97706')}
      ${row(manual, 'Manual review needed', '#2563eb')}
      <h3 style="margin:16px 0 8px;">Stress seed / entity counts</h3>
      <pre style="background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;font-size:11px;overflow:auto;">${JSON.stringify(report.entityCounts, null, 2).slice(0, 8000)}</pre>
      <p style="font-size:13px;margin-top:20px;">
        Portal: <a href="${BRAND.url}/login">${BRAND.url}/login</a><br/>
        Re-run locally: <code>npm run audit:portal-tabs</code> · with email: <code>npm run audit:portal-tabs:email</code>
      </p>
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
  const auditArgs = ['node', 'scripts/portal-tab-audit.mjs'];
  if (PRODUCTION) auditArgs.push('--production');
  if (process.argv.includes('--no-seed')) auditArgs.push('--no-seed');

  console.log('Running audit:', auditArgs.join(' '));
  execSync(auditArgs.join(' '), { stdio: 'inherit', cwd: ROOT });

  if (!fs.existsSync(RESULTS)) {
    throw new Error('Audit did not write portal-tab-audit-results.json');
  }

  const report = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
  const subject = `[FleetCo] Portal audit — ${report.summary.broken} broken, ${report.summary.empty} empty (${PRODUCTION ? 'production' : 'local'})`;
  const html = buildReportHtml(report);
  const text = buildText(report);

  const attachments = [fileAttachment(RESULTS)];

  const result = await sendEmail({
    to: TO,
    subject,
    html,
    text,
    attachments,
  });

  if (result.success) {
    console.log('Report emailed to', TO, result.id || '');
  } else {
    console.error('Email failed:', result.reason || result.error || result);
    console.log('\n--- Report preview (text) ---\n', text.slice(0, 4000));
    process.exit(result.skipped ? 2 : 1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

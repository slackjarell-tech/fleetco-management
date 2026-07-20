/**
 * Generate FleetCo illustrated user manual PDF with live website screenshots.
 * Run: npm run marketing:manual
 *
 * Outputs:
 *   marketing/manual-frames/*.png (screenshots)
 *   public/marketing/FleetCo-User-Manual.pdf
 *   marketing/FleetCo-User-Manual.pdf
 *   %USERPROFILE%/Downloads/FleetCo-User-Manual.pdf
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FRAMES_DIR = path.join(ROOT, 'marketing', 'manual-frames');
const LEGACY_FRAMES = path.join(ROOT, 'marketing', 'video-frames');
const OUT_PATHS = [
  path.join(ROOT, 'public', 'marketing', 'FleetCo-User-Manual.pdf'),
  path.join(ROOT, 'marketing', 'FleetCo-User-Manual.pdf'),
  path.join(os.homedir(), 'Downloads', 'FleetCo-User-Manual.pdf'),
];

const BASE = process.env.SITE_URL || 'https://fleetcomanagement.org';
const TOKEN_KEY = 'fleet_pulse_access_token';
const NAVY = '#0F172A';
const AMBER = '#F59E0B';
const SLATE = '#64748B';

const BRAND = {
  company: 'FleetCo Management LLC',
  url: BASE,
  email: 'support@fleetcomanagement.org',
  phone: '(360) 952-1249',
};

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

/** Portal pages to capture (live). Fallback file = marketing/video-frames name without extension. */
const SHOTS = [
  { id: 'website-home', url: '/#platform-tour', caption: 'FleetCo public website — platform tour and client portal entry', fallback: '02-website-home' },
  { id: 'login', url: '/login', caption: 'Login screen — use your email and password from your administrator', public: true },
  { id: 'portal-dashboard', url: '/portal', caption: 'Admin dashboard — KPIs for fleet, loads, fuel, and maintenance', fallback: '05-portal-dashboard' },
  { id: 'portal-fleet', url: '/portal/fleet', caption: 'Fleet Units — manage trucks and trailers; open Specs & Parts on any unit', fallback: '07-portal-fleet' },
  { id: 'portal-loads', url: '/portal/loads', caption: 'Load Board — create and assign freight', fallback: '08-portal-loads' },
  { id: 'portal-maintenance', url: '/portal/maintenance', caption: 'Preventive maintenance schedules', fallback: '09-portal-maintenance' },
  { id: 'portal-parts', url: '/portal/parts', caption: 'Parts Inventory — stock levels, fitment tags, request POs', fallback: null },
  { id: 'portal-vehicle-lookup', url: '/portal/vehicle-lookup', caption: 'Vehicle Parts Research — VIN decode, recalls, accessories', fallback: null },
  { id: 'portal-accounting', url: '/portal/accounting', caption: 'Accounting Center — POs, payroll runs, general ledger, 1099', fallback: null },
  { id: 'portal-reports', url: '/portal/reports', caption: 'Reports Center — Excel/CSV exports and master data workbook', fallback: null },
  { id: 'portal-customers', url: '/portal/customers', caption: 'Customers & Team — portal logins and module access', fallback: '06-portal-customers' },
  { id: 'driver-home', url: '/driver', caption: 'Driver mobile app — clock, loads, dashcam, HOS', mobile: true, fallback: '12-driver-home' },
  { id: 'driver-clock', url: '/driver/clock', caption: 'Driver time clock — select vehicle before clock-in', mobile: true, fallback: '15-driver-clock' },
];

const LOGIN_ACCOUNTS = [
  { email: 'jarell.slack@fleetcomanagement.org', password: 'FleetCo2026!' },
  { email: 'admin@fleetco.com', password: 'admin123' },
];

async function apiLogin() {
  for (const acct of LOGIN_ACCOUNTS) {
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acct),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        console.log('Logged in as', acct.email);
        return data.access_token;
      }
    } catch {
      /* try next */
    }
  }
  throw new Error('Could not log in to capture portal screenshots');
}

function toDataUrl(filePath) {
  const buf = fs.readFileSync(filePath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function capturePage(page, { url, token, mobile, scrollTo }) {
  page.setDefaultNavigationTimeout(120000);
  if (mobile) {
    await page.setUserAgent(MOBILE_UA);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  } else {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  }

  let pathOnly = url;
  let hash = scrollTo || null;
  const hashIdx = url.indexOf('#');
  if (hashIdx >= 0) {
    pathOnly = url.slice(0, hashIdx) || '/';
    hash = hash || url.slice(hashIdx);
  }

  if (token) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.evaluate((key, t) => localStorage.setItem(key, t), TOKEN_KEY, token);
  }

  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 120000 });
  try {
    await page.waitForFunction(
      () => document.body && document.body.innerText.trim().length > 40,
      { timeout: 30000 },
    );
  } catch {
    await new Promise((r) => setTimeout(r, 3000));
  }

  if (hash) {
    try {
      await page.waitForSelector(hash, { timeout: 8000 });
      await page.evaluate((sel) => {
        document.querySelector(sel)?.scrollIntoView({ behavior: 'instant', block: 'center' });
      }, hash);
      await new Promise((r) => setTimeout(r, 1200));
    } catch {
      /* optional scroll target */
    }
  } else if (!mobile) {
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  await new Promise((r) => setTimeout(r, 2000));
  return page.screenshot({ type: 'png', fullPage: false });
}

async function captureAllShots(browser, token) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  const images = {};
  const page = await browser.newPage();

  for (const shot of SHOTS) {
    const outFile = path.join(FRAMES_DIR, `${shot.id}.png`);
    let ok = false;
    if (!shot.public) {
      try {
        const buf = await capturePage(page, {
          url: shot.url,
          token,
          mobile: shot.mobile,
        });
        fs.writeFileSync(outFile, buf);
        images[shot.id] = toDataUrl(outFile);
        console.log('Captured:', shot.id);
        ok = true;
      } catch (err) {
        console.warn(`Live capture failed for ${shot.id}:`, err.message);
      }
    } else {
      try {
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
        await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle2', timeout: 90000 });
        await new Promise((r) => setTimeout(r, 2000));
        const buf = await page.screenshot({ type: 'png' });
        fs.writeFileSync(outFile, buf);
        images[shot.id] = toDataUrl(outFile);
        console.log('Captured (public):', shot.id);
        ok = true;
      } catch (err) {
        console.warn(`Public capture failed for ${shot.id}:`, err.message);
      }
    }

    if (!ok && shot.fallback) {
      const legacy = path.join(LEGACY_FRAMES, `${shot.fallback}.png`);
      if (fs.existsSync(legacy)) {
        fs.copyFileSync(legacy, outFile);
        images[shot.id] = toDataUrl(outFile);
        console.log('Fallback frame:', shot.fallback, '→', shot.id);
      }
    }
  }

  await page.close();
  return images;
}

function fig(images, id, caption) {
  const src = images[id];
  if (!src) return '';
  return `<figure class="shot"><img src="${src}" alt=""/><figcaption>${caption}</figcaption></figure>`;
}

function styles() {
  return `
    @page { margin: 0.6in 0.65in; size: letter; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: ${NAVY}; font-size: 10pt; line-height: 1.48; margin: 0; }
    h1 { font-size: 24pt; font-weight: 900; margin: 0 0 8px; }
    h2 { font-size: 13pt; font-weight: 800; margin: 18px 0 8px; color: ${NAVY}; border-bottom: 2px solid ${AMBER}; padding-bottom: 3px; page-break-after: avoid; }
    h3 { font-size: 10.5pt; font-weight: 700; margin: 12px 0 5px; page-break-after: avoid; }
    p { margin: 0 0 8px; }
    ul, ol { margin: 0 0 10px 16px; padding: 0; }
    li { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 8px 0 12px; }
    th, td { border: 1px solid #E2E8F0; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #F1F5F9; font-weight: 700; }
    .cover {
      min-height: 9.2in; display: flex; flex-direction: column; justify-content: center;
      background: linear-gradient(135deg, ${NAVY} 0%, #1e293b 100%);
      color: white; padding: 1in; page-break-after: always; position: relative;
    }
    .cover-bar { width: 6px; height: 90px; background: ${AMBER}; position: absolute; left: 0.65in; top: 2.6in; border-radius: 3px; }
    .cover-kicker { color: ${AMBER}; font-size: 10pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; }
    .cover h1 { color: white; font-size: 28pt; }
    .cover-sub { font-size: 13pt; color: #CBD5E1; margin-top: 6px; max-width: 5.5in; }
    .cover-meta { margin-top: 40px; font-size: 10pt; color: #94A3B8; line-height: 1.7; }
    .cover-note { margin-top: 20px; font-size: 9pt; color: #64748B; }
    .toc { page-break-after: always; }
    .tip { background: #FFFBEB; border-left: 3px solid ${AMBER}; padding: 8px 10px; margin: 8px 0; font-size: 9pt; }
    .path { font-family: Consolas, monospace; font-size: 8.5pt; background: #F1F5F9; padding: 1px 5px; border-radius: 3px; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 8pt; color: ${SLATE}; text-align: center; }
    .chapter { page-break-before: always; }
    figure.shot { margin: 10px 0 14px; page-break-inside: avoid; text-align: center; }
    figure.shot img {
      width: 100%; max-height: 3.8in; object-fit: contain;
      border: 1px solid #CBD5E1; border-radius: 6px;
      box-shadow: 0 2px 8px rgba(15,23,42,.08);
    }
    figure.shot.mobile img { max-height: 4.5in; max-width: 2.4in; }
    figcaption { font-size: 8.5pt; color: ${SLATE}; margin-top: 5px; font-style: italic; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media print { figure.shot { break-inside: avoid; } }
  `;
}

function buildHtml(images) {
  const year = new Date().getFullYear();
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const f = (id, cap) => fig(images, id, cap || SHOTS.find((s) => s.id === id)?.caption || '');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${styles()}</style></head><body>
  <div class="cover">
    <div class="cover-bar"></div>
    <div class="cover-kicker">Illustrated Operations Guide</div>
    <h1>FleetCo Management<br/>User Manual</h1>
    <p class="cover-sub">Step-by-step instructions with screenshots from ${BRAND.url.replace('https://', '')} for fleet managers, parts staff, accounting, and drivers.</p>
    <div class="cover-meta">
      <strong>${BRAND.company}</strong><br/>
      ${BRAND.url}<br/>
      ${BRAND.email} · ${BRAND.phone}<br/><br/>
      Version ${year} · ${date}
    </div>
    <p class="cover-note">Screenshots captured from the live platform. Hard refresh the portal after updates to match the latest UI.</p>
  </div>

  <div class="toc">
    <h2>Table of Contents</h2>
    <ol>
      <li>Getting Started</li><li>Dashboard</li><li>Fleet Units &amp; Vehicle Specs</li>
      <li>Maintenance &amp; Work Orders</li><li>Parts &amp; Vehicle Research</li><li>Accounting Center</li>
      <li>Operations &amp; Loads</li><li>Drivers &amp; Time Clock</li><li>Reports</li>
      <li>Customers &amp; Team</li><li>Driver Mobile App</li><li>Quick Reference</li>
    </ol>
  </div>

  <div class="chapter">
    <h2>1. Getting Started</h2>
    ${f('website-home')}
    <p>Visit <strong>${BRAND.url}</strong> and click <strong>Client Portal</strong> or go to <span class="path">/login</span>.</p>
    ${f('login')}
    <ol>
      <li>Enter email and password from your administrator.</li>
      <li>Set a new password on first login (8+ characters).</li>
      <li>You arrive at the dashboard with the sidebar on the left.</li>
    </ol>
    <div class="tip">Bookmark the portal. Press <strong>Ctrl+Shift+R</strong> after platform updates.</div>
  </div>

  <div class="chapter">
    <h2>2. Dashboard</h2>
    ${f('portal-dashboard')}
    <p>The dashboard shows fleet KPIs: active vehicles, loads, fuel spend, maintenance due, and compliance alerts.</p>
    <p><strong>Customer view (FleetCo staff):</strong> use the dropdown under your name in the sidebar to preview a customer's scoped data.</p>
    <p><strong>Executive view:</strong> <span class="path">/portal/executive</span> · <strong>Customer Insights:</strong> <span class="path">/portal/customer-insights</span></p>
  </div>

  <div class="chapter">
    <h2>3. Fleet Units &amp; Vehicle Specs</h2>
    ${f('portal-fleet')}
    <p>Path: <span class="path">/portal/fleet</span>. Manage trucks and trailers.</p>
    <h3>Add a vehicle</h3>
    <ol>
      <li>Click <strong>Add Vehicle</strong> or <strong>Add Trailer</strong>.</li>
      <li>Enter unit #, make, model, year, VIN → <strong>Decode VIN</strong> for NHTSA specs and recalls.</li>
      <li>Save and assign driver/customer as needed.</li>
    </ol>
    <h3>Specs &amp; Parts (on each unit card)</h3>
    <p>Click the amber <strong>Specs &amp; Parts</strong> button for tabs: Specs, Recalls, Parts (inventory + RockAuto link), Service Tasks (AutoZone guides), Equipment (crane/welder serials).</p>
    <p>Also use <strong>History</strong>, <strong>Docs</strong>, and <strong>Manuals</strong> on each card.</p>
  </div>

  <div class="chapter">
    <h2>4. Maintenance &amp; Work Orders</h2>
    ${f('portal-maintenance')}
    <ul>
      <li><span class="path">/portal/maintenance</span> — PM schedules by date/mileage</li>
      <li><span class="path">/portal/workorders</span> — repair jobs with tasks and parts</li>
      <li><span class="path">/portal/calendar</span> — calendar view</li>
      <li><span class="path">/portal/service-templates</span> — reusable task checklists</li>
    </ul>
  </div>

  <div class="chapter">
    <h2>5. Parts &amp; Vehicle Research</h2>
    ${f('portal-parts')}
    <p>Track stock, reorder points, vendor, and <strong>fitment fields</strong> (compatible makes/models). Click <strong>Request PO</strong> to start a purchase order.</p>
    ${f('portal-vehicle-lookup')}
    <p><strong>VIN Lookup</strong> — decode VIN, see parts, maintenance, recalls, accessories.</p>
    <p><strong>Serial / Warranty</strong> — find equipment by brand and serial number.</p>
  </div>

  <div class="chapter">
    <h2>6. Accounting Center</h2>
    ${f('portal-accounting')}
    <table>
      <tr><th>Tab</th><th>Purpose</th></tr>
      <tr><td>Purchase Orders</td><td>Submit → approve → Issue PO &amp; email vendor → receive into inventory</td></tr>
      <tr><td>Payroll Runs</td><td>Import Time Clock hours → batch run → post (GL entry)</td></tr>
      <tr><td>General Ledger</td><td>Chart of accounts + auto journal entries</td></tr>
      <tr><td>Tax Center</td><td>Estimates + 1099-NEC CSV export</td></tr>
    </table>
    <div class="tip">PO emails require RESEND_API_KEY on the server. Tax figures are estimates — use a CPA for filing.</div>
  </div>

  <div class="chapter">
    <h2>7. Operations &amp; Loads</h2>
    ${f('portal-loads')}
    <p>Create loads, assign driver/truck/trailer, track status. Also: PD Command Tower, Route Builder, Fleet Map, Yard Management.</p>
  </div>

  <div class="chapter">
    <h2>8. Drivers &amp; Time Clock</h2>
    <p><span class="path">/portal/drivers</span> — roster and scorecards.</p>
    <p><span class="path">/portal/timeclock</span> — clock in with vehicle selection; hours import into Accounting payroll.</p>
    <p><span class="path">/portal/payroll</span> — individual pay records; use Accounting for batch runs.</p>
  </div>

  <div class="chapter">
    <h2>9. Reports</h2>
    ${f('portal-reports')}
    <p>Download Excel/CSV per report or run the <strong>FleetCo Master Data Export</strong> (multi-sheet workbook). FleetCo staff can scope by customer via the view switcher.</p>
  </div>

  <div class="chapter">
    <h2>10. Customers &amp; Team</h2>
    ${f('portal-customers')}
    <p>Add customers, create portal logins (owner, fleet manager, HR, parts manager, drivers), configure sidebar modules, send password resets.</p>
  </div>

  <div class="chapter">
    <h2>11. Driver Mobile App</h2>
    <div class="two-col">
      <figure class="shot mobile">${images['driver-home'] ? `<img src="${images['driver-home']}" alt=""/>` : ''}<figcaption>Driver home</figcaption></figure>
      <figure class="shot mobile">${images['driver-clock'] ? `<img src="${images['driver-clock']}" alt=""/>` : ''}<figcaption>Time clock</figcaption></figure>
    </div>
    <p>Drivers use <span class="path">${BRAND.url}/driver</span> on their phone: loads, dashcam, scan, HOS, inspections, navigation.</p>
  </div>

  <div class="chapter">
    <h2>12. Quick Reference</h2>
    <table>
      <tr><th>Task</th><th>Location</th></tr>
      <tr><td>Vehicle specs &amp; recalls</td><td>Fleet → unit → Specs &amp; Parts</td></tr>
      <tr><td>VIN parts lookup</td><td>Maintenance → Vehicle Parts Research</td></tr>
      <tr><td>Issue parts PO</td><td>Accounting → Purchase Orders</td></tr>
      <tr><td>Payroll from clock</td><td>Accounting → Import Time Clock</td></tr>
      <tr><td>Export reports</td><td>Finance → Reports</td></tr>
      <tr><td>Online manual</td><td>${BRAND.url}/system-manual</td></tr>
    </table>
    <p>Support: <strong>${BRAND.email}</strong> · <strong>${BRAND.phone}</strong></p>
    <div class="footer">© ${year} ${BRAND.company} · Screenshots from ${date}</div>
  </div>
</body></html>`;
}

async function main() {
  for (const out of OUT_PATHS) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  let token = null;
  try {
    token = await apiLogin();
  } catch (err) {
    console.warn('Login failed — using fallback frames only:', err.message);
  }

  const images = await captureAllShots(browser, token);
  const html = buildHtml(images);

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load', timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1500));

  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.6in', right: '0.65in', bottom: '0.6in', left: '0.65in' },
  });
  await browser.close();

  for (const out of OUT_PATHS) {
    fs.writeFileSync(out, pdfBuffer);
    console.log('Wrote:', out);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

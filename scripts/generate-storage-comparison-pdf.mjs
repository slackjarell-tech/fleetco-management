/**
 * Generate FleetCo cloud storage comparison PDF.
 * Run: node scripts/generate-storage-comparison-pdf.mjs
 *
 * Output: public/marketing/FleetCo-Cloud-Storage-Comparison.pdf
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'marketing');
const MARKETING_DIR = path.join(__dirname, '..', 'marketing');

const NAVY = '#0F172A';
const AMBER = '#F59E0B';
const SLATE = '#64748B';
const LIGHT = '#F8FAFC';
const GREEN = '#059669';
const RED = '#DC2626';

function baseStyles() {
  return `
    @page { margin: 0.6in 0.65in; size: letter; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: ${NAVY};
      font-size: 10.5pt;
      line-height: 1.45;
      margin: 0;
    }
    h1 { font-size: 22pt; margin: 0 0 6px; color: ${NAVY}; }
    h2 { font-size: 13pt; margin: 22px 0 8px; color: ${NAVY}; border-bottom: 2px solid ${AMBER}; padding-bottom: 4px; }
    h3 { font-size: 11pt; margin: 14px 0 6px; color: ${NAVY}; }
    p { margin: 0 0 8px; }
    .subtitle { color: ${SLATE}; font-size: 11pt; margin-bottom: 16px; }
    .badge { display: inline-block; background: ${AMBER}; color: ${NAVY}; font-weight: 700; font-size: 9pt; padding: 3px 10px; border-radius: 4px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 14px; font-size: 9.5pt; }
    th { background: ${NAVY}; color: white; text-align: left; padding: 7px 8px; font-weight: 600; }
    td { border: 1px solid #E2E8F0; padding: 6px 8px; vertical-align: top; }
    tr:nth-child(even) td { background: ${LIGHT}; }
    .win { color: ${GREEN}; font-weight: 700; }
    .warn { color: ${RED}; font-weight: 600; }
    .note { background: #FFFBEB; border-left: 4px solid ${AMBER}; padding: 10px 12px; margin: 12px 0; font-size: 9.5pt; }
    .rec { background: #ECFDF5; border-left: 4px solid ${GREEN}; padding: 10px 12px; margin: 12px 0; font-size: 9.5pt; }
    ul { margin: 6px 0 10px; padding-left: 18px; }
    li { margin-bottom: 4px; }
    .footer-note { margin-top: 24px; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 8.5pt; color: ${SLATE}; text-align: center; }
    .page-break { page-break-before: always; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .card { border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px; }
    .card h3 { margin-top: 0; }
  `;
}

function comparisonHtml() {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>FleetCo Cloud Storage Comparison</title>
  <style>${baseStyles()}</style></head><body>

  <div class="badge">Internal · Architecture &amp; Infrastructure</div>
  <h1>Cloud Storage Comparison</h1>
  <p class="subtitle">FleetCo Management LLC · Object storage options for dashcam media, uploads &amp; fleet files · ${date}</p>

  <h2>Executive summary</h2>
  <p>FleetCo currently stores <strong>business records</strong> in Render PostgreSQL (cloud) but saves <strong>photos and dashcam JPEGs</strong> on the web server disk (<code>server/uploads/</code>), which is not durable and does not scale. This document compares leading object storage providers to support a phased migration.</p>

  <div class="rec">
    <strong>Recommendation:</strong> Move file/media storage to object storage immediately (AWS S3, Google Cloud Storage, or Cloudflare R2). Keep the app on Render + Postgres for now. Add 30–90 day dashcam retention. Upgrade database architecture only when entity count or performance requires it.
  </div>

  <h2>Current FleetCo storage (baseline)</h2>
  <table>
    <tr><th>Layer</th><th>Location</th><th>Durable?</th><th>Scales?</th></tr>
    <tr><td>Users, customers, loads, vehicles, dashcam metadata</td><td>Render PostgreSQL (<code>fleetco-db</code>)</td><td class="win">Yes</td><td>Moderate — single JSON blob in Postgres</td></tr>
    <tr><td>JSON backup mirror</td><td>1 GB Render persistent disk (<code>server/data</code>)</td><td class="win">Yes</td><td>Limited to 1 GB disk</td></tr>
    <tr><td>Dashcam JPEGs, POD photos, receipts, PDFs</td><td><code>server/uploads/</code> (ephemeral web disk)</td><td class="warn">No</td><td class="warn">Poor — lost on redeploy, fills quickly</td></tr>
    <tr><td>Driver offline queue</td><td>Phone IndexedDB / localStorage</td><td>Temporary</td><td>Until sync completes</td></tr>
    <tr><td>Safety AI analysis</td><td>Gemini API (external) → alerts in Postgres</td><td>Yes (alerts only)</td><td>Depends on API limits</td></tr>
  </table>

  <div class="note">
    <strong>Dashcam math:</strong> At ~300 KB per JPEG and 1 frame/second, one driver generates ~1 GB/hour. Without retention policies, storage and cost grow rapidly on any platform.
  </div>

  <h2>Providers compared (2026 list pricing, US regions)</h2>
  <table>
    <tr>
      <th>Factor</th>
      <th>AWS S3</th>
      <th>Google Cloud Storage</th>
      <th>Cloudflare R2</th>
      <th>Backblaze B2</th>
    </tr>
    <tr>
      <td>Hot storage ($/GB/mo)</td>
      <td>~$0.023</td>
      <td>~$0.020</td>
      <td>~$0.015</td>
      <td>~$0.007</td>
    </tr>
    <tr>
      <td>Internet egress ($/GB)</td>
      <td class="win">~$0.09 (100 GB/mo free)</td>
      <td>~$0.12 (100 GB/mo free)</td>
      <td class="win">$0.00</td>
      <td>~$0.01 (free up to 3× stored)</td>
    </tr>
    <tr>
      <td>PUT requests (per 1K)</td>
      <td>~$0.005</td>
      <td>~$0.05</td>
      <td>~$4.50 per million Class A</td>
      <td>Free</td>
    </tr>
    <tr>
      <td>GET requests (per 1K)</td>
      <td>~$0.0004</td>
      <td>~$0.004</td>
      <td>~$0.36 per million Class B</td>
      <td>Free</td>
    </tr>
    <tr>
      <td>Archive / cold tier</td>
      <td>Glacier Deep Archive ~$0.001/GB</td>
      <td>Archive ~$0.0012/GB</td>
      <td>Single tier only</td>
      <td>Single hot tier</td>
    </tr>
    <tr>
      <td>Lifecycle auto-delete</td>
      <td class="win">Yes — mature</td>
      <td class="win">Yes</td>
      <td class="win">Yes</td>
      <td>Limited</td>
    </tr>
    <tr>
      <td>Signed / private URLs</td>
      <td class="win">Yes</td>
      <td class="win">Yes</td>
      <td class="win">Yes</td>
      <td class="win">Yes</td>
    </tr>
    <tr>
      <td>Market adoption / hiring</td>
      <td class="win">Industry standard</td>
      <td>Strong (GCP / ML)</td>
      <td>Growing (S3-compatible)</td>
      <td>Niche / backup</td>
    </tr>
    <tr>
      <td>S3-compatible API</td>
      <td>Native</td>
      <td>No (GCS API)</td>
      <td class="win">Yes</td>
      <td class="win">Yes</td>
    </tr>
  </table>

  <div class="page-break"></div>

  <h2>AWS S3 — benefits &amp; trade-offs</h2>
  <div class="two-col">
    <div class="card">
      <h3>Benefits</h3>
      <ul>
        <li>Most widely used object store — largest ecosystem of tools, docs, and consultants</li>
        <li>Lower egress than GCS (~25% cheaper at scale) — important when fleet managers view dashcam in portal</li>
        <li>Eight storage classes (Standard → Glacier Deep Archive) for cost optimization</li>
        <li>Mature lifecycle rules — auto-delete dashcam after N days</li>
        <li>Natural path if FleetCo later adopts RDS, Lambda, or broader AWS stack</li>
        <li>Works from Render app via AWS SDK with minimal friction</li>
      </ul>
    </div>
    <div class="card">
      <h3>Trade-offs</h3>
      <ul>
        <li>IAM and bucket policies have a learning curve</li>
        <li>Total cost driven by egress + requests, not storage alone</li>
        <li>Separate vendor from Gemini (Google AI) — cross-cloud if AI reads from S3</li>
        <li>Does not fix Postgres JSON blob architecture — files only</li>
      </ul>
      <p><strong>Best for FleetCo when:</strong> you want the safest default, lower image delivery cost, and maximum portability.</p>
    </div>
  </div>

  <h2>Google Cloud Storage — benefits &amp; trade-offs</h2>
  <div class="two-col">
    <div class="card">
      <h3>Benefits</h3>
      <ul>
        <li>Slightly cheaper hot storage (~$0.020/GB) than S3 Standard</li>
        <li>Same Google Cloud console/billing as <strong>Gemini Safety AI</strong> (already in FleetCo stack)</li>
        <li>Easy pipeline: GCS image → Gemini vision without cross-cloud transfer fees</li>
        <li>Strong for future ML, BigQuery analytics on fleet data</li>
        <li>Clear tier ladder: Standard → Nearline → Coldline → Archive</li>
        <li>Enterprise-grade durability and IAM</li>
      </ul>
    </div>
    <div class="card">
      <h3>Trade-offs</h3>
      <ul>
        <li>Highest egress of the hyperscalers (~$0.12/GB) — costly if portal loads many images</li>
        <li>Not S3-native — separate SDK vs AWS tooling</li>
        <li>Smaller third-party integration surface than S3</li>
        <li>Operation pricing can spike on list-heavy workloads</li>
      </ul>
      <p><strong>Best for FleetCo when:</strong> Google (Gemini, ML) is the long-term AI platform and egress volume stays moderate.</p>
    </div>
  </div>

  <h2>Cloudflare R2 — why it matters for FleetCo</h2>
  <p>R2 is often the best fit for <strong>photo-heavy apps viewed often in a web portal</strong> because it charges <strong>$0 egress</strong> to the internet (via Cloudflare network). API is S3-compatible — minimal code change from an S3 integration.</p>
  <table>
    <tr><th>Pros</th><th>Cons</th></tr>
    <tr>
      <td>Zero egress — fleet managers reviewing dashcam won't drive large bandwidth bills</td>
      <td>Single storage tier — no Glacier-style deep archive</td>
    </tr>
    <tr>
      <td>Lower storage than S3 (~$0.015/GB)</td>
      <td>Smaller ecosystem than AWS/GCP</td>
    </tr>
    <tr>
      <td>S3-compatible — reuse AWS SDK patterns</td>
      <td>Another vendor alongside Render + Postgres</td>
    </tr>
  </table>

  <h2>Cost scenarios (estimated monthly, US list pricing)</h2>
  <table>
    <tr><th>Scenario</th><th>Stored</th><th>Egress (viewed)</th><th>AWS S3</th><th>GCS</th><th>Cloudflare R2</th></tr>
    <tr><td>Early stage (light dashcam)</td><td>50 GB</td><td>20 GB/mo</td><td>~$3</td><td>~$3</td><td>~$1</td></tr>
    <tr><td>Growing fleet (moderate)</td><td>500 GB</td><td>200 GB/mo</td><td>~$30</td><td>~$34</td><td>~$8</td></tr>
    <tr><td>Heavy live dashcam (10 drivers, 2 hr/day each)</td><td>2 TB</td><td>800 GB/mo</td><td>~$118</td><td>~$136</td><td>~$30</td></tr>
    <tr><td>Heavy + no retention (worst case)</td><td>10 TB+</td><td>2 TB/mo</td><td>$500+</td><td>$600+</td><td>~$150+</td></tr>
  </table>
  <p><em>Estimates exclude API request fees and assume Standard/hot tiers. Retention policies dramatically reduce the "heavy" scenarios.</em></p>

  <div class="page-break"></div>

  <h2>Decision matrix for FleetCo</h2>
  <table>
    <tr><th>Priority</th><th>Recommended choice</th><th>Reason</th></tr>
    <tr><td>Fastest fix, lowest risk</td><td><strong>AWS S3</strong></td><td>Industry default, great docs, lifecycle rules, lower egress than GCS</td></tr>
    <tr><td>Align with Gemini / Safety AI</td><td><strong>Google Cloud Storage</strong></td><td>Same cloud as vision AI; simpler future ML pipelines</td></tr>
    <tr><td>Minimize portal viewing cost</td><td><strong>Cloudflare R2</strong></td><td>Zero egress — ideal for dashcam review UI</td></tr>
    <tr><td>Cheapest raw storage</td><td><strong>Backblaze B2</strong></td><td>~$0.007/GB but less enterprise polish</td></tr>
    <tr><td>Keep everything on Render only</td><td class="warn">Not recommended</td><td>Uploads on ephemeral disk — data loss and crash risk</td></tr>
    <tr><td>Full migration to AWS now</td><td>Defer</td><td>Overkill — move files first, app can stay on Render</td></tr>
  </table>

  <h2>Phased roadmap (recommended)</h2>
  <table>
    <tr><th>Phase</th><th>Timeline</th><th>Action</th><th>Outcome</th></tr>
    <tr><td>1</td><td>Now</td><td>Object storage for all uploads (S3, GCS, or R2)</td><td>Durable media; survives redeploy</td></tr>
    <tr><td>1</td><td>Now</td><td>Dashcam retention policy (30–90 days)</td><td>Predictable cost; compliance-friendly</td></tr>
    <tr><td>2</td><td>3–6 mo</td><td>Upgrade Render Postgres + RAM as customers grow</td><td>Stable performance</td></tr>
    <tr><td>3</td><td>6–12 mo</td><td>Split JSON blob or migrate to dedicated Postgres schema / RDS</td><td>Scales past thousands of entities</td></tr>
    <tr><td>4</td><td>As needed</td><td>True video streaming (WebRTC) + queue-based AI</td><td>Only if live dashcam becomes core product</td></tr>
  </table>

  <h2>Security &amp; compliance checklist</h2>
  <ul>
    <li><strong>Private buckets</strong> — no public read; serve via signed URLs with expiry</li>
    <li><strong>Encryption at rest</strong> — enabled by default on S3 and GCS</li>
    <li><strong>Customer scoping</strong> — prefix objects by <code>customer_id</code> / session</li>
    <li><strong>Retention</strong> — document how long dashcam and cabin camera data is kept</li>
    <li><strong>Driver consent</strong> — in-cabin camera requires clear fleet policy (varies by state)</li>
    <li><strong>Access control</strong> — only authorized portal roles view Driver Media (already role-scoped)</li>
  </ul>

  <h2>One-line for leadership</h2>
  <div class="rec">
    "Our business data is already in cloud Postgres on Render. The gap is driver media — dashcam files on server disk won't scale and can be lost on redeploy. Move files to S3, GCS, or R2 with a 90-day retention policy now; keep the app on Render until we outgrow the database design."
  </div>

  <div class="footer-note">
    FleetCo Management LLC · fleetcomanagement.org · Confidential internal architecture brief · Generated ${date}
  </div>
  </body></html>`;
}

async function htmlToPdf(browser, html, outPath) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
  });
  await page.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(MARKETING_DIR, { recursive: true });

  const filename = 'FleetCo-Cloud-Storage-Comparison.pdf';
  const publicPath = path.join(OUT_DIR, filename);
  const marketingPath = path.join(MARKETING_DIR, filename);

  console.log('Generating FleetCo cloud storage comparison PDF…');
  const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH
    || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  const html = comparisonHtml();
  await htmlToPdf(browser, html, publicPath);
  fs.copyFileSync(publicPath, marketingPath);
  await browser.close();

  const stat = fs.statSync(publicPath);
  console.log(`✓ ${filename} (${(stat.size / 1024).toFixed(0)} KB)`);
  console.log(`  Public: ${publicPath}`);
  console.log(`  Copy:   ${marketingPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

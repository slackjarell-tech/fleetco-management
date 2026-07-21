/**
 * Generate FleetCo business plan and revenue PDFs.
 * Run: npm run marketing:plan
 *
 * Outputs:
 *   public/marketing/FleetCo-Business-Plan.pdf
 *   public/marketing/FleetCo-Revenue-Projections-10Year.pdf
 *   public/marketing/FleetCo-Revenue-PandL-Scenarios.pdf
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BRAND } from '../marketing/brand.js';
import { BUSINESS_PLAN } from '../marketing/business-plan.mjs';
import {
  BASE_PROJECTION,
  SCENARIOS_Y5,
  SCENARIOS_Y10,
  ASSUMPTIONS,
  SHOP_ASSUMPTIONS,
  SHOP_PROJECTION,
  COMBINED_PROJECTION,
  PRICING,
  CUMULATIVE_REVENUE,
  CUMULATIVE_COMBINED_REVENUE,
  MILESTONES,
  formatCurrency,
  formatPct,
  ebitdaMargin,
} from '../marketing/financial-model.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'marketing');
const MARKETING_DIR = path.join(__dirname, '..', 'marketing');

const NAVY = '#0F172A';
const AMBER = '#F59E0B';
const SLATE = '#64748B';
const LIGHT = '#F8FAFC';
const RED = '#DC2626';
const GREEN = '#059669';

function baseStyles() {
  return `
    @page { margin: 0.65in 0.7in; size: letter; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: ${NAVY};
      font-size: 10.5pt;
      line-height: 1.55;
      margin: 0;
    }
    h1 { font-size: 26pt; font-weight: 900; margin: 0 0 8px; line-height: 1.15; }
    h2 { font-size: 14pt; font-weight: 800; margin: 28px 0 10px; color: ${NAVY}; border-bottom: 2px solid ${AMBER}; padding-bottom: 4px; }
    h3 { font-size: 11pt; font-weight: 700; margin: 16px 0 6px; color: ${NAVY}; }
    p { margin: 0 0 10px; }
    ul, ol { margin: 0 0 12px 18px; padding: 0; }
    li { margin-bottom: 5px; }
    .cover {
      min-height: 9.5in;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: linear-gradient(135deg, ${NAVY} 0%, #1e293b 100%);
      color: white;
      padding: 1.2in 1in;
      page-break-after: always;
      position: relative;
    }
    .cover-bar { width: 6px; height: 100px; background: ${AMBER}; position: absolute; left: 0.7in; top: 2.8in; border-radius: 3px; }
    .cover-kicker { color: ${AMBER}; font-size: 11pt; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; }
    .cover h1 { color: white; font-size: 32pt; }
    .cover-sub { font-size: 14pt; color: #CBD5E1; margin-top: 8px; max-width: 5.5in; }
    .cover-meta { margin-top: 48px; font-size: 10pt; color: #94A3B8; }
    .cover-contact { margin-top: 24px; font-size: 11pt; color: ${AMBER}; font-weight: 700; }
    .confidential { color: #FCA5A5; font-size: 9pt; margin-top: 32px; text-transform: uppercase; letter-spacing: 0.1em; }
    .footer-note {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
      font-size: 8.5pt;
      color: ${SLATE};
      text-align: center;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5pt;
      color: ${SLATE};
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 6px;
      margin-bottom: 20px;
    }
    .page-header strong { color: ${NAVY}; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin: 12px 0 20px;
    }
    th {
      background: ${NAVY};
      color: white;
      text-align: left;
      padding: 8px 10px;
      font-weight: 700;
    }
    th.num, td.num { text-align: right; }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #E2E8F0;
    }
    tr:nth-child(even) td { background: ${LIGHT}; }
    tr.total td { font-weight: 800; background: #FEF3C7 !important; border-top: 2px solid ${AMBER}; }
    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin: 16px 0 24px;
    }
    .metric-card {
      background: ${LIGHT};
      border: 1px solid #E2E8F0;
      border-left: 4px solid ${AMBER};
      padding: 14px;
      border-radius: 6px;
    }
    .metric-card .label { font-size: 8.5pt; color: ${SLATE}; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .metric-card .value { font-size: 18pt; font-weight: 900; color: ${NAVY}; margin-top: 4px; }
    .metric-card .sub { font-size: 8.5pt; color: ${SLATE}; margin-top: 2px; }
    .callout {
      background: ${LIGHT};
      border-left: 4px solid ${AMBER};
      padding: 12px 14px;
      margin: 12px 0;
      border-radius: 0 6px 6px 0;
    }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .badge { display: inline-block; background: ${AMBER}; color: ${NAVY}; font-size: 8pt; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
    .positive { color: ${GREEN}; font-weight: 700; }
    .negative { color: ${RED}; font-weight: 700; }
    .section-break { page-break-before: always; }
    .chart-bar-wrap { margin: 8px 0; }
    .chart-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; font-size: 9pt; }
    .chart-label { width: 36px; font-weight: 700; }
    .chart-bar-bg { flex: 1; background: #E2E8F0; height: 18px; border-radius: 4px; overflow: hidden; }
    .chart-bar-fill { height: 100%; background: linear-gradient(90deg, ${AMBER}, #FBBF24); border-radius: 4px; }
    .chart-val { width: 70px; text-align: right; font-weight: 700; }
  `;
}

function pageHeader(docTitle) {
  return `<div class="page-header"><strong>${BRAND.shortName}</strong><span>${docTitle} · ${BUSINESS_PLAN.preparedDate}</span></div>`;
}

function coverHtml({ kicker, title, subtitle, extra = '' }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyles()}</style></head><body>
    <div class="cover">
      <div class="cover-bar"></div>
      <div class="cover-kicker">${kicker}</div>
      <h1>${title}</h1>
      <div class="cover-sub">${subtitle}</div>
      <div class="cover-contact">${BRAND.website} · ${BRAND.phone} · ${BRAND.email}</div>
      <div class="cover-meta">${BRAND.company} · ${BRAND.location} · Founded 2022</div>
      <div class="confidential">${BUSINESS_PLAN.confidential}</div>
      ${extra}
    </div>`;
}

function businessPlanHtml() {
  const bp = BUSINESS_PLAN;
  const maxRev = BASE_PROJECTION[9].annualRevenue;
  const chartBars = BASE_PROJECTION.map((row) => {
    const pct = Math.round((row.annualRevenue / maxRev) * 100);
    return `<div class="chart-row"><span class="chart-label">Y${row.year}</span><div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${pct}%"></div></div><span class="chart-val">${formatCurrency(row.annualRevenue, true)}</span></div>`;
  }).join('');

  const pricingRows = bp.productsAndServices.pricing.map((p) =>
    `<tr><td><strong>${p.name}</strong></td><td>${p.label || `$${p.monthly}/mo`}</td><td>${p.fleetMax ? `Up to ${p.fleetMax} vehicles` : '16+ vehicles'}</td></tr>`
  ).join('');

  const segmentRows = bp.marketAnalysis.segments.map((s) =>
    `<tr><td>${s.name}</td><td>${s.size}</td><td>${s.tier}</td><td>${s.need}</td></tr>`
  ).join('');

  const milestoneItems = bp.milestones.map((m) => `<li><strong>${m.when}:</strong> ${m.metric}</li>`).join('');

  const finSummaryRows = BASE_PROJECTION.map((row) =>
    `<tr><td>Y${row.year} (${row.calendar})</td><td class="num">${row.customersEoy}</td><td class="num">${formatCurrency(row.annualRevenue, true)}</td><td class="num">${formatCurrency(row.arrEoy, true)}</td><td class="num">${formatPct(row.yoyGrowthPct)}</td></tr>`
  ).join('');

  const combinedFinRows = COMBINED_PROJECTION.map((row) =>
    `<tr><td>Y${row.year} (${row.calendar})</td><td class="num">${formatCurrency(row.saasRevenue, true)}</td><td class="num">${formatCurrency(row.shopRevenue, true)}</td><td class="num"><strong>${formatCurrency(row.annualRevenue, true)}</strong></td><td class="num">${row.locationsEoy}</td></tr>`
  ).join('');

  const fsiServiceRows = bp.productsAndServices.fsiShopServices.map((s) =>
    `<tr><td><strong>${s.name}</strong></td><td>${s.pricing}</td><td>${s.desc}</td></tr>`
  ).join('');

  const shopPhaseRows = bp.shopIntegration.expansionModel.map((p) =>
    `<tr><td><span class="badge">${p.phase}</span></td><td>${p.detail}</td></tr>`
  ).join('');

  const revenueStreamRows = bp.revenueModel.streams.map((s) =>
    `<tr><td><strong>${s.name}</strong></td><td>${s.desc}</td></tr>`
  ).join('');

  const roadmapRows = bp.roadmap.map((r) =>
    `<tr><td><strong>${r.when}</strong></td><td>${r.item}</td></tr>`
  ).join('');

  const orgRows = [
    ...bp.teamAndOrg.leadership.map((l) => `<tr><td>Leadership</td><td>${l}</td></tr>`),
    `<tr><td>FleetCo</td><td>${bp.teamAndOrg.fleetCoFunctions.join(' · ')}</td></tr>`,
    `<tr><td>${SHOP_ASSUMPTIONS.entity}</td><td>${bp.teamAndOrg.fsiFunctions.join(' · ')}</td></tr>`,
  ].join('');

  return `${coverHtml({
    kicker: 'Integrated Business Plan',
    title: 'FleetCo + FSI',
    subtitle: bp.subtitle,
  })}
  ${pageHeader('Business Plan')}

  <h2>1. Executive Summary</h2>
  ${bp.executiveSummary.map((p) => `<p>${p}</p>`).join('')}

  <div class="metric-grid">
    <div class="metric-card"><div class="label">Year 10 SaaS ARR</div><div class="value">${formatCurrency(BASE_PROJECTION[9].arrEoy, true)}</div><div class="sub">780 customers · base case</div></div>
    <div class="metric-card"><div class="label">Year 10 Combined Revenue</div><div class="value">${formatCurrency(COMBINED_PROJECTION[9].annualRevenue, true)}</div><div class="sub">${SHOP_PROJECTION[9].locationsEoy} FSI locations</div></div>
    <div class="metric-card"><div class="label">10-Year Combined</div><div class="value">${formatCurrency(CUMULATIVE_COMBINED_REVENUE, true)}</div><div class="sub">SaaS ${formatCurrency(CUMULATIVE_REVENUE, true)} + shops</div></div>
  </div>

  <h2>2. Corporate Structure</h2>
  <p>${bp.corporateStructure.overview}</p>
  <div class="two-col">
    <div class="callout"><strong>FleetCo Management LLC</strong><br/>${bp.corporateStructure.fleetCoRole}</div>
    <div class="callout"><strong>${SHOP_ASSUMPTIONS.entity}</strong><br/>${bp.corporateStructure.fsiRole}</div>
    <div class="callout"><strong>FSI corporate (fleetservicesint.com)</strong><br/>${bp.corporateStructure.fsiCorporateRole}</div>
  </div>
  <p><strong>Customer promise:</strong> ${bp.corporateStructure.customerPromise}</p>

  <h2>3. Company Overview</h2>
  <div class="two-col">
    <div>
      <p><strong>SaaS entity:</strong> ${bp.companyOverview.legalName}</p>
      <p><strong>FSI dealer entity:</strong> ${bp.companyOverview.affiliateEntity}</p>
      <p><strong>Headquarters:</strong> ${bp.companyOverview.headquarters}</p>
      <p><strong>Founded:</strong> ${bp.companyOverview.founded}</p>
      <p><strong>Ownership:</strong> ${bp.companyOverview.ownership}</p>
    </div>
    <div>
      <p><strong>Website:</strong> ${bp.companyOverview.website}</p>
      <p><strong>Contact:</strong> ${bp.companyOverview.contact}</p>
    </div>
  </div>
  <h3>Mission</h3><p>${bp.companyOverview.mission}</p>
  <h3>Vision</h3><p>${bp.companyOverview.vision}</p>
  <h3>Core Values</h3><ul>${bp.companyOverview.values.map((v) => `<li>${v}</li>`).join('')}</ul>
  ${bp.companyOverview.affiliateEntityNote ? `<div class="callout"><strong>Entity note:</strong> ${bp.companyOverview.affiliateEntityNote}</div>` : ''}

  <h2>3a. Online research — verified vs assumptions</h2>
  <p><em>Researched ${bp.onlineResearch.researchedAt}. Full memo: ${bp.onlineResearch.researchDoc}</em></p>
  <div class="callout"><strong>Integrated stack:</strong> ${bp.onlineResearch.integratedStack}</div>
  <h3>Verified — Fleet Services International (fleetservicesint.com)</h3>
  <ul>
    <li><strong>Brand:</strong> ${bp.onlineResearch.publicFsi.brandName}</li>
    <li><strong>Role:</strong> ${bp.onlineResearch.publicFsi.role}</li>
    <li><strong>Phone:</strong> ${bp.onlineResearch.publicFsi.corporatePhone}</li>
    <li><strong>Site:</strong> ${bp.onlineResearch.publicFsi.website}</li>
    <li><strong>Founded (site claim):</strong> ${bp.onlineResearch.publicFsi.foundedClaim}</li>
    <li><strong>Capital band (site):</strong> ${bp.onlineResearch.publicFsi.capitalBandUsd}</li>
    <li><strong>Model:</strong> ${bp.onlineResearch.publicFsi.notFranchiseClaim}</li>
    <li><strong>Richard Petty / Petty's Garage co-brand:</strong> ${bp.onlineResearch.publicFsi.pettyGarageCoBrand ? 'Yes (site)' : 'No'}</li>
  </ul>
  <h3>Verified — FleetCo (this plan)</h3>
  <ul>
    <li><strong>Entity:</strong> ${bp.onlineResearch.fleetCoVerified.legalName}</li>
    <li><strong>Site:</strong> ${bp.onlineResearch.fleetCoVerified.website}</li>
    <li><strong>HQ:</strong> ${bp.onlineResearch.fleetCoVerified.headquarters} · Founded ${bp.onlineResearch.fleetCoVerified.founded}</li>
    <li><strong>Ownership:</strong> ${bp.onlineResearch.fleetCoVerified.ownership}</li>
  </ul>
  <h3>Plan assumptions (internal projections)</h3>
  <ul>${bp.onlineResearch.planAssumptions.map((a) => `<li>${a}</li>`).join('')}</ul>

  <div class="section-break"></div>
  ${pageHeader('Business Plan')}

  <h2>4. Market Analysis</h2>
  <h3>Problem</h3>
  <ul>${bp.marketAnalysis.problem.map((p) => `<li>${p}</li>`).join('')}</ul>
  <h3>Target Segments</h3>
  <table>
    <tr><th>Segment</th><th>Fleet Size</th><th>Tier</th><th>Primary Need</th></tr>
    ${segmentRows}
  </table>
  <div class="callout"><strong>Market size:</strong> ${bp.marketAnalysis.tam}</div>
  <h3>Industry Trends</h3>
  <ul>${bp.marketAnalysis.trends.map((t) => `<li>${t}</li>`).join('')}</ul>

  <h2>5. Products & Services</h2>
  <h3>FleetCo SaaS Platform</h3>
  <ul>${bp.productsAndServices.platform.map((p) => `<li>${p}</li>`).join('')}</ul>
  <h3>Managed Services (FleetCo)</h3>
  <ul>${bp.productsAndServices.managedServices.map((p) => `<li>${p}</li>`).join('')}</ul>
  <h3>${SHOP_ASSUMPTIONS.entity} — Shop Services</h3>
  <table>
    <tr><th>Service</th><th>Pricing</th><th>Description</th></tr>
    ${fsiServiceRows}
  </table>
  <h3>SaaS Subscription Pricing</h3>
  <table>
    <tr><th>Plan</th><th>Price</th><th>Fleet Size</th></tr>
    ${pricingRows}
  </table>
  <h3>Client ROI Claims</h3>
  <ul>${bp.productsAndServices.clientRoi.map((r) => `<li>${r}</li>`).join('')}</ul>

  <div class="section-break"></div>
  ${pageHeader('Business Plan')}

  <h2>6. Shop Operations & Platform Integration</h2>
  <h3>Workflow (portal ↔ bay)</h3>
  <ol>${bp.shopIntegration.workflow.map((w) => `<li>${w}</li>`).join('')}</ol>
  <h3>Strategic Advantages</h3>
  <ul>${bp.shopIntegration.advantages.map((a) => `<li>${a}</li>`).join('')}</ul>
  <h3>FSI Expansion Roadmap</h3>
  <table><tr><th>Phase</th><th>Plan</th></tr>${shopPhaseRows}</table>

  <h2>7. Revenue Model</h2>
  <table><tr><th>Stream</th><th>Description</th></tr>${revenueStreamRows}</table>
  <div class="callout"><strong>Year 10 base case:</strong> ${bp.revenueModel.combinedY10}</div>

  <h2>8. Competitive Advantage</h2>
  <ul>${bp.competitiveAdvantage.map((a) => `<li>${a}</li>`).join('')}</ul>

  <h2>9. Marketing & Sales (Go-to-Market)</h2>
  <table>
    <tr><th>Phase</th><th>Tactics</th></tr>
    ${bp.goToMarket.channels.map((c) => `<tr><td><span class="badge">${c.phase}</span></td><td>${c.tactics}</td></tr>`).join('')}
  </table>
  <p><strong>Sales funnel:</strong> ${bp.goToMarket.funnel}</p>
  <p><strong>Retention:</strong> ${bp.goToMarket.retention}</p>

  <h2>10. Operations & Technology</h2>
  <p><strong>Stack:</strong> ${bp.operations.technology}</p>
  <p><strong>Delivery model:</strong> ${bp.operations.delivery}</p>
  <p><strong>Support tiers:</strong> ${bp.operations.support}</p>
  <h3>Headcount Plan</h3>
  <table>
    <tr><th>Period</th><th>FTE</th><th>Roles</th></tr>
    ${bp.operations.headcount.map((h) => `<tr><td>${h.year}</td><td>${h.fte}</td><td>${h.roles}</td></tr>`).join('')}
  </table>

  <h2>11. Team & Organization</h2>
  <table><tr><th>Function</th><th>Structure</th></tr>${orgRows}</table>
  <p><strong>Governance:</strong> ${bp.teamAndOrg.governance}</p>

  <h2>12. Financial Summary — SaaS (Base Case)</h2>
  <table>
    <tr><th>Year</th><th class="num">Customers</th><th class="num">Revenue</th><th class="num">ARR (EoY)</th><th class="num">YoY</th></tr>
    ${finSummaryRows}
    <tr class="total"><td colspan="2"><strong>10-Year Cumulative</strong></td><td class="num"><strong>${formatCurrency(CUMULATIVE_REVENUE, true)}</strong></td><td colspan="2"></td></tr>
  </table>
  <p><em>SaaS-only model; companion PDFs include full P&amp;L scenarios. Shop revenue is additive below.</em></p>

  <h2>13. Financial Summary — Combined (SaaS + FSI Shops)</h2>
  <table>
    <tr><th>Year</th><th class="num">SaaS Revenue</th><th class="num">Dealer Service Revenue</th><th class="num">Total</th><th class="num">FSI Territories</th></tr>
    ${combinedFinRows}
    <tr class="total"><td colspan="3"><strong>10-Year Cumulative Combined</strong></td><td class="num"><strong>${formatCurrency(CUMULATIVE_COMBINED_REVENUE, true)}</strong></td><td></td></tr>
  </table>
  <p><em>Dealer service assumptions: ${SHOP_ASSUMPTIONS.grossMarginPct}% gross margin; ~${SHOP_ASSUMPTIONS.mobileWorkstationsPerTerritory} mobile workstations per territory; phased territory openings per expansion table. FSI corporate capital guidance: ${SHOP_ASSUMPTIONS.fsiTypicalCapitalUsd.replace('-', '–')} USD (territory-dependent, per fleetservicesint.com).</em></p>

  <div class="chart-bar-wrap"><h3>SaaS Revenue Growth Trajectory</h3>${chartBars}</div>

  <div class="section-break"></div>
  ${pageHeader('Business Plan')}

  <h2>14. Product & Shop Roadmap</h2>
  <table><tr><th>When</th><th>Milestone</th></tr>${roadmapRows}</table>

  <h2>15. Key Milestones</h2>
  <ul>${milestoneItems}</ul>

  <h2>16. Risk Analysis & Mitigation</h2>
  <table>
    <tr><th>Risk</th><th>Mitigation</th></tr>
    ${bp.risks.map((r) => `<tr><td>${r.risk}</td><td>${r.mitigation}</td></tr>`).join('')}
  </table>

  <h2>17. Use of Funds</h2>
  <ul>${bp.useOfFunds.map((u) => `<li>${u}</li>`).join('')}</ul>

  <h2>18. Assumptions</h2>
  <ul>
    <li>Model start year: ${ASSUMPTIONS.modelStartYear} (Year 1 = first commercial year)</li>
    <li>SaaS gross margin: ${ASSUMPTIONS.grossMarginPct}% · Shop gross margin: ${SHOP_ASSUMPTIONS.grossMarginPct}%</li>
    <li>Churn: ${ASSUMPTIONS.churnStartPct}% (early) declining to ${ASSUMPTIONS.churnEndPct}% (Year 10)</li>
    <li>Billing mix: ${ASSUMPTIONS.billingMix.monthly * 100}% monthly / ${ASSUMPTIONS.billingMix.yearly * 100}% yearly (${ASSUMPTIONS.yearlyDiscountPct}% annual discount)</li>
    <li>Blended SaaS ARPU rises from $450/mo (Y1) to $610/mo (Y10) as mix shifts toward Growth and Enterprise</li>
    <li>${SHOP_ASSUMPTIONS.entity} reflects Slack-affiliated FSI dealership operation (mobile territory model per fleetservicesint.com), integrated with FleetCo software — confirm legal entity and territory award before external use</li>
  </ul>

  <div class="footer-note">${BRAND.company} · ${BRAND.website} · ${BRAND.phone} · ${BRAND.email} · ${BUSINESS_PLAN.confidential}</div>
  </body></html>`;
}

function revenueProjectionsHtml() {
  const rows = BASE_PROJECTION.map((row) =>
    `<tr>
      <td><strong>Year ${row.year}</strong></td>
      <td>${row.calendar}</td>
      <td class="num">${row.customersEoy}</td>
      <td class="num">+${row.netNew}</td>
      <td class="num">$${row.arpuMonthly}</td>
      <td class="num">${row.avgCustomers}</td>
      <td class="num"><strong>${formatCurrency(row.annualRevenue)}</strong></td>
      <td class="num">${formatCurrency(row.arrEoy)}</td>
      <td class="num">${formatPct(row.yoyGrowthPct)}</td>
    </tr>`
  ).join('');

  const maxArr = BASE_PROJECTION[9].arrEoy;
  const arrChart = BASE_PROJECTION.map((row) => {
    const pct = Math.round((row.arrEoy / maxArr) * 100);
    return `<div class="chart-row"><span class="chart-label">Y${row.year}</span><div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${pct}%"></div></div><span class="chart-val">${formatCurrency(row.arrEoy, true)}</span></div>`;
  }).join('');

  return `${coverHtml({
    kicker: 'Financial Data Export',
    title: '10-Year Revenue Projections',
    subtitle: `Base case · Year 1 (${ASSUMPTIONS.modelStartYear}) through Year 10 (${ASSUMPTIONS.modelStartYear + 9})`,
    extra: `<div style="margin-top:40px;font-size:11pt;color:#CBD5E1">Companion to FleetCo Business Plan · ${formatCurrency(CUMULATIVE_REVENUE, true)} cumulative revenue</div>`,
  })}
  ${pageHeader('Revenue Projections')}

  <div class="metric-grid">
    <div class="metric-card"><div class="label">Year 1 ARR</div><div class="value">${formatCurrency(BASE_PROJECTION[0].arrEoy, true)}</div><div class="sub">${BASE_PROJECTION[0].customersEoy} customers EoY</div></div>
    <div class="metric-card"><div class="label">Year 5 ARR</div><div class="value">${formatCurrency(BASE_PROJECTION[4].arrEoy, true)}</div><div class="sub">${BASE_PROJECTION[4].customersEoy} customers · EBITDA+</div></div>
    <div class="metric-card"><div class="label">Year 10 ARR</div><div class="value">${formatCurrency(BASE_PROJECTION[9].arrEoy, true)}</div><div class="sub">${BASE_PROJECTION[9].customersEoy} customers EoY</div></div>
  </div>

  <h2>Annual Revenue & ARR — Base Case</h2>
  <table>
    <tr>
      <th>Year</th><th>Calendar</th>
      <th class="num">Customers (EoY)</th><th class="num">Net New</th><th class="num">ARPU/mo</th>
      <th class="num">Avg Customers</th><th class="num">Annual Revenue</th><th class="num">ARR (EoY)</th><th class="num">YoY Growth</th>
    </tr>
    ${rows}
    <tr class="total">
      <td colspan="6"><strong>10-Year Totals / End State</strong></td>
      <td class="num"><strong>${formatCurrency(CUMULATIVE_REVENUE)}</strong></td>
      <td class="num"><strong>${formatCurrency(BASE_PROJECTION[9].arrEoy)}</strong></td>
      <td></td>
    </tr>
  </table>

  <h2>ARR Growth Chart</h2>
  ${arrChart}

  <div class="section-break"></div>
  ${pageHeader('Revenue Projections')}

  <h2>Pricing Reference</h2>
  <table>
    <tr><th>Plan</th><th>Monthly</th><th>Yearly (10% off)</th><th>Fleet Size</th></tr>
    <tr><td>Starter</td><td class="num">$${PRICING.Starter.monthly}</td><td class="num">$${PRICING.Starter.yearly.toLocaleString()}</td><td>1–5 vehicles</td></tr>
    <tr><td>Growth</td><td class="num">$${PRICING.Growth.monthly}</td><td class="num">$${PRICING.Growth.yearly.toLocaleString()}</td><td>6–15 vehicles</td></tr>
    <tr><td>Enterprise</td><td class="num">~$${PRICING.Enterprise.monthly}</td><td class="num">Custom</td><td>16+ vehicles</td></tr>
  </table>

  <h2>Customer Mix Evolution</h2>
  <table>
    <tr><th>Period</th><th>Starter</th><th>Growth</th><th>Enterprise</th><th>Blended ARPU</th></tr>
    <tr><td>Year 1–2</td><td>60%</td><td>35%</td><td>5%</td><td class="num">$450–$470/mo</td></tr>
    <tr><td>Year 3–5</td><td>52%</td><td>40%</td><td>8%</td><td class="num">$485–$515/mo</td></tr>
    <tr><td>Year 6–8</td><td>48%</td><td>42%</td><td>10%</td><td class="num">$535–$575/mo</td></tr>
    <tr><td>Year 9–10</td><td>45%</td><td>45%</td><td>10%</td><td class="num">$590–$610/mo</td></tr>
  </table>

  <h2>Key Milestones</h2>
  <ul>
    ${MILESTONES.map((m) => `<li><strong>${m.when}:</strong> ${m.metric}</li>`).join('')}
  </ul>

  <div class="callout">
    <strong>Notes:</strong> Annual revenue uses average customer count during the year × ARPU × 12.
    ARR (end of year) = customers at year-end × blended monthly ARPU × 12.
    Year 1 reflects commercial launch from near-zero paying customers in ${ASSUMPTIONS.modelStartYear}.
  </div>

  <div class="footer-note">${BRAND.company} · ${BRAND.website} · ${BUSINESS_PLAN.confidential}</div>
  </body></html>`;
}

function revenuePandLHtml() {
  const pandlRows = BASE_PROJECTION.map((row) => {
    const margin = ebitdaMargin(row);
    const ebitdaClass = row.ebitda >= 0 ? 'positive' : 'negative';
    const ebitdaStr = row.ebitda >= 0 ? formatCurrency(row.ebitda) : `(${formatCurrency(Math.abs(row.ebitda))})`;
    return `<tr>
      <td><strong>Y${row.year}</strong> (${row.calendar})</td>
      <td class="num">${formatCurrency(row.annualRevenue, true)}</td>
      <td class="num">${formatCurrency(row.grossProfit, true)}</td>
      <td class="num">${ASSUMPTIONS.grossMarginPct}%</td>
      <td class="num">${formatCurrency(row.opex, true)}</td>
      <td class="num ${ebitdaClass}">${ebitdaStr}</td>
      <td class="num">${margin != null ? `${margin}%` : '—'}</td>
    </tr>`;
  }).join('');

  const scenarioY5Rows = Object.values(SCENARIOS_Y5).map((s) =>
    `<tr><td>${s.label}</td><td class="num">${s.customersEoy}</td><td class="num">$${s.arpuMonthly}</td><td class="num">${formatCurrency(s.annualRevenue, true)}</td><td class="num">${formatCurrency(s.arrEoy, true)}</td></tr>`
  ).join('');

  const scenarioY10Rows = Object.values(SCENARIOS_Y10).map((s) =>
    `<tr><td>${s.label}</td><td class="num">${s.customersEoy}</td><td class="num">$${s.arpuMonthly}</td><td class="num">${formatCurrency(s.annualRevenue, true)}</td><td class="num">${formatCurrency(s.arrEoy, true)}</td></tr>`
  ).join('');

  return `${coverHtml({
    kicker: 'Financial Data Export',
    title: 'Revenue P&L & Scenarios',
    subtitle: 'Profit & loss outlook · Conservative / Base / Optimistic sensitivity',
    extra: `<div style="margin-top:40px;font-size:11pt;color:#CBD5E1">EBITDA break-even: Year 5 · Year 10 EBITDA: ${formatCurrency(BASE_PROJECTION[9].ebitda, true)} (28% margin)</div>`,
  })}
  ${pageHeader('Revenue P&L & Scenarios')}

  <h2>10-Year P&L — Base Case</h2>
  <table>
    <tr>
      <th>Year</th><th class="num">Revenue</th><th class="num">Gross Profit</th><th class="num">GM%</th>
      <th class="num">OpEx</th><th class="num">EBITDA</th><th class="num">EBITDA %</th>
    </tr>
    ${pandlRows}
  </table>

  <div class="callout">
    <strong>OpEx includes:</strong> sales & marketing, fleet managers & support staff, product/engineering, and G&A.
    Early years assume founder-led sales; headcount scales from 2–4 FTE (Y1) to 12–15 FTE (Y10).
  </div>

  <h2>Scenario Comparison — Year 5 (${ASSUMPTIONS.modelStartYear + 4})</h2>
  <table>
    <tr><th>Scenario</th><th class="num">Customers</th><th class="num">ARPU/mo</th><th class="num">Annual Revenue</th><th class="num">ARR</th></tr>
    ${scenarioY5Rows}
  </table>

  <h2>Scenario Comparison — Year 10 (${ASSUMPTIONS.modelStartYear + 9})</h2>
  <table>
    <tr><th>Scenario</th><th class="num">Customers</th><th class="num">ARPU/mo</th><th class="num">Annual Revenue</th><th class="num">ARR</th></tr>
    ${scenarioY10Rows}
  </table>

  <div class="section-break"></div>
  ${pageHeader('Revenue P&L & Scenarios')}

  <h2>OpEx Breakdown (Target Allocation)</h2>
  <table>
    <tr><th>Category</th><th>Allocation</th><th>Description</th></tr>
    <tr><td>Sales & Marketing</td><td class="num">40%</td><td>Digital ads, content, trade shows, sales hires</td></tr>
    <tr><td>Fleet Management & Support</td><td class="num">35%</td><td>Customer delivery — fleet managers, onboarding</td></tr>
    <tr><td>Product & Engineering</td><td class="num">20%</td><td>Mobile app, integrations, platform features</td></tr>
    <tr><td>G&A & Infrastructure</td><td class="num">5%</td><td>Hosting, legal, accounting, tools</td></tr>
  </table>

  <h2>Unit Economics (Year 10 Base Case)</h2>
  <div class="metric-grid">
    <div class="metric-card"><div class="label">ARPU (monthly)</div><div class="value">$610</div><div class="sub">Blended across tiers</div></div>
    <div class="metric-card"><div class="label">Gross Margin</div><div class="value">${ASSUMPTIONS.grossMarginPct}%</div><div class="sub">Services + platform</div></div>
    <div class="metric-card"><div class="label">Customers / FTE</div><div class="value">~52</div><div class="sub">780 customers · 15 FTE</div></div>
  </div>

  <h2>Scenario Assumptions</h2>
  <table>
    <tr><th>Scenario</th><th>Customer Growth</th><th>ARPU</th><th>When to Use</th></tr>
    <tr><td>Conservative</td><td>Slower sales ramp, higher churn</td><td>Lower enterprise mix</td><td>Planning, lender/conservative case</td></tr>
    <tr><td>Base Case</td><td>Moderate B2B SaaS + services growth</td><td>Gradual tier migration</td><td>Operating plan, investor base case</td></tr>
    <tr><td>Optimistic</td><td>Strong enterprise wins, regional expansion</td><td>Higher ARPU from upsells</td><td>Upside scenario, hiring acceleration</td></tr>
  </table>

  <div class="footer-note">${BRAND.company} · ${BRAND.website} · ${BUSINESS_PLAN.confidential}</div>
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
  const stat = fs.statSync(outPath);
  console.log(`  ✓ ${path.basename(outPath)} (${(stat.size / 1024).toFixed(0)} KB)`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(MARKETING_DIR, { recursive: true });

  const outputs = [
    { name: 'FleetCo-Business-Plan.pdf', html: businessPlanHtml() },
    { name: 'FleetCo-Revenue-Projections-10Year.pdf', html: revenueProjectionsHtml() },
    { name: 'FleetCo-Revenue-PandL-Scenarios.pdf', html: revenuePandLHtml() },
  ];

  console.log('Generating FleetCo business plan PDFs…');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  for (const { name, html } of outputs) {
    const publicPath = path.join(OUT_DIR, name);
    const marketingPath = path.join(MARKETING_DIR, name);
    await htmlToPdf(browser, html, publicPath);
    fs.copyFileSync(publicPath, marketingPath);
  }

  await browser.close();
  console.log(`\nDone. PDFs available at public/marketing/ and marketing/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

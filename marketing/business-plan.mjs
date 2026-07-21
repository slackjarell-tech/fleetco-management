/** Structured business plan content — FleetCo Management LLC + Fleet Services International LTD. */
import { BRAND } from './brand.js';
import {
  PRICING,
  ASSUMPTIONS,
  BASE_PROJECTION,
  SHOP_ASSUMPTIONS,
  SHOP_PROJECTION,
  COMBINED_PROJECTION,
  MILESTONES,
  CUMULATIVE_REVENUE,
  CUMULATIVE_COMBINED_REVENUE,
  formatCurrency,
} from './financial-model.mjs';

const FSI = SHOP_ASSUMPTIONS.entity;

/** Verified July 2026 — marketing/fleet-services-international-research.md */
export const ONLINE_RESEARCH = {
  researchedAt: '2026-07-21',
  researchDoc: 'marketing/fleet-services-international-research.md',
  publicFsi: {
    brandName: 'Fleet Services International (FSI)',
    role: 'National B2B mobile fleet service dealership platform (exclusive territory licenses for independent dealers)',
    website: 'https://www.fleetservicesint.com/',
    corporatePhone: '+1 404-699-9669',
    siteEmail: 'mymail@mailservice.com',
    foundedClaim: 'Started 2001; 25+ year dealer track record (site marketing)',
    notFranchiseClaim: 'Site states not a franchise — no franchise fees or royalties',
    capitalBandUsd: '$150,000–$500,000 typical total commitment (territory-dependent)',
    pettyGarageCoBrand: true,
    keyPages: [
      'https://www.fleetservicesint.com/',
      'https://www.fleetservicesint.com/the-dealership-model',
      'https://www.fleetservicesint.com/qualifications',
      'https://www.fleetservicesint.com/the-richard-petty-advantage',
    ],
  },
  fleetCoVerified: {
    legalName: BRAND.company,
    website: BRAND.url,
    headquarters: BRAND.location,
    founded: 2022,
    ownership: 'JaRell D. Slack & Desiree Slack (per internal plan)',
  },
  integratedStack:
    'FSI corporate (fleetservicesint.com) licenses territories and dealer systems; FleetCo (fleetcomanagement.org) delivers SaaS + managed ops; affiliated dealer entity operates mobile PM/repair with FleetCo as the integrated software layer for subscribers and dealer back-office.',
  planAssumptions: [
    `${FSI} operates as Slack-affiliated FSI dealership territory(ies) per official mobile dealer model (not fixed retail bays as primary model)`,
    'Territory count and service P&L in SHOP_PROJECTION are FleetCo internal projections — not FSI corporate forecasts',
    'FleetCo portal/work-order integration with field service is product roadmap',
  ],
};

export const BUSINESS_PLAN = {
  title: 'FleetCo Management LLC & Fleet Services International LTD — Integrated Business Plan',
  subtitle: 'SaaS Platform · Managed Fleet Operations · FSI Dealership Service Layer · 2026–2035',
  confidential: 'Confidential — For Internal & Investor Use',
  preparedDate: 'July 2026',

  executiveSummary: [
    `${BRAND.company} is a managed fleet operations company combining dedicated fleet management services with a proprietary SaaS platform at ${BRAND.url}. Founded in 2022 and headquartered in ${BRAND.location}, FleetCo serves owner-operators and small-to-mid-size carriers (1–50+ vehicles) who need one connected system for dispatch, maintenance, compliance, fuel optimization, accounting, and driver communication — without hiring a full back-office team.`,
    `${FSI} is the affiliated FSI dealership operating entity (mobile on-site commercial PM and repair in a protected territory — per fleetservicesint.com dealership model; not a franchise). FSI corporate provides dealer training, vendor supply chain, and dealer software; FleetCo provides SaaS and managed fleet operations. Together they form an integrated stack: FleetCo for digital operations, FSI dealer standards for field service revenue and downtime reduction. Public affiliation between FleetCo and a specific awarded FSI territory should be confirmed before external investor materials.`,
    `Revenue combines recurring subscriptions ($299–$599/mo core tiers, custom enterprise) with shop labor and parts. The U.S. for-hire sector includes 750,000+ motor carriers; most operate under 20 power units and lose an estimated 30% of revenue to inefficiency and downtime. FleetCo targets measurable ROI: 15–25% less unplanned downtime, 8–12% fuel savings, $2K+ average annual savings per unit — amplified when FSI performs PM and repairs with work orders flowing directly into the portal.`,
    `Year 1 (2026) base case: 18 SaaS customers, ${formatCurrency(BASE_PROJECTION[0].arrEoy, true)} ARR, one FSI territory pilot (~${formatCurrency(SHOP_PROJECTION[0].annualRevenue, true)} mobile service revenue). FSI corporate cites typical dealer capital of ~$150K–$500K per awarded territory (separate from FleetCo SaaS opex). By Year 10 (2035): 780 SaaS customers, ${formatCurrency(BASE_PROJECTION[9].arrEoy, true)} ARR, 12 FSI territories in the financial model, ${formatCurrency(CUMULATIVE_COMBINED_REVENUE, true)} cumulative combined revenue over the decade. SaaS reaches EBITDA break-even in Year 5; territory scale adds mobile crews and fleet accounts funded from operating cash flow.`,
  ],

  corporateStructure: {
    overview: `${BRAND.company} (FleetCo) owns brand, SaaS, customer contracts, and managed services from Dallas (founded 2022). ${FSI} is the affiliated FSI authorized dealer operation — exclusive protected territory, mobile workstations, field teams, and on-site B2B fleet service per fleetservicesint.com (not a franchise; not FSI corporate). FSI corporate (fleetservicesint.com) is the separate national licensor providing training, vendor supply chain, and dealer software access. Intercompany MSAs cover FleetCo software for dealer ops, SaaS customer referrals for priority mobile service, and consolidated leadership reporting.`,
    fleetCoRole: 'Product, engineering, sales, fleet managers, customer portals, Stripe billing, mobile driver app, and executive analytics.',
    fsiRole: 'Mobile commercial fleet service in protected territory: scheduled preventative maintenance, breakdown/service calls, on-site repair (vans, trucks, trailers); owner-led team of mechanics, sales, and admin per FSI dealer model; Richard Petty / Petty’s Garage co-brand available to exclusive dealers per FSI site.',
    fsiCorporateRole: 'Since 2001 per FSI site: territory award, elite training, continuous support, pre-negotiated parts/tools vendors, proprietary dealer back-office software (scheduling, inventory, invoicing).',
    customerPromise: 'One relationship with FleetCo; optional in-territory mobile FSI-standard service with digital work orders, live vehicle/service status in portal, and unified P&L — no duplicate data entry.',
  },

  companyOverview: {
    legalName: BRAND.company,
    affiliateEntity: FSI,
    affiliateEntityNote:
      'Affiliated FSI dealer operation integrated with FleetCo; FSI corporate platform at fleetservicesint.com. See fleet-services-international-research.md.',
    dba: BRAND.shortName,
    founded: 2022,
    headquarters: BRAND.location,
    website: BRAND.website,
    contact: `${BRAND.phone} · ${BRAND.email}`,
    ownership: 'JaRell D. Slack & Desiree Slack, Owners (both FleetCo and affiliated FSI dealer entity per plan)',
    mission: 'Give every fleet — from one truck to fifty — enterprise-grade operations, compliance, and cost control without enterprise complexity, backed by mobile on-site service when units need wrench time.',
    vision: 'Become the trusted managed operations and service partner for 1,000+ North American fleets by 2035, with FSI-aligned mobile service territories integrated with FleetCo on every major freight corridor we serve.',
    values: [
      'Transparency in pricing and performance',
      'Safety and compliance first',
      'Human support backed by modern technology',
      'Long-term partnerships over transactional sales',
      'Field service and software built as one system',
    ],
  },

  marketAnalysis: {
    problem: [
      '5+ disconnected tools for dispatch, maintenance, fuel, compliance, and payroll',
      '30% of revenue lost to inefficiency, downtime, and poor visibility',
      'DOT violations and missed PMs cost $10K+ in fines and lost loads annually',
      'No single source of truth for fleet P&L and cost-per-mile',
      'External shops rarely update fleet software — owners lose days waiting on phone calls and paper tickets',
    ],
    segments: [
      { name: 'Owner-operators', size: '1–5 vehicles', tier: 'Starter ($299/mo)', need: 'Compliance, fuel optimization, parts sourcing, FSI PM packages, monthly reporting' },
      { name: 'Small fleets', size: '6–15 vehicles', tier: 'Growth ($599/mo)', need: 'PM scheduling, priority mobile service windows, quarterly budget reviews, safety coordination' },
      { name: 'Established fleets', size: '16+ vehicles', tier: 'Enterprise (custom)', need: 'Telematics integrations, dedicated account team, multi-site mobile service SLAs, EV transition planning' },
      { name: 'B2B fleet accounts (FSI dealer)', size: '1–30+ units', tier: 'PM programs + time & materials', need: 'On-site preventative maintenance and break-fix without full SaaS (upsell path to FleetCo)' },
    ],
    tam: 'U.S. for-hire motor carriers: 750,000+ · Addressable small/mid fleets (1–50 units): ~500,000 · Class 8 aftermarket repair & maintenance: $30B+ annually · Serviceable obtainable market (Year 1–3: TX, Gulf Coast, PNW corridors): ~45,000 fleets + regional B2B fleet service accounts',
    trends: [
      'Rising insurance and compliance costs pushing fleets toward managed services',
      'Driver shortage increasing demand for mobile-first tools and reduced paperwork',
      'Consolidation of point solutions into platform plays — FleetCo + FSI as vertical stack',
      'Aging Class 8 fleet increasing demand for PM programs and extended warranty work',
      'Telematics and AI adoption creating appetite for unified dashboards and predictive maintenance',
    ],
  },

  productsAndServices: {
    platform: [
      'Public marketing site with platform tour, services, transparent pricing, investor and competitive analysis pages',
      'Executive portal — KPI dashboard, customers, fleet assets, dispatch, maintenance, analytics, accounting actions',
      'Customer portal — team roles, Stripe subscriptions, documents, driver media, messaging',
      'FleetCo Driver app (Capacitor) — time clock, live GPS, loads, fuel logs, dashcam, barcode scanning, HOS/inspections, routes & POD',
      'Maintenance module — PM schedules, work orders, service templates, parts inventory, vendor contracts, Repairs Dashboard, Time Clock for techs',
      'Finance — invoicing, fuel audits, IFTA dashboard, fleet P&L per unit, custom reports',
      'AI Site Commander — intelligent site assistance and operational guidance',
    ],
    managedServices: [
      'Dedicated fleet manager per account',
      'Parts sourcing and NBO vendor coordination',
      'Fuel optimization and IFTA-ready reporting',
      'Preventive maintenance scheduling and work order management',
      'Safety and DOT compliance coordination',
      'Monthly and quarterly business reviews (tier-dependent)',
      'Towing and external shop coordination when outside FSI footprint',
    ],
    fsiShopServices: [
      { name: 'Scheduled preventative maintenance', pricing: 'Fleet PM programs', desc: 'Core FSI dealer revenue per fleetservicesint.com — recurring on-site PM for commercial fleets' },
      { name: 'Breakdown / service calls', pricing: 'Time & materials', desc: 'On-site break-fix when units fail; complements predictable PM revenue' },
      { name: 'On-site engine & driveline', pricing: 'Estimate on site', desc: 'Mobile repair for vans, trucks, trailers — work orders in FleetCo portal' },
      { name: 'Tire & trailer work', pricing: 'Per job / fleet account', desc: 'Commercial tire and trailer maintenance at customer yard or terminal' },
      { name: 'DOT / compliance support', pricing: 'Per inspection', desc: 'Inspection and compliance documentation tied to FleetCo maintenance records' },
      { name: 'Fleet intake / prep', pricing: 'Per-unit packages', desc: 'Pre-road safety repairs for acquired units — upsell to FleetCo SaaS' },
    ],
    pricing: [
      { ...PRICING.Starter, name: 'Starter', label: '$299/mo · 1–5 vehicles · $3,229/yr (10% off)' },
      { ...PRICING.Growth, name: 'Growth', label: '$599/mo · 6–15 vehicles · $6,471/yr (10% off)' },
      { ...PRICING.Enterprise, name: 'Enterprise', label: 'Custom · 16+ vehicles · telematics & dedicated account team' },
    ],
    clientRoi: [
      '15–25% reduction in unplanned downtime (PM + integrated mobile service)',
      '8–12% fuel cost savings through optimization',
      '$2K+ average annual savings per truck/unit',
      '100% compliance visibility across fleet documents and inspections',
      'Same-day service visibility — managers see units in service on dashboard without phone tag',
    ],
  },

  shopIntegration: {
    workflow: [
      'Driver or manager opens DVIR / pre-trip defect → optional auto work order',
      'Vehicle status set to In Service / In Shop; appears on Fleet Map and Repairs Dashboard',
      'Field tech clocks time to work order (Time Clock module); parts from mobile inventory',
      'Customer portal shows labor, parts, and invoice; accounting exports for P&L per unit',
      'On completion, status returns to Active; PM schedule updated from odometer and service templates',
    ],
    advantages: [
      'Demonstrates platform to prospects via live mobile service workflow',
      'Captures repair margin that pure SaaS competitors leave to third parties',
      'Reduces churn — operational data and service history stay in FleetCo',
      'Aligns with FSI corporate model: service brought to the customer to reduce downtime',
    ],
    expansionModel: [
      { phase: '2026', detail: 'Pilot one protected territory (Dallas metro target); mobile workstation + FleetCo work orders' },
      { phase: '2027–2028', detail: 'Scale fleet accounts and mobile crews within territory; add sales/admin headcount per FSI dealer blueprint' },
      { phase: '2029–2031', detail: 'Financial model adds 1–2 territories per year (subject to FSI corporate award and capital)' },
      { phase: '2032–2035', detail: 'Up to 12 territories in base-case model; standardized PM menus; FleetCo SaaS cross-sell on every account' },
    ],
  },

  revenueModel: {
    streams: [
      { name: 'SaaS subscriptions', desc: 'Starter / Growth / Enterprise monthly or annual (10% yearly discount); blended ARPU rises $450→$610/mo (Y1–Y10)' },
      { name: 'FSI dealer labor & parts', desc: `Mobile on-site PM and repair; target ${SHOP_ASSUMPTIONS.grossMarginPct}% gross margin on dealer service revenue (projection)` },
      { name: 'Onboarding & projects', desc: 'Data migration, custom reports, enterprise integrations (non-recurring)' },
      { name: 'Future marketplace', desc: 'Parts sourcing margin and vendor contract referrals (Year 4+)' },
    ],
    combinedY10: `${formatCurrency(BASE_PROJECTION[9].annualRevenue, true)} SaaS + ${formatCurrency(SHOP_PROJECTION[9].annualRevenue, true)} FSI dealer service = ${formatCurrency(COMBINED_PROJECTION[9].annualRevenue, true)} total Year 10 revenue (base case)`,
  },

  competitiveAdvantage: [
    'Hybrid model: managed services + proprietary platform + FSI-aligned mobile dealer service — not pure self-serve software or telematics-only',
    'Flat monthly SaaS pricing by fleet size band — predictable vs. per-vehicle fees from Samsara/Motive class vendors',
    'Full maintenance stack competitors lack: service templates, parts inventory, mechanic time clock, vendor contracts',
    'End-to-end: website → portal → driver app → mobile FSI service in one ecosystem',
    'Production PostgreSQL infrastructure, Stripe-ready billing, multi-tenant customer portal',
    'Owner-operated with direct leadership access; competitive matrix shows breadth vs. point solutions',
  ],

  goToMarket: {
    channels: [
      { phase: 'Year 1–2', tactics: 'Founder-led outbound, website consultations, client deck, Google/LinkedIn ads, FSI dealer launch in territory, local fleet associations' },
      { phase: 'Year 3–5', tactics: 'Inside sales, referral program with fuel vendors, SaaS customers prioritized for mobile PM windows, MATS/GATS, downtime case studies' },
      { phase: 'Year 6–10', tactics: 'Regional sales + territory leads, enterprise RFPs, ELD/telematics integrations, new territory awards where capital allows' },
    ],
    funnel: 'Website / consultation → Live demo (portal + field service story) → Subscription and/or PM contract → Onboarding → Expansion (Starter → Growth; dealer PM programs)',
    retention: 'Fleet manager relationships, quarterly reviews (Growth+), platform stickiness via operational + service data, priority mobile scheduling for subscribers',
  },

  operations: {
    technology: 'Node.js/Express API · React/Vite frontend · PostgreSQL (Render) · Capacitor mobile apps · Resend email · Stripe billing · Android release AAB pipeline for Play Store',
    delivery: 'Remote-first FleetCo ops with Dallas HQ; FSI territory lead on-site for field teams; fleet managers assigned by region and fleet size',
    support: 'Email and phone (Starter); priority + quarterly reviews (Growth); dedicated account team (Enterprise); dealer service accounts get field lead as operational contact',
    headcount: [
      { year: 'Y1–2', fte: '2–4 FleetCo + 6–8 FSI dealer', roles: 'Owners, 1 fleet manager, part-time engineering; territory owner, 3–4 mobile techs, 1 sales/admin' },
      { year: 'Y3–5', fte: '6–10 FleetCo + 12–20 FSI', roles: '+ sales, support, engineering; 2 territories, duplicate field leadership per territory' },
      { year: 'Y6–10', fte: '12–15 FleetCo + 45–60 FSI', roles: 'Regional managers, CS, enterprise; up to 12 territories × mobile crews + support staff (model)' },
    ],
  },

  teamAndOrg: {
    leadership: [
      'JaRell D. Slack — Owner/CEO: product vision, enterprise sales, platform architecture',
      'Desiree Slack — Owner/COO: operations, fleet services delivery, FSI dealer team standards and hiring',
    ],
    fleetCoFunctions: ['Product & engineering', 'Fleet managers & safety coordinators', 'Sales & marketing', 'Customer success & billing'],
    fsiFunctions: ['Territory owner / dealer principal', 'Field service manager', 'Mobile heavy-duty technicians', 'Sales reps & admin (per FSI dealer model)', 'Parts/inventory coordinator'],
    governance: 'Weekly leadership sync on ARR, territory fleet-account growth, and churn; shared KPI dashboard in executive portal',
  },

  roadmap: [
    { when: '2026 Q3–Q4', item: 'Google Play launch — FleetCo Driver (org.fleetcomanagement.driver); FSI territory pilot on FleetCo work orders' },
    { when: '2027', item: 'Apple App Store — FleetCo Driver iOS parity; primary FSI territory at target utilization' },
    { when: '2028', item: 'Second FSI territory (model); telematics integration pilots for Enterprise tier' },
    { when: '2030', item: '4 FSI territories (model); SaaS EBITDA break-even; optional ELD hardware partnerships' },
    { when: '2035', item: '12 FSI territories (model); $5.7M+ SaaS ARR; integrated marketplace for parts' },
  ],

  risks: [
    { risk: 'Customer concentration early stage', mitigation: 'Diversify across regions and fleet sizes; no single customer >15% of SaaS revenue by Year 3' },
    { risk: 'Churn in economic downturn', mitigation: 'ROI-focused retention, annual contracts, essential compliance + FSI PM bundles' },
    { risk: 'Competition from ELD/telematics incumbents', mitigation: 'Managed services + mobile service differentiation; integrate rather than replace telematics' },
    { risk: 'Scaling fleet manager capacity', mitigation: 'Platform automation, tiered support, hire ahead of customer growth' },
    { risk: 'Dealer capital and technician shortage', mitigation: 'Phase territory scale on utilization; apprentice program; competitive field pay tied to billed hours; FSI vendor supply chain' },
    { risk: 'Intercompany complexity (FSI dealer vs FleetCo)', mitigation: 'Clear MSAs, transfer pricing documentation, separate P&L with consolidated reporting' },
    { risk: 'FSI territory award timing', mitigation: 'Align plan with FSI corporate selection process; capital band $150K–$500K per site guidance' },
    { risk: 'Technology reliability', mitigation: 'PostgreSQL production DB, data integrity guards, monitored deploys on Render' },
  ],

  useOfFunds: [
    'Sales & marketing (35%) — ads, content, trade shows, sales hires',
    'Fleet management & support (30%) — customer delivery capacity',
    'FSI dealer capital & mobile equipment (20%) — workstations, tools, initial inventory per FSI qualifications package',
    'Product & engineering (12%) — mobile app, integrations, AI features',
    'G&A & infrastructure (3%) — hosting, legal, accounting',
  ],

  milestones: MILESTONES,
  financialSummary: BASE_PROJECTION,
  shopFinancialSummary: SHOP_PROJECTION,
  combinedFinancialSummary: COMBINED_PROJECTION,
  assumptions: ASSUMPTIONS,
  shopAssumptions: SHOP_ASSUMPTIONS,
  onlineResearch: ONLINE_RESEARCH,
};

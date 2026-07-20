/** Structured business plan content for FleetCo Management LLC. */
import { BRAND } from './brand.js';
import { PRICING, ASSUMPTIONS, BASE_PROJECTION, MILESTONES, CUMULATIVE_REVENUE, formatCurrency } from './financial-model.mjs';

export const BUSINESS_PLAN = {
  title: 'FleetCo Management LLC — Business Plan',
  subtitle: 'Managed Fleet Operations Platform · 2026–2035 Growth Plan',
  confidential: 'Confidential — For Internal & Investor Use',
  preparedDate: 'July 2026',

  executiveSummary: [
    `FleetCo Management LLC is a managed fleet operations company combining dedicated fleet management services with a proprietary SaaS platform. Founded in ${2022}, FleetCo serves owner-operators and small-to-mid-size carriers (1–50+ vehicles) who need one connected system for dispatch, maintenance, compliance, fuel optimization, and driver communication — without hiring a full back-office team.`,
    `The U.S. trucking and logistics sector includes over 750,000 for-hire motor carriers, the vast majority operating fewer than 20 power units. These operators lose an estimated 30% of revenue to inefficiency, downtime, and poor visibility across fragmented tools. FleetCo addresses this with transparent subscription pricing ($299–$599/mo for core tiers, custom enterprise quotes) and measurable client ROI: 15–25% reduction in unplanned downtime, 8–12% fuel savings, and $2K+ average annual savings per unit.`,
    `The platform is live at ${BRAND.url}, with an executive portal, customer portal, mobile driver app (iOS/Android), Stripe-ready billing, and PostgreSQL-backed production infrastructure. Year 1 (2026) targets 18 paying fleet customers and ${formatCurrency(BASE_PROJECTION[0].arrEoy, true)} ARR. By Year 10 (2035), the base case projects 780 customers, ${formatCurrency(BASE_PROJECTION[9].arrEoy, true)} ARR, and ${formatCurrency(CUMULATIVE_REVENUE, true)} cumulative revenue over the decade.`,
    `FleetCo reaches EBITDA break-even in Year 5 and generates ${formatCurrency(BASE_PROJECTION[9].ebitda, true)} EBITDA in Year 10 at a 28% margin. Growth is driven by founder-led sales, digital marketing, referral partnerships with shops and fuel vendors, and expansion from Starter to Growth and Enterprise tiers as client fleets scale.`,
  ],

  companyOverview: {
    legalName: BRAND.company,
    dba: BRAND.shortName,
    founded: 2022,
    headquarters: BRAND.location,
    website: BRAND.website,
    contact: `${BRAND.phone} · ${BRAND.email}`,
    ownership: 'JaRell D. Slack & Desiree Slack, Owners',
    mission: 'Give every fleet — from one truck to fifty — enterprise-grade operations, compliance, and cost control without enterprise complexity.',
    vision: 'Become the trusted managed operations partner for 1,000+ North American fleets by 2035.',
    values: ['Transparency in pricing and performance', 'Safety and compliance first', 'Human support backed by modern technology', 'Long-term partnerships over transactional sales'],
  },

  marketAnalysis: {
    problem: [
      '5+ disconnected tools for dispatch, maintenance, fuel, compliance, and payroll',
      '30% of revenue lost to inefficiency, downtime, and poor visibility',
      'DOT violations and missed PMs cost $10K+ in fines and lost loads annually',
      'No single source of truth for fleet P&L and cost-per-mile',
    ],
    segments: [
      { name: 'Owner-operators', size: '1–5 vehicles', tier: 'Starter ($299/mo)', need: 'Compliance, fuel optimization, parts sourcing, monthly reporting' },
      { name: 'Small fleets', size: '6–15 vehicles', tier: 'Growth ($599/mo)', need: 'PM scheduling, priority support, quarterly budget reviews, safety coordination' },
      { name: 'Established fleets', size: '16+ vehicles', tier: 'Enterprise (custom)', need: 'Telematics integrations, dedicated account team, EV transition planning' },
    ],
    tam: 'U.S. for-hire motor carriers: 750,000+ · Addressable small/mid fleets (1–50 units): ~500,000 operators · Serviceable obtainable market (Year 1–3 focus: TX, PNW, Gulf Coast): ~45,000 fleets',
    trends: ['Rising insurance and compliance costs pushing fleets toward managed services', 'Driver shortage increasing demand for mobile-first tools and reduced paperwork', 'Telematics and AI adoption creating appetite for unified dashboards', 'Consolidation of point solutions into platform plays'],
  },

  productsAndServices: {
    platform: [
      'Public marketing site with platform tour, services, and transparent pricing',
      'Executive portal — KPI dashboard, customers, fleet assets, dispatch, maintenance, analytics',
      'Customer portal — team roles, subscriptions, documents, media review',
      'FleetCo Driver app — time clock, loads, fuel logs, dashcam, barcode scanning, HOS/inspections',
      'AI Site Commander — intelligent site assistance and operational guidance',
    ],
    managedServices: [
      'Dedicated fleet manager per account',
      'Parts sourcing and vendor coordination',
      'Fuel optimization and IFTA-ready reporting',
      'Preventive maintenance scheduling and work order management',
      'Safety and DOT compliance coordination',
      'Monthly and quarterly business reviews (tier-dependent)',
    ],
    pricing: [
      { ...PRICING.Starter, name: 'Starter', label: '$299/mo · 1–5 vehicles · $3,229/yr (10% off)' },
      { ...PRICING.Growth, name: 'Growth', label: '$599/mo · 6–15 vehicles · $6,471/yr (10% off)' },
      { ...PRICING.Enterprise, name: 'Enterprise', label: 'Custom · 16+ vehicles · telematics & dedicated account team' },
    ],
    clientRoi: [
      '15–25% reduction in unplanned downtime',
      '8–12% fuel cost savings through optimization',
      '$2K+ average annual savings per truck/unit',
      '100% compliance visibility across fleet documents and inspections',
    ],
  },

  competitiveAdvantage: [
    'Hybrid model: managed services + proprietary platform — not pure self-serve software or traditional broker',
    'Flat monthly pricing by fleet size band — predictable vs. per-vehicle or per-load fees',
    'End-to-end stack: website → portal → driver app in one ecosystem',
    'Production-ready infrastructure with PostgreSQL persistence and data integrity protections',
    'Owner-operated company with direct access to leadership for every client',
  ],

  goToMarket: {
    channels: [
      { phase: 'Year 1–2', tactics: 'Founder-led outbound, website consultations, client presentation video, Google/LinkedIn ads, local fleet associations' },
      { phase: 'Year 3–5', tactics: 'Inside sales hire, referral program with shops/fuel vendors, case studies, trade show presence (MATS, GATS)' },
      { phase: 'Year 6–10', tactics: 'Regional sales managers, enterprise RFP responses, partner integrations (ELD, telematics), channel resellers' },
    ],
    funnel: 'Website visit → Free consultation → Live demo → Subscription signup → Account provisioning → Onboarding → Expansion (Starter → Growth → Enterprise)',
    retention: 'Dedicated fleet manager relationships, quarterly reviews (Growth+), platform stickiness via operational data, annual contract discounts',
  },

  operations: {
    technology: 'Node.js/Express API · React/Vite frontend · PostgreSQL (Render) · Capacitor mobile apps · Resend email · Stripe billing integration',
    delivery: 'Remote-first operations with Dallas HQ; fleet managers assigned by region and fleet size',
    support: 'Email and phone support (Starter); priority support and quarterly reviews (Growth); dedicated account team (Enterprise)',
    headcount: [
      { year: 'Y1–2', fte: '2–4', roles: 'Owners, 1 fleet manager, part-time engineering' },
      { year: 'Y3–5', fte: '6–10', roles: '+ sales, + support, + engineering' },
      { year: 'Y6–10', fte: '12–15', roles: '+ regional managers, + customer success, + enterprise specialists' },
    ],
  },

  risks: [
    { risk: 'Customer concentration early stage', mitigation: 'Diversify across regions and fleet sizes; no single customer >15% of revenue by Year 3' },
    { risk: 'Churn in economic downturn', mitigation: 'ROI-focused retention, annual contracts, essential compliance services' },
    { risk: 'Competition from ELD/telematics incumbents', mitigation: 'Managed services differentiation; integrations rather than replacement' },
    { risk: 'Scaling fleet manager capacity', mitigation: 'Platform automation, tiered support model, hire ahead of customer growth' },
    { risk: 'Technology reliability', mitigation: 'PostgreSQL production DB, data integrity guards, monitored deploys on Render' },
  ],

  useOfFunds: [
    'Sales & marketing (40%) — ads, content, trade shows, sales hires',
    'Fleet management & support staff (35%) — customer delivery capacity',
    'Product & engineering (20%) — mobile app, integrations, AI features',
    'G&A & infrastructure (5%) — hosting, legal, accounting',
  ],

  milestones: MILESTONES,
  financialSummary: BASE_PROJECTION,
  assumptions: ASSUMPTIONS,
};

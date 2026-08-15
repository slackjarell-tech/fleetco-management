import {
  MapPin,
  Route,
  Package,
  DollarSign,
  Shield,
  Users,
  Warehouse,
  Smartphone,
  Bot,
  Fuel,
  Wrench,
  FileText,
  BarChart3,
  Clock,
} from 'lucide-react';

export const LOAD_BOARD_MARKETPLACE = {
  headline: 'FleetCo Load Board',
  subheadline: 'Post Freight Free. Pay Only When It Moves.',
  description:
    'Freight brokers, shippers, and fleet owners can post loads on the FleetCo Load Board at no cost. When a carrier books and completes the load, FleetCo charges 3.5% of total load value from the poster and 1.5% from the carrier — only when freight moves.',
  brokerPostingFee: 0,
  platformFeePercent: 5,
  posterFeePercent: 3.5,
  carrierFeePercent: 1.5,
  feeNote:
    'Posters and freight brokers pay 3.5% of load value; carriers pay 1.5% of load value. No monthly load-board fees. No per-post charges.',
  equipmentExamples: [
    'Cargo Van / Sprinter',
    'Box Truck & Liftgate',
    'Dry Van & Reefer',
    'Flatbed & Step Deck',
    'Power Only',
    'Hotshot & Car Hauler',
  ],
  brokerBenefits: [
    { title: 'Free to Post', desc: 'List unlimited loads — dry van, reefer, flatbed, box truck, power only, and more.' },
    { title: 'Built-In Equipment Matching', desc: 'Specify required equipment so carriers see loads that fit their fleet.' },
    { title: 'One Portal', desc: 'Post loads, track status, and manage your shippers from the same FleetCo platform.' },
    { title: 'Electronic BOL', desc: 'Attach bill of lading PDFs to loads — drivers download directly from the load board.' },
    { title: 'Low Transaction Fee', desc: 'Brokers pay 3.5%; carriers pay 1.5% when freight moves — not when you post.' },
  ],
};

export const PLATFORM_FEATURES = [
  {
    icon: MapPin,
    title: 'Live Fleet Map',
    desc: 'See every truck and driver on one map — status, location, and assignments updated in real time.',
    tag: 'Operations',
  },
  {
    icon: Route,
    title: 'Routes & POD',
    desc: 'Build routes, track stops, capture proof-of-delivery photos, and share progress with dispatch.',
    tag: 'Operations',
  },
  {
    icon: Package,
    title: 'Load Board & Marketplace',
    desc: 'Post loads free as a broker or shipper. Carriers book freight matched to equipment type — brokers pay 3.5% and carriers pay 1.5% when the load moves.',
    tag: 'Operations',
  },
  {
    icon: DollarSign,
    title: 'Payroll & Time Clock',
    desc: 'Clock drivers in/out, run payroll, and export pay records — synced with your fleet roster.',
    tag: 'Drivers & Payroll',
  },
  {
    icon: Shield,
    title: 'Compliance & IFTA',
    desc: 'HOS logs, DVIR inspections, incident tracking, and IFTA reporting in one compliance hub.',
    tag: 'Compliance',
  },
  {
    icon: Users,
    title: 'Owner-Operator Mode',
    desc: 'One login to run the business and drive — fleet owners get driver app access on the same account.',
    tag: 'Drivers & Payroll',
  },
  {
    icon: Warehouse,
    title: 'Yard Management (YMS)',
    desc: 'Design your yard layout, assign trailer spots, and see occupancy live — unique to FleetCo.',
    tag: 'Operations',
  },
  {
    icon: Smartphone,
    title: 'FleetCo Driver App',
    desc: 'Android app for clock-in, DVIR, fuel logs, scans, and messaging — synced to the portal instantly.',
    tag: 'Mobile',
  },
  {
    icon: Bot,
    title: 'FleetCo AI Assistant',
    desc: 'Ask questions about your fleet, get help navigating the portal, and draft reports faster.',
    tag: 'Other',
  },
  {
    icon: Fuel,
    title: 'Fuel & Audits',
    desc: 'Log fuel purchases, compare station prices, and audit receipts against vehicle assignments.',
    tag: 'Finance',
  },
  {
    icon: Wrench,
    title: 'Maintenance & Work Orders',
    desc: 'PM schedules, pre-trip checklists, work orders, parts inventory, and vendor coordination.',
    tag: 'Maintenance',
  },
  {
    icon: FileText,
    title: 'Invoices & Accounting',
    desc: 'Customer invoicing, chart of accounts, journal entries, and fleet P&L in one place.',
    tag: 'Finance',
  },
  {
    icon: BarChart3,
    title: 'Reports & Scorecards',
    desc: 'Driver scorecards, TCO per vehicle, executive dashboards, and exportable fleet reports.',
    tag: 'Finance',
  },
  {
    icon: Clock,
    title: 'ELD & HOS Portal',
    desc: 'Hours-of-service tracking, violation alerts, and inspection-ready records for audits.',
    tag: 'Compliance',
  },
];

export const PRICING_FAQ = [
  {
    q: 'How much does it cost to post loads on the FleetCo Load Board?',
    a: 'Posting loads is free for freight brokers and shippers. When a carrier completes a load, the poster pays 3.5% of load value and the carrier pays 1.5% of load value to FleetCo. There are no per-post or monthly load-board fees.',
  },
  {
    q: 'What is included in every plan?',
    a: 'Full access to the FleetCo portal — fleet tracking, maintenance, drivers, fuel, compliance, reports, payroll, load board access, and the driver mobile app.',
  },
  {
    q: 'Can I switch plans as my fleet grows?',
    a: 'Yes. Move from Starter (1–5 vehicles) to Growth (6–15) or contact us for Enterprise (16+) anytime. We prorate billing changes through Stripe.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — request a 14-day guided demo sandbox at fleetcomanagement.org/start-trial. No credit card required. You can also subscribe directly from the pricing page after a live walkthrough.',
  },
  {
    q: 'Do drivers need their own login?',
    a: 'Drivers get their own account or use owner-operator mode where the fleet owner drives on the same login. Every driver gets a unique 6-digit driver number for tracking.',
  },
  {
    q: 'What about the Android driver app?',
    a: 'FleetCo Driver is available on Google Play (internal testing track). iOS is coming soon — join the waitlist on our Driver App page.',
  },
];

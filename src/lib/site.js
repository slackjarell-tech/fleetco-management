/** Site-wide configuration for Fleetco Management */
export const SITE = {
  name: 'Fleetco Management',
  legalName: 'Fleetco Management LLC',
  domain: 'https://fleetcomanagement.org',
  url: import.meta.env.VITE_SITE_URL || 'https://fleetcomanagement.org',
  email: 'support@fleetcomanagement.org',
  supportEmail: 'support@fleetcomanagement.org',
  phone: '(360) 952-1249',
  location: 'Dallas, TX',
  description:
    'Fleet software for owner-operators and small carriers — dispatch, maintenance, fuel, payroll, compliance, and driver app in one portal.',
  tagline: 'Move freight. We handle the rest.',
};

export const SOCIAL = {
  ogImage: '/assets/fleetco-logo.png',
  twitterHandle: '@fleetcomanagement',
};

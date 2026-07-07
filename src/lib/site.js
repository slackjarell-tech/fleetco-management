/** Site-wide configuration for Fleetco Management */
export const SITE = {
  name: 'Fleetco Management',
  legalName: 'Fleetco Management LLC',
  domain: 'https://fleetcomanagement.org',
  url: import.meta.env.VITE_SITE_URL || 'https://fleetcomanagement.org',
  email: 'info@fleetcomanagement.org',
  phone: '(214) 555-0198',
  location: 'Dallas, TX',
  description:
    'Fleet management for owner-operators and small fleets — parts sourcing, fuel optimization, DOT compliance, and fleet operations in one portal.',
  tagline: 'Move freight. We handle the rest.',
};

export const SOCIAL = {
  ogImage: '/assets/fleetco-logo.png',
  twitterHandle: '@fleetcomanagement',
};

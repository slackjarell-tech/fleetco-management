/** Shared FleetCo brand constants for marketing & site */
export const BRAND = {
  company: 'Fleetco Management LLC',
  shortName: 'FleetCo Management',
  phone: '(360) 952-1249',
  phoneTel: '+13609521249',
  email: 'info@fleetcomanagement.org',
  supportEmail: 'support@fleetcomanagement.org',
  website: 'fleetcomanagement.org',
  url: 'https://fleetcomanagement.org',
  location: 'Dallas, TX',
  tagline: 'Move freight. We handle the rest.',
  ownersLine: 'JaRell D. Slack & Desiree M. Clark, Owners',
  owner1: { name: 'JaRell D. Slack', title: 'Owner, Director of Fleet Management' },
  owner2: { name: 'Desiree M. Clark', title: 'Co-Owner, Director of Operations' },
  pricing: [
    {
      name: 'Starter',
      price: '$299/mo',
      fleetSize: '1–5 vehicles',
      detail: 'Fleet manager · parts sourcing · fuel optimization · monthly reports',
    },
    {
      name: 'Growth',
      price: '$599/mo',
      fleetSize: '6–15 vehicles',
      detail: 'Everything in Starter · PM scheduling · priority support · budget reviews',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom pricing',
      priceSub: 'Quote on request',
      fleetSize: '16+ vehicles',
      detail: 'Tailored scope · telematics · custom integrations · dedicated account team',
      contactOnly: true,
    },
  ],
};

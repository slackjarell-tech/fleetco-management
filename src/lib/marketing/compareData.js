/** Public comparison data for /compare marketing page */
export const COMPARE_COMPETITORS = [
  { id: 'fleetco', name: 'FleetCo', highlight: true },
  { id: 'fleetlegend', name: 'FleetLegend' },
  { id: 'samsara', name: 'Samsara' },
  { id: 'motive', name: 'Motive' },
  { id: 'fleetio', name: 'Fleetio' },
];

export const COMPARE_ROWS = [
  { feature: 'Starting price (small fleet)', values: { fleetco: '$299/mo', fleetlegend: 'Custom', samsara: '~$40/vehicle', motive: '~$35/vehicle', fleetio: '~$4/vehicle' } },
  { feature: 'Load board + dispatch', values: { fleetco: 'Yes', fleetlegend: 'Yes', samsara: 'No', motive: 'Limited', fleetio: 'No' } },
  { feature: 'Free broker load posting', values: { fleetco: 'Yes', fleetlegend: 'No', samsara: 'No', motive: 'No', fleetio: 'No' } },
  { feature: 'Yard Management (YMS)', values: { fleetco: 'Yes', fleetlegend: 'No', samsara: 'No', motive: 'No', fleetio: 'No' } },
  { feature: 'Owner-operator single login', values: { fleetco: 'Yes', fleetlegend: 'Partial', samsara: 'No', motive: 'No', fleetio: 'No' } },
  { feature: 'Payroll + time clock', values: { fleetco: 'Yes', fleetlegend: 'Yes', samsara: 'No', motive: 'No', fleetio: 'No' } },
  { feature: 'Full accounting / GL', values: { fleetco: 'Yes', fleetlegend: 'Yes', samsara: 'No', motive: 'No', fleetio: 'Basic' } },
  { feature: 'QuickBooks export', values: { fleetco: 'Yes', fleetlegend: 'Sync', samsara: 'No', motive: 'No', fleetio: 'Yes' } },
  { feature: 'Electronic BOL on loads', values: { fleetco: 'Yes', fleetlegend: 'Docs', samsara: 'No', motive: 'No', fleetio: 'No' } },
  { feature: 'IFTA reporting', values: { fleetco: 'Yes', fleetlegend: 'Yes', samsara: 'Yes', motive: 'Yes', fleetio: 'Add-on' } },
  { feature: 'FMCSA-certified ELD hardware', values: { fleetco: 'Software logs*', fleetlegend: 'Integration', samsara: 'Yes', motive: 'Yes', fleetio: 'Via partner' } },
  { feature: 'Managed fleet services (human)', values: { fleetco: 'Yes', fleetlegend: 'No', samsara: 'No', motive: 'No', fleetio: 'No' } },
  { feature: 'Android driver app', values: { fleetco: 'Yes', fleetlegend: 'Yes', samsara: 'Yes', motive: 'Yes', fleetio: 'Yes' } },
  { feature: 'AI assistant', values: { fleetco: 'Yes', fleetlegend: 'No', samsara: 'Add-on', motive: 'Limited', fleetio: 'No' } },
];

export const ELD_DISCLAIMER =
  'FleetCo ELD Portal provides HOS logging and DVIR workflows in software. It is not a replacement for FMCSA-certified connected ELD hardware required for most interstate carriers. Telematics integrations are available on Enterprise plans.';

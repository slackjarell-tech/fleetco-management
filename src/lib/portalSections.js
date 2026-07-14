/** Maps portal routes to sidebar section labels for usage tracking. */
export const PATH_TO_SECTION = {
  '/portal': 'Dashboard',
  '/portal/executive': 'Dashboard',
  '/portal/customer-insights': 'Dashboard',
  '/portal/loads': 'Operations',
  '/portal/pd-command': 'Operations',
  '/portal/route-builder': 'Operations',
  '/portal/route-dashboard': 'Operations',
  '/portal/my-route': 'Operations',
  '/portal/navigation': 'Operations',
  '/portal/fleet-map': 'Operations',
  '/portal/yard-management': 'Operations',
  '/portal/fleet': 'Fleet',
  '/portal/fleetpnl': 'Fleet',
  '/portal/tco': 'Fleet',
  '/portal/repairs': 'Fleet',
  '/portal/workorders': 'Fleet',
  '/portal/diagnostics': 'Fleet',
  '/portal/maintenance': 'Maintenance',
  '/portal/calendar': 'Maintenance',
  '/portal/pretrip': 'Maintenance',
  '/portal/inspections': 'Maintenance',
  '/portal/service-templates': 'Maintenance',
  '/portal/parts': 'Maintenance',
  '/portal/vehicle-lookup': 'Maintenance',
  '/portal/vendors': 'Maintenance',
  '/portal/drivers': 'Drivers & Payroll',
  '/portal/scorecard': 'Drivers & Payroll',
  '/portal/driver-payroll': 'Drivers & Payroll',
  '/portal/payroll': 'Drivers & Payroll',
  '/portal/timeclock': 'Drivers & Payroll',
  '/portal/eld': 'Compliance',
  '/portal/hos': 'Compliance',
  '/portal/compliance': 'Compliance',
  '/portal/ifta': 'Compliance',
  '/portal/incidents': 'Compliance',
  '/portal/invoices': 'Finance',
  '/portal/fuel-stations': 'Finance',
  '/portal/fuel': 'Finance',
  '/portal/driver-scans': 'Finance',
  '/portal/driver-media': 'Finance',
  '/portal/reports': 'Finance',
  '/portal/accounting': 'Finance',
  '/portal/customers': 'Other',
  '/portal/messages': 'Other',
  '/portal/assistant': 'Other',
};

export function sectionForPath(pathname) {
  if (PATH_TO_SECTION[pathname]) return PATH_TO_SECTION[pathname];
  const base = pathname.split('/').slice(0, 3).join('/');
  return PATH_TO_SECTION[base] || 'Other';
}

export const INTERNAL_ONLY_PATHS = new Set([
  '/portal/executive',
  '/portal/customer-insights',
  '/portal/domain-emails',
  '/portal/data-backup',
  '/portal/advertisement',
  '/portal/dev-feedback',
  '/portal/revan',
  '/portal/competitive-analysis',
  '/portal/marketing-gallery',
]);

export function isCustomerFacingPath(path) {
  return !INTERNAL_ONLY_PATHS.has(path);
}

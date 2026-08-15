/** FleetCo Jobs — categories aligned with trucking & fleet operations hiring. */

export const JOB_CATEGORIES = [
  { id: 'cdl_driver_otr', label: 'CDL Driver — OTR', group: 'Driving' },
  { id: 'cdl_driver_regional', label: 'CDL Driver — Regional', group: 'Driving' },
  { id: 'cdl_driver_local', label: 'CDL Driver — Local / Dedicated', group: 'Driving' },
  { id: 'owner_operator', label: 'Owner-Operator', group: 'Driving' },
  { id: 'team_driver', label: 'Team Driver', group: 'Driving' },
  { id: 'dispatcher', label: 'Dispatcher', group: 'Operations' },
  { id: 'fleet_manager', label: 'Fleet Manager', group: 'Operations' },
  { id: 'safety_compliance', label: 'Safety / Compliance', group: 'Operations' },
  { id: 'mechanic_diesel', label: 'Diesel Mechanic / Technician', group: 'Shop' },
  { id: 'shop_foreman', label: 'Shop Foreman', group: 'Shop' },
  { id: 'warehouse_yard', label: 'Warehouse / Yard / Hostler', group: 'Operations' },
  { id: 'office_admin', label: 'Office / Admin', group: 'Corporate' },
  { id: 'hr_recruiting', label: 'HR / Recruiting', group: 'Corporate' },
  { id: 'sales_account', label: 'Sales / Account Manager', group: 'Corporate' },
  { id: 'other', label: 'Other', group: 'Other' },
];

export const EMPLOYMENT_TYPES = [
  { id: 'full_time', label: 'Full-time' },
  { id: 'part_time', label: 'Part-time' },
  { id: 'contract', label: 'Contract / 1099' },
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'owner_operator', label: 'Owner-operator' },
];

export const PAY_TYPES = [
  { id: 'per_mile', label: 'Per mile' },
  { id: 'hourly', label: 'Hourly' },
  { id: 'salary', label: 'Salary' },
  { id: 'percentage', label: 'Percentage of load' },
  { id: 'negotiable', label: 'Negotiable' },
];

export const APPLICATION_STATUSES = [
  'new', 'reviewed', 'interview', 'offer', 'hired', 'rejected', 'withdrawn',
];

export const JOB_POSTING_STATUSES = ['draft', 'open', 'paused', 'filled', 'closed'];

export function jobCategoryLabel(id) {
  return JOB_CATEGORIES.find((c) => c.id === id)?.label || id || 'Position';
}

export function slugify(text) {
  return String(text || 'job')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'job';
}

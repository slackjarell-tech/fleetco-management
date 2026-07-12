/** Customer portal roles — UI labels and helpers (mirrors server/customerRoles.js). */

export const CUSTOMER_TEAM_ROLES = [
  'customer_owner',
  'customer_hr',
  'customer_fleet_manager',
  'customer_fleet_coordinator',
  'customer_parts_manager',
  'driver',
];

export const CUSTOMER_LEGACY_ROLE = 'user';

export const CUSTOMER_ASSIGN_ROLES = ['customer_owner', 'customer_hr', 'customer_fleet_manager'];

export const CUSTOMER_ROLE_LABELS = {
  customer_owner: 'Customer Owner',
  customer_hr: 'HR',
  customer_fleet_manager: 'Fleet Manager',
  customer_fleet_coordinator: 'Fleet Coordinator',
  customer_parts_manager: 'Parts Manager',
  driver: 'Driver',
  user: 'Customer Owner',
};

export const DEFAULT_SIDEBAR_BY_CUSTOMER_ROLE = {
  customer_owner: ['Dashboard', 'Operations', 'Fleet', 'Maintenance', 'Drivers & Payroll', 'Compliance', 'Finance', 'Other'],
  customer_hr: ['Dashboard', 'Drivers & Payroll', 'Compliance', 'Other'],
  customer_fleet_manager: ['Dashboard', 'Operations', 'Fleet', 'Maintenance', 'Drivers & Payroll', 'Compliance', 'Other'],
  customer_fleet_coordinator: ['Dashboard', 'Operations', 'Fleet', 'Other'],
  customer_parts_manager: ['Dashboard', 'Maintenance', 'Fleet', 'Other'],
  driver: ['Dashboard', 'Operations', 'Other'],
  user: ['Dashboard', 'Operations', 'Fleet', 'Maintenance', 'Drivers & Payroll', 'Compliance', 'Finance', 'Other'],
};

export function normalizeCustomerRole(role) {
  return role === CUSTOMER_LEGACY_ROLE ? 'customer_owner' : role;
}

export function isCustomerTeamRole(role) {
  return CUSTOMER_TEAM_ROLES.includes(role) || role === CUSTOMER_LEGACY_ROLE;
}

export function isCustomerPortalUser(user) {
  return !!user?.customer_id && isCustomerTeamRole(user?.role);
}

export function canManageCustomerTeam(role) {
  if (!role) return false;
  return CUSTOMER_ASSIGN_ROLES.includes(normalizeCustomerRole(role)) || role === CUSTOMER_LEGACY_ROLE;
}

export function getAssignableCustomerRoles(actorRole) {
  const actor = normalizeCustomerRole(actorRole);
  if (actor === 'customer_owner') return [...CUSTOMER_TEAM_ROLES];
  if (actor === 'customer_hr') {
    return ['customer_hr', 'customer_fleet_manager', 'customer_fleet_coordinator', 'customer_parts_manager', 'driver'];
  }
  if (actor === 'customer_fleet_manager') {
    return ['customer_fleet_manager', 'customer_fleet_coordinator', 'customer_parts_manager', 'driver'];
  }
  return [];
}

export function customerRoleLabel(role) {
  return CUSTOMER_ROLE_LABELS[role] || CUSTOMER_ROLE_LABELS[normalizeCustomerRole(role)] || role;
}

export function defaultSidebarModulesForRole(role) {
  const key = normalizeCustomerRole(role);
  return DEFAULT_SIDEBAR_BY_CUSTOMER_ROLE[key] || DEFAULT_SIDEBAR_BY_CUSTOMER_ROLE.customer_fleet_coordinator;
}

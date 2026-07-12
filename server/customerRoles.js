/** Customer portal roles — separate from FleetCo internal roles (same slug only when customer_id is set). */

export const CUSTOMER_TEAM_ROLES = [
  'customer_owner',
  'customer_hr',
  'customer_fleet_manager',
  'customer_fleet_coordinator',
  'customer_parts_manager',
  'driver',
];

/** Legacy first-login role — treated as customer_owner everywhere. */
export const CUSTOMER_LEGACY_ROLE = 'user';

/** Roles that can invite users and assign access for their company. */
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

export const ALL_NAV_MODULES = [
  'Dashboard',
  'Operations',
  'Fleet',
  'Maintenance',
  'Drivers & Payroll',
  'Compliance',
  'Finance',
  'Other',
];

export const DEFAULT_SIDEBAR_BY_CUSTOMER_ROLE = {
  customer_owner: ALL_NAV_MODULES,
  customer_hr: ['Dashboard', 'Drivers & Payroll', 'Compliance', 'Other'],
  customer_fleet_manager: ['Dashboard', 'Operations', 'Fleet', 'Maintenance', 'Drivers & Payroll', 'Compliance', 'Other'],
  customer_fleet_coordinator: ['Dashboard', 'Operations', 'Fleet', 'Other'],
  customer_parts_manager: ['Dashboard', 'Maintenance', 'Fleet', 'Other'],
  driver: ['Dashboard', 'Operations', 'Other'],
  user: ALL_NAV_MODULES,
};

export function normalizeCustomerRole(role) {
  return role === CUSTOMER_LEGACY_ROLE ? 'customer_owner' : role;
}

export function isCustomerTeamRole(role) {
  return CUSTOMER_TEAM_ROLES.includes(role) || role === CUSTOMER_LEGACY_ROLE;
}

export function isCustomerPortalUserRecord(user) {
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

export function canAssignCustomerRole(actorRole, targetRole) {
  const normalized = normalizeCustomerRole(targetRole);
  if (!CUSTOMER_TEAM_ROLES.includes(normalized)) return false;
  return getAssignableCustomerRoles(actorRole).includes(normalized);
}

export function defaultSidebarModulesForRole(role) {
  const key = normalizeCustomerRole(role);
  return DEFAULT_SIDEBAR_BY_CUSTOMER_ROLE[key] || DEFAULT_SIDEBAR_BY_CUSTOMER_ROLE.customer_fleet_coordinator;
}

export function customerRoleLabel(role) {
  return CUSTOMER_ROLE_LABELS[role] || CUSTOMER_ROLE_LABELS[normalizeCustomerRole(role)] || role;
}

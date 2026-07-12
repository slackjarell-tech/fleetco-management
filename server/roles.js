/** Subscription plans — shared with frontend via duplicate constants (no cross-import in server) */
export const SUBSCRIPTION_PLANS = {
  Starter: { monthly: 299, fleetMax: 5 },
  Growth: { monthly: 599, fleetMax: 15 },
};

export function yearlyTotal(monthlyPrice) {
  return Math.round(monthlyPrice * 12 * 0.9);
}

export function subscriptionAmount(planName, term) {
  const plan = SUBSCRIPTION_PLANS[planName];
  if (!plan) return null;
  if (term === 'yearly') return yearlyTotal(plan.monthly);
  return plan.monthly;
}

export const FLEETCO_INTERNAL_ROLES = ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'];

export {
  CUSTOMER_TEAM_ROLES,
  CUSTOMER_LEGACY_ROLE,
  CUSTOMER_ASSIGN_ROLES,
  isCustomerTeamRole,
  isCustomerPortalUserRecord,
  canAssignCustomerRole,
  getAssignableCustomerRoles,
  defaultSidebarModulesForRole,
  normalizeCustomerRole,
  customerRoleLabel,
} from './customerRoles.js';

import {
  CUSTOMER_TEAM_ROLES,
  CUSTOMER_LEGACY_ROLE,
  isCustomerTeamRole,
  isCustomerPortalUserRecord,
  getAssignableCustomerRoles,
  normalizeCustomerRole,
} from './customerRoles.js';

/** Senior Leadership Team — can grant @fleetcomanagement.org email access */
export const SLT_ROLES = ['owner', 'executive', 'fleet_manager'];

export function isFleetCoInternal(role) {
  return FLEETCO_INTERNAL_ROLES.includes(role);
}

export function canCreateFleetCoEmployees(role) {
  return role === 'owner';
}

export function canProvisionCustomers(role) {
  return ['owner', 'executive', 'fleet_manager'].includes(role);
}

export function canManageCustomerTeam(role) {
  if (!role) return false;
  const normalized = normalizeCustomerRole(role);
  return ['customer_owner', 'customer_hr', 'customer_fleet_manager'].includes(normalized) || role === CUSTOMER_LEGACY_ROLE;
}

export function canMutateUsers(actor) {
  if (!actor) return false;
  if (['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(actor.role)) return true;
  return canManageCustomerTeam(actor.role);
}

export function canDeleteUser(actor, target, customerRecord) {
  if (!actor || !target) return false;
  if (['owner', 'executive', 'fleet_manager'].includes(actor.role)) return true;
  if (canManageCustomerTeam(actor.role) && target.customer_id === actor.customer_id) {
    if (target.id === actor.id) return false;
    if (customerRecord?.user_id === target.id) return false;
    return isCustomerTeamRole(target.role);
  }
  return false;
}

export function isInternalStaff(role) {
  return FLEETCO_INTERNAL_ROLES.includes(role);
}

export function canListAllUsers(role) {
  return isInternalStaff(role);
}

export const FLEETCO_EMAIL_DOMAIN = 'fleetcomanagement.org';

export function canManageDomainEmails(role) {
  return SLT_ROLES.includes(role);
}

export function canGrantEmployeeEmailAccess(role) {
  return SLT_ROLES.includes(role);
}

/** Full datastore export/import — executives and SLT only */
export function canManageDatastore(role) {
  return SLT_ROLES.includes(role);
}

export function normalizeFleetCoEmail(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim().toLowerCase();
  const local = trimmed.includes('@')
    ? trimmed.split('@')[0]
    : trimmed;
  const cleaned = local.replace(/[^a-z0-9._-]/g, '');
  if (!cleaned || cleaned.length < 2) return null;
  return `${cleaned}@${FLEETCO_EMAIL_DOMAIN}`;
}

export function isFleetCoDomainEmail(email) {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${FLEETCO_EMAIL_DOMAIN}`);
}

export function requireFleetCoEmail(email) {
  const normalized = email.includes('@') ? email.trim().toLowerCase() : normalizeFleetCoEmail(email);
  if (!normalized || !isFleetCoDomainEmail(normalized)) {
    throw new Error(`FleetCo employee emails must use @${FLEETCO_EMAIL_DOMAIN}`);
  }
  return normalized;
}

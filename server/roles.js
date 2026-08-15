/** Per-unit subscription pricing — shared with frontend via duplicate constants (no cross-import in server) */
export const PRICE_PER_UNIT_MONTHLY = 35;
export const YEARLY_DISCOUNT_PERCENT = 5;
export const DEFAULT_SUBSCRIPTION_PLAN = 'Per Unit';

export const SUBSCRIPTION_PLANS = {
  'Per Unit': { perUnitMonthly: PRICE_PER_UNIT_MONTHLY },
  Starter: { perUnitMonthly: PRICE_PER_UNIT_MONTHLY },
  Growth: { perUnitMonthly: PRICE_PER_UNIT_MONTHLY },
};

export function unitCountFromCustomer(customerOrUnits) {
  if (typeof customerOrUnits === 'number') return Math.max(1, Math.round(customerOrUnits));
  const n = Number(customerOrUnits?.fleet_size);
  return Math.max(1, Number.isFinite(n) && n > 0 ? Math.round(n) : 1);
}

export function monthlyTotalForUnits(unitCount) {
  const units = Math.max(1, Math.round(Number(unitCount) || 1));
  return Math.round(units * PRICE_PER_UNIT_MONTHLY * 100) / 100;
}

export function yearlyTotal(monthlyTotal) {
  const monthly = Number(monthlyTotal) || 0;
  return Math.round(monthly * 12 * (1 - YEARLY_DISCOUNT_PERCENT / 100) * 100) / 100;
}

export function subscriptionAmount(planName, term, unitCount = 1) {
  if (!SUBSCRIPTION_PLANS[planName] && planName !== DEFAULT_SUBSCRIPTION_PLAN) return null;
  const monthly = monthlyTotalForUnits(unitCount);
  if (term === 'yearly') return yearlyTotal(monthly);
  return monthly;
}

export function subscriptionAmountForCustomer(customer, term) {
  const plan = customer?.subscription_plan || DEFAULT_SUBSCRIPTION_PLAN;
  const billingTerm = term || customer?.subscription_term || 'monthly';
  return subscriptionAmount(plan, billingTerm, unitCountFromCustomer(customer));
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

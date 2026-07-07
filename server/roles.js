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
export const CUSTOMER_TEAM_ROLES = ['user', 'driver'];

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
  return role === 'user';
}

export const FLEETCO_EMAIL_DOMAIN = 'fleetcomanagement.org';

export function canManageDomainEmails(role) {
  return role === 'owner';
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

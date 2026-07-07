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

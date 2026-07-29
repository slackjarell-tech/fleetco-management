import { isCustomerPortalUser, customerRoleLabel } from './customerRoles.js';

/** Dedicated driver login (role slug driver). */
export function isPureDriverUser(user) {
  return user?.role === 'driver';
}

/** Customer portal users and drivers — one login for fleet management + driving. */
export function isDriverCapableUser(user) {
  if (!user) return false;
  if (user.role === 'driver') return true;
  return isCustomerPortalUser(user);
}

export function canAccessDriverApp(user) {
  return isDriverCapableUser(user);
}

export function filterDriverRoster(users, customerId = null) {
  let list = (users || []).filter(isDriverCapableUser);
  if (customerId) {
    list = list.filter((u) => u.customer_id === customerId);
  }
  return list;
}

export function driverRosterLabel(user) {
  if (!user) return 'Driver';
  if (user.role === 'driver') return 'Driver';
  if (isCustomerPortalUser(user)) {
    const role = customerRoleLabel(user.role);
    return `${role} · Driver`;
  }
  return 'Driver';
}

import { isCustomerPortalUserRecord } from './customerRoles.js';
import {
  ensureAllDriverNumbers,
  ensureDriverNumber,
  generateNextDriverNumber,
} from './entityNumbers.js';

export { ensureDriverNumber, ensureAllDriverNumbers, generateNextDriverNumber };

/** Dedicated driver login (role slug driver). */
export function isPureDriverRole(role) {
  return role === 'driver';
}

/** Any user who can drive, be assigned loads, and use the driver app. */
export function isDriverCapableUser(user) {
  if (!user) return false;
  if (user.role === 'driver') return true;
  return isCustomerPortalUserRecord(user);
}

export function filterDriverRoster(users, customerId = null) {
  let list = (users || []).filter(isDriverCapableUser);
  if (customerId) {
    list = list.filter((u) => u.customer_id === customerId);
  }
  return list;
}

/** @deprecated Use ensureAllDriverNumbers — kept for seed import compatibility */
export function ensureAllCustomerDriverNumbers() {
  return ensureAllDriverNumbers();
}

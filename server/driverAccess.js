import { isCustomerPortalUserRecord } from './customerRoles.js';
import { generateNextDriverNumber, listUsers, updateUser } from './db.js';

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

export function ensureDriverNumber(userId) {
  const user = listUsers().find((u) => u.id === userId);
  if (!user || !isDriverCapableUser(user)) return null;
  if (user.employee_number && /^DRV-/i.test(user.employee_number)) return user.employee_number;
  const num = generateNextDriverNumber();
  updateUser(userId, { employee_number: num });
  return num;
}

/** Backfill DRV-##### for every customer portal user on startup. */
export function ensureAllCustomerDriverNumbers() {
  let count = 0;
  for (const u of listUsers()) {
    if (!isCustomerPortalUserRecord(u)) continue;
    if (u.employee_number && /^DRV-/i.test(u.employee_number)) continue;
    updateUser(u.id, { employee_number: generateNextDriverNumber() });
    count += 1;
  }
  return count;
}

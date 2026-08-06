import { listEntities, listUsers, updateEntity, updateUser } from './db.js';
import { isCustomerPortalUserRecord } from './customerRoles.js';

const SIX_DIGIT_LEN = 6;

function isDriverCapableUserRecord(user) {
  if (!user) return false;
  if (user.role === 'driver') return true;
  return isCustomerPortalUserRecord(user);
}

/** Format a positive integer as a zero-padded 6-digit string (e.g. 000001). */
export function formatSixDigit(n) {
  return String(Math.max(1, Math.floor(n))).padStart(SIX_DIGIT_LEN, '0');
}

/** Parse numeric value from driver number — supports 000001 and legacy DRV-00001. */
export function parseDriverNumberValue(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const legacy = s.match(/^DRV-(\d+)$/i);
  if (legacy) return parseInt(legacy[1], 10);
  const digits = s.match(/^(\d{1,6})$/);
  if (digits) return parseInt(digits[1], 10);
  return null;
}

export function hasAssignedDriverNumber(raw) {
  return parseDriverNumberValue(raw) !== null;
}

/** Parse numeric value from customer_number (6 digits). */
export function parseCustomerNumberValue(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const digits = s.match(/^(\d{1,6})$/);
  if (digits) return parseInt(digits[1], 10);
  return null;
}

export function hasAssignedCustomerNumber(raw) {
  return parseCustomerNumberValue(raw) !== null;
}

/** System-wide unique driver ID — 6 digits on User.employee_number (legacy DRV-##### still recognized). */
export function generateNextDriverNumber() {
  let max = 0;
  for (const u of listUsers()) {
    const n = parseDriverNumberValue(u.employee_number);
    if (n != null) max = Math.max(max, n);
  }
  return formatSixDigit(max + 1);
}

export function isDriverNumberTaken(number, excludeUserId = null) {
  const targetNum = parseDriverNumberValue(number);
  const targetStr = String(number || '').trim().toUpperCase();
  if (targetNum == null && !targetStr) return false;
  return listUsers().some((u) => {
    if (u.id === excludeUserId) return false;
    if (targetNum != null) {
      const n = parseDriverNumberValue(u.employee_number);
      if (n != null && n === targetNum) return true;
    }
    return String(u.employee_number || '').trim().toUpperCase() === targetStr;
  });
}

/** System-wide unique customer ID — 6 digits on Customer.customer_number. */
export function generateNextCustomerNumber() {
  let max = 0;
  for (const c of listEntities('Customer')) {
    const n = parseCustomerNumberValue(c.customer_number);
    if (n != null) max = Math.max(max, n);
  }
  return formatSixDigit(max + 1);
}

export function isCustomerNumberTaken(number, excludeCustomerId = null) {
  const targetNum = parseCustomerNumberValue(number);
  const targetStr = String(number || '').trim();
  if (targetNum == null && !targetStr) return false;
  return listEntities('Customer').some((c) => {
    if (c.id === excludeCustomerId) return false;
    if (targetNum != null) {
      const n = parseCustomerNumberValue(c.customer_number);
      if (n != null && n === targetNum) return true;
    }
    return String(c.customer_number || '').trim() === targetStr;
  });
}

/** Assign customer_number on create when not provided. */
export function stampCustomerNumber(data, excludeCustomerId = null) {
  if (!data || typeof data !== 'object') return data;
  const next = { ...data };
  const existing = String(next.customer_number || '').trim();
  if (existing) {
    if (isCustomerNumberTaken(existing, excludeCustomerId)) {
      throw new Error(`Customer number ${existing} is already assigned`);
    }
    return next;
  }
  next.customer_number = generateNextCustomerNumber();
  return next;
}

/** Assign driver number on user create when driver-capable and not provided. */
export function stampDriverNumber(userFields, excludeUserId = null) {
  if (!userFields || typeof userFields !== 'object') return userFields;
  const next = { ...userFields };
  const role = next.role;
  const customerId = next.customer_id ?? next.customerId ?? null;
  const capable = isDriverCapableUserRecord({ role, customer_id: customerId });
  if (!capable) return next;

  const existing = String(next.employee_number || next.employeeNumber || '').trim();
  if (existing) {
    if (isDriverNumberTaken(existing, excludeUserId)) {
      throw new Error(`Driver number ${existing} is already assigned`);
    }
    if (next.employeeNumber !== undefined) next.employeeNumber = existing;
    if (next.employee_number !== undefined) next.employee_number = existing;
    return next;
  }

  const num = generateNextDriverNumber();
  if ('employeeNumber' in next) next.employeeNumber = num;
  if ('employee_number' in next) next.employee_number = num;
  if (!('employeeNumber' in next) && !('employee_number' in next)) {
    next.employee_number = num;
  }
  return next;
}

export function ensureDriverNumber(userId) {
  const user = listUsers().find((u) => u.id === userId);
  if (!user || !isDriverCapableUserRecord(user)) return null;
  if (hasAssignedDriverNumber(user.employee_number)) return user.employee_number;
  const num = generateNextDriverNumber();
  updateUser(userId, { employee_number: num });
  return num;
}

/** Backfill 6-digit driver numbers for every driver-capable user missing one. */
export function ensureAllDriverNumbers() {
  let count = 0;
  for (const u of listUsers()) {
    if (!isDriverCapableUserRecord(u)) continue;
    if (hasAssignedDriverNumber(u.employee_number)) continue;
    updateUser(u.id, { employee_number: generateNextDriverNumber() });
    count += 1;
  }
  return count;
}

/** Backfill 6-digit customer numbers for every customer missing one. */
export function ensureAllCustomerNumbers() {
  let count = 0;
  for (const c of listEntities('Customer')) {
    if (hasAssignedCustomerNumber(c.customer_number)) continue;
    updateEntity('Customer', c.id, { customer_number: generateNextCustomerNumber() });
    count += 1;
  }
  return count;
}

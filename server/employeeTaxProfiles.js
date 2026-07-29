import {
  createEntity,
  filterEntities,
  findUserById,
  getEntity,
  isDriverNumberTaken,
  nowIso,
  updateEntity,
  updateUser,
} from './db.js';
import { isInternalRole } from './entityScope.js';
import { canManageCustomerTeam } from './roles.js';

export function canManageHrPayroll(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  return canManageCustomerTeam(user.role) || user.role === 'customer_hr';
}

function assertHrPayroll(user) {
  if (!canManageHrPayroll(user)) {
    throw new Error('HR or payroll admin access required');
  }
}

function assertUserInScope(user, targetUserId) {
  const target = findUserById(targetUserId);
  if (!target) throw new Error('Employee not found');

  if (isInternalRole(user.role)) {
    if (!target.customer_id && !['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(target.role)) {
      throw new Error('Not a FleetCo employee record');
    }
    return target;
  }

  if (!user.customer_id || target.customer_id !== user.customer_id) {
    throw new Error('You can only manage employees in your organization');
  }
  return target;
}

export function getEmployeeTaxProfile(user, { user_id, tax_year }) {
  assertHrPayroll(user);
  if (!user_id) throw new Error('user_id required');
  assertUserInScope(user, user_id);

  const year = tax_year || new Date().getFullYear();
  const customerId = user.customer_id || '';
  const rows = filterEntities('EmployeeTaxProfile', { user_id, tax_year: year }, null, 5);
  let profile = rows.find((r) => (customerId ? r.customer_id === customerId : !r.customer_id)) || rows[0];

  return {
    success: true,
    profile: profile || null,
    tax_year: year,
    user_id,
  };
}

export function saveEmployeeTaxProfile(user, body) {
  assertHrPayroll(user);
  const { user_id, tax_year, federal, states, employee_number } = body;
  if (!user_id) throw new Error('user_id required');

  const target = assertUserInScope(user, user_id);
  const year = tax_year || new Date().getFullYear();
  const customerId = target.customer_id || user.customer_id || '';

  if (employee_number !== undefined && employee_number !== null && employee_number !== '') {
    const num = String(employee_number).trim();
    if (isDriverNumberTaken(num, target.id)) {
      throw new Error(`Employee number ${num} is already assigned`);
    }
    updateUser(target.id, { employee_number: num });
  }

  const payload = {
    user_id,
    customer_id: customerId,
    employee_name: target.full_name || target.email,
    tax_year: year,
    federal: federal || {},
    states: states || {},
    updated_at: nowIso(),
    updated_by: user.email,
  };

  const existing = filterEntities('EmployeeTaxProfile', { user_id, tax_year: year, customer_id: customerId }, null, 1)[0];
  let profile;
  if (existing) {
    profile = updateEntity('EmployeeTaxProfile', existing.id, payload);
  } else {
    profile = createEntity('EmployeeTaxProfile', { ...payload, created_by: user.email });
  }

  return { success: true, profile, employee_number: findUserById(user_id)?.employee_number };
}

export function listEmployeeTaxProfiles(user, { tax_year, customer_id } = {}) {
  assertHrPayroll(user);
  const year = tax_year || new Date().getFullYear();
  let items = filterEntities('EmployeeTaxProfile', { tax_year: year });

  if (user.customer_id) {
    items = items.filter((p) => p.customer_id === user.customer_id);
  } else if (customer_id) {
    items = items.filter((p) => p.customer_id === customer_id);
  }

  return { success: true, count: items.length, items };
}

export function updateEmployeeNumber(user, { user_id, employee_number }) {
  return saveEmployeeTaxProfile(user, { user_id, employee_number, tax_year: new Date().getFullYear() });
}

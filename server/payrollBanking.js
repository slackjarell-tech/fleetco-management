import {
  createEntity,
  filterEntities,
  findUserById,
  getEntity,
  listUsers,
  nowIso,
  updateEntity,
} from './db.js';
import { isInternalRole } from './entityScope.js';
import { encryptSensitive, maskAccountLast4 } from './payrollVault.js';

const FLEETCO_EMPLOYEE_ROLES = new Set(['owner', 'executive', 'fleet_manager', 'fleet_coordinator']);

export function canManageCustomerFunding(user) {
  if (!user?.customer_id) return false;
  return ['customer_owner', 'customer_hr', 'customer_fleet_manager', 'user'].includes(user.role);
}

export function canManagePayeeBank(user, targetUserId) {
  if (!user) return false;
  if (user.id === targetUserId && user.role === 'driver') return true;
  if (canManageCustomerFunding(user)) {
    const target = findUserById(targetUserId);
    return target?.customer_id === user.customer_id;
  }
  if (isInternalRole(user.role)) return true;
  return false;
}

function maskedFunding(account) {
  if (!account) return null;
  return {
    id: account.id,
    customer_id: account.customer_id,
    account_holder: account.account_holder,
    bank_name: account.bank_name,
    account_type: account.account_type,
    routing_last4: account.routing_last4,
    account_last4: account.account_last4,
    status: account.status,
    updated_at: account.updated_at,
  };
}

function maskedPayee(account) {
  if (!account) return null;
  return {
    id: account.id,
    user_id: account.user_id,
    employee_name: account.employee_name,
    bank_name: account.bank_name,
    account_type: account.account_type,
    routing_last4: account.routing_last4,
    account_last4: account.account_last4,
    status: account.status,
    updated_at: account.updated_at,
  };
}

export function saveCustomerFundingAccount(user, body) {
  if (!canManageCustomerFunding(user) && !isInternalRole(user.role)) {
    throw new Error('Only customer HR/owner or FleetCo staff can save company funding bank info');
  }
  const customerId = user.customer_id || body.customer_id;
  if (!customerId) throw new Error('customer_id required');

  const { account_holder, bank_name, account_type, routing_number, account_number } = body;
  if (!account_holder || !routing_number || !account_number) {
    throw new Error('account_holder, routing_number, and account_number are required');
  }

  const routingEnc = encryptSensitive(routing_number.replace(/\D/g, ''));
  const accountEnc = encryptSensitive(account_number.replace(/\D/g, ''));

  const existing = filterEntities('CustomerFundingAccount', { customer_id: customerId }, null, 1)[0];
  const payload = {
    customer_id: customerId,
    account_holder: String(account_holder).trim(),
    bank_name: String(bank_name || '').trim(),
    account_type: account_type === 'savings' ? 'savings' : 'checking',
    routing_ciphertext: routingEnc.ciphertext,
    routing_enc_mode: routingEnc.mode,
    routing_last4: routingEnc.last4 || maskAccountLast4(routing_number),
    account_ciphertext: accountEnc.ciphertext,
    account_enc_mode: accountEnc.mode,
    account_last4: accountEnc.last4 || maskAccountLast4(account_number),
    status: 'active',
    updated_at: nowIso(),
    updated_by: user.email,
  };

  if (existing) {
    return maskedFunding(updateEntity('CustomerFundingAccount', existing.id, payload));
  }
  return maskedFunding(createEntity('CustomerFundingAccount', { ...payload, created_by: user.email }));
}

export function savePayeeBankAccount(user, body) {
  const { user_id, account_holder, bank_name, account_type, routing_number, account_number } = body;
  if (!user_id) throw new Error('user_id is required');
  if (!canManagePayeeBank(user, user_id)) {
    throw new Error('You cannot update bank info for this employee');
  }

  const payee = findUserById(user_id);
  if (!payee) throw new Error('Employee not found');

  if (!account_holder || !routing_number || !account_number) {
    throw new Error('account_holder, routing_number, and account_number are required');
  }

  const routingEnc = encryptSensitive(routing_number.replace(/\D/g, ''));
  const accountEnc = encryptSensitive(account_number.replace(/\D/g, ''));

  const existing = filterEntities('PayeeBankAccount', { user_id }, null, 1)[0];
  const payload = {
    user_id,
    customer_id: payee.customer_id || '',
    employee_name: payee.full_name || payee.email,
    account_holder: String(account_holder).trim(),
    bank_name: String(bank_name || '').trim(),
    account_type: account_type === 'savings' ? 'savings' : 'checking',
    routing_ciphertext: routingEnc.ciphertext,
    routing_enc_mode: routingEnc.mode,
    routing_last4: routingEnc.last4,
    account_ciphertext: accountEnc.ciphertext,
    account_enc_mode: accountEnc.mode,
    account_last4: accountEnc.last4,
    status: 'active',
    updated_at: nowIso(),
    updated_by: user.email,
  };

  if (existing) {
    return maskedPayee(updateEntity('PayeeBankAccount', existing.id, payload));
  }
  return maskedPayee(createEntity('PayeeBankAccount', { ...payload, created_by: user.email }));
}

export function getPayrollBankingSummary(user) {
  let customerId = user.customer_id;
  if (isInternalRole(user.role) && !customerId) {
    return { mode: 'internal', funding: null, payees: [] };
  }
  if (!customerId && !isInternalRole(user.role)) {
    throw new Error('Customer context required');
  }

  const funding = customerId
    ? filterEntities('CustomerFundingAccount', { customer_id: customerId, status: 'active' }, null, 1)[0]
    : null;

  let payees = filterEntities('PayeeBankAccount', { status: 'active' });
  if (customerId) {
    payees = payees.filter((p) => p.customer_id === customerId);
  }

  const drivers = listUsers().filter((u) => u.role === 'driver' && (!customerId || u.customer_id === customerId));

  return {
    mode: customerId ? 'customer' : 'internal',
    customer_id: customerId,
    funding: maskedFunding(funding),
    payees: payees.map(maskedPayee),
    drivers: drivers.map((d) => ({ id: d.id, name: d.full_name || d.email, email: d.email })),
    drivers_missing_bank: drivers
      .filter((d) => !payees.some((p) => p.user_id === d.id))
      .map((d) => ({ id: d.id, name: d.full_name || d.email, email: d.email })),
  };
}

export function listFleetCoInternalEmployees() {
  return listUsers().filter((u) => FLEETCO_EMPLOYEE_ROLES.has(u.role) && !u.customer_id);
}

export { FLEETCO_EMPLOYEE_ROLES };

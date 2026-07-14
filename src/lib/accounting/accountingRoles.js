import { isInternalRole, isSLT } from '@/lib/roles';
import { normalizeCustomerRole } from '@/lib/customerRoles';

export function canAccessAccounting(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  const role = normalizeCustomerRole(user.role);
  return ['customer_owner', 'customer_hr', 'customer_fleet_manager', 'customer_parts_manager'].includes(role);
}

export function canSubmitPurchaseOrder(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  const role = normalizeCustomerRole(user.role);
  return ['customer_owner', 'customer_fleet_manager', 'customer_parts_manager', 'customer_hr'].includes(role);
}

export function canApprovePurchaseOrder(user) {
  if (!user) return false;
  if (isSLT(user.role) || user.role === 'fleet_coordinator') return true;
  const role = normalizeCustomerRole(user.role);
  return ['customer_owner', 'customer_fleet_manager', 'customer_hr'].includes(role);
}

export function canIssuePurchaseOrder(user) {
  return canApprovePurchaseOrder(user);
}

export function canReceivePurchaseOrder(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  const role = normalizeCustomerRole(user.role);
  return ['customer_owner', 'customer_fleet_manager', 'customer_parts_manager', 'customer_hr'].includes(role);
}

export function canRunPayroll(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  const role = normalizeCustomerRole(user.role);
  return ['customer_owner', 'customer_hr', 'customer_fleet_manager'].includes(role);
}

export function canApprovePayroll(user) {
  if (!user) return false;
  if (isSLT(user.role)) return true;
  const role = normalizeCustomerRole(user.role);
  return ['customer_owner', 'customer_hr'].includes(role);
}

export const PO_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  declined: 'Declined',
  issued: 'PO Issued',
  received: 'Received',
  cancelled: 'Cancelled',
};

export const PAYROLL_RUN_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  posted: 'Posted',
  paid: 'Paid',
};

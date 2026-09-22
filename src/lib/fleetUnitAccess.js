import { isInternalRole, isFleetCoAdmin } from '@/lib/roles';
import {
  isCustomerPortalUser,
  canAddCustomerVehicles,
  canEditCustomerVehicles,
} from '@/lib/customerRoles';

/** FleetCo portal staff (internal roles + shop tech). */
export function isFleetCoEmployee(user) {
  if (!user?.role) return false;
  return isInternalRole(user.role) || user.role === 'tech';
}

/** Edit unit status, odometer, specs — customers + all FleetCo employees. */
export function canEditFleetUnits(user) {
  if (!user) return false;
  if (isFleetCoEmployee(user)) return true;
  return isCustomerPortalUser(user) && canEditCustomerVehicles(user.role);
}

/** Register new trucks/trailers — customers (wizard) + FleetCo employees. */
export function canAddFleetUnits(user) {
  if (!user) return false;
  if (isFleetCoEmployee(user)) return true;
  return isCustomerPortalUser(user) && canAddCustomerVehicles(user.role);
}

/** Full FleetCo admin add/edit (assign customer, delete, trailer buttons). */
export function canAdministerFleetUnits(user) {
  return isFleetCoAdmin(user?.role) || user?.role === 'tech';
}

/** Customer-style modal (no assign-customer field). */
export function useCustomerFleetUnitModal(user) {
  return isCustomerPortalUser(user) && !isFleetCoEmployee(user);
}

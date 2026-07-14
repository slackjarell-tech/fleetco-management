/** Frontend role helpers — mirror server/roles.js where relevant */
export {
  isCustomerPortalUser,
  canManageCustomerTeam,
  customerRoleLabel,
  isCustomerTeamRole,
} from './customerRoles.js';
import { isCustomerPortalUser as isCustomerPortalAccount } from './customerRoles.js';
export const PLATFORM_ADMIN_ROLES = ['owner', 'executive', 'admin'];
export const FLEETCO_ADMIN_ROLES = ['owner', 'executive', 'fleet_manager', 'admin'];
export const EXECUTIVE_VIEW_ROLES = ['owner', 'executive'];
export const INTERNAL_ROLES = ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'];

/** Senior Leadership Team — owner, executive, fleet managers */
export const SLT_ROLES = ['owner', 'executive', 'fleet_manager'];

export function isSLT(role) {
  return SLT_ROLES.includes(role);
}

export function canManageDomainEmails(role) {
  return isSLT(role);
}

export function canManageDatastore(role) {
  return isSLT(role);
}

export function isPlatformAdmin(role) {
  return PLATFORM_ADMIN_ROLES.includes(role);
}

export function isFleetCoAdmin(role) {
  return FLEETCO_ADMIN_ROLES.includes(role);
}

export function isExecutiveView(role) {
  return EXECUTIVE_VIEW_ROLES.includes(role);
}

export function isInternalRole(role) {
  return INTERNAL_ROLES.includes(role);
}

function _isCustomerPortal(user) {
  return isCustomerPortalAccount(user);
}

export function getEffectiveCustomerId(user, viewAsCustomerId = null) {
  if (!user) return null;
  if (user.customer_id) return user.customer_id;
  if (INTERNAL_ROLES.includes(user.role) && viewAsCustomerId) return viewAsCustomerId;
  return null;
}

export function filterByCustomerId(records, user, field = 'customer_id', viewAsCustomerId = null) {
  const cid = getEffectiveCustomerId(user, viewAsCustomerId);
  if (cid) {
    return records.filter((r) => r[field] === cid || r.assigned_customer_id === cid);
  }
  return records;
}

export function filterVehiclesForUser(vehicles, user, viewAsCustomerId = null) {
  if (!user) return vehicles;
  if (user.role === 'driver') {
    return vehicles.filter((v) => v.assigned_driver_id === user.id);
  }
  const cid = getEffectiveCustomerId(user, viewAsCustomerId);
  if (cid) {
    return vehicles.filter(
      (v) => v.customer_id === cid || v.assigned_customer_id === cid,
    );
  }
  if (_isCustomerPortal(user) && user.customer_id) {
    return vehicles.filter(
      (v) => v.customer_id === user.customer_id || v.assigned_customer_id === user.customer_id,
    );
  }
  return vehicles;
}

export function isDeliveryStopComplete(status) {
  return status === 'delivered' || status === 'completed';
}

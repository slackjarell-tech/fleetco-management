/**
 * Load board permissions — posting, dispatch, and future broker syndication.
 */
import { isFleetCoAdmin, INTERNAL_ROLES } from './roles.js';
import { canManageCustomerTeam, isCustomerPortalUser } from './customerRoles.js';
import { isPureDriverUser } from './driverAccess.js';

/** Partner brokers who log in to post loads on behalf of shippers (future syndication UI). */
export const FREIGHT_BROKER_ROLE = 'freight_broker';

export const LOAD_POSTING_ROLES = [
  ...INTERNAL_ROLES,
  'admin',
  FREIGHT_BROKER_ROLE,
  'customer_owner',
  'customer_fleet_manager',
  'customer_fleet_coordinator',
  'user', // legacy customer owner
];

export const LOAD_DISPATCH_ROLES = [...INTERNAL_ROLES, 'admin'];

export function isFreightBroker(user) {
  return user?.role === FREIGHT_BROKER_ROLE;
}

/** Can create or edit loads (post freight). */
export function canPostLoad(user) {
  if (!user || isPureDriverUser(user)) return false;
  if (isFleetCoAdmin(user.role) || INTERNAL_ROLES.includes(user.role)) return true;
  if (isFreightBroker(user)) return true;
  if (isCustomerPortalUser(user)) {
    return canManageCustomerTeam(user.role) || user.role === 'customer_fleet_coordinator';
  }
  return LOAD_POSTING_ROLES.includes(user.role);
}

/** Can assign drivers, change dispatch status, delete loads. */
export function canDispatchLoad(user) {
  if (!user) return false;
  return isFleetCoAdmin(user.role) || LOAD_DISPATCH_ROLES.includes(user.role);
}

/** Customer/broker posting UI — hide internal dispatch fields. */
export function isCustomerLoadPoster(user) {
  if (!user) return false;
  if (isFreightBroker(user)) return true;
  return isCustomerPortalUser(user) && canPostLoad(user);
}

export function loadPosterCustomerId(user) {
  if (!user) return null;
  if (user.customer_id) return user.customer_id;
  return null;
}

/** Carriers can browse open marketplace loads from other shippers/brokers. */
export function canBrowseMarketplace(user) {
  if (!user || isPureDriverUser(user)) return false;
  if (isFreightBroker(user)) return false;
  if (isFleetCoAdmin(user.role) || INTERNAL_ROLES.includes(user.role)) return true;
  return !!user.customer_id;
}

export function canBookMarketplaceLoad(user, load) {
  if (!canBrowseMarketplace(user) || !load) return false;
  if (load.status !== 'available') return false;
  if (load.booking_status && load.booking_status !== 'open') return false;
  if (load.customer_id && user.customer_id === load.customer_id) return false;
  return load.marketplace_visible !== false;
}

export function canRespondToBooking(user, load) {
  if (!user || !load) return false;
  if (isFleetCoAdmin(user.role) || LOAD_DISPATCH_ROLES.includes(user.role)) return true;
  if (load.customer_id && user.customer_id === load.customer_id) return true;
  return false;
}

export const PLATFORM_FEE_PERCENT = 3.5;

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
  if (load.posted_by_user_id && load.posted_by_user_id === user.id) return true;
  if (load.customer_id && user.customer_id === load.customer_id) return true;
  return false;
}

function isLoadPoster(user, load) {
  if (!user || !load) return false;
  if (load.posted_by_user_id && load.posted_by_user_id === user.id) return true;
  if (load.customer_id && user.customer_id && load.customer_id === user.customer_id) return true;
  return false;
}

function isLoadCarrier(user, load) {
  if (!user || !load) return false;
  const carrierId = load.booked_by_customer_id || load.assigned_customer_id;
  if (carrierId && user.customer_id && carrierId === user.customer_id) return true;
  if (load.booked_by_user_id === user.id) return true;
  return false;
}

/** Poster, carrier, interested fleet customers (pre-book), brokers, and SLT. */
export function canAccessLoadThread(user, load) {
  if (!user || !load) return false;
  if (isFleetCoAdmin(user.role) || user.role === 'admin' || user.role === 'owner') return true;
  if (isLoadPoster(user, load)) return true;
  if (isLoadCarrier(user, load)) return true;

  const openMarketplace = load.marketplace_visible !== false
    && load.status === 'available'
    && (!load.booking_status || load.booking_status === 'open');

  if (openMarketplace && user.customer_id && !isFreightBroker(user)) {
    if (load.customer_id && user.customer_id === load.customer_id) return false;
    return true;
  }

  if (load.booking_status === 'pending' && isLoadPoster(user, load)) return true;

  return false;
}

export function canViewSltMarketplaceOversight(user) {
  return isFleetCoAdmin(user?.role) || user?.role === 'fleet_manager';
}

export {
  POSTER_FEE_PERCENT,
  CARRIER_FEE_PERCENT,
  PLATFORM_FEE_PERCENT,
  userLoadFeeAmount,
  userLoadFeePercent,
} from './loadMarketplaceFinance.js';

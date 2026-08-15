import { isFleetCoInternal } from './roles.js';

export function isSltMarketplaceViewer(user) {
  if (!user) return false;
  return isFleetCoInternal(user.role) || user.role === 'admin' || user.role === 'owner' || user.role === 'fleet_manager';
}

export function isLoadPoster(user, load) {
  if (!user || !load) return false;
  if (load.posted_by_user_id && load.posted_by_user_id === user.id) return true;
  if (load.customer_id && user.customer_id && load.customer_id === user.customer_id) return true;
  return false;
}

export function isLoadCarrier(user, load) {
  if (!user || !load) return false;
  const carrierId = load.booked_by_customer_id || load.assigned_customer_id;
  if (carrierId && user.customer_id && carrierId === user.customer_id) return true;
  if (load.booked_by_user_id === user.id) return true;
  return false;
}

/** Brokers, carriers, interested fleet customers (pre-book), and SLT. */
export function canAccessLoadThread(user, load) {
  if (!user || !load) return false;
  if (isSltMarketplaceViewer(user)) return true;
  if (isLoadPoster(user, load)) return true;
  if (isLoadCarrier(user, load)) return true;

  const openMarketplace = load.marketplace_visible !== false
    && load.status === 'available'
    && (!load.booking_status || load.booking_status === 'open');

  if (openMarketplace && user.customer_id && user.role !== 'freight_broker') {
    if (load.customer_id && user.customer_id === load.customer_id) return false;
    return true;
  }

  if (load.booking_status === 'pending' && isLoadPoster(user, load)) return true;

  return false;
}

export function canRespondToLoadBooking(user, load) {
  if (!user || !load) return false;
  if (isSltMarketplaceViewer(user)) return true;
  return isLoadPoster(user, load);
}

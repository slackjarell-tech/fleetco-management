import {
  createEntity,
  filterEntities,
  getEntity,
  updateEntity,
  findUserById,
  nowIso,
} from './db.js';
import { isFleetCoInternal } from './roles.js';

function isAdminRole(role) {
  return isFleetCoInternal(role) || role === 'admin' || role === 'owner';
}
import { isDriverCapableUser } from './driverAccess.js';

export const PLATFORM_FEE_PERCENT = 3.5;

export function canBrowseMarketplace(user) {
  if (!user) return false;
  if (user.role === 'driver') return false;
  if (isFleetCoInternal(user.role) || isAdminRole(user.role)) return true;
  if (user.role === 'freight_broker') return false;
  if (user.customer_id) return true;
  return false;
}

export function canBookMarketplaceLoad(user, load) {
  if (!canBrowseMarketplace(user)) return false;
  if (!load || load.status !== 'available') return false;
  if (load.booking_status && load.booking_status !== 'open') return false;
  if (load.customer_id && user.customer_id === load.customer_id) return false;
  return load.marketplace_visible !== false;
}

export function canRespondToBooking(user, load) {
  if (!user || !load) return false;
  if (isFleetCoInternal(user.role) || isAdminRole(user.role)) return true;
  if (load.customer_id && user.customer_id === load.customer_id) return true;
  if (load.posted_by_user_id === user.id) return true;
  return false;
}

export function listMarketplaceLoads(user) {
  if (!canBrowseMarketplace(user)) return [];
  let loads = filterEntities('Load', { status: 'available' });
  loads = loads.filter((l) => {
    if (l.marketplace_visible === false) return false;
    if (l.booking_status && l.booking_status !== 'open') return false;
    if (user.customer_id && l.customer_id === user.customer_id) return false;
    return true;
  });
  return loads.sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
}

export function bookLoad(user, { loadId, driverId, vehicleId, notes }) {
  if (!user) throw new Error('Unauthorized');
  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');
  if (!canBookMarketplaceLoad(user, load)) throw new Error('You cannot book this load');

  let assignedDriver = driverId || null;
  if (assignedDriver) {
    const driver = findUserById(assignedDriver);
    if (!driver) throw new Error('Driver not found');
    if (user.customer_id && driver.customer_id !== user.customer_id) {
      throw new Error('Driver must belong to your fleet');
    }
  } else if (isDriverCapableUser(user)) {
    assignedDriver = user.id;
  }

  const updated = updateEntity('Load', loadId, {
    booking_status: 'pending',
    booked_by_customer_id: user.customer_id || null,
    booked_by_user_id: user.id,
    booked_driver_id: assignedDriver,
    booked_vehicle_id: vehicleId || null,
    booked_at: nowIso(),
    booking_notes: notes || '',
  });
  return { success: true, load: updated };
}

export function respondToLoadBooking(user, { loadId, action, assignedDriverId, assignedVehicleId }) {
  if (!user) throw new Error('Unauthorized');
  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');
  if (!canRespondToBooking(user, load)) throw new Error('Not authorized to respond to this booking');
  if (load.booking_status !== 'pending') throw new Error('No pending booking on this load');

  if (action === 'decline') {
    const updated = updateEntity('Load', loadId, {
      booking_status: 'open',
      booked_by_customer_id: null,
      booked_by_user_id: null,
      booked_driver_id: null,
      booked_vehicle_id: null,
      booked_at: null,
      booking_notes: '',
    });
    return { success: true, load: updated, action: 'declined' };
  }

  if (action !== 'accept') throw new Error('action must be accept or decline');

  const driverId = assignedDriverId || load.booked_driver_id || null;
  const vehicleId = assignedVehicleId || load.booked_vehicle_id || null;

  const updated = updateEntity('Load', loadId, {
    booking_status: 'accepted',
    status: 'assigned',
    assigned_driver_id: driverId,
    assigned_vehicle_id: vehicleId,
    assigned_customer_id: load.booked_by_customer_id || null,
    platform_fee_percent: PLATFORM_FEE_PERCENT,
    platform_fee_status: 'pending',
    platform_fee_amount: load.rate ? Math.round(load.rate * PLATFORM_FEE_PERCENT) / 100 : null,
  });
  return { success: true, load: updated, action: 'accepted' };
}

export function completeLoadWithFee(user, loadId) {
  if (!user) throw new Error('Unauthorized');
  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');
  const canComplete = isFleetCoInternal(user.role) || isAdminRole(user.role)
    || (user.customer_id && (load.customer_id === user.customer_id || load.booked_by_customer_id === user.customer_id));
  if (!canComplete) throw new Error('Not authorized');

  const rate = Number(load.rate) || 0;
  const feeAmount = rate ? Math.round(rate * PLATFORM_FEE_PERCENT) / 100 : 0;

  const updated = updateEntity('Load', loadId, {
    status: 'delivered',
    platform_fee_percent: PLATFORM_FEE_PERCENT,
    platform_fee_amount: feeAmount,
    platform_fee_status: feeAmount > 0 ? 'pending' : 'waived',
    delivered_at: nowIso(),
  });
  return { success: true, load: updated, platformFee: feeAmount };
}

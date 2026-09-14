import {
  createEntity,
  filterEntities,
  getEntity,
  updateEntity,
  nowIso,
} from './db.js';
import { isDriverCapableUser } from './roles.js';

function assertDriver(user) {
  if (!user) throw new Error('Unauthorized');
  if (!isDriverCapableUser(user)) throw new Error('Driver access required');
}

function getShift(clockEntryId, userId) {
  const entry = clockEntryId ? getEntity('TimeClockEntry', clockEntryId) : null;
  if (entry) return entry;
  return filterEntities('TimeClockEntry', { user_id: userId })
    .find((e) => e.entry_type === 'shift' && !e.clock_out) || null;
}

function assertTrailer(trailerId) {
  const trailer = getEntity('Vehicle', trailerId);
  if (!trailer) throw new Error('Trailer not found');
  if (trailer.unit_type !== 'trailer') throw new Error('Selected unit is not a trailer');
  return trailer;
}

function stampTrailerLastKnown(trailerId, { lat, lng, driverId, driverName, eventType }) {
  if (lat == null || lng == null) return;
  updateEntity('Vehicle', trailerId, {
    last_known_lat: lat,
    last_known_lng: lng,
    last_known_at: nowIso(),
    last_driver_id: driverId || null,
    last_driver_name: driverName || null,
    last_event_type: eventType || null,
  });
}

export async function hookTrailer(body, user) {
  assertDriver(user);
  const { trailerId, lat, lng, accuracy, clockEntryId } = body;
  if (!trailerId) throw new Error('trailerId is required');

  const shift = getShift(clockEntryId, user.id);
  if (!shift || shift.clock_out) throw new Error('Clock in to your shift before signing in to a trailer');
  if (!shift.vehicle_id || shift.vehicle_unit_number === 'POV') {
    throw new Error('Select a truck (not POV) before hooking a trailer');
  }

  const trailer = assertTrailer(trailerId);

  if (trailer.coupled_driver_id && trailer.coupled_driver_id !== user.id) {
    throw new Error(`Trailer #${trailer.unit_number} is signed in to another driver`);
  }

  if (shift.trailer_id && shift.trailer_id !== trailerId) {
    throw new Error('Sign out of the current trailer before signing in to a different one');
  }

  const event = createEntity('TrailerAssignment', {
    event_type: 'hook',
    trailer_id: trailer.id,
    trailer_unit_number: trailer.unit_number,
    vehicle_id: shift.vehicle_id,
    vehicle_unit_number: shift.vehicle_unit_number,
    driver_id: user.id,
    driver_name: user.full_name || user.email,
    clock_entry_id: shift.id,
    lat: lat ?? null,
    lng: lng ?? null,
    accuracy: accuracy ?? null,
    customer_id: user.customer_id || trailer.customer_id || '',
    timestamp: nowIso(),
  });

  updateEntity('Vehicle', trailer.id, {
    coupled_driver_id: user.id,
    coupled_vehicle_id: shift.vehicle_id,
    coupled_at: nowIso(),
    last_known_lat: lat ?? trailer.last_known_lat ?? null,
    last_known_lng: lng ?? trailer.last_known_lng ?? null,
    last_known_at: nowIso(),
    last_driver_id: user.id,
    last_driver_name: user.full_name || user.email,
    last_event_type: 'hook',
  });

  if (!shift.trailer_id) {
    updateEntity('TimeClockEntry', shift.id, {
      trailer_id: trailer.id,
      trailer_unit_number: trailer.unit_number,
    });
  }

  return {
    success: true,
    message: `Signed in to trailer #${trailer.unit_number}`,
    event,
    trailer: getEntity('Vehicle', trailer.id),
    shift: getEntity('TimeClockEntry', shift.id),
  };
}

export async function unhookTrailer(body, user) {
  assertDriver(user);
  const { trailerId, lat, lng, accuracy, clockEntryId } = body;
  if (!trailerId) throw new Error('trailerId is required');

  const shift = getShift(clockEntryId, user.id);
  if (!shift) throw new Error('No active shift found');

  const trailer = assertTrailer(trailerId);
  if (shift.trailer_id !== trailerId) {
    throw new Error('This trailer is not signed in on your current shift');
  }

  const event = createEntity('TrailerAssignment', {
    event_type: 'unhook',
    trailer_id: trailer.id,
    trailer_unit_number: trailer.unit_number,
    vehicle_id: shift.vehicle_id,
    vehicle_unit_number: shift.vehicle_unit_number,
    driver_id: user.id,
    driver_name: user.full_name || user.email,
    clock_entry_id: shift.id,
    lat: lat ?? null,
    lng: lng ?? null,
    accuracy: accuracy ?? null,
    customer_id: user.customer_id || trailer.customer_id || '',
    timestamp: nowIso(),
  });

  stampTrailerLastKnown(trailer.id, {
    lat,
    lng,
    driverId: user.id,
    driverName: user.full_name || user.email,
    eventType: 'unhook',
  });

  updateEntity('Vehicle', trailer.id, {
    coupled_driver_id: null,
    coupled_vehicle_id: null,
    coupled_at: null,
  });

  updateEntity('TimeClockEntry', shift.id, {
    trailer_id: null,
    trailer_unit_number: null,
  });

  return {
    success: true,
    message: `Signed out of trailer #${trailer.unit_number} — last location saved`,
    event,
    trailer: getEntity('Vehicle', trailer.id),
    shift: getEntity('TimeClockEntry', shift.id),
  };
}

export function listTrailerAssignments(body, user) {
  const { trailerId, driverId, limit = 50 } = body || {};
  let rows = filterEntities('TrailerAssignment', trailerId ? { trailer_id: trailerId } : driverId ? { driver_id: driverId } : {});
  if (user?.customer_id) {
    rows = rows.filter((r) => !r.customer_id || r.customer_id === user.customer_id);
  }
  rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return { success: true, assignments: rows.slice(0, limit) };
}

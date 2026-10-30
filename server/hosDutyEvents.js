/**
 * HOS duty / movement events — snapshot clocks when drivers move or change duty.
 */
import { createEntity, listEntities, updateEntity } from './db.js';
import { computeDriverHosClocks } from '../lib/hosFmcsa.js';

const MOVING_SPEED_MPS = 2.2; // ~5 mph

export function listHosLogsForDriver(driverId, limit = 120) {
  const logs = listEntities('HOSLog');
  return logs
    .filter((l) => l.driver_id === driverId)
    .sort((a, b) => (b.log_date || '').localeCompare(a.log_date || ''))
    .slice(0, limit);
}

export function recordHosMovementEvent(body, user) {
  const driverId = body.driver_id || user?.id;
  if (!driverId) throw new Error('driver_id required');
  if (user?.role === 'driver' && user.id !== driverId) {
    throw new Error('Drivers can only record their own HOS events');
  }

  const eventType = body.event_type || 'movement_ping';
  const dutyStatus = body.duty_status || body.dutyStatus || 'driving';
  const eventAt = body.event_at || new Date().toISOString();
  const speed = Number(body.speed) || 0;

  const logs = listHosLogsForDriver(driverId);
  const clocks = computeDriverHosClocks(logs, {
    currentDuty: dutyStatus,
    now: eventAt,
  });

  const event = createEntity('HOSDutyEvent', {
    driver_id: driverId,
    driver_name: body.driver_name || user?.full_name || '',
    vehicle_id: body.vehicle_id || null,
    vehicle_unit_number: body.vehicle_unit_number || null,
    clock_entry_id: body.clock_entry_id || null,
    event_type: eventType,
    event_at: eventAt,
    duty_status: dutyStatus,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    speed_mps: speed,
    moving: speed >= MOVING_SPEED_MPS || eventType === 'vehicle_clock_in',
    hos_clocks: clocks,
    source: body.source || 'fleetco_portal',
  });

  // Keep today's HOS log in sync with latest clocks
  const today = eventAt.slice(0, 10);
  const todayLog = logs.find((l) => l.log_date === today);
  if (todayLog) {
    updateEntity('HOSLog', todayLog.id, {
      hos_clocks: clocks,
      last_movement_at: eventAt,
      hours_remaining: clocks.driveRemaining,
      cycle_remaining: clocks.cycleRemaining,
    });
  }

  return { success: true, event, clocks };
}

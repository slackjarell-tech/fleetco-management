/**
 * Licensed vehicle slots (customer.fleet_size + extra_licensed_units) and VIN reuse audit.
 */
import { createEntity, getEntity, listEntities } from './db.js';
import { canProvisionCustomers, isFleetCoEmployeeRole, unitCountFromCustomer } from './roles.js';

/** Statuses that do not count against the customer's licensed unit limit */
export const NON_BILLABLE_VEHICLE_STATUSES = new Set(['inactive', 'sold', 'retired']);

export function normalizeVin(vin) {
  if (!vin || typeof vin !== 'string') return '';
  return vin.replace(/\s+/g, '').toUpperCase();
}

export function isBillableVehicleStatus(status) {
  const s = (status || 'active').toLowerCase();
  return !NON_BILLABLE_VEHICLE_STATUSES.has(s);
}

export function vehicleCustomerId(vehicle) {
  return vehicle?.customer_id || vehicle?.assigned_customer_id || null;
}

export function licensedUnitLimit(customer) {
  if (!customer) return 1;
  const base = unitCountFromCustomer(customer);
  const extra = Number(customer.extra_licensed_units);
  return base + (Number.isFinite(extra) && extra > 0 ? Math.round(extra) : 0);
}

export function countBillableVehicles(customerId, { excludeVehicleId } = {}) {
  if (!customerId) return 0;
  return listEntities('Vehicle').filter((v) => {
    if (excludeVehicleId && v.id === excludeVehicleId) return false;
    if (vehicleCustomerId(v) !== customerId) return false;
    return isBillableVehicleStatus(v.status);
  }).length;
}

export function getVehicleUnitUsage(customerId) {
  const customer = getEntity('Customer', customerId);
  const limit = licensedUnitLimit(customer);
  const inUse = countBillableVehicles(customerId);
  return {
    limit,
    inUse,
    remaining: Math.max(0, limit - inUse),
    overLimit: inUse > limit,
    fleet_size: customer?.fleet_size ?? null,
    extra_licensed_units: Number(customer?.extra_licensed_units) || 0,
  };
}

function canBypassUnitLimits(actor) {
  if (!actor) return false;
  return isFleetCoEmployeeRole(actor.role) || canProvisionCustomers(actor.role);
}

function findActiveVehicleWithVin(customerId, vin, excludeVehicleId) {
  const normalized = normalizeVin(vin);
  if (!normalized || normalized.length < 11) return null;
  return listEntities('Vehicle').find((v) => {
    if (excludeVehicleId && v.id === excludeVehicleId) return false;
    if (vehicleCustomerId(v) !== customerId) return false;
    if (!isBillableVehicleStatus(v.status)) return false;
    return normalizeVin(v.vin) === normalized;
  });
}

function listVinRemovalEvents(customerId, vin) {
  const normalized = normalizeVin(vin);
  if (!normalized) return [];
  return listEntities('VehicleVinEvent').filter(
    (e) => e.customer_id === customerId && normalizeVin(e.vin) === normalized,
  );
}

export function logVehicleVinEvent({
  customerId,
  vin,
  eventType,
  vehicleId,
  unitNumber,
  actorEmail,
  notes,
}) {
  const normalized = normalizeVin(vin);
  if (!customerId || !normalized) return null;
  return createEntity('VehicleVinEvent', {
    customer_id: customerId,
    vin: normalized,
    event_type: eventType,
    vehicle_id: vehicleId || '',
    unit_number: unitNumber || '',
    actor_email: actorEmail || '',
    notes: notes || '',
    created_at: new Date().toISOString(),
  });
}

export function recordVehicleRemoval(vehicle, actor) {
  const customerId = vehicleCustomerId(vehicle);
  const vin = normalizeVin(vehicle.vin);
  if (!customerId || !vin) return;
  logVehicleVinEvent({
    customerId,
    vin,
    eventType: 'removed',
    vehicleId: vehicle.id,
    unitNumber: vehicle.unit_number,
    actorEmail: actor?.email,
    notes: 'Vehicle deleted from fleet',
  });
}

export function recordVehicleStatusRemoval(vehicle, actor, previousStatus) {
  const customerId = vehicleCustomerId(vehicle);
  const vin = normalizeVin(vehicle.vin);
  if (!customerId || !vin) return;
  if (!isBillableVehicleStatus(previousStatus) || isBillableVehicleStatus(vehicle.status)) return;
  logVehicleVinEvent({
    customerId,
    vin,
    eventType: 'removed',
    vehicleId: vehicle.id,
    unitNumber: vehicle.unit_number,
    actorEmail: actor?.email,
    notes: `Status changed from ${previousStatus} to ${vehicle.status}`,
  });
}

/**
 * Validates slot limit and VIN rules. Throws Error with user-facing message.
 */
export function assertVehicleUnitCompliance({
  actor,
  customerId,
  status,
  vin,
  vehicleId,
  previousVehicle,
}) {
  if (!customerId) return;
  if (canBypassUnitLimits(actor)) return;

  const customer = getEntity('Customer', customerId);
  if (!customer) throw new Error('Customer account not found');

  const billable = isBillableVehicleStatus(status);
  const normalizedVin = normalizeVin(vin);

  if (billable) {
    const limit = licensedUnitLimit(customer);
    const inUse = countBillableVehicles(customerId, { excludeVehicleId: vehicleId });
    if (inUse >= limit) {
      logVehicleVinEvent({
        customerId,
        vin: normalizedVin || 'UNKNOWN',
        eventType: 'blocked_limit',
        vehicleId,
        unitNumber: previousVehicle?.unit_number,
        actorEmail: actor?.email,
        notes: `Attempted billable unit at ${inUse}/${limit}`,
      });
      throw new Error(
        `Licensed unit limit reached (${inUse} of ${limit} in use). ` +
          'Contact FleetCo to add units to your subscription before adding or reactivating vehicles.',
      );
    }
  }

  if (billable && normalizedVin.length >= 11) {
    const duplicate = findActiveVehicleWithVin(customerId, normalizedVin, vehicleId);
    if (duplicate) {
      throw new Error(
        `VIN ${normalizedVin} is already on active unit ${duplicate.unit_number || duplicate.id}. ` +
          'Update the existing unit or retire it before reusing this VIN.',
      );
    }

    const priorRemovals = listVinRemovalEvents(customerId, normalizedVin);
    const wasRemoved = priorRemovals.some((e) => e.event_type === 'removed');
    if (wasRemoved && billable) {
      const usage = getVehicleUnitUsage(customerId);
      const reactivatingSame =
        previousVehicle && normalizeVin(previousVehicle.vin) === normalizedVin;
      if (!reactivatingSame && usage.inUse >= usage.limit - (vehicleId && !isBillableVehicleStatus(previousVehicle?.status) ? 1 : 0)) {
        logVehicleVinEvent({
          customerId,
          vin: normalizedVin,
          eventType: 'blocked_vin_reuse',
          vehicleId,
          actorEmail: actor?.email,
          notes: 'VIN previously removed; add licensed units to restore this asset',
        });
        throw new Error(
          `This VIN was previously removed from your fleet. To add it again, contact FleetCo to purchase an additional licensed unit.`,
        );
      }
      logVehicleVinEvent({
        customerId,
        vin: normalizedVin,
        eventType: 'readded',
        vehicleId,
        actorEmail: actor?.email,
        notes: 'VIN returned to billable fleet',
      });
    }
  }
}

export function resolveVehicleCustomerIdFromPayload(payload, ctx, existing) {
  return (
    payload.customer_id ||
    payload.assigned_customer_id ||
    existing?.customer_id ||
    existing?.assigned_customer_id ||
    ctx?.customerId ||
    null
  );
}

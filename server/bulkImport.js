import { createEntity, createUser, findUserByEmail, listEntities } from './db.js';
import bcrypt from 'bcryptjs';

function resolveVehicleId(unitRef) {
  if (!unitRef) return undefined;
  const vehicles = listEntities('Vehicle');
  const match = vehicles.find(
    (v) => v.unit_number?.toLowerCase() === String(unitRef).trim().toLowerCase(),
  );
  return match?.id;
}

function enrichRecord(type, record, user) {
  const data = { ...record };

  if (user?.customer_id && !data.customer_id) {
    data.customer_id = user.customer_id;
  }

  if (data.vehicle_unit) {
    const vehicleId = resolveVehicleId(data.vehicle_unit);
    if (!vehicleId) {
      throw new Error(`Vehicle unit "${data.vehicle_unit}" not found`);
    }
    data.vehicle_id = vehicleId;
    delete data.vehicle_unit;
  }

  if (type === 'WorkOrder' && data.labor_hours != null && data.labor_rate != null && data.parts_total != null) {
    data.labor_cost = data.labor_hours * data.labor_rate;
    data.total_cost = data.labor_cost + data.parts_total;
  }

  return data;
}

function createBulkRecord(type, record, user) {
  if (type === 'User') {
    const { email, password, ...rest } = record;
    if (!email) throw new Error('Email required');
    if (findUserByEmail(email)) throw new Error(`User already exists: ${email}`);
    const hash = bcrypt.hashSync(password || 'changeme123', 10);
    return createUser({ email, passwordHash: hash, ...rest });
  }

  const data = enrichRecord(type, record, user);
  return createEntity(type, data);
}

export function bulkCreateEntities(type, rows, user) {
  const created = [];
  const failed = [];

  rows.forEach((record, index) => {
    try {
      const item = createBulkRecord(type, record, user);
      created.push(item);
    } catch (err) {
      failed.push({ row: index + 1, error: err.message });
    }
  });

  return {
    total: rows.length,
    created: created.length,
    failed,
    items: created,
  };
}

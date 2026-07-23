import { createEntity, createUser, findUserByEmail, listEntities, listUsers } from './db.js';
import bcrypt from 'bcryptjs';

const INTERNAL_EMPLOYEE_ROLES = new Set(['owner', 'executive', 'fleet_manager', 'fleet_coordinator']);

function resolveDriverByEmail(email, customerId) {
  if (!email) return null;
  const normalized = String(email).trim().toLowerCase();
  const users = listUsers();
  return users.find(
    (u) => u.email?.toLowerCase() === normalized && u.role === 'driver' && (!customerId || u.customer_id === customerId),
  );
}

function resolveInternalEmployeeByEmail(email) {
  if (!email) return null;
  const normalized = String(email).trim().toLowerCase();
  return listUsers().find(
    (u) => u.email?.toLowerCase() === normalized && INTERNAL_EMPLOYEE_ROLES.has(u.role) && !u.customer_id,
  );
}

function resolveCustomerByCompany(name) {
  if (!name) return null;
  const needle = String(name).trim().toLowerCase();
  return listEntities('Customer').find((c) => (c.company_name || '').toLowerCase() === needle);
}

function resolveVehicleId(unitRef) {
  if (!unitRef) return undefined;
  const vehicles = listEntities('Vehicle');
  const match = vehicles.find(
    (v) => v.unit_number?.toLowerCase() === String(unitRef).trim().toLowerCase(),
  );
  return match?.id;
}

function enrichRecord(type, record, user, ctx) {
  const data = { ...record };

  if (ctx?.customerId && !data.customer_id) {
    data.customer_id = ctx.customerId;
  } else if (user?.customer_id && !data.customer_id) {
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

  if (type === 'PayrollRecord') {
    if (data.payee_type === 'fleetco_employee' || data.employee_email) {
      const employee = resolveInternalEmployeeByEmail(data.employee_email);
      if (!employee) throw new Error(`FleetCo employee not found: ${data.employee_email}`);
      data.payee_type = 'fleetco_employee';
      data.employee_user_id = employee.id;
      data.driver_name = data.driver_name || employee.full_name || employee.email;
      data.customer_id = '';
      delete data.employee_email;
      delete data.driver_email;
    } else {
      let customerId = data.customer_id || ctx?.customerId || user?.customer_id || null;
      if (!customerId && data.customer_company && isInternalImport(user)) {
        const cust = resolveCustomerByCompany(data.customer_company);
        if (!cust) throw new Error(`Customer not found: ${data.customer_company}`);
        customerId = cust.id;
      }
      const driver = resolveDriverByEmail(data.driver_email, customerId);
      if (!driver) throw new Error(`Driver not found for email: ${data.driver_email}`);
      data.payee_type = 'driver';
      data.driver_id = driver.id;
      data.driver_name = data.driver_name || driver.full_name || driver.email;
      data.customer_id = driver.customer_id || customerId || '';
      delete data.driver_email;
      delete data.customer_company;
    }
    if (data.gross_pay != null && data.net_pay == null) {
      const gross = Number(data.gross_pay) || 0;
      const ded = Number(data.deductions) || 0;
      data.net_pay = gross - ded;
    }
    if (!data.status) data.status = 'draft';
  }

  return data;
}

function isInternalImport(user) {
  return ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(user?.role);
}

function createBulkRecord(type, record, user, ctx) {
  if (type === 'User') {
    const { email, password, ...rest } = record;
    if (!email) throw new Error('Email required');
    if (findUserByEmail(email)) throw new Error(`User already exists: ${email}`);
    const hash = bcrypt.hashSync(password || 'changeme123', 10);
    const customerId = rest.customer_id || ctx?.customerId || user?.customer_id || null;
    return createUser({ email, passwordHash: hash, ...rest, customerId });
  }

  const data = enrichRecord(type, record, user, ctx);
  return createEntity(type, data);
}

export function bulkCreateEntities(type, rows, user, ctx = null) {
  const created = [];
  const failed = [];

  rows.forEach((record, index) => {
    try {
      const item = createBulkRecord(type, record, user, ctx);
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

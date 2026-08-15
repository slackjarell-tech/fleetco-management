/**
 * Create personal driver directly in local data store (no API login required).
 *
 * Usage: node scripts/create-personal-driver-local.mjs
 */
import bcrypt from 'bcryptjs';
import { initDatabase } from '../server/storePersist.js';
import {
  createUser,
  findUserByEmail,
  getUserRowByEmail,
  updateUser,
  listEntities,
} from '../server/db.js';
import { defaultSidebarModulesForRole } from '../server/customerRoles.js';
import { PERSONAL_DRIVER } from '../server/seedDemo.js';

await initDatabase();

const spec = PERSONAL_DRIVER;
const hash = bcrypt.hashSync(spec.password, 10);
const customerId =
  listEntities('Customer').find((c) => c.company_name === 'Lone Star Freight LLC')?.id
  || listEntities('Customer')[0]?.id
  || null;
const sidebarModules = defaultSidebarModulesForRole('driver');
const existing = getUserRowByEmail(spec.email);

if (!existing) {
  createUser({
    email: spec.email,
    passwordHash: hash,
    fullName: spec.fullName,
    role: 'driver',
    customerId,
    employeeNumber: spec.employeeNumber,
    sidebarModules,
    phone: spec.phone,
  });
  console.log('Created personal driver in local store.');
} else {
  updateUser(existing.id, {
    full_name: spec.fullName,
    role: 'driver',
    employee_number: spec.employeeNumber,
    password_hash: hash,
    sidebar_modules: sidebarModules,
    phone: spec.phone,
    status: 'active',
    ...(customerId && !existing.customer_id ? { customer_id: customerId } : {}),
  });
  console.log('Updated personal driver in local store.');
}

console.log('\n--- FleetCo Driver login (local) ---');
console.log('URL:      http://localhost:5173/driver/login');
console.log('Email:   ', spec.email);
console.log('Password:', spec.password);
console.log('Phone:   ', spec.phone);
console.log('User ID: ', findUserByEmail(spec.email)?.id);

/**
 * Test customer driver creation flow
 */
import bcrypt from 'bcryptjs';
import { initDatabase } from '../server/storePersist.js';
import { invokeFunction } from '../server/functions.js';
import {
  createUser,
  createEntity,
  findUserByEmail,
  listUsers,
} from '../server/db.js';

function assert(name, cond, detail = '') {
  if (cond) {
    console.log(`  ✓ ${name}`);
    return true;
  }
  console.error(`  ✗ ${name}${detail ? `: ${detail}` : ''}`);
  return false;
}

let passed = 0;
let failed = 0;

function check(name, cond, detail) {
  if (assert(name, cond, detail)) passed++;
  else failed++;
}

async function main() {
  await initDatabase();
  console.log('Driver creation flow test\n');

  // Setup test customer + owner
  const cust = createEntity('Customer', {
    company_name: 'Test Haulers',
    contact_name: 'Test Owner',
    status: 'active',
  });

  const ownerEmail = `test-owner-${Date.now()}@example.com`;
  const owner = createUser({
    email: ownerEmail,
    passwordHash: bcrypt.hashSync('test123', 10),
    fullName: 'Test Owner',
    role: 'customer_owner',
    customerId: cust.id,
  });

  const driverEmail = `test-driver-${Date.now()}@example.com`;
  const tempPassword = 'TempPass123!';

  // Test createUserAccount as customer owner
  let result;
  try {
    result = await invokeFunction('createUserAccount', {
      email: driverEmail,
      tempPassword,
      role: 'driver',
      customerId: cust.id,
      fullName: 'Test Driver',
      phone: '555-1234',
      license_number: 'CDL123',
      license_state: 'TX',
      license_expiry: '2027-01-01',
      status: 'active',
    }, owner);
    check('createUserAccount succeeds', result?.success === true, JSON.stringify(result));
  } catch (err) {
    check('createUserAccount succeeds', false, err.message);
    console.log('\nFAILED at createUserAccount — root cause found');
    process.exit(1);
  }

  check('Returns user_id', !!result.user_id, result.user_id);
  check('Auto-assigns driver number', /^DRV-\d{5}$/.test(result.employee_number || ''), result.employee_number);

  const newUser = findUserByEmail(driverEmail);
  check('User record exists', !!newUser, driverEmail);
  check('User has driver role', newUser?.role === 'driver');
  check('User linked to customer', newUser?.customer_id === cust.id);
  check('Driver number stored on user', newUser?.employee_number === result.employee_number);

  // Profile fields should be set via createUserAccount (no separate update needed)
  check('Phone saved on create', newUser?.phone === '555-1234', newUser?.phone);
  check('License fields saved', newUser?.license_number === 'CDL123');

  // Test with legacy 'user' role (common in production)
  const legacyOwnerEmail = `legacy-owner-${Date.now()}@example.com`;
  const legacyOwner = createUser({
    email: legacyOwnerEmail,
    passwordHash: bcrypt.hashSync('test123', 10),
    fullName: 'Legacy Owner',
    role: 'user',
    customerId: cust.id,
  });

  const driverEmail2 = `test-driver-legacy-${Date.now()}@example.com`;
  try {
    result = await invokeFunction('createUserAccount', {
      email: driverEmail2,
      tempPassword,
      role: 'driver',
      customerId: cust.id,
      fullName: 'Legacy Flow Driver',
      phone: '555-9999',
      license_number: 'X123',
    }, legacyOwner);
    check('Legacy user role: createUserAccount succeeds', result?.success === true);
  } catch (err) {
    check('Legacy user role: createUserAccount succeeds', false, err.message);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

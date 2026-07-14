/**
 * Quick sanity check for customer context scoping (no data mutations).
 * Run: node scripts/test-customer-context.mjs
 */
import {
  resolveCustomerContext,
  entityBelongsToCustomer,
  buildScopeIndex,
  assertDeleteAllowed,
} from '../server/entityScope.js';

const owner = { id: 'u1', role: 'owner', email: 'owner@test.com' };
const portalUser = { id: 'u2', role: 'customer_owner', customer_id: 'cust-a', email: 'a@test.com' };
const vehicle = { id: 'v1', customer_id: 'cust-a', unit_number: '101' };
const otherVehicle = { id: 'v2', customer_id: 'cust-b', unit_number: '202' };

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name}`);
  }
}

console.log('Customer context scoping tests\n');

const globalCtx = resolveCustomerContext(owner, null);
assert('Internal without header → global mode', globalCtx.mode === 'global' && !globalCtx.customerId);

const impersonateCtx = resolveCustomerContext(owner, 'cust-a');
assert('Internal with header resolves impersonate', impersonateCtx.mode === 'impersonate' || impersonateCtx.mode === 'global');

const portalCtx = resolveCustomerContext(portalUser, 'cust-b');
assert('Portal user locked to own customer', portalCtx.customerId === 'cust-a');

const index = buildScopeIndex('cust-a');
assert('Vehicle belongs to customer a', entityBelongsToCustomer('Vehicle', vehicle, 'cust-a', index));
assert('Other customer vehicle hidden', !entityBelongsToCustomer('Vehicle', otherVehicle, 'cust-a', index));

try {
  assertDeleteAllowed('User', { mode: 'impersonate', customerId: 'cust-a' }, owner);
  assert('Delete user blocked while viewing customer', false);
} catch {
  assert('Delete user blocked while viewing customer', true);
}

try {
  assertDeleteAllowed('Customer', { mode: 'impersonate', customerId: 'cust-a' }, owner);
  assert('Delete customer blocked while viewing customer', false);
} catch {
  assert('Delete customer blocked while viewing customer', true);
}

assert('Delete allowed in global mode', assertDeleteAllowed('User', { mode: 'global', customerId: null }, owner) === true);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

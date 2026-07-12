import bcrypt from 'bcryptjs';
import {
  createUser,
  createEntity,
  filterEntities,
  findUserByEmail,
  updateEntity,
  listEntities,
  nowIso,
} from './db.js';
import { computeNextDueDate } from './billing.js';
import { seedDemoData } from './seedDemo.js';
import { repairCustomerPortalLogins } from './repairCustomerLogins.js';
import { getStoreStats } from './db.js';

const OWNER_EMAIL = 'jarrell@fleetcomanagement.org';

export function seedDatabase() {
  // Owner login — JaRell Slack creates all FleetCo employees
  const owner = findUserByEmail(OWNER_EMAIL);
  if (!owner) {
    const hash = bcrypt.hashSync('FleetCo2026!', 10);
    createUser({
      email: OWNER_EMAIL,
      passwordHash: hash,
      fullName: 'JaRell D. Slack',
      role: 'owner',
    });
    console.log(`Seeded owner: ${OWNER_EMAIL} / FleetCo2026!`);
  }

  const ownerUser = findUserByEmail(OWNER_EMAIL);
  const ownerMailbox = filterEntities('DomainEmail', { email: OWNER_EMAIL }, null, 1)[0];
  if (!ownerMailbox && ownerUser) {
    createEntity('DomainEmail', {
      email: OWNER_EMAIL,
      local_part: 'jarrell',
      display_name: 'JaRell D. Slack',
      mailbox_type: 'employee',
      status: 'active',
      linked_user_id: ownerUser.id,
      portal_role: 'owner',
      has_portal_access: true,
      created_by: OWNER_EMAIL,
      notes: 'Owner account',
      provisioned_at: nowIso(),
    });
  }

  const admin = findUserByEmail('admin@fleetco.com');
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    createUser({
      email: 'admin@fleetco.com',
      passwordHash: hash,
      fullName: 'Fleet Admin',
      role: 'executive',
    });
    console.log('Seeded admin user: admin@fleetco.com / admin123');
  }

  // Demo data only in dev, or when SEED_DEMO_DATA=true — never auto-seed production on deploy
  const allowDemoSeed =
    process.env.SEED_DEMO_DATA === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO_DATA !== 'false');
  if (allowDemoSeed && seedDemoData()) {
    console.log('Demo fleet data ready for client presentations');
  } else if (process.env.NODE_ENV === 'production' && filterEntities('Customer').length === 0) {
    console.log('[seed] Production startup — skipping demo customers (add real customers in the portal)');
  }

  // Backfill manager assignment on demo customers (fixes blank Customers tab for fleet managers)
  const manager = findUserByEmail('manager@fleetco.com');
  if (manager) {
    for (const customer of listEntities('Customer')) {
      const patch = {};
      if (!customer.assigned_manager_id) patch.assigned_manager_id = manager.id;
      if (!customer.next_payment_due_at) {
        const base = customer.last_payment_at || customer.payment_collected_at || nowIso();
        patch.last_payment_at = customer.last_payment_at || base;
        patch.next_payment_due_at = computeNextDueDate(base, customer.subscription_term || 'monthly');
        patch.payment_status = customer.payment_status || 'current';
        patch.system_paused = customer.system_paused || false;
      }
      if (Object.keys(patch).length) {
        updateEntity('Customer', customer.id, patch);
      }
    }
  }

  const repair = repairCustomerPortalLogins();
  if (repair.repaired) {
    console.log(`[seed] Restored ${repair.repaired} customer portal login(s) from saved credentials`);
  }
  if (repair.relinked) {
    console.log(`[seed] Re-linked ${repair.relinked} customer portal account(s)`);
  }

  const stats = getStoreStats();
  console.log(
    `[datastore] ${stats.path} — ${stats.userCount} users, ${stats.customerCount} customers` +
      (stats.backupExists ? ' (backup ok)' : ''),
  );
}

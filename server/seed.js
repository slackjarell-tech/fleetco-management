import bcrypt from 'bcryptjs';
import {
  createUser,
  createEntity,
  filterEntities,
  findUserByEmail,
  getUserRowByEmail,
  updateEntity,
  updateUser,
  listEntities,
  listUsers,
  nowIso,
} from './db.js';
import { computeNextDueDate } from './billing.js';
import { seedDemoData } from './seedDemo.js';
import { repairCustomerPortalLogins } from './repairCustomerLogins.js';
import { getStoreStats } from './db.js';
import { defaultSidebarModulesForRole } from './customerRoles.js';

function migrateCustomerRoles() {
  let migrated = 0;
  for (const u of listUsers()) {
    if (!u.customer_id || u.role !== 'user') continue;
    const row = getUserRowByEmail(u.email);
    updateUser(u.id, {
      role: 'customer_owner',
      ...(!row?.sidebar_modules?.length
        ? { sidebar_modules: defaultSidebarModulesForRole('customer_owner') }
        : {}),
    });
    migrated += 1;
  }
  if (migrated) console.log(`[seed] Migrated ${migrated} customer portal user(s) to customer_owner`);
}

const OWNER_EMAIL = 'jarell.slack@fleetcomanagement.org';
const LEGACY_OWNER_EMAIL = 'jarrell@fleetcomanagement.org';
const DEFAULT_OWNER_PASSWORD = 'FleetCo2026!';

function migrateOwnerEmail() {
  const ownerRow = getUserRowByEmail(OWNER_EMAIL);
  const legacyRow = getUserRowByEmail(LEGACY_OWNER_EMAIL);
  if (!legacyRow) return;

  if (!ownerRow) {
    updateUser(legacyRow.id, { email: OWNER_EMAIL, role: 'owner' });
    console.log(`[seed] Migrated owner login: ${LEGACY_OWNER_EMAIL} → ${OWNER_EMAIL}`);
  } else if (ownerRow.id !== legacyRow.id && !ownerRow.password_hash && legacyRow.password_hash) {
    updateUser(ownerRow.id, { password_hash: legacyRow.password_hash, role: 'owner' });
    console.log('[seed] Copied owner password hash from legacy login');
  }

  const legacyMailbox = filterEntities('DomainEmail', { email: LEGACY_OWNER_EMAIL }, null, 1)[0];
  if (legacyMailbox) {
    updateEntity('DomainEmail', legacyMailbox.id, {
      email: OWNER_EMAIL,
      local_part: 'jarell.slack',
      created_by: OWNER_EMAIL,
    });
  }
}

/** Ensure owner exists with a usable password (supports one-time OWNER_BOOTSTRAP_PASSWORD reset). */
function ensureOwnerLogin() {
  migrateOwnerEmail();

  const bootstrapPassword = process.env.OWNER_BOOTSTRAP_PASSWORD?.trim();
  let ownerRow = getUserRowByEmail(OWNER_EMAIL);
  const legacyRow = getUserRowByEmail(LEGACY_OWNER_EMAIL);

  if (!ownerRow) {
    const password = bootstrapPassword || DEFAULT_OWNER_PASSWORD;
    createUser({
      email: OWNER_EMAIL,
      passwordHash: bcrypt.hashSync(password, 10),
      fullName: 'JaRell D. Slack',
      role: 'owner',
    });
    console.log(`[seed] Seeded owner: ${OWNER_EMAIL}`);
    ownerRow = getUserRowByEmail(OWNER_EMAIL);
  } else {
    const patch = {};
    if (ownerRow.role !== 'owner') patch.role = 'owner';
    if (bootstrapPassword) {
      patch.password_hash = bcrypt.hashSync(bootstrapPassword, 10);
      console.log('[seed] Owner password reset via OWNER_BOOTSTRAP_PASSWORD');
    } else if (!ownerRow.password_hash) {
      patch.password_hash = legacyRow?.password_hash || bcrypt.hashSync(DEFAULT_OWNER_PASSWORD, 10);
      console.log('[seed] Restored missing owner password hash');
    }
    if (Object.keys(patch).length) updateUser(ownerRow.id, patch);
  }

  return findUserByEmail(OWNER_EMAIL);
}

export function seedDatabase() {
  migrateCustomerRoles();
  const ownerUser = ensureOwnerLogin();
  const ownerMailbox = filterEntities('DomainEmail', { email: OWNER_EMAIL }, null, 1)[0];
  if (!ownerMailbox && ownerUser) {
    createEntity('DomainEmail', {
      email: OWNER_EMAIL,
      local_part: 'jarell.slack',
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

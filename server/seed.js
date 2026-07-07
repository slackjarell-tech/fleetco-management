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
import { seedDemoData } from './seedDemo.js';

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

  // Full demo dataset for client presentations (skips if customers already exist)
  if (seedDemoData()) {
    console.log('Demo fleet data ready for client presentations');
  }

  // Backfill manager assignment on demo customers (fixes blank Customers tab for fleet managers)
  const manager = findUserByEmail('manager@fleetco.com');
  if (manager) {
    for (const customer of listEntities('Customer')) {
      if (!customer.assigned_manager_id) {
        updateEntity('Customer', customer.id, { assigned_manager_id: manager.id });
      }
    }
  }
}

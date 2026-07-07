import bcrypt from 'bcryptjs';
import {
  createUser,
  findUserByEmail,
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
}

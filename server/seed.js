import bcrypt from 'bcryptjs';
import {
  createUser,
  findUserByEmail,
} from './db.js';
import { seedDemoData } from './seedDemo.js';

export function seedDatabase() {
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

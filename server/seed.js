import bcrypt from 'bcryptjs';
import {
  createUser,
  findUserByEmail,
  createEntity,
  filterEntities,
  db,
} from './db.js';

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

  const vehicles = filterEntities('Vehicle');
  if (!vehicles.length) {
    const ts = new Date().toISOString();
    createEntity('Vehicle', {
      unit_number: 'T-101',
      unit_type: 'truck',
      make: 'Freightliner',
      model: 'Cascadia',
      year: 2022,
      vin: '1FUJGHDV8NLBT1234',
      license_plate: 'FLT-101',
      status: 'active',
      odometer: 125000,
      created_date: ts,
    });
    createEntity('Vehicle', {
      unit_number: 'TR-201',
      unit_type: 'trailer',
      make: 'Great Dane',
      model: 'Champion SE',
      year: 2021,
      trailer_type: 'Dry Van',
      trailer_length: 53,
      status: 'active',
      created_date: ts,
    });
    console.log('Seeded sample vehicles');
  }

  const stations = filterEntities('FuelStation');
  if (!stations.length) {
    createEntity('FuelStation', {
      name: 'Pilot Travel Center #412',
      brand: 'Pilot',
      address: '1234 I-80 Exit 42',
      city: 'Omaha',
      state: 'NE',
      diesel_price: 3.899,
      gasoline_price: 3.459,
      status: 'active',
    });
    createEntity('FuelStation', {
      name: 'Love\'s Travel Stop #301',
      brand: 'Love\'s',
      address: '567 Hwy 35',
      city: 'Des Moines',
      state: 'IA',
      diesel_price: 3.849,
      gasoline_price: 3.419,
      status: 'active',
    });
    console.log('Seeded sample fuel stations');
  }
}

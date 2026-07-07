import bcrypt from 'bcryptjs';
import {
  createUser,
  findUserByEmail,
  createEntity,
  filterEntities,
  listEntities,
  nowIso,
} from './db.js';
import { computeNextDueDate } from './billing.js';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateOnly(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function ensureUser(email, { fullName, role, password = 'demo123' }) {
  if (findUserByEmail(email)) return findUserByEmail(email);
  const hash = bcrypt.hashSync(password, 10);
  return createUser({ email, passwordHash: hash, fullName, role });
}

export function seedDemoData() {
  if (filterEntities('Customer').length > 0) return false;

  console.log('Seeding demo fleet data for client presentations...');

  const manager = ensureUser('manager@fleetco.com', {
    fullName: 'Sarah Chen',
    role: 'fleet_manager',
  });
  ensureUser('dispatch@fleetco.com', {
    fullName: 'Marcus Webb',
    role: 'fleet_coordinator',
  });
  ensureUser('driver1@fleetco.com', {
    fullName: 'Mike Rodriguez',
    role: 'driver',
  });
  ensureUser('driver2@fleetco.com', {
    fullName: 'Lisa Thompson',
    role: 'driver',
  });

  const ts = nowIso();
  const monthlyDue = computeNextDueDate(ts, 'monthly');
  const overdueDue = new Date();
  overdueDue.setDate(overdueDue.getDate() - 5);

  const customers = [
    createEntity('Customer', {
      company_name: 'Lone Star Freight LLC',
      contact_name: 'James Whitfield',
      email: 'jwhitfield@lonestarfreight.com',
      phone: '(214) 555-0142',
      address: '4200 Industrial Blvd',
      city: 'Dallas',
      state: 'TX',
      zip: '75247',
      mc_number: 'MC-884521',
      dot_number: '3847291',
      fleet_size: 18,
      status: 'active',
      assigned_manager_id: manager.id,
      subscription_plan: 'Growth',
      subscription_term: 'monthly',
      subscription_amount: 599,
      payment_collected_at: ts,
      last_payment_at: ts,
      next_payment_due_at: monthlyDue,
      subscription_status: 'active',
      payment_status: 'current',
      system_paused: false,
      notes: 'Owner-operator group — 12 trucks, 6 trailers. Priority fuel program.',
    }),
    createEntity('Customer', {
      company_name: 'Midwest Haulers Inc',
      contact_name: 'Angela Brooks',
      email: 'abrooks@midwesthaulers.com',
      phone: '(515) 555-0198',
      address: '890 Truckway Rd',
      city: 'Des Moines',
      state: 'IA',
      zip: '50309',
      mc_number: 'MC-772104',
      dot_number: '2918473',
      fleet_size: 42,
      status: 'active',
      assigned_manager_id: manager.id,
      subscription_plan: 'Growth',
      subscription_term: 'monthly',
      subscription_amount: 599,
      payment_collected_at: ts,
      last_payment_at: ts,
      next_payment_due_at: monthlyDue,
      subscription_status: 'active',
      payment_status: 'current',
      system_paused: false,
      notes: 'Regional dry van — strong maintenance contract candidate.',
    }),
    createEntity('Customer', {
      company_name: 'Gulf Coast Logistics',
      contact_name: 'Carlos Mendez',
      email: 'cmendez@gulfcoastlog.com',
      phone: '(713) 555-0167',
      address: '1200 Port Terminal Dr',
      city: 'Houston',
      state: 'TX',
      zip: '77029',
      mc_number: 'MC-901334',
      dot_number: '4102837',
      fleet_size: 27,
      status: 'active',
      assigned_manager_id: manager.id,
      subscription_plan: 'Starter',
      subscription_term: 'monthly',
      subscription_amount: 299,
      payment_collected_at: ts,
      last_payment_at: ts,
      next_payment_due_at: monthlyDue,
      subscription_status: 'active',
      payment_status: 'current',
      system_paused: false,
    }),
    createEntity('Customer', {
      company_name: 'Peak Transport Co',
      contact_name: 'Diana Walsh',
      email: 'dwalsh@peaktransport.com',
      phone: '(303) 555-0133',
      address: '5500 E 56th Ave',
      city: 'Denver',
      state: 'CO',
      zip: '80216',
      mc_number: 'MC-658902',
      dot_number: '3374102',
      fleet_size: 9,
      status: 'prospect',
      assigned_manager_id: manager.id,
      subscription_plan: 'Starter',
      subscription_term: 'monthly',
      subscription_amount: 299,
      payment_collected_at: ts,
      last_payment_at: ts,
      next_payment_due_at: overdueDue.toISOString(),
      subscription_status: 'active',
      payment_status: 'overdue',
      system_paused: false,
      notes: 'Demo scheduled — interested in compliance + fuel modules. Payment overdue for pause demo.',
    }),
  ];

  const c1 = customers[0].id;
  const c2 = customers[1].id;

  const vehicles = [
    { unit_number: 'T-101', unit_type: 'truck', make: 'Freightliner', model: 'Cascadia', year: 2022, vin: '1FUJGHDV8NLBT1234', license_plate: 'TX-FLT101', status: 'active', odometer: 125400, customer_id: c1 },
    { unit_number: 'T-102', unit_type: 'truck', make: 'Kenworth', model: 'T680', year: 2021, vin: '1XKYDP9X8MJ123456', license_plate: 'TX-FLT102', status: 'active', odometer: 198750, customer_id: c1 },
    { unit_number: 'T-103', unit_type: 'truck', make: 'Volvo', model: 'VNL 760', year: 2023, vin: '4V4NC9EH5PN123789', license_plate: 'TX-FLT103', status: 'in_shop', odometer: 87200, customer_id: c1 },
    { unit_number: 'T-201', unit_type: 'truck', make: 'Peterbilt', model: '579', year: 2020, vin: '1XPWD40X1LD123456', license_plate: 'IA-MWH201', status: 'active', odometer: 312000, customer_id: c2 },
    { unit_number: 'T-202', unit_type: 'truck', make: 'Freightliner', model: 'Cascadia', year: 2022, vin: '3AKJHHDR5NS123456', license_plate: 'IA-MWH202', status: 'active', odometer: 156300, customer_id: c2 },
    { unit_number: 'T-203', unit_type: 'truck', make: 'International', model: 'LT', year: 2019, vin: '3HSDZAPR4KN123456', license_plate: 'IA-MWH203', status: 'active', odometer: 421500, customer_id: c2 },
    { unit_number: 'T-301', unit_type: 'truck', make: 'Mack', model: 'Anthem', year: 2021, vin: '1M1AX07Y9MM123456', license_plate: 'TX-GCL301', status: 'active', odometer: 245800, customer_id: customers[2].id },
    { unit_number: 'T-401', unit_type: 'truck', make: 'Freightliner', model: 'Cascadia', year: 2024, vin: '3AKJHHDR8RS123456', license_plate: 'CO-PT401', status: 'active', odometer: 28400, customer_id: customers[3].id },
    { unit_number: 'TR-101', unit_type: 'trailer', make: 'Great Dane', model: 'Champion SE', year: 2021, trailer_type: 'Dry Van', trailer_length: 53, status: 'active', customer_id: c1 },
    { unit_number: 'TR-102', unit_type: 'trailer', make: 'Utility', model: '4000D-X', year: 2020, trailer_type: 'Reefer', trailer_length: 53, status: 'active', customer_id: c2 },
    { unit_number: 'TR-103', unit_type: 'trailer', make: 'Wabash', model: 'DuraPlate', year: 2022, trailer_type: 'Dry Van', trailer_length: 53, status: 'active', customer_id: c2 },
    { unit_number: 'TR-201', unit_type: 'trailer', make: 'Hyundai', model: 'Composite', year: 2023, trailer_type: 'Dry Van', trailer_length: 53, status: 'active', customer_id: customers[2].id },
  ];

  const vehicleRecords = vehicles.map((v) => createEntity('Vehicle', v));

  createEntity('FuelStation', { name: 'Pilot Travel Center #412', brand: 'Pilot', address: '1234 I-80 Exit 42', city: 'Omaha', state: 'NE', diesel_price: 3.899, gasoline_price: 3.459, status: 'active' });
  createEntity('FuelStation', { name: "Love's Travel Stop #301", brand: "Love's", address: '567 Hwy 35', city: 'Des Moines', state: 'IA', diesel_price: 3.849, gasoline_price: 3.419, status: 'active' });
  createEntity('FuelStation', { name: 'TA Petro Dallas', brand: 'TA', address: '8800 N Stemmons Fwy', city: 'Dallas', state: 'TX', diesel_price: 3.929, gasoline_price: 3.499, status: 'active' });
  createEntity('FuelStation', { name: 'Buc-ee\'s #47', brand: 'Buc-ee\'s', address: '2800 I-45', city: 'Madisonville', state: 'TX', diesel_price: 3.779, gasoline_price: 3.359, status: 'active' });

  const workOrders = [
    { wo_number: 'WO-240891', title: 'Brake inspection — steer axle', repair_type: 'Brakes', status: 'open', priority: 'high', vehicle_id: vehicleRecords[2].id, complaint: 'Driver reported soft pedal on descent', labor_hours: 2.5, labor_rate: 85, labor_cost: 212.5, parts_total: 340, total_cost: 552.5, opened_date: dateOnly(-2), due_date: dateOnly(3) },
    { wo_number: 'WO-240877', title: 'PM Service — 125K interval', repair_type: 'Preventive Maintenance', status: 'in_progress', priority: 'medium', vehicle_id: vehicleRecords[0].id, labor_hours: 4, labor_rate: 75, labor_cost: 300, parts_total: 185, total_cost: 485, opened_date: dateOnly(-5) },
    { wo_number: 'WO-240865', title: 'DEF system fault — P20EE', repair_type: 'Engine', status: 'parts_ordered', priority: 'critical', vehicle_id: vehicleRecords[3].id, diagnosis: 'DEF quality sensor failure', labor_hours: 3, labor_rate: 95, labor_cost: 285, parts_total: 620, total_cost: 905, opened_date: dateOnly(-8) },
    { wo_number: 'WO-240850', title: 'Trailer tire replacement (4)', repair_type: 'Tires', status: 'completed', priority: 'medium', vehicle_id: vehicleRecords[9].id, labor_hours: 1.5, labor_rate: 75, labor_cost: 112.5, parts_total: 980, total_cost: 1092.5, opened_date: dateOnly(-14), due_date: dateOnly(-10) },
    { wo_number: 'WO-240842', title: 'A/C not cooling', repair_type: 'HVAC', status: 'open', priority: 'low', vehicle_id: vehicleRecords[4].id, complaint: 'No cold air above 85°F ambient', labor_hours: 2, labor_rate: 75, labor_cost: 150, parts_total: 0, total_cost: 150, opened_date: dateOnly(-1) },
    { wo_number: 'WO-240831', title: 'DOT annual inspection', repair_type: 'Preventive Maintenance', status: 'completed', priority: 'high', vehicle_id: vehicleRecords[1].id, labor_hours: 1, labor_rate: 75, labor_cost: 75, parts_total: 45, total_cost: 120, opened_date: dateOnly(-21) },
    { wo_number: 'WO-240820', title: 'Transmission slip — 5th gear', repair_type: 'Transmission', status: 'awaiting_parts', priority: 'critical', vehicle_id: vehicleRecords[5].id, labor_hours: 8, labor_rate: 110, labor_cost: 880, parts_total: 4200, total_cost: 5080, opened_date: dateOnly(-12) },
    { wo_number: 'WO-240815', title: 'Reefer unit service', repair_type: 'HVAC', status: 'in_progress', priority: 'medium', vehicle_id: vehicleRecords[9].id, labor_hours: 3, labor_rate: 85, labor_cost: 255, parts_total: 120, total_cost: 375, opened_date: dateOnly(-4) },
  ];
  workOrders.forEach((wo) => createEntity('WorkOrder', wo));

  const loads = [
    { load_number: 'LD-88421', origin_city: 'Dallas', origin_state: 'TX', destination_city: 'Atlanta', destination_state: 'GA', status: 'in_transit', rate: 2850, miles: 780, commodity: 'General Freight', pickup_date: dateOnly(-1), delivery_date: dateOnly(1), customer_id: c1 },
    { load_number: 'LD-88422', origin_city: 'Des Moines', origin_state: 'IA', destination_city: 'Chicago', destination_state: 'IL', status: 'delivered', rate: 1200, miles: 320, commodity: 'Food Grade', pickup_date: dateOnly(-4), delivery_date: dateOnly(-3), customer_id: c2 },
    { load_number: 'LD-88423', origin_city: 'Houston', origin_state: 'TX', destination_city: 'Phoenix', destination_state: 'AZ', status: 'booked', rate: 3400, miles: 1175, commodity: 'Building Materials', pickup_date: dateOnly(1), delivery_date: dateOnly(3), customer_id: customers[2].id },
    { load_number: 'LD-88424', origin_city: 'Denver', origin_state: 'CO', destination_city: 'Salt Lake City', destination_state: 'UT', status: 'in_transit', rate: 1650, miles: 520, commodity: 'Retail', pickup_date: dateOnly(-2), delivery_date: dateOnly(0), customer_id: customers[3].id },
    { load_number: 'LD-88425', origin_city: 'Dallas', origin_state: 'TX', destination_city: 'Memphis', destination_state: 'TN', status: 'delivered', rate: 2100, miles: 450, commodity: 'Automotive Parts', pickup_date: dateOnly(-7), delivery_date: dateOnly(-5), customer_id: c1 },
  ];
  loads.forEach((l) => createEntity('Load', l));

  createEntity('Vendor', { name: 'Rush Truck Centers — Dallas', type: 'dealer', phone: '(214) 555-8800', email: 'service@rushtruckdallas.com', city: 'Dallas', state: 'TX', status: 'active', services: 'Full service, warranty, parts' });
  createEntity('Vendor', { name: 'FleetPride — Des Moines', type: 'parts', phone: '(515) 555-7700', email: 'orders@fleetpride-dm.com', city: 'Des Moines', state: 'IA', status: 'active' });
  createEntity('Vendor', { name: 'Commercial Tire Pros', type: 'tires', phone: '(713) 555-6600', city: 'Houston', state: 'TX', status: 'active' });

  [
    { part_number: 'BP-4410', description: 'Brake pad set — steer axle', quantity: 12, unit_cost: 89.5, location: 'A-12', reorder_point: 4 },
    { part_number: 'OF-3350', description: 'Oil filter — Cummins ISX', quantity: 24, unit_cost: 18.75, location: 'B-03', reorder_point: 8 },
    { part_number: 'DF-2201', description: 'DEF fluid — 2.5 gal', quantity: 36, unit_cost: 12.99, location: 'C-01', reorder_point: 12 },
    { part_number: 'BL-8800', description: 'Serpentine belt', quantity: 8, unit_cost: 42.0, location: 'B-08', reorder_point: 3 },
  ].forEach((p) => createEntity('PartInventory', p));

  [
    { vehicle_id: vehicleRecords[0].id, gallons: 142, cost: 553.58, station_name: 'TA Petro Dallas', fuel_type: 'diesel', odometer: 125100, date: dateOnly(-3) },
    { vehicle_id: vehicleRecords[3].id, gallons: 165, cost: 635.25, station_name: "Love's #301", fuel_type: 'diesel', odometer: 311800, date: dateOnly(-2) },
    { vehicle_id: vehicleRecords[6].id, gallons: 128, cost: 486.72, station_name: "Buc-ee's #47", fuel_type: 'diesel', odometer: 245500, date: dateOnly(-1) },
  ].forEach((f) => createEntity('FuelLog', f));

  [
    { invoice_number: 'INV-2026-0142', customer_id: c1, amount: 4850, status: 'paid', due_date: dateOnly(-15), description: 'March fleet management — Lone Star' },
    { invoice_number: 'INV-2026-0143', customer_id: c2, amount: 9200, status: 'sent', due_date: dateOnly(14), description: 'Q1 maintenance program — Midwest Haulers' },
    { invoice_number: 'INV-2026-0144', customer_id: customers[2].id, amount: 3100, status: 'overdue', due_date: dateOnly(-5), description: 'Fuel audit & compliance review' },
    { invoice_number: 'INV-2026-0145', customer_id: customers[3].id, amount: 1500, status: 'draft', due_date: dateOnly(30), description: 'Onboarding — Peak Transport demo period' },
  ].forEach((inv) => createEntity('Invoice', inv));

  [
    { name: 'Robert Kim', email: 'rkim@lonestarfreight.com', message: 'Interested in your fuel optimization program for our 18-unit fleet.', status: 'new', source: 'website' },
    { name: 'Patricia Nguyen', email: 'pnguyen@midwesthaulers.com', message: 'Can you provide a demo of the compliance tracker?', status: 'contacted', source: 'referral' },
    { name: 'Tom Bradley', email: 'tbradley@gmail.com', message: 'Owner-operator with 3 trucks — looking for affordable fleet software.', status: 'new', source: 'website' },
  ].forEach((inq) => createEntity('Inquiry', inq));

  createEntity('MaintenanceSchedule', { vehicle_id: vehicleRecords[0].id, service_type: 'PM-A', interval_miles: 25000, last_service_miles: 100000, next_due_miles: 125000, status: 'due_soon' });
  createEntity('MaintenanceSchedule', { vehicle_id: vehicleRecords[5].id, service_type: 'DOT Annual', interval_months: 12, last_service_date: dateOnly(-400), next_due_date: dateOnly(30), status: 'scheduled' });

  createEntity('HOSLog', { driver_name: 'Mike Rodriguez', status: 'driving', hours_remaining: 6.5, cycle_remaining: 42, date: dateOnly(0) });
  createEntity('HOSLog', { driver_name: 'Lisa Thompson', status: 'on_duty_not_driving', hours_remaining: 8, cycle_remaining: 38, date: dateOnly(0) });

  createEntity('Message', { subject: 'Welcome to FleetCo Portal', body: 'Your demo account is ready. Explore the dashboard, work orders, and Site Commander AI.', from_user: 'FleetCo Admin', to_role: 'all', read: false, created_date: daysAgo(0) });

  createEntity('Incident', { title: 'Minor fender bender — parking lot', severity: 'low', status: 'closed', vehicle_id: vehicleRecords[1].id, date: dateOnly(-30), description: 'Backing incident at customer dock. No injuries.' });

  console.log('Demo data seeded:', {
    customers: customers.length,
    vehicles: vehicleRecords.length,
    workOrders: workOrders.length,
    loads: loads.length,
    demoLogins: 'manager@fleetco.com / demo123, driver1@fleetco.com / demo123',
  });

  return true;
}

export function getDemoSeedSummary() {
  return {
    customers: listEntities('Customer').length,
    vehicles: listEntities('Vehicle').length,
    workOrders: listEntities('WorkOrder').length,
    loads: listEntities('Load').length,
    invoices: listEntities('Invoice').length,
    seeded: filterEntities('Customer').length > 0,
  };
}

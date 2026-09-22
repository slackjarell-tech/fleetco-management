/**
 * Seed demo fleet data for Roby Morgan (roby.morgan88@gmail.com).
 * Usage: node scripts/seed-demo-roby.mjs [--production]
 */
const PRODUCTION = process.argv.includes('--production');
const BASE = PRODUCTION ? 'https://fleetcomanagement.org' : 'http://localhost:3001';
const CUSTOMER_EMAIL = 'roby.morgan88@gmail.com';

const OWNER_EMAIL = process.env.FLEETCO_OWNER_EMAIL || 'jarell.slack@fleetcomanagement.org';
const OWNER_PASS = process.env.FLEETCO_OWNER_PASSWORD || '';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 400) }; }
  return { status: res.status, data, ok: res.ok };
}

async function main() {
  if (!OWNER_PASS) {
    console.error('Set FLEETCO_OWNER_PASSWORD in the environment.');
    process.exit(1);
  }

  const login = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASS }),
  });
  if (!login.ok) {
    console.error('Owner login failed:', login.data?.error || login.status);
    process.exit(1);
  }

  const token = login.data.access_token;
  const users = await req('/api/entities/User', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const roby = Array.isArray(users.data)
    ? users.data.find((u) => u.email?.toLowerCase() === CUSTOMER_EMAIL.toLowerCase())
    : null;
  if (!roby?.customer_id) {
    console.error('No portal user found for', CUSTOMER_EMAIL);
    process.exit(1);
  }

  const customerId = roby.customer_id;
  const ctxHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Customer-Context': customerId,
  };

  const authed = (path, opts = {}) => req(path, {
    ...opts,
    headers: { ...ctxHeaders, ...(opts.headers || {}) },
  });

  const vehicles = await authed('/api/entities/Vehicle');
  const existing = Array.isArray(vehicles.data) ? vehicles.data : [];
  const byUnit = Object.fromEntries(existing.map((v) => [v.unit_number, v]));

  const upsertVehicle = async (spec) => {
    const found = byUnit[spec.unit_number];
    if (found) {
      const r = await authed(`/api/entities/Vehicle/${found.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...found, ...spec, customer_id: customerId, assigned_customer_id: customerId }),
      });
      return r.ok ? r.data : null;
    }
    const r = await authed('/api/entities/Vehicle', {
      method: 'POST',
      body: JSON.stringify({ ...spec, customer_id: customerId, assigned_customer_id: customerId }),
    });
    if (r.ok) byUnit[spec.unit_number] = r.data;
    return r.ok ? r.data : null;
  };

  const truck1 = await upsertVehicle({
    unit_number: 'FC101',
    make: 'Chevy',
    model: 'Silverado 1500',
    year: 2026,
    unit_type: 'truck',
    equipment_class: 'pickup',
    status: 'active',
    odometer: 18450,
    vin: '1GCPABEK9TZ304056',
    license_plate: 'TX-FC101',
  });

  if (byUnit['DEMO-101']?.id && byUnit['DEMO-101'].unit_number === 'DEMO-101') {
    await authed(`/api/entities/Vehicle/${byUnit['DEMO-101'].id}`, { method: 'DELETE' });
  }

  const truck2 = await upsertVehicle({
    unit_number: 'FC102',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2022,
    unit_type: 'truck',
    equipment_class: 'semi_tractor',
    status: 'in_shop',
    odometer: 412000,
    vin: '1FUJGHDV8NLAA5678',
    license_plate: 'TX-FC102',
  });

  const trailer = await upsertVehicle({
    unit_number: 'FC-T01',
    make: 'Great Dane',
    model: 'Dry Van',
    year: 2021,
    unit_type: 'trailer',
    equipment_class: 'dry_van',
    trailer_type: 'Dry Van',
    trailer_length: 53,
    status: 'active',
    vin: '1GRAA9620MB123456',
    license_plate: 'TX-T01',
  });

  const wos = await authed('/api/entities/WorkOrder');
  const woList = Array.isArray(wos.data) ? wos.data : [];
  const hasWo = (num) => woList.some((w) => w.wo_number === num);

  const createWo = async (body) => {
    if (hasWo(body.wo_number)) return woList.find((w) => w.wo_number === body.wo_number);
    const r = await authed('/api/entities/WorkOrder', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return r.ok ? r.data : null;
  };

  const today = new Date().toISOString().split('T')[0];

  const wo1 = truck1 && await createWo({
    wo_number: 'RO-DEMO-101',
    title: 'Brake noise under load',
    complaint: 'Driver reports squeal when stopping from highway speed; worse when loaded.',
    vehicle_id: truck1.id,
    customer_id: customerId,
    status: 'awaiting_estimate',
    priority: 'high',
    repair_type: 'Brakes',
    opened_date: today,
    service_tasks: [],
    parts: [],
    require_customer_authorization: true,
  });

  const wo2 = truck2 && await createWo({
    wo_number: 'RO-DEMO-102',
    title: 'Check engine / DEF system',
    complaint: 'CEL on for 200 miles. Shop previously noted DEF quality sensor fault.',
    vehicle_id: truck2.id,
    customer_id: customerId,
    status: 'awaiting_authorization',
    priority: 'medium',
    repair_type: 'Engine',
    opened_date: today,
    total_cost: 1845,
    labor_cost: 620,
    parts_cost: 1225,
    diagnosis: 'Replace DEF quality sensor and clear codes. Road test 25 mi.',
    service_tasks: [{ description: 'Diagnose CEL', hours: 1, rate: 125 }],
    parts: [{ name: 'DEF quality sensor', quantity: 1, unit_cost: 1225 }],
    require_customer_authorization: true,
  });

  const wo3 = truck1 && await createWo({
    wo_number: 'RO-DEMO-100',
    title: 'PM service — oil & filters',
    complaint: 'Scheduled 15k mile PM.',
    vehicle_id: truck1.id,
    customer_id: customerId,
    status: 'completed',
    priority: 'low',
    repair_type: 'Preventive Maintenance',
    opened_date: today,
    completed_date: today,
    total_cost: 485,
    labor_cost: 185,
    parts_cost: 300,
  });

  const loads = await authed('/api/entities/Load');
  const loadList = Array.isArray(loads.data) ? loads.data : [];
  let demoLoad = loadList.find((l) => l.load_number === 'DEMO-8801');
  if (!demoLoad && truck1) {
    const lr = await authed('/api/entities/Load', {
      method: 'POST',
      body: JSON.stringify({
        load_number: 'DEMO-8801',
        customer_id: customerId,
        vehicle_id: truck1.id,
        origin: 'Dallas, TX',
        destination: 'Houston, TX',
        rate: 2400,
        status: 'in_transit',
        pickup_date: today,
        delivery_date: today,
      }),
    });
    demoLoad = lr.ok ? lr.data : null;
  }

  const invoices = await authed('/api/entities/Invoice');
  const invList = Array.isArray(invoices.data) ? invoices.data : [];
  let demoInv = invList.find((i) => i.invoice_number === 'INV-DEMO-16');
  if (!demoInv) {
    const ir = await authed('/api/entities/Invoice', {
      method: 'POST',
      body: JSON.stringify({
        invoice_number: 'INV-DEMO-16',
        customer_id: customerId,
        status: 'sent',
        due_date: today,
        total: 175,
        line_items: [{ description: 'FleetCo portal — monthly (5 units demo)', amount: 175 }],
      }),
    });
    demoInv = ir.ok ? ir.data : null;
  }

  console.log(JSON.stringify({
    base: BASE,
    customerId,
    email: CUSTOMER_EMAIL,
    seeded: {
      vehicles: [truck1?.unit_number, truck2?.unit_number, trailer?.unit_number].filter(Boolean),
      workOrders: [wo1?.wo_number, wo2?.wo_number, wo3?.wo_number].filter(Boolean),
      load: demoLoad?.load_number || null,
      invoice: demoInv?.invoice_number || null,
    },
    loginUrl: PRODUCTION ? 'https://fleetcomanagement.org/login' : 'http://localhost:5173/login',
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

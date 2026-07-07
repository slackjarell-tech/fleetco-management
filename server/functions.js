import bcrypt from 'bcryptjs';
import {
  createEntity,
  createUser,
  filterEntities,
  findUserByEmail,
  findUserById,
  getUserRowByEmail,
  getEntity,
  updateUser,
  updateEntity,
  deleteEntity,
  listEntities,
  nowIso,
} from './db.js';
import {
  canCreateFleetCoEmployees,
  canManageCustomerTeam,
  canProvisionCustomers,
  isFleetCoInternal,
  subscriptionAmount,
  SUBSCRIPTION_PLANS,
  FLEETCO_EMAIL_DOMAIN,
  canManageDomainEmails,
  canGrantEmployeeEmailAccess,
  normalizeFleetCoEmail,
  isFleetCoDomainEmail,
  requireFleetCoEmail,
} from './roles.js';

const SIM_ROUTES = [
  { name: 'I-80 Westbound', id: 'sim_driver_01', userName: '👤 Mike R. (Sim)', steps: [
    { lat: 41.8827, lng: -87.6233 }, { lat: 41.6005, lng: -88.2025 }, { lat: 41.5250, lng: -90.5786 },
    { lat: 41.6611, lng: -93.6120 }, { lat: 41.2565, lng: -95.9345 }, { lat: 40.8082, lng: -96.6990 },
    { lat: 40.5865, lng: -105.1139 }, { lat: 39.7392, lng: -104.9903 }, { lat: 40.7608, lng: -111.8910 },
    { lat: 39.5296, lng: -119.8138 }, { lat: 38.5816, lng: -121.4944 }, { lat: 37.7749, lng: -122.4194 },
  ]},
  { name: 'I-10 Eastbound', id: 'sim_driver_02', userName: '👤 Carlos V. (Sim)', steps: [
    { lat: 34.0522, lng: -118.2437 }, { lat: 33.7490, lng: -117.7645 }, { lat: 33.4484, lng: -112.0740 },
    { lat: 32.2217, lng: -110.9265 }, { lat: 31.7619, lng: -106.4850 }, { lat: 29.4241, lng: -98.4936 },
    { lat: 29.7604, lng: -95.3698 }, { lat: 30.4515, lng: -91.1871 }, { lat: 30.3322, lng: -87.2222 },
    { lat: 30.3322, lng: -81.6557 },
  ]},
  { name: 'I-95 Northbound', id: 'sim_driver_03', userName: '👤 Lisa T. (Sim)', steps: [
    { lat: 25.7617, lng: -80.1918 }, { lat: 26.7153, lng: -80.0534 }, { lat: 28.5383, lng: -81.3792 },
    { lat: 30.3322, lng: -81.6557 }, { lat: 32.0809, lng: -81.0912 }, { lat: 33.7490, lng: -84.3880 },
    { lat: 35.2271, lng: -80.8431 }, { lat: 37.5407, lng: -77.4360 }, { lat: 38.9072, lng: -77.0369 },
    { lat: 39.9526, lng: -75.1652 }, { lat: 40.7128, lng: -74.0060 },
  ]},
  { name: 'I-5 Northbound', id: 'sim_driver_04', userName: '👤 Dave K. (Sim)', steps: [
    { lat: 32.7157, lng: -117.1611 }, { lat: 34.0522, lng: -118.2437 }, { lat: 36.7372, lng: -119.7871 },
    { lat: 37.3382, lng: -121.8863 }, { lat: 37.7749, lng: -122.4194 }, { lat: 38.5816, lng: -121.4944 },
    { lat: 45.5152, lng: -122.6784 }, { lat: 47.6062, lng: -122.3321 },
  ]},
];

export async function invokeFunction(name, body, user) {
  switch (name) {
    case 'decodeVin':
      return decodeVin(body);
    case 'submitInquiry':
      return submitInquiry(body);
    case 'upgradeUserRole':
      return upgradeUserRole(body, user);
    case 'createUserAccount':
      return createUserAccount(body, user);
    case 'provisionCustomer':
      return provisionCustomer(body, user);
    case 'sendCustomerTestLogin':
      return sendCustomerTestLogin(body, user);
    case 'createDomainEmail':
      return createDomainEmail(body, user);
    case 'simulateDrivers':
      return simulateDrivers(body);
    case 'predictFuelPrices':
      return predictFuelPrices();
    case 'createCheckout':
      return createCheckout(body);
    case 'sendNotification':
      console.log('[notification]', body);
      return { success: true };
    case 'sendSystemEmail':
      console.log('[email]', body);
      return { success: true };
    case 'sendMaterials':
      console.log('[materials]', body);
      return { success: true };
    case 'notifyDvirReview':
      console.log('[dvir review]', body);
      return { success: true };
    case 'refreshFuelPrices':
      return { success: true, message: 'Fuel prices refreshed (local mode)' };
    case 'seedDemoData': {
      if (!user || !['owner', 'executive'].includes(user.role)) throw new Error('Owner or executive access required');
      const { seedDemoData, getDemoSeedSummary } = await import('./seedDemo.js');
      const created = seedDemoData();
      return {
        success: true,
        created,
        message: created ? 'Demo data seeded successfully' : 'Demo data already exists',
        summary: getDemoSeedSummary(),
      };
    }
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

async function decodeVin({ vin }) {
  if (!vin || typeof vin !== 'string' || vin.trim().length < 11) {
    throw new Error('Valid VIN (11+ characters) is required');
  }
  const cleanVin = vin.trim().toUpperCase();
  const decodeRes = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${cleanVin}?format=json`
  );
  const decodeData = await decodeRes.json();
  if (!decodeData?.Results?.length) {
    throw new Error('Could not decode VIN. No results from NHTSA.');
  }
  const results = decodeData.Results;
  const findValue = (name) => results.find((r) => r.Variable === name)?.Value || null;
  const specs = {
    make: findValue('Make'),
    model: findValue('Model'),
    year: findValue('Model Year') ? parseInt(findValue('Model Year'), 10) : null,
    body_class: findValue('Body Class'),
    fuel_type: findValue('Fuel Type - Primary'),
    manufacturer: findValue('Manufacturer Name'),
    vehicle_type: findValue('Vehicle Type'),
  };
  let recalls = [];
  try {
    const recallRes = await fetch(`https://api.nhtsa.gov/vehicles/${cleanVin}/recalls?format=json`);
    const recallData = await recallRes.json();
    if (recallData?.results?.length) {
      recalls = recallData.results.map((r) => ({
        nhtsa_campaign: r.NHTSACampaignNumber || '',
        component: r.Component || '',
        summary: r.Summary || '',
      }));
    }
  } catch {
    recalls = [];
  }
  return { vin: cleanVin, specs, recalls };
}

function submitInquiry(body) {
  const { name, email, message } = body;
  if (!name || !email || !message) {
    throw new Error('Name, email, and message are required.');
  }
  const inquiry = createEntity('Inquiry', {
    ...body,
    status: 'new',
  });
  console.log('[inquiry received]', inquiry.id, email);
  return { success: true, id: inquiry.id };
}

function upgradeUserRole(body, user) {
  if (!user) throw new Error('Unauthorized');
  const { email, role, customer_id, employee_number } = body;
  if (!email || !role) throw new Error('Email and role are required');
  const target = findUserByEmail(email);
  if (!target) throw new Error('User not found');
  const updateData = { role };
  if (customer_id) updateData.customer_id = customer_id;
  if (employee_number) updateData.employee_number = employee_number;
  updateUser(target.id, updateData);
  if (customer_id) {
    updateEntity('Customer', customer_id, { user_id: target.id });
  }
  return { success: true, email, role };
}

function provisionInternalPortalUser({ email, tempPassword, role, employeeNumber, fullName }, actingUser) {
  if (!canGrantEmployeeEmailAccess(actingUser.role)) {
    throw new Error('Only owner or SLT (Senior Leadership Team) can grant employee email and portal access');
  }
  const normalizedEmail = requireFleetCoEmail(email);
  const internalRoles = ['executive', 'fleet_manager', 'fleet_coordinator'];
  if (!internalRoles.includes(role)) {
    throw new Error('Portal role must be executive, fleet_manager, or fleet_coordinator');
  }

  let existing = getUserRowByEmail(normalizedEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(tempPassword, 10);
    createUser({
      email: normalizedEmail,
      passwordHash: hash,
      role,
      customerId: null,
      employeeNumber,
      fullName,
    });
  } else {
    updateUser(existing.id, {
      role,
      customer_id: null,
      employee_number: employeeNumber,
      password_hash: bcrypt.hashSync(tempPassword, 10),
      ...(fullName ? { full_name: fullName } : {}),
    });
  }

  createEntity('PendingAccount', {
    email: normalizedEmail,
    temp_password: tempPassword,
    role,
    customer_id: null,
    activated: false,
    created_by: actingUser.full_name || actingUser.email,
    employee_number: employeeNumber || '',
  });

  return findUserByEmail(normalizedEmail);
}

function createUserAccount(body, user) {
  if (!user) throw new Error('Unauthorized');
  const { email, tempPassword, role, customerId, employeeNumber, fullName } = body;
  if (!email || !tempPassword || !role) {
    throw new Error('Email, tempPassword, and role are required');
  }

  const internalRoles = ['executive', 'fleet_manager', 'fleet_coordinator'];
  const customerRoles = ['user', 'driver'];

  let normalizedEmail = email.trim().toLowerCase();

  if (internalRoles.includes(role)) {
    if (!canCreateFleetCoEmployees(user.role)) {
      throw new Error('Only the owner (JaRell Slack) can create FleetCo employee accounts');
    }
    if (customerId) throw new Error('FleetCo employees are not linked to a customer account');
    normalizedEmail = requireFleetCoEmail(normalizedEmail);
  } else if (customerRoles.includes(role)) {
    if (canManageCustomerTeam(user.role)) {
      if (!user.customer_id) throw new Error('Your account is not linked to a customer organization');
      if (customerId && customerId !== user.customer_id) {
        throw new Error('You can only add team members to your own organization');
      }
    } else if (canProvisionCustomers(user.role) || user.role === 'owner') {
      if (!customerId) throw new Error('customerId is required when creating customer portal users');
    } else {
      throw new Error('You do not have permission to create this account type');
    }
  } else if (role === 'owner') {
    throw new Error('Owner accounts cannot be created through this form');
  } else {
    throw new Error(`Invalid role: ${role}`);
  }

  const effectiveCustomerId = internalRoles.includes(role)
    ? null
    : (customerId || user.customer_id || null);

  let existing = getUserRowByEmail(normalizedEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(tempPassword, 10);
    createUser({
      email: normalizedEmail,
      passwordHash: hash,
      role,
      customerId: effectiveCustomerId,
      employeeNumber,
      fullName,
    });
  } else {
    updateUser(existing.id, {
      role,
      customer_id: effectiveCustomerId,
      employee_number: employeeNumber,
      password_hash: bcrypt.hashSync(tempPassword, 10),
      ...(fullName ? { full_name: fullName } : {}),
    });
  }

  createEntity('PendingAccount', {
    email: normalizedEmail,
    temp_password: tempPassword,
    role,
    customer_id: effectiveCustomerId,
    activated: false,
    created_by: user.full_name || user.email,
    employee_number: employeeNumber || '',
  });

  console.log(`[account created] ${normalizedEmail} role=${role}`);
  return {
    success: true,
    email: normalizedEmail,
    message: `${normalizedEmail} account created. They can sign in with the temporary password.`,
  };
}

function createDomainEmail(body, user) {
  if (!user || !canManageDomainEmails(user.role)) {
    throw new Error('Only owner or SLT (Senior Leadership Team) can create @fleetcomanagement.org company emails');
  }

  const {
    localPart,
    email: rawEmail,
    displayName,
    mailboxType = 'employee',
    createPortalAccess = true,
    portalRole = 'fleet_coordinator',
    tempPassword,
    employeeNumber,
    notes,
    linkExistingUserId,
  } = body;

  const email = normalizeFleetCoEmail(rawEmail || localPart);
  if (!email) {
    throw new Error('Enter a valid email name (e.g. jane.doe)');
  }

  const existingUser = getUserRowByEmail(email);
  const existingMailbox = filterEntities('DomainEmail', { email }, null, 1)[0];
  if (existingMailbox) {
    throw new Error(`${email} already exists in the company email directory`);
  }

  const linkedExisting = linkExistingUserId ? findUserById(linkExistingUserId) : null;
  if (linkExistingUserId && !linkedExisting) {
    throw new Error('Linked portal user not found');
  }

  const local_part = email.split('@')[0];
  const ts = nowIso();
  let linkedUserId = existingUser?.id || linkedExisting?.id || null;
  let portalMessage = '';

  if (createPortalAccess && !linkedExisting) {
    if (!tempPassword) throw new Error('Temp password is required when creating portal access');
    const internalRoles = ['executive', 'fleet_manager', 'fleet_coordinator'];
    if (!internalRoles.includes(portalRole)) {
      throw new Error('Portal role must be executive, fleet_manager, or fleet_coordinator');
    }
    provisionInternalPortalUser(
      {
        email,
        tempPassword,
        role: portalRole,
        employeeNumber,
        fullName: displayName || local_part.replace(/[._]/g, ' '),
      },
      user
    );
    linkedUserId = findUserByEmail(email)?.id || linkedUserId;
    portalMessage = ` Portal login created (${portalRole}).`;
  } else if (linkedExisting) {
    updateUser(linkedExisting.id, { email });
    linkedUserId = linkedExisting.id;
    portalMessage = ` Linked to existing portal account (login email updated to ${email}).`;
  } else if (existingUser) {
    linkedUserId = existingUser.id;
  }

  const mailbox = createEntity('DomainEmail', {
    email,
    local_part,
    display_name: displayName || local_part.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    mailbox_type: mailboxType,
    status: 'active',
    linked_user_id: linkedUserId,
    portal_role: createPortalAccess ? portalRole : (linkedExisting?.role || ''),
    has_portal_access: !!createPortalAccess || !!linkedExisting,
    created_by: user.email,
    notes: notes || '',
    provisioned_at: ts,
  });

  console.log(`[domain email] ${email} created by ${user.email}`);
  console.log(`[email] Welcome ${email} — mailbox registered. Set up IONOS mailbox to receive mail at this address.`);

  return {
    success: true,
    mailbox,
    email,
    message: `Company email ${email} created.${portalMessage} Configure the mailbox in IONOS Email & Office to receive mail.`,
  };
}

function provisionCustomer(body, user) {
  if (!user || !canProvisionCustomers(user.role)) {
    throw new Error('Only FleetCo owner, executive, or fleet managers can add customers');
  }

  const {
    customer: customerData,
    subscription_plan,
    subscription_term,
    payment_collected,
    tempPassword,
    createLogin,
  } = body;

  if (!customerData?.company_name || !customerData?.email) {
    throw new Error('Company name and contact email are required');
  }
  if (!payment_collected) {
    throw new Error('Payment must be collected before activating a customer account');
  }
  if (!SUBSCRIPTION_PLANS[subscription_plan]) {
    throw new Error('Valid subscription plan required (Starter or Growth)');
  }
  if (!['monthly', 'yearly'].includes(subscription_term)) {
    throw new Error('Subscription term must be monthly or yearly');
  }

  const amount = subscriptionAmount(subscription_plan, subscription_term);
  const ts = nowIso();

  const customer = createEntity('Customer', {
    ...customerData,
    status: 'active',
    subscription_plan,
    subscription_term,
    subscription_amount: amount,
    payment_collected_at: ts,
    subscription_status: 'active',
    provisioned_by: user.email,
  });

  createEntity('Subscription', {
    customer_id: customer.id,
    plan: subscription_plan,
    term: subscription_term,
    amount,
    status: 'active',
    started_at: ts,
    collected_by: user.email,
  });

  let loginMessage = '';
  if (createLogin && tempPassword) {
    createUserAccount(
      {
        email: customerData.email,
        tempPassword,
        role: 'user',
        customerId: customer.id,
      },
      user
    );
    updateEntity('Customer', customer.id, { user_id: findUserByEmail(customerData.email)?.id });
    loginMessage = ` Portal login created for ${customerData.email}.`;
  }

  return {
    success: true,
    customer,
    subscription: { plan: subscription_plan, term: subscription_term, amount },
    message: `Customer ${customerData.company_name} activated.${loginMessage}`,
  };
}

function sendCustomerTestLogin(body, user) {
  if (!user || !canProvisionCustomers(user.role)) {
    throw new Error('Only FleetCo owner, executive, or fleet managers can send customer test logins');
  }

  const { customerId, tempPassword: providedPassword } = body;
  if (!customerId) throw new Error('customerId is required');

  const customer = getEntity('Customer', customerId);
  if (!customer) throw new Error('Customer not found');
  if (!customer.email) throw new Error('Customer has no email on file');

  const tempPassword = providedPassword || `Fleet${Math.random().toString(36).slice(2, 8)}!`;
  const email = customer.email.trim().toLowerCase();

  createUserAccount(
    {
      email,
      tempPassword,
      role: 'user',
      customerId: customer.id,
      fullName: customer.contact_name || customer.company_name,
    },
    user
  );

  updateEntity('Customer', customer.id, {
    user_id: findUserByEmail(email)?.id,
    status: customer.status === 'inactive' ? 'prospect' : customer.status,
  });

  const loginUrl = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org/login';
  const credentialText = [
    'Welcome to FleetCo Management!',
    '',
    `Company: ${customer.company_name}`,
    `Portal: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary password: ${tempPassword}`,
    '',
    'Please sign in and change your password after your first login.',
    'From there you can add drivers and team members under Customers & Team → My Team.',
  ].join('\n');

  const message = createEntity('Message', {
    conversation_id: `customer_${customer.id}`,
    sender_id: user.id,
    sender_name: user.full_name || user.email,
    sender_role: user.role,
    customer_id: customer.id,
    text: credentialText,
  });

  console.log(`[test login] ${email} for ${customer.company_name} by ${user.email}`);

  return {
    success: true,
    email,
    tempPassword,
    loginUrl,
    messageId: message.id,
    message: `Test login ready for ${customer.contact_name || customer.company_name}. Credentials saved to customer messages — copy and send to the prospect.`,
    credentialsText: credentialText,
  };
}

function simulateDrivers(body) {
  const action = body.action || 'step';
  if (action === 'reset') {
    const existing = listEntities('DriverLocation', '-timestamp', 500);
    for (const loc of existing.filter((l) => l.user_id?.startsWith('sim_driver_'))) {
      deleteEntity('DriverLocation', loc.id);
    }
    const now = nowIso();
    const created = [];
    for (const route of SIM_ROUTES) {
      const start = route.steps[0];
      created.push(createEntity('DriverLocation', {
        user_id: route.id,
        user_name: route.userName,
        lat: start.lat + (Math.random() - 0.5) * 0.02,
        lng: start.lng + (Math.random() - 0.5) * 0.02,
        speed: 25 + Math.random() * 10,
        heading: Math.floor(Math.random() * 360),
        timestamp: now,
        clock_entry_id: 'simulation',
      }));
    }
    return { action: 'reset', drivers: SIM_ROUTES.length, created };
  }

  if (action === 'step') {
    const simIds = SIM_ROUTES.map((r) => r.id);
    const recent = listEntities('DriverLocation', '-timestamp', 100);
    const lastPositions = {};
    for (const loc of recent) {
      if (simIds.includes(loc.user_id) && !lastPositions[loc.user_id]) {
        lastPositions[loc.user_id] = loc;
      }
    }
    const now = nowIso();
    const updates = [];
    for (const route of SIM_ROUTES) {
      const last = lastPositions[route.id];
      if (!last) continue;
      let closestIdx = 0;
      let closestDist = Infinity;
      for (let i = 0; i < route.steps.length; i++) {
        const d = Math.sqrt(
          (last.lat - route.steps[i].lat) ** 2 + (last.lng - route.steps[i].lng) ** 2
        );
        if (d < closestDist) { closestDist = d; closestIdx = i; }
      }
      const nextIdx = (closestIdx + 1) % route.steps.length;
      const target = route.steps[nextIdx];
      let newLat, newLng;
      if (closestDist < 0.3) {
        newLat = target.lat + (Math.random() - 0.5) * 0.02;
        newLng = target.lng + (Math.random() - 0.5) * 0.02;
      } else {
        const progress = 0.15 + Math.random() * 0.25;
        newLat = last.lat + (target.lat - last.lat) * progress + (Math.random() - 0.5) * 0.03;
        newLng = last.lng + (target.lng - last.lng) * progress + (Math.random() - 0.5) * 0.03;
      }
      const heading = Math.atan2(target.lng - last.lng, target.lat - last.lat) * (180 / Math.PI);
      createEntity('DriverLocation', {
        user_id: route.id,
        user_name: route.userName,
        lat: newLat,
        lng: newLng,
        speed: 22 + Math.random() * 15,
        heading: heading >= 0 ? heading : heading + 360,
        timestamp: now,
        clock_entry_id: 'simulation',
      });
      updates.push({ driver: route.userName, lat: newLat.toFixed(4), lng: newLng.toFixed(4) });
    }
    return { action: 'step', count: SIM_ROUTES.length, updates };
  }
  throw new Error('Unknown action');
}

function predictFuelPrices() {
  const stations = filterEntities('FuelStation', { status: 'active' });
  const dieselPrices = stations.filter((s) => s.diesel_price).map((s) => s.diesel_price);
  const gasPrices = stations.filter((s) => s.gasoline_price).map((s) => s.gasoline_price);
  const avgDiesel = dieselPrices.length
    ? dieselPrices.reduce((a, b) => a + b, 0) / dieselPrices.length
    : 3.85;
  const avgGas = gasPrices.length
    ? gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length
    : 3.45;

  const predictions = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const drift = (Math.random() - 0.5) * 0.02;
    predictions.push({
      date: d.toISOString().split('T')[0],
      diesel_price: parseFloat((avgDiesel + drift * i * 0.1).toFixed(3)),
      gasoline_price: parseFloat((avgGas + drift * i * 0.08).toFixed(3)),
      trend: drift > 0.005 ? 'up' : drift < -0.005 ? 'down' : 'stable',
      note: 'Local forecast model (no external AI)',
    });
  }
  return {
    generated_at: now.toISOString(),
    current_avg_diesel: parseFloat(avgDiesel.toFixed(3)),
    current_avg_gas: parseFloat(avgGas.toFixed(3)),
    predictions,
  };
}

function createCheckout({ planName, billingTerm = 'monthly' }) {
  const origin = process.env.APP_ORIGIN || 'http://localhost:5173';
  const term = billingTerm === 'yearly' ? 'yearly' : 'monthly';
  return {
    url: `${origin}/register?plan=${encodeURIComponent(planName || 'Starter')}&term=${term}`,
    message: 'Complete registration after selecting your plan',
  };
}

export function invokeLLM({ prompt }) {
  // Legacy stub — use server/aiAgent.js simpleLLM via /api/integrations/llm
  return {
    description: 'Use /api/integrations/llm or configure GROQ_API_KEY for AI features.',
    system: 'General',
    severity: 'info',
  };
}

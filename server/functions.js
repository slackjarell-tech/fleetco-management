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
  listUsers,
  nowIso,
} from './db.js';
import {
  canCreateFleetCoEmployees,
  canManageCustomerTeam,
  canAssignCustomerRole,
  CUSTOMER_TEAM_ROLES,
  CUSTOMER_LEGACY_ROLE,
  defaultSidebarModulesForRole,
  normalizeCustomerRole,
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
import {
  computeNextDueDate,
  getBillingSnapshot,
  formatCountdown,
  reminderTypeForDays,
  REMINDER_THRESHOLDS,
} from './billing.js';
import {
  normalizeNotificationPrefs,
  getCustomerNotificationPrefs,
  shouldSendCustomerNotification,
  NOTIFICATION_TYPE_TO_PREF,
} from './notificationPreferences.js';
import { sendWelcomeSignupEmail } from './customerEmails.js';
import { sendInquiryNotificationEmail } from './inquiryEmails.js';
import { getEmailConfigStatus, sendEmail as sendEmailDirect } from './email.js';

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
    case 'sendCustomerWelcomeEmail':
      return sendCustomerWelcomeEmail(body, user);
    case 'getCustomerNotificationPrefs':
      return getCustomerNotificationPrefsForUser(user);
    case 'updateCustomerNotificationPrefs':
      return updateCustomerNotificationPrefs(body, user);
    case 'getBillingAlerts':
      return getBillingAlerts(body, user);
    case 'recordCustomerPayment':
      return recordCustomerPayment(body, user);
    case 'setCustomerPause':
      return setCustomerPause(body, user);
    case 'startDashcamSession':
      return startDashcamSession(body, user);
    case 'captureDashcamFrame':
      return captureDashcamFrame(body, user);
    case 'stopDashcamSession':
      return stopDashcamSession(body, user);
    case 'createDomainEmail':
      return createDomainEmail(body, user);
    case 'simulateDrivers':
      return simulateDrivers(body);
    case 'predictFuelPrices':
      return predictFuelPrices();
    case 'createCheckout':
      return createCheckout(body);
    case 'sendNotification':
      return sendNotification(body);
    case 'getEmailConfig':
      return getEmailConfig(user);
    case 'testEmailConfig':
      return testEmailConfig(body, user);
    case 'sendSystemEmail': {
      const { sendEmail } = await import('./email.js');
      const { to, subject, html, text } = body;
      if (!to || !subject) throw new Error('to and subject are required');
      return sendEmail({ to, subject, html, text });
    }
    case 'sendMaterials': {
      const { sendEmail, fileAttachment } = await import('./email.js');
      const { to, subject, html, attachmentPaths = [] } = body;
      if (!to) throw new Error('to is required');
      const attachments = attachmentPaths.map((p) => fileAttachment(p));
      return sendEmail({
        to,
        subject: subject || 'FleetCo Marketing Materials',
        html: html || '<p>Your FleetCo materials are attached.</p>',
        attachments,
      });
    }
    case 'notifyDvirReview':
      console.log('[dvir review]', body);
      return { success: true };
    case 'refreshFuelPrices':
      return { success: true, message: 'Fuel prices refreshed (local mode)' };
    case 'seedDemoData': {
      if (!user || !['owner', 'executive'].includes(user.role)) throw new Error('Owner or executive access required');
      const { seedDemoData, getDemoSeedSummary } = await import('./seedDemo.js');
      const created = seedDemoData(body);
      return {
        success: true,
        created: !!created,
        message: created
          ? (body?.fillGaps ? 'Demo gap data added for system test' : 'Demo data seeded successfully')
          : 'Demo data already exists — pass fillGaps: true to add missing records',
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

async function submitInquiry(body) {
  const { name, email, message } = body;
  if (!name || !email || !message) {
    throw new Error('Name, email, and message are required.');
  }
  const inquiry = createEntity('Inquiry', {
    ...body,
    status: 'new',
  });
  console.log('[inquiry received]', inquiry.id, email);

  let notificationEmail = { success: false, skipped: true };
  try {
    notificationEmail = await sendInquiryNotificationEmail(inquiry);
    if (!notificationEmail.success) {
      console.warn('[inquiry email not sent]', inquiry.id, notificationEmail.error || notificationEmail.reason);
    }
  } catch (err) {
    console.error('[inquiry email failed]', inquiry.id, err.message);
  }

  return {
    success: true,
    id: inquiry.id,
    emailSent: !!notificationEmail.success,
  };
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

async function createUserAccount(body, user) {
  if (!user) throw new Error('Unauthorized');
  const { email, tempPassword, role, customerId, employeeNumber, fullName, sendWelcomeEmail } = body;
  if (!email || !tempPassword || !role) {
    throw new Error('Email, tempPassword, and role are required');
  }

  const internalRoles = ['executive', 'fleet_manager', 'fleet_coordinator'];
  const customerRoles = [...CUSTOMER_TEAM_ROLES, CUSTOMER_LEGACY_ROLE];

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
      if (!canAssignCustomerRole(user.role, role)) {
        throw new Error(`You cannot assign the ${role} role`);
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
  const sidebarModules = body.sidebar_modules || defaultSidebarModulesForRole(role);
  if (!existing) {
    const hash = bcrypt.hashSync(tempPassword, 10);
    createUser({
      email: normalizedEmail,
      passwordHash: hash,
      role,
      customerId: effectiveCustomerId,
      employeeNumber,
      fullName,
      sidebarModules,
    });
  } else {
    updateUser(existing.id, {
      role,
      customer_id: effectiveCustomerId,
      employee_number: employeeNumber,
      password_hash: bcrypt.hashSync(tempPassword, 10),
      sidebar_modules: sidebarModules,
      ...(fullName ? { full_name: fullName } : {}),
    });
  }

  const portalUser = findUserByEmail(normalizedEmail);

  // Replace any prior pending row so temp password stays current
  for (const old of filterEntities('PendingAccount', { email: normalizedEmail })) {
    deleteEntity('PendingAccount', old.id);
  }

  createEntity('PendingAccount', {
    email: normalizedEmail,
    temp_password: tempPassword,
    role,
    customer_id: effectiveCustomerId,
    user_id: portalUser?.id || null,
    activated: false,
    created_by: user.full_name || user.email,
    employee_number: employeeNumber || '',
  });

  console.log(`[account created] ${normalizedEmail} role=${role}`);

  let welcomeEmail = null;
  const shouldSendWelcome =
    sendWelcomeEmail !== false &&
    customerRoles.includes(role) &&
    effectiveCustomerId;
  if (shouldSendWelcome) {
    const customer = getEntity('Customer', effectiveCustomerId);
    if (customer) {
      welcomeEmail = await sendWelcomeSignupEmail({
        to: normalizedEmail,
        companyName: customer.company_name,
        contactName: fullName || customer.contact_name,
        tempPassword,
        notificationPrefs: getCustomerNotificationPrefs(customer),
      });
    }
  }

  let emailNote = '';
  if (welcomeEmail?.success) {
    emailNote = ' Welcome email sent.';
  } else if (welcomeEmail?.skipped) {
    emailNote = ' (Welcome email skipped — RESEND_API_KEY not configured on server.)';
  } else if (welcomeEmail?.error) {
    emailNote = ` (Welcome email failed: ${welcomeEmail.error}${welcomeEmail.hint ? ` — ${welcomeEmail.hint}` : ''})`;
  }

  return {
    success: true,
    email: normalizedEmail,
    user_id: portalUser?.id,
    welcomeEmail,
    message: `${normalizedEmail} account created. They can sign in with the temporary password and will be asked to set a new password on first login.${emailNote}`,
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

async function provisionCustomer(body, user) {
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
  const nextDue = computeNextDueDate(ts, subscription_term);
  const notificationPrefs = normalizeNotificationPrefs(body.notification_prefs);

  const customer = createEntity('Customer', {
    ...customerData,
    status: 'active',
    subscription_plan,
    subscription_term,
    subscription_amount: amount,
    payment_collected_at: ts,
    last_payment_at: ts,
    next_payment_due_at: nextDue,
    subscription_status: 'active',
    payment_status: 'current',
    system_paused: false,
    provisioned_by: user.email,
    notification_prefs: notificationPrefs,
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
  let welcomeEmail = null;
  if (createLogin && tempPassword) {
    await createUserAccount(
      {
        email: customerData.email,
        tempPassword,
        role: 'customer_owner',
        customerId: customer.id,
        fullName: customerData.contact_name || customerData.company_name,
        sendWelcomeEmail: false,
      },
      user
    );
    const portalEmail = customerData.email.trim().toLowerCase();
    updateEntity('Customer', customer.id, {
      user_id: findUserByEmail(portalEmail)?.id,
      has_portal_login: true,
      portal_login_email: portalEmail,
    });
    loginMessage = ` Portal login created for ${portalEmail}.`;

    welcomeEmail = await sendWelcomeSignupEmail({
      to: portalEmail,
      companyName: customerData.company_name,
      contactName: customerData.contact_name,
      tempPassword,
      notificationPrefs,
    });
    if (welcomeEmail.success) {
      loginMessage += ' Welcome email sent.';
    } else if (welcomeEmail.skipped) {
      loginMessage += ' (Welcome email skipped — RESEND_API_KEY not configured on server.)';
    } else if (welcomeEmail.error) {
      loginMessage += ` (Welcome email failed: ${welcomeEmail.error}${welcomeEmail.hint ? ` — ${welcomeEmail.hint}` : ''})`;
    }
  }

  return {
    success: true,
    customer,
    subscription: { plan: subscription_plan, term: subscription_term, amount },
    welcomeEmail,
    message: `Customer ${customerData.company_name} activated.${loginMessage}`,
  };
}

async function sendCustomerTestLogin(body, user) {
  if (!user || !canProvisionCustomers(user.role)) {
    throw new Error('Only FleetCo owner, executive, or fleet managers can send customer test logins');
  }

  const { customerId, tempPassword: providedPassword, cc, bcc } = body;
  if (!customerId) throw new Error('customerId is required');

  const customer = getEntity('Customer', customerId);
  if (!customer) throw new Error('Customer not found');
  if (!customer.email) throw new Error('Customer has no email on file');

  const tempPassword = providedPassword || `Fleet${Math.random().toString(36).slice(2, 8)}!`;
  const email = customer.email.trim().toLowerCase();

  await createUserAccount(
    {
      email,
      tempPassword,
      role: 'customer_owner',
      customerId: customer.id,
      fullName: customer.contact_name || customer.company_name,
      sendWelcomeEmail: false,
    },
    user
  );

  updateEntity('Customer', customer.id, {
    user_id: findUserByEmail(email)?.id,
    has_portal_login: true,
    portal_login_email: email,
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

  const notificationPrefs = getCustomerNotificationPrefs(customer);
  const welcomeEmail = await sendWelcomeSignupEmail({
    to: email,
    cc,
    bcc,
    companyName: customer.company_name,
    contactName: customer.contact_name,
    tempPassword,
    notificationPrefs,
  });

  let emailNote = '';
  if (welcomeEmail.success) {
    emailNote = ' Welcome email sent to the customer.';
  } else if (welcomeEmail.skipped) {
    emailNote = ' (Welcome email skipped — RESEND_API_KEY not configured on server.)';
  } else if (welcomeEmail.error) {
    emailNote = ` (Welcome email failed: ${welcomeEmail.error}${welcomeEmail.hint ? ` — ${welcomeEmail.hint}` : ''})`;
  }

  return {
    success: true,
    email,
    tempPassword,
    loginUrl,
    messageId: message.id,
    welcomeEmail,
    message: `Test login ready for ${customer.contact_name || customer.company_name}. Credentials saved to customer messages.${emailNote}`,
    credentialsText: credentialText,
  };
}

async function sendCustomerWelcomeEmail(body, user) {
  if (!user || !canProvisionCustomers(user.role)) {
    throw new Error('Only FleetCo owner, executive, or fleet managers can send customer welcome emails');
  }

  const { customerId, email: emailInput, tempPassword: providedPassword, cc, bcc, resetPassword } = body;
  let customer = customerId ? getEntity('Customer', customerId) : null;
  if (!customer && emailInput) {
    customer = filterEntities('Customer', { email: emailInput.trim().toLowerCase() }, null, 1)[0];
  }
  if (!customer) throw new Error('Customer not found');
  if (!customer.email) throw new Error('Customer has no email on file');

  const portalEmail = customer.email.trim().toLowerCase();
  let tempPassword = providedPassword;

  const pending = filterEntities('PendingAccount', { email: portalEmail, activated: false }, null, 1)[0]
    || filterEntities('PendingAccount', { email: portalEmail }, null, 1)[0];

  if (!tempPassword && pending?.temp_password && !resetPassword) {
    tempPassword = pending.temp_password;
  }

  if (!tempPassword || resetPassword) {
    tempPassword = tempPassword || `Fleet${Math.random().toString(36).slice(2, 8)}!`;
    await createUserAccount(
      {
        email: portalEmail,
        tempPassword,
        role: 'customer_owner',
        customerId: customer.id,
        fullName: customer.contact_name || customer.company_name,
        sendWelcomeEmail: false,
      },
      user
    );
  } else if (!findUserByEmail(portalEmail)) {
    await createUserAccount(
      {
        email: portalEmail,
        tempPassword,
        role: 'customer_owner',
        customerId: customer.id,
        fullName: customer.contact_name || customer.company_name,
        sendWelcomeEmail: false,
      },
      user
    );
  }

  updateEntity('Customer', customer.id, {
    user_id: findUserByEmail(portalEmail)?.id,
    has_portal_login: true,
    portal_login_email: portalEmail,
  });

  const notificationPrefs = getCustomerNotificationPrefs(customer);
  const welcomeEmail = await sendWelcomeSignupEmail({
    to: portalEmail,
    cc,
    bcc,
    companyName: customer.company_name,
    contactName: customer.contact_name,
    tempPassword,
    notificationPrefs,
  });

  let message = `Welcome email processed for ${customer.company_name}.`;
  if (welcomeEmail.success) {
    message = `Welcome email sent to ${portalEmail} with login credentials.`;
  } else if (welcomeEmail.skipped) {
    message += ' (Email skipped — RESEND_API_KEY not configured on server.)';
  } else if (welcomeEmail.error) {
    message += ` (Email failed: ${welcomeEmail.error}${welcomeEmail.hint ? ` — ${welcomeEmail.hint}` : ''})`;
  }

  return {
    success: true,
    email: portalEmail,
    tempPassword,
    welcomeEmail,
    message,
  };
}

function getCustomerNotificationPrefsForUser(user) {
  if (!user?.customer_id) {
    throw new Error('Only customer portal users can view notification preferences');
  }
  const customer = getEntity('Customer', user.customer_id);
  if (!customer) throw new Error('Customer organization not found');
  return { success: true, notification_prefs: getCustomerNotificationPrefs(customer) };
}

function updateCustomerNotificationPrefs(body, user) {
  if (!user?.customer_id) {
    throw new Error('Only customer portal users can update notification preferences');
  }
  const customer = getEntity('Customer', user.customer_id);
  if (!customer) throw new Error('Customer organization not found');

  const prefs = normalizeNotificationPrefs({
    ...getCustomerNotificationPrefs(customer),
    ...(body.prefs || {}),
  });
  updateEntity('Customer', customer.id, { notification_prefs: prefs });
  return { success: true, notification_prefs: prefs };
}

async function sendNotification(body) {
  const { type, entityId } = body;
  const prefKey = NOTIFICATION_TYPE_TO_PREF[type];
  const { sendEmail } = await import('./email.js');

  if (type === 'load_assigned') {
    const load = getEntity('Load', entityId);
    if (!load) throw new Error('Load not found');

    let recipientEmail = null;
    let recipientName = '';
    let customer = load.customer_id ? getEntity('Customer', load.customer_id) : null;

    if (load.assigned_driver_id) {
      const driver = findUserById(load.assigned_driver_id);
      if (driver?.email) {
        recipientEmail = driver.email;
        recipientName = driver.full_name || driver.email;
        if (!customer && driver.customer_id) {
          customer = getEntity('Customer', driver.customer_id);
        }
      }
    }
    if (!recipientEmail && customer?.email) {
      recipientEmail = customer.email;
      recipientName = customer.contact_name || customer.company_name;
    }
    if (!recipientEmail) {
      return { success: true, skipped: true, reason: 'No recipient email found for this load' };
    }
    if (customer && prefKey && !shouldSendCustomerNotification(customer, prefKey)) {
      return { success: true, skipped: true, reason: 'Customer opted out of load update emails' };
    }

    const route = `${load.origin_city || '?'}, ${load.origin_state || ''} → ${load.destination_city || '?'}, ${load.destination_state || ''}`.trim();
    const subject = `Load ${load.load_number} — assignment update`;
    const text = [
      `Hi ${recipientName || 'there'},`,
      '',
      `Load ${load.load_number} has been updated.`,
      `Route: ${route}`,
      `Status: ${load.status || 'updated'}`,
      '',
      `View in portal: ${process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org'}/portal/load-board`,
    ].join('\n');
    const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px"><p>${text.replace(/\n/g, '<br/>')}</p></div>`;
    return sendEmail({ to: recipientEmail, subject, html, text });
  }

  if (type === 'invoice_sent') {
    const invoice = getEntity('Invoice', entityId);
    if (!invoice) throw new Error('Invoice not found');
    const customer = invoice.customer_id ? getEntity('Customer', invoice.customer_id) : null;
    if (!customer?.email) {
      return { success: true, skipped: true, reason: 'Customer has no email on file' };
    }
    if (prefKey && !shouldSendCustomerNotification(customer, prefKey)) {
      return { success: true, skipped: true, reason: 'Customer opted out of invoice notices' };
    }

    const amount = invoice.amount != null ? `$${Number(invoice.amount).toLocaleString()}` : '—';
    const subject = `Invoice ${invoice.invoice_number} from FleetCo Management`;
    const text = [
      `Hi ${customer.contact_name || customer.company_name},`,
      '',
      `Invoice ${invoice.invoice_number} is ready.`,
      `Amount: ${amount}`,
      invoice.description ? `Description: ${invoice.description}` : '',
      invoice.due_date ? `Due date: ${invoice.due_date}` : '',
      '',
      `View in portal: ${process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org'}/portal/invoices`,
    ].filter(Boolean).join('\n');
    const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px"><p>${text.replace(/\n/g, '<br/>')}</p></div>`;
    return sendEmail({ to: customer.email, subject, html, text });
  }

  console.log('[notification]', body);
  return { success: true };
}

function getEmailConfig(user) {
  if (!user || !['owner', 'executive'].includes(user.role)) {
    throw new Error('Only owner or executive can view email configuration');
  }
  return { success: true, ...getEmailConfigStatus() };
}

async function testEmailConfig(body, user) {
  if (!user || !['owner', 'executive'].includes(user.role)) {
    throw new Error('Only owner or executive can send test emails');
  }
  const to = body.to || user.email;
  if (!to) throw new Error('Recipient email required');

  const result = await sendEmailDirect({
    to,
    subject: 'FleetCo Management — email test',
    html: '<p>This is a test email from FleetCo Management. If you received it, your Resend API key and sender address are configured correctly.</p>',
    text: 'This is a test email from FleetCo Management. If you received it, your Resend API key and sender address are configured correctly.',
  });

  return {
    ...result,
    config: getEmailConfigStatus(),
    to,
  };
}

function customersForUser(user) {
  const all = listEntities('Customer');
  if (!user) return [];
  if (['owner', 'executive'].includes(user.role)) return all;
  if (user.role === 'fleet_manager') {
    return all.filter((c) => c.assigned_manager_id === user.id);
  }
  if (user.role === 'fleet_coordinator') {
    return all.filter((c) => c.assigned_coordinator_id === user.id);
  }
  if (user.customer_id) {
    return all.filter((c) => c.id === user.customer_id);
  }
  return [];
}

function buildAlertRow(customer) {
  const billing = getBillingSnapshot(customer);
  if (!billing || billing.status === 'current') return null;
  return {
    customerId: customer.id,
    companyName: customer.company_name,
    contactName: customer.contact_name,
    email: customer.email,
    status: billing.status,
    daysUntilDue: billing.daysUntilDue,
    dueAt: billing.dueAt,
    amount: billing.amount,
    term: billing.term,
    plan: billing.plan,
    systemPaused: billing.isPaused,
    countdown: formatCountdown(billing.daysUntilDue),
    canPause: billing.canPause,
  };
}

function syncPaymentReminders(customers, actingUser) {
  const today = new Date().toISOString().slice(0, 10);
  const created = [];

  for (const customer of customers) {
    const billing = getBillingSnapshot(customer);
    if (!billing?.dueAt) continue;

    const type = reminderTypeForDays(billing.daysUntilDue);
    if (!type && !billing.isPaused) continue;

    const reminderKey = `${customer.id}_${type || 'paused'}_${today}`;
    const existing = filterEntities('PaymentReminder', { reminder_key: reminderKey }, null, 1)[0];
    if (existing) continue;

    const message = billing.isPaused
      ? `${customer.company_name} portal is paused — subscription payment required.`
      : `${customer.company_name}: ${formatCountdown(billing.daysUntilDue)} ($${billing.amount?.toLocaleString() || '—'}/${billing.term === 'yearly' ? 'yr' : 'mo'}).`;

    const targets = listUsers().filter((u) => {
      if (['owner', 'executive'].includes(u.role)) return true;
      if (u.role === 'fleet_manager' && customer.assigned_manager_id === u.id) return true;
      if (u.role === 'fleet_coordinator' && customer.assigned_coordinator_id === u.id) return true;
      if (u.customer_id === customer.id) return true;
      return false;
    });

    for (const target of targets) {
      created.push(createEntity('PaymentReminder', {
        reminder_key: reminderKey,
        customer_id: customer.id,
        recipient_user_id: target.id,
        recipient_email: target.email,
        type: billing.isPaused ? 'system_paused' : type,
        message,
        due_at: billing.dueAt,
        days_remaining: billing.daysUntilDue,
        read: false,
        created_by: actingUser?.email || 'system',
      }));
    }
  }

  return created;
}

function getBillingAlerts(body, user) {
  if (!user) throw new Error('Unauthorized');

  const customers = customersForUser(user);
  const alertCustomers = customers.filter((c) => {
    const b = getBillingSnapshot(c);
    return b && (b.status !== 'current' || b.isPaused);
  });

  syncPaymentReminders(alertCustomers.length ? alertCustomers : customers, user);

  const alerts = customers.map(buildAlertRow).filter(Boolean);

  let userBilling = null;
  if (user.customer_id) {
    const customer = getEntity('Customer', user.customer_id);
    userBilling = customer ? { ...getBillingSnapshot(customer), companyName: customer.company_name } : null;
  }

  const reminders = filterEntities('PaymentReminder', { recipient_user_id: user.id, read: false });

  return {
    success: true,
    alerts,
    userBilling,
    reminders: reminders.slice(0, 20),
    unreadCount: reminders.length,
    summary: {
      overdue: alerts.filter((a) => a.status === 'overdue').length,
      dueSoon: alerts.filter((a) => a.status === 'due_soon').length,
      paused: alerts.filter((a) => a.status === 'paused').length,
    },
  };
}

function recordCustomerPayment(body, user) {
  if (!user || !canProvisionCustomers(user.role)) {
    throw new Error('Only FleetCo owner, executive, or fleet managers can record customer payments');
  }

  const { customerId } = body;
  if (!customerId) throw new Error('customerId is required');

  const customer = getEntity('Customer', customerId);
  if (!customer) throw new Error('Customer not found');

  const ts = nowIso();
  const term = customer.subscription_term || 'monthly';
  const nextDue = computeNextDueDate(ts, term);

  updateEntity('Customer', customerId, {
    last_payment_at: ts,
    payment_collected_at: ts,
    next_payment_due_at: nextDue,
    subscription_status: 'active',
    payment_status: 'current',
    system_paused: false,
    paused_at: '',
    paused_by: '',
    pause_reason: '',
  });

  createEntity('Subscription', {
    customer_id: customerId,
    plan: customer.subscription_plan,
    term,
    amount: customer.subscription_amount,
    status: 'active',
    started_at: ts,
    collected_by: user.email,
    type: 'renewal',
  });

  const message = createEntity('Message', {
    conversation_id: `customer_${customerId}`,
    sender_id: user.id,
    sender_name: user.full_name || user.email,
    sender_role: user.role,
    customer_id: customerId,
    text: `Payment received — thank you! Your subscription is active through ${new Date(nextDue).toLocaleDateString()}.`,
  });

  return {
    success: true,
    next_payment_due_at: nextDue,
    message: `Payment recorded for ${customer.company_name}. Next due ${new Date(nextDue).toLocaleDateString()}.`,
    customerMessageId: message.id,
  };
}

function setCustomerPause(body, user) {
  if (!user || !canProvisionCustomers(user.role)) {
    throw new Error('Only FleetCo owner, executive, or fleet managers can pause customer access');
  }

  const { customerId, paused, reason } = body;
  if (!customerId) throw new Error('customerId is required');

  const customer = getEntity('Customer', customerId);
  if (!customer) throw new Error('Customer not found');

  const billing = getBillingSnapshot(customer);
  const shouldPause = paused !== false;

  if (shouldPause && !billing?.canPause && !['owner', 'executive'].includes(user.role)) {
    throw new Error('Customer payment must be due or overdue before pausing portal access');
  }

  const ts = nowIso();
  updateEntity('Customer', customerId, {
    system_paused: shouldPause,
    paused_at: shouldPause ? ts : '',
    paused_by: shouldPause ? user.email : '',
    pause_reason: shouldPause ? (reason || 'Unpaid subscription') : '',
    payment_status: shouldPause ? 'paused' : (billing?.isOverdue ? 'overdue' : 'current'),
  });

  const note = shouldPause
    ? `Portal access paused — ${reason || 'subscription payment overdue'}. Contact FleetCo to restore access.`
    : 'Portal access restored — thank you for your payment.';

  createEntity('Message', {
    conversation_id: `customer_${customerId}`,
    sender_id: user.id,
    sender_name: user.full_name || user.email,
    sender_role: user.role,
    customer_id: customerId,
    text: note,
  });

  syncPaymentReminders([getEntity('Customer', customerId)], user);

  return {
    success: true,
    paused: shouldPause,
    message: shouldPause
      ? `${customer.company_name} portal paused until payment is received.`
      : `${customer.company_name} portal access restored.`,
  };
}

const DASHCAM_MODES = ['view_ahead', 'cabin', 'broll'];
const DASHCAM_INTERVALS = [3, 5, 10, 15];

function assertDriver(user) {
  if (!user) throw new Error('Unauthorized');
  if (user.role !== 'driver') throw new Error('Dashcam recording is for driver accounts only');
}

function startDashcamSession(body, user) {
  assertDriver(user);

  const { mode = 'view_ahead', intervalSec = 5, mountNotes = '', vehicleId = '' } = body;
  if (!DASHCAM_MODES.includes(mode)) {
    throw new Error('mode must be view_ahead, cabin, or broll');
  }
  const interval = Number(intervalSec);
  if (!DASHCAM_INTERVALS.includes(interval) && mode === 'view_ahead') {
    throw new Error('intervalSec must be 3, 5, 10, or 15 for time-lapse');
  }

  const active = filterEntities('DashcamSession', { driver_id: user.id, status: 'recording' }, null, 1)[0];
  if (active) {
    throw new Error('Stop the current recording session before starting a new one');
  }

  const ts = nowIso();
  const session = createEntity('DashcamSession', {
    driver_id: user.id,
    driver_name: user.full_name || user.email,
    customer_id: user.customer_id || '',
    mode,
    interval_sec: mode === 'view_ahead' ? interval : 0,
    mount_notes: mountNotes,
    vehicle_id: vehicleId,
    status: 'recording',
    frame_count: 0,
    started_at: ts,
    ended_at: '',
    safety_acknowledged: true,
  });

  return {
    success: true,
    session,
    message: mode === 'view_ahead'
      ? `View-ahead time-lapse started — 1 frame every ${interval}s (photos only, saves memory).`
      : `${mode.replace('_', ' ')} capture session started.`,
  };
}

function captureDashcamFrame(body, user) {
  assertDriver(user);

  const { sessionId, imageUrl, lat, lng, heading, speed } = body;
  if (!sessionId || !imageUrl) throw new Error('sessionId and imageUrl are required');

  const session = getEntity('DashcamSession', sessionId);
  if (!session) throw new Error('Session not found');
  if (session.driver_id !== user.id) throw new Error('Not your recording session');
  if (session.status !== 'recording') throw new Error('Session is not actively recording');

  const frameIndex = (session.frame_count || 0) + 1;
  const frame = createEntity('DashcamFrame', {
    session_id: sessionId,
    driver_id: user.id,
    customer_id: user.customer_id || '',
    frame_index: frameIndex,
    image_url: imageUrl,
    lat: lat ?? null,
    lng: lng ?? null,
    heading: heading ?? 0,
    speed: speed ?? 0,
    captured_at: nowIso(),
    mode: session.mode,
  });

  updateEntity('DashcamSession', sessionId, { frame_count: frameIndex });

  return { success: true, frame, frameIndex };
}

function stopDashcamSession(body, user) {
  assertDriver(user);

  const { sessionId } = body;
  if (!sessionId) throw new Error('sessionId is required');

  const session = getEntity('DashcamSession', sessionId);
  if (!session) throw new Error('Session not found');
  if (session.driver_id !== user.id && !['owner', 'executive', 'fleet_manager'].includes(user.role)) {
    throw new Error('Not authorized to stop this session');
  }

  const ts = nowIso();
  const updated = updateEntity('DashcamSession', sessionId, {
    status: 'completed',
    ended_at: ts,
  });

  const durationMs = new Date(ts) - new Date(session.started_at);
  const durationMin = Math.round(durationMs / 60000);

  return {
    success: true,
    session: updated,
    message: `Recording saved — ${updated.frame_count} frame(s) over ${durationMin} min. Visible to your fleet office.`,
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

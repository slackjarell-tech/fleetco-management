import bcrypt from 'bcryptjs';
import {
  createEntity,
  createUser,
  getUserRowByEmail,
  findUserByEmail,
  updateEntity,
  nowIso,
} from './db.js';
import { stampCustomerNumber } from './entityNumbers.js';
import {
  requireLoadBoardFeeAcknowledgment,
  recordLoadBoardFeeAcknowledgmentOnCustomer,
} from './loadBoardFeeAcknowledgment.js';
import { BROKER_ACCOUNT_TYPE, BROKER_SUBSCRIPTION_PLAN } from './brokerAccounts.js';
import { defaultSidebarModulesForRole } from './customerRoles.js';
import {
  validateBrokerRegistrationForm,
  brokerCustomerFields,
} from './brokerRegistrationFields.js';

function validatePassword(password) {
  if (!password || String(password).length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
}

export async function registerFreightBroker(body) {
  validateBrokerRegistrationForm(body);
  validatePassword(body.password);
  requireLoadBoardFeeAcknowledgment(body);

  const normalizedEmail = body.email.trim().toLowerCase();
  if (getUserRowByEmail(normalizedEmail)) {
    throw new Error('An account with this email already exists — sign in instead');
  }

  const ts = nowIso();
  const customer = createEntity('Customer', stampCustomerNumber({
    ...brokerCustomerFields(body, normalizedEmail, ts),
    status: 'active',
    account_type: BROKER_ACCOUNT_TYPE,
    billing_model: 'load_board_transaction',
    subscription_plan: BROKER_SUBSCRIPTION_PLAN,
    subscription_term: null,
    subscription_amount: 0,
    subscription_status: 'active',
    payment_status: 'load_board_only',
    system_paused: false,
    has_portal_login: true,
    portal_login_email: normalizedEmail,
  }));

  const hash = bcrypt.hashSync(body.password, 10);
  const user = createUser({
    email: normalizedEmail,
    passwordHash: hash,
    role: 'freight_broker',
    customerId: customer.id,
    fullName: body.contact_name.trim(),
    phone: body.phone.trim(),
    sidebarModules: defaultSidebarModulesForRole('freight_broker'),
  });

  updateEntity('Customer', customer.id, { user_id: user.id });
  updateEntity('User', user.id, {
    load_board_fee_acknowledged_at: ts,
    load_board_fee_acknowledged_source: 'broker_signup',
  });
  recordLoadBoardFeeAcknowledgmentOnCustomer(customer.id, { source: 'broker_signup' });

  createEntity('BrokerApplication', {
    company_name: customer.company_name,
    contact_name: customer.contact_name,
    email: normalizedEmail,
    phone: customer.phone,
    mc_number: customer.mc_number,
    dot_number: customer.dot_number,
    loads_per_week: customer.loads_per_week,
    equipment_types: customer.equipment_types,
    message: customer.business_notes || 'Self-service broker signup',
    status: 'approved',
    customer_id: customer.id,
    load_board_fee_acknowledged: true,
    load_board_fee_acknowledged_at: ts,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
  });

  return {
    success: true,
    user: findUserByEmail(normalizedEmail),
    customer,
    message: 'Broker account created. Post loads free — pay the 3.5% platform fee only when freight moves.',
  };
}

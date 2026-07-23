import { filterEntities, getEntity, listEntities } from './db.js';
import { getBillingSnapshot } from './billing.js';
import {
  createStripePortalSessionForCustomerId,
  fetchStripePaymentsForCustomer,
  getStripeConfigStatus,
  stripeDashboardUrls,
  stripeResourceUrl,
} from './stripeBilling.js';

export const SLT_BILLING_ROLES = new Set(['owner', 'executive', 'fleet_manager']);

export function assertSltBillingAccess(user) {
  if (!user || !SLT_BILLING_ROLES.has(user.role)) {
    throw new Error('SLT access required (owner, executive, or fleet manager)');
  }
}

function monthlyRevenueAmount(customer) {
  const amount = Number(customer.subscription_amount) || 0;
  if (!amount) return 0;
  const term = (customer.subscription_term || 'monthly').toLowerCase();
  if (term === 'yearly') return Math.round((amount / 12) * 100) / 100;
  return amount;
}

function recentLocalPayments(customerId, limit = 8) {
  return filterEntities('Subscription', { customer_id: customerId })
    .sort((a, b) => String(b.started_at || '').localeCompare(String(a.started_at || '')))
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      amount: s.amount,
      plan: s.plan,
      term: s.term,
      status: s.status,
      started_at: s.started_at,
      collected_by: s.collected_by,
      type: s.type,
    }));
}

export function getSltBillingDashboard(user) {
  assertSltBillingAccess(user);

  const customers = listEntities('Customer').sort((a, b) =>
    String(a.company_name || '').localeCompare(String(b.company_name || '')),
  );

  let mrr = 0;
  let activeCount = 0;
  let stripeLinked = 0;
  let overdueCount = 0;

  const rows = customers.map((c) => {
    const billing = getBillingSnapshot(c);
    const isActive = (c.subscription_status || '').toLowerCase() === 'active' && !c.system_paused;
    if (isActive) {
      activeCount += 1;
      mrr += monthlyRevenueAmount(c);
    }
    if (c.stripe_customer_id) stripeLinked += 1;
    if (billing?.status === 'overdue' || billing?.isPaused) overdueCount += 1;

    return {
      id: c.id,
      company_name: c.company_name,
      contact_name: c.contact_name,
      email: c.email,
      subscription_plan: c.subscription_plan,
      subscription_term: c.subscription_term,
      subscription_amount: c.subscription_amount,
      subscription_status: c.subscription_status,
      payment_status: c.payment_status,
      system_paused: !!c.system_paused,
      billing,
      last_payment_at: c.last_payment_at || c.payment_collected_at,
      next_payment_due_at: c.next_payment_due_at,
      stripe_customer_id: c.stripe_customer_id || null,
      stripe_subscription_id: c.stripe_subscription_id || null,
      stripe_customer_url: stripeResourceUrl('customer', c.stripe_customer_id),
      stripe_subscription_url: stripeResourceUrl('subscription', c.stripe_subscription_id),
      recent_payments: recentLocalPayments(c.id, 5),
    };
  });

  return {
    success: true,
    stripe: getStripeConfigStatus(),
    dashboard: stripeDashboardUrls(),
    summary: {
      customerCount: customers.length,
      activeSubscriptions: activeCount,
      estimatedMrr: Math.round(mrr * 100) / 100,
      stripeLinked,
      overdueOrPaused: overdueCount,
    },
    customers: rows,
  };
}

export async function getSltCustomerBillingDetail(user, customerId) {
  assertSltBillingAccess(user);
  if (!customerId) throw new Error('customerId is required');

  const customer = getEntity('Customer', customerId);
  if (!customer) throw new Error('Customer not found');

  const billing = getBillingSnapshot(customer);
  let stripeActivity = { invoices: [], charges: [], subscription: null };
  if (getStripeConfigStatus().configured) {
    try {
      stripeActivity = await fetchStripePaymentsForCustomer(customer, { limit: 24 });
    } catch (err) {
      stripeActivity = { ...stripeActivity, error: err.message };
    }
  }

  return {
    success: true,
    customer: {
      id: customer.id,
      company_name: customer.company_name,
      email: customer.email,
      subscription_plan: customer.subscription_plan,
      subscription_term: customer.subscription_term,
      subscription_amount: customer.subscription_amount,
      subscription_status: customer.subscription_status,
      payment_status: customer.payment_status,
      stripe_customer_id: customer.stripe_customer_id,
      stripe_subscription_id: customer.stripe_subscription_id,
      stripe_customer_url: stripeResourceUrl('customer', customer.stripe_customer_id),
      stripe_subscription_url: stripeResourceUrl('subscription', customer.stripe_subscription_id),
    },
    billing,
    local_payments: recentLocalPayments(customer.id, 24),
    stripe: stripeActivity,
    dashboard: stripeDashboardUrls(),
  };
}

export async function createSltCustomerPortalSession(user, customerId) {
  assertSltBillingAccess(user);
  if (!customerId) throw new Error('customerId is required');

  const origin = (process.env.APP_ORIGIN || process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org').replace(/\/$/, '');
  return createStripePortalSessionForCustomerId(customerId, {
    returnUrl: `${origin}/portal/slt-billing`,
  });
}

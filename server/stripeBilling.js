import Stripe from 'stripe';
import {
  createEntity,
  filterEntities,
  getEntity,
  listEntities,
  nowIso,
  updateEntity,
} from './db.js';
import { computeNextDueDate } from './billing.js';
import { subscriptionAmount as calcSubscriptionAmount, SUBSCRIPTION_PLANS } from './roles.js';

let stripeClient = null;

export function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return null;
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}

export function getStripeConfigStatus() {
  const configured = !!getStripe();
  return {
    configured,
    publishableKey: (process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim() || null,
    webhookConfigured: !!(process.env.STRIPE_WEBHOOK_SECRET || '').trim(),
  };
}

/** Resolve Stripe Price ID from env or marketing defaults */
export function resolveStripePriceId(planName, billingTerm = 'monthly') {
  const plan = (planName || 'Starter').replace(/\s+/g, '');
  const term = billingTerm === 'yearly' ? 'yearly' : 'monthly';
  const envKey = `STRIPE_PRICE_${plan.toUpperCase()}_${term.toUpperCase()}`;
  const fromEnv = (process.env[envKey] || '').trim();
  if (fromEnv) return fromEnv;

  const defaults = {
    'Starter-monthly': 'price_1TeONARdSUUW62RaxuR5Q5RA',
    'Growth-monthly': 'price_1TeONARdSUUW62RaCIqcHhVB',
  };
  return defaults[`${plan}-${term}`] || null;
}

function appOrigin() {
  return (process.env.APP_ORIGIN || process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org').replace(/\/$/, '');
}

async function ensureStripeCustomer(customerRecord) {
  const stripe = getStripe();
  if (!stripe || !customerRecord) return null;

  if (customerRecord.stripe_customer_id) {
    return customerRecord.stripe_customer_id;
  }

  const sc = await stripe.customers.create({
    email: customerRecord.email || undefined,
    name: customerRecord.company_name || customerRecord.contact_name,
    metadata: { fleetco_customer_id: customerRecord.id },
  });

  updateEntity('Customer', customerRecord.id, { stripe_customer_id: sc.id });
  return sc.id;
}

export function activateCustomerSubscription(customerId, { plan, term, stripeSubscriptionId, stripeCustomerId, amount }) {
  const customer = getEntity('Customer', customerId);
  if (!customer) return null;

  const ts = nowIso();
  const subscriptionPlan = plan || customer.subscription_plan || 'Starter';
  const subscriptionTerm = term || customer.subscription_term || 'monthly';
  const subscriptionAmountValue =
    amount ??
    calcSubscriptionAmount(subscriptionPlan, subscriptionTerm) ??
    customer.subscription_amount ??
    SUBSCRIPTION_PLANS[subscriptionPlan]?.monthly;

  const nextDue = computeNextDueDate(ts, subscriptionTerm);

  const updated = updateEntity('Customer', customerId, {
    subscription_plan: subscriptionPlan,
    subscription_term: subscriptionTerm,
    subscription_amount: typeof subscriptionAmountValue === 'number' ? subscriptionAmountValue : customer.subscription_amount,
    subscription_status: 'active',
    payment_status: 'current',
    system_paused: false,
    paused_at: '',
    paused_by: '',
    pause_reason: '',
    payment_collected_at: ts,
    last_payment_at: ts,
    next_payment_due_at: nextDue,
    stripe_customer_id: stripeCustomerId || customer.stripe_customer_id || '',
    stripe_subscription_id: stripeSubscriptionId || customer.stripe_subscription_id || '',
  });

  createEntity('Subscription', {
    customer_id: customerId,
    plan: subscriptionPlan,
    term: subscriptionTerm,
    amount: subscriptionAmountValue,
    status: 'active',
    started_at: ts,
    collected_by: 'stripe',
    type: 'stripe_checkout',
  });

  return updated;
}

function findCustomerIdFromMetadata(meta = {}) {
  if (meta.customer_id) return meta.customer_id;
  if (meta.fleetco_customer_id) return meta.fleetco_customer_id;
  return '';
}

async function resolveCustomerFromStripeObject(obj) {
  const meta = obj.metadata || {};
  let customerId = findCustomerIdFromMetadata(meta);
  if (customerId) return getEntity('Customer', customerId);

  const stripeCustomerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id;
  if (stripeCustomerId) {
    const match = listEntities('Customer').find((c) => c.stripe_customer_id === stripeCustomerId);
    if (match) return match;
  }

  const email = obj.customer_email || obj.customer_details?.email || meta.email;
  if (email) {
    const byEmail = filterEntities('Customer', { email: email.trim().toLowerCase() }, null, 1)[0];
    if (byEmail) return byEmail;
  }

  return null;
}

export async function createStripeCheckoutSession({
  planName,
  billingTerm = 'monthly',
  priceId,
  user,
  customerId,
  email,
}) {
  const stripe = getStripe();
  if (!stripe) return null;

  const term = billingTerm === 'yearly' ? 'yearly' : 'monthly';
  const plan = planName || 'Starter';
  const price = priceId || resolveStripePriceId(plan, term);
  if (!price) {
    throw new Error(`Stripe price not configured for ${plan} (${term}). Set STRIPE_PRICE_${plan.toUpperCase()}_${term.toUpperCase()} in environment.`);
  }

  const origin = appOrigin();
  let stripeCustomerId = null;
  let fleetCustomerId = customerId || user?.customer_id || '';

  if (fleetCustomerId) {
    const record = getEntity('Customer', fleetCustomerId);
    if (record) stripeCustomerId = await ensureStripeCustomer(record);
  }

  const sessionParams = {
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/portal/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      customer_id: fleetCustomerId,
      plan_name: plan,
      billing_term: term,
      user_id: user?.id || '',
    },
    subscription_data: {
      metadata: {
        customer_id: fleetCustomerId,
        plan_name: plan,
        billing_term: term,
      },
    },
  };

  if (stripeCustomerId) {
    sessionParams.customer = stripeCustomerId;
  } else {
    sessionParams.customer_email = (email || user?.email || '').trim() || undefined;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { url: session.url, sessionId: session.id, provider: 'stripe' };
}

export async function createStripePortalSession(user) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured on the server (STRIPE_SECRET_KEY)');

  if (!user?.customer_id) {
    throw new Error('Only customer portal accounts can manage subscription billing');
  }

  const customer = getEntity('Customer', user.customer_id);
  if (!customer) throw new Error('Customer organization not found');

  const stripeCustomerId = await ensureStripeCustomer(customer);
  const portal = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appOrigin()}/portal/billing`,
  });

  return { url: portal.url, provider: 'stripe' };
}

export async function getCustomerBillingOverview(user) {
  if (!user?.customer_id) {
    throw new Error('Customer account required');
  }
  const customer = getEntity('Customer', user.customer_id);
  if (!customer) throw new Error('Customer not found');

  const stripe = getStripeConfigStatus();
  return {
    success: true,
    customer: {
      company_name: customer.company_name,
      subscription_plan: customer.subscription_plan,
      subscription_term: customer.subscription_term,
      subscription_amount: customer.subscription_amount,
      subscription_status: customer.subscription_status,
      payment_status: customer.payment_status,
      system_paused: customer.system_paused,
      next_payment_due_at: customer.next_payment_due_at,
      last_payment_at: customer.last_payment_at,
      stripe_customer_id: customer.stripe_customer_id ? 'connected' : null,
      stripe_subscription_id: customer.stripe_subscription_id ? 'active' : null,
    },
    stripe,
  };
}

export async function syncCheckoutSession(sessionId, user) {
  const stripe = getStripe();
  if (!stripe || !sessionId) return { success: false, skipped: true };

  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return { success: false, error: 'Checkout not completed yet' };
  }

  let customer = await resolveCustomerFromStripeObject(session);
  if (!customer && user?.customer_id) {
    customer = getEntity('Customer', user.customer_id);
  }

  if (!customer) {
    return { success: false, error: 'No customer record linked to this payment yet. Contact FleetCo support with your receipt email.' };
  }

  const plan = session.metadata?.plan_name || customer.subscription_plan || 'Starter';
  const term = session.metadata?.billing_term || customer.subscription_term || 'monthly';
  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

  activateCustomerSubscription(customer.id, {
    plan,
    term,
    stripeSubscriptionId: subId,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
    amount: calcSubscriptionAmount(plan, term),
  });

  return { success: true, customerId: customer.id };
}

export async function handleStripeWebhook(rawBody, signature) {
  const stripe = getStripe();
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!stripe || !secret) {
    throw new Error('Stripe webhook not configured');
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customer = await resolveCustomerFromStripeObject(session);
    if (customer) {
      const plan = session.metadata?.plan_name || customer.subscription_plan;
      const term = session.metadata?.billing_term || customer.subscription_term;
      activateCustomerSubscription(customer.id, {
        plan,
        term,
        stripeSubscriptionId: session.subscription,
        stripeCustomerId: session.customer,
        amount: calcSubscriptionAmount(plan, term),
      });
    }
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    const customer = await resolveCustomerFromStripeObject(invoice);
    if (customer) {
      const ts = nowIso();
      const term = customer.subscription_term || 'monthly';
      updateEntity('Customer', customer.id, {
        last_payment_at: ts,
        payment_collected_at: ts,
        next_payment_due_at: computeNextDueDate(ts, term),
        subscription_status: 'active',
        payment_status: 'current',
        system_paused: false,
      });
      createEntity('Subscription', {
        customer_id: customer.id,
        plan: customer.subscription_plan,
        term,
        amount: customer.subscription_amount,
        status: 'active',
        started_at: ts,
        collected_by: 'stripe_invoice',
        type: 'renewal',
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const customer = await resolveCustomerFromStripeObject(sub);
    if (customer) {
      updateEntity('Customer', customer.id, {
        subscription_status: 'cancelled',
        payment_status: 'cancelled',
      });
    }
  }

  return { received: true, type: event.type };
}

export async function createCheckoutWithFallback(body, user) {
  const planName = body.planName || body.plan || 'Starter';
  const billingTerm = body.billingTerm === 'yearly' ? 'yearly' : 'monthly';

  try {
    const stripeResult = await createStripeCheckoutSession({
      planName,
      billingTerm,
      priceId: body.priceId,
      user,
      customerId: body.customerId,
      email: body.email,
    });
    if (stripeResult?.url) {
      return { ...stripeResult, message: 'Redirecting to secure Stripe checkout' };
    }
  } catch (err) {
    if (getStripe()) throw err;
  }

  const origin = appOrigin();
  return {
    url: `${origin}/register?plan=${encodeURIComponent(planName)}&term=${billingTerm}`,
    message: 'Stripe not configured — complete registration; FleetCo will activate billing manually',
    provider: 'register_fallback',
  };
}

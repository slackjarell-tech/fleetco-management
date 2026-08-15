/**
 * Stripe Connect carrier payouts — charge broker card on delivery, transfer to carrier.
 * Requires STRIPE_CONNECT_ENABLED=true and broker card + carrier Connect onboarding.
 */
import { getStripe, ensureStripeCustomer } from './stripeBilling.js';
import { getEntity, updateEntity, listEntities, nowIso } from './db.js';
import { sendEmail } from './email.js';

const APP_URL = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';

export function isCarrierPayoutEnabled() {
  return process.env.STRIPE_CONNECT_ENABLED === 'true' && !!getStripe();
}

export async function syncBrokerCardFromSetupSession(session) {
  const stripe = getStripe();
  if (!stripe || !session) return { success: false, skipped: true };

  const customerId = session.metadata?.customer_id;
  if (!customerId || session.metadata?.setup_type !== 'broker_load_board') {
    return { success: false, skipped: true };
  }

  const customer = getEntity('Customer', customerId);
  if (!customer) return { success: false, error: 'customer_not_found' };

  const setupIntentId = typeof session.setup_intent === 'string'
    ? session.setup_intent
    : session.setup_intent?.id;
  if (!setupIntentId) return { success: false, error: 'no_setup_intent' };

  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
  const paymentMethodId = setupIntent.payment_method;
  if (!paymentMethodId) return { success: false, error: 'no_payment_method' };

  const stripeCustomerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id;

  if (stripeCustomerId) {
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  updateEntity('Customer', customerId, {
    broker_default_payment_method_id: paymentMethodId,
    broker_card_on_file_at: nowIso(),
    stripe_customer_id: stripeCustomerId || customer.stripe_customer_id,
  });

  return { success: true, customerId, paymentMethodId };
}

export async function getBrokerPaymentMethodId(customer) {
  if (!customer) return null;
  if (customer.broker_default_payment_method_id) return customer.broker_default_payment_method_id;

  const stripe = getStripe();
  if (!stripe || !customer.stripe_customer_id) return null;

  const sc = await stripe.customers.retrieve(customer.stripe_customer_id);
  return sc.invoice_settings?.default_payment_method || sc.default_source || null;
}

export async function createCarrierConnectOnboarding(user) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');
  if (!user?.customer_id) throw new Error('Customer account required');
  if (user.role === 'freight_broker') {
    throw new Error('Brokers receive carrier payouts — fleet customers connect payout accounts');
  }

  const customer = getEntity('Customer', user.customer_id);
  if (!customer) throw new Error('Customer not found');

  let accountId = customer.stripe_connect_account_id;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'company',
      metadata: {
        fleetco_customer_id: customer.id,
      },
    });
    accountId = account.id;
    updateEntity('Customer', customer.id, {
      stripe_connect_account_id: accountId,
    });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}/portal/billing?connect=refresh`,
    return_url: `${APP_URL}/portal/billing?connect=success`,
    type: 'account_onboarding',
  });

  return { success: true, url: link.url, accountId };
}

export async function getCarrierConnectStatus(user) {
  const stripe = getStripe();
  if (!user?.customer_id) return { enabled: false, onboarded: false };

  const customer = getEntity('Customer', user.customer_id);
  if (!customer?.stripe_connect_account_id || !stripe) {
    return {
      enabled: isCarrierPayoutEnabled(),
      onboarded: false,
      accountId: customer?.stripe_connect_account_id || null,
    };
  }

  const account = await stripe.accounts.retrieve(customer.stripe_connect_account_id);
  const onboarded = account.charges_enabled && account.payouts_enabled;

  if (onboarded && !customer.stripe_connect_onboarded) {
    updateEntity('Customer', customer.id, { stripe_connect_onboarded: true });
  }

  return {
    enabled: isCarrierPayoutEnabled(),
    onboarded,
    accountId: account.id,
    detailsSubmitted: account.details_submitted,
  };
}

function brokerUsersForCustomer(customerId) {
  return listEntities('User').filter((u) => u.customer_id === customerId && u.email);
}

async function notifyBrokerPayoutResult(load, { success, message, amount }) {
  const brokerCustomer = getEntity('Customer', load.customer_id);
  const emails = brokerUsersForCustomer(load.customer_id).map((u) => u.email).filter(Boolean);
  if (!emails.length && brokerCustomer?.contact_email) emails.push(brokerCustomer.contact_email);
  if (!emails.length) return;

  const subject = success
    ? `Carrier payment sent — Load #${load.load_number}`
    : `Carrier payment failed — Load #${load.load_number}`;

  const html = `
    <p>${success ? 'FleetCo charged your card on file and initiated carrier payout.' : 'FleetCo could not auto-pay the carrier for this load.'}</p>
    <p><strong>Load #${load.load_number}</strong> · $${(amount || 0).toFixed(2)}</p>
    <p>${message || ''}</p>
    <p><a href="${APP_URL}/portal/loads">Open Load Board</a></p>
  `;

  await sendEmail({ to: emails, subject, html, text: `${subject}\n${message}\n${APP_URL}/portal/loads` });
}

export async function attemptCarrierPayoutOnDelivery(load) {
  if (!isCarrierPayoutEnabled()) {
    return { attempted: false, mode: 'manual', reason: 'connect_disabled' };
  }

  const stripe = getStripe();
  const brokerCustomer = getEntity('Customer', load.customer_id);
  const carrierCustomerId = load.booked_by_customer_id || load.assigned_customer_id;
  const carrierCustomer = carrierCustomerId ? getEntity('Customer', carrierCustomerId) : null;

  const amount = Number(load.carrier_payout_amount ?? load.rate) || 0;
  if (!amount) return { attempted: false, reason: 'no_amount' };

  const paymentMethodId = await getBrokerPaymentMethodId(brokerCustomer);
  if (!paymentMethodId || !brokerCustomer?.stripe_customer_id) {
    return { attempted: false, mode: 'manual', reason: 'broker_no_card' };
  }

  if (!carrierCustomer?.stripe_connect_account_id) {
    return { attempted: false, mode: 'manual', reason: 'carrier_not_connected' };
  }

  const account = await stripe.accounts.retrieve(carrierCustomer.stripe_connect_account_id);
  if (!account.payouts_enabled) {
    return { attempted: false, mode: 'manual', reason: 'carrier_not_onboarded' };
  }

  const amountCents = Math.round(amount * 100);
  if (amountCents < 50) return { attempted: false, reason: 'amount_too_small' };

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: brokerCustomer.stripe_customer_id,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `FleetCo carrier payout — Load #${load.load_number}`,
      transfer_data: {
        destination: carrierCustomer.stripe_connect_account_id,
      },
      metadata: {
        load_id: load.id,
        payout_type: 'carrier_haul_pay',
        load_number: load.load_number || '',
      },
    });

    const patch = {
      carrier_stripe_payment_intent_id: intent.id,
      carrier_payment_auto_attempted_at: nowIso(),
    };

    if (intent.status === 'succeeded') {
      patch.carrier_payment_status = 'sent';
      patch.carrier_payment_sent_at = nowIso();
      patch.carrier_payment_sent_notes = 'Auto-paid via Stripe Connect on delivery';
      patch.carrier_payment_method = 'stripe_connect';
    } else {
      patch.carrier_payment_status = 'pending';
      patch.carrier_payment_stripe_status = intent.status;
    }

    updateEntity('Load', load.id, patch);

    notifyBrokerPayoutResult(load, {
      success: intent.status === 'succeeded',
      message: intent.status === 'succeeded'
        ? 'Payment transferred to carrier Connect account.'
        : `Payment status: ${intent.status}. Mark paid manually if needed.`,
      amount,
    }).catch(() => {});

    return { attempted: true, success: intent.status === 'succeeded', intentId: intent.id, status: intent.status };
  } catch (err) {
    updateEntity('Load', load.id, {
      carrier_payment_auto_attempted_at: nowIso(),
      carrier_payment_auto_error: err.message?.slice(0, 500) || 'charge_failed',
    });
    notifyBrokerPayoutResult(load, {
      success: false,
      message: err.message || 'Card charge failed. Pay carrier manually and mark paid on the load board.',
      amount,
    }).catch(() => {});
    return { attempted: true, success: false, error: err.message };
  }
}

export async function handleCarrierPayoutStripeEvent(event) {
  const stripe = getStripe();
  if (!stripe) return { handled: false };

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode === 'setup') {
      return { ...(await syncBrokerCardFromSetupSession(session)), handled: true };
    }
    if (session.metadata?.fee_type === 'load_platform_fee') {
      const loadId = session.metadata.load_id;
      if (loadId) {
        updateEntity('Load', loadId, {
          platform_fee_status: 'paid',
          platform_fee_paid_at: nowIso(),
          platform_fee_checkout_session_id: session.id,
        });
      }
      return { handled: true, type: 'load_platform_fee' };
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    if (intent.metadata?.payout_type !== 'carrier_haul_pay') return { handled: false };
    const loadId = intent.metadata.load_id;
    if (!loadId) return { handled: false };

    updateEntity('Load', loadId, {
      carrier_payment_status: 'sent',
      carrier_payment_sent_at: nowIso(),
      carrier_payment_method: 'stripe_connect',
      carrier_stripe_payment_intent_id: intent.id,
    });
    return { handled: true, type: 'carrier_payout' };
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    if (intent.metadata?.payout_type !== 'carrier_haul_pay') return { handled: false };
    const loadId = intent.metadata.load_id;
    if (loadId) {
      updateEntity('Load', loadId, {
        carrier_payment_auto_error: intent.last_payment_error?.message || 'payment_failed',
      });
    }
    return { handled: true, type: 'carrier_payout_failed' };
  }

  return { handled: false };
}

export async function getBrokerPaymentCompliance(user) {
  const { brokerHasBlockingPaymentIssues, countOverdueBrokerLoads } = await import('./loadCarrierPayments.js');
  const blocked = brokerHasBlockingPaymentIssues(user?.customer_id);
  const overdueCount = countOverdueBrokerLoads(user?.customer_id);

  let brokerCard = false;
  if (user?.customer_id) {
    const customer = getEntity('Customer', user.customer_id);
    brokerCard = !!(customer?.broker_default_payment_method_id || customer?.broker_card_on_file_at);
    if (!brokerCard && customer) {
      brokerCard = !!(await getBrokerPaymentMethodId(customer));
    }
  }

  return {
    canPostLoads: !blocked,
    blockedReason: blocked
      ? 'Resolve overdue or disputed carrier payments before posting new loads.'
      : null,
    overdueCount,
    brokerCardOnFile: brokerCard,
    autoPayoutEnabled: isCarrierPayoutEnabled(),
  };
}

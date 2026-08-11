import { getStripe, getStripeConfigStatus } from './stripeBilling.js';
import { getEntity, updateEntity } from './db.js';
import { PLATFORM_FEE_PERCENT } from './loadMarketplace.js';

/**
 * Stripe Connect scaffold for load marketplace fees.
 * Requires STRIPE_CONNECT_ENABLED=true and platform Stripe Connect setup.
 */
export function getConnectConfigStatus() {
  const stripe = getStripeConfigStatus();
  const connectEnabled = process.env.STRIPE_CONNECT_ENABLED === 'true';
  return {
    ...stripe,
    connectEnabled,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    ready: stripe.configured && connectEnabled,
  };
}

export async function createLoadPlatformFeeSession(user, { loadId }) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');
  if (process.env.STRIPE_CONNECT_ENABLED !== 'true') {
    return {
      success: false,
      mode: 'manual',
      message: 'Stripe Connect is not enabled. Platform fee recorded as pending for manual settlement.',
    };
  }

  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');
  const rate = Number(load.rate) || 0;
  if (!rate) throw new Error('Load has no rate — cannot calculate platform fee');

  const feeAmount = Math.round(rate * PLATFORM_FEE_PERCENT);
  const appUrl = process.env.PUBLIC_APP_URL || 'https://fleetcomanagement.org';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: feeAmount,
        product_data: {
          name: `FleetCo load fee — #${load.load_number}`,
          description: `${PLATFORM_FEE_PERCENT}% platform fee on $${rate.toLocaleString()} load revenue`,
        },
      },
      quantity: 1,
    }],
    metadata: {
      load_id: loadId,
      fee_type: 'load_platform_fee',
    },
    success_url: `${appUrl}/portal/loads?fee=success&load=${loadId}`,
    cancel_url: `${appUrl}/portal/loads?fee=cancel&load=${loadId}`,
  });

  updateEntity('Load', loadId, {
    platform_fee_checkout_session_id: session.id,
    platform_fee_status: 'checkout_started',
  });

  return { success: true, url: session.url, sessionId: session.id, feeAmountCents: feeAmount };
}

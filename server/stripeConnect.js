import { getStripe, getStripeConfigStatus } from './stripeBilling.js';
import { getEntity, updateEntity } from './db.js';
import { computeLoadFinancials, POSTER_FEE_PERCENT, CARRIER_FEE_PERCENT, PLATFORM_FEE_PERCENT } from './loadMarketplaceFinance.js';

function resolveFeeParty(user, load) {
  if (user.customer_id && load.customer_id && user.customer_id === load.customer_id) return 'poster';
  const carrierId = load.booked_by_customer_id || load.assigned_customer_id;
  if (user.customer_id && carrierId && user.customer_id === carrierId) return 'carrier';
  if (load.booked_by_user_id === user.id) return 'carrier';
  return 'poster';
}

/**
 * Stripe Connect scaffold for load marketplace fees.
 * Each party pays their platform fee share when settling (poster 3.5%, carrier 1.5%).
 */
export function getConnectConfigStatus() {
  const stripe = getStripeConfigStatus();
  const connectEnabled = process.env.STRIPE_CONNECT_ENABLED === 'true';
  return {
    ...stripe,
    connectEnabled,
    posterFeePercent: POSTER_FEE_PERCENT,
    carrierFeePercent: CARRIER_FEE_PERCENT,
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

  const fin = computeLoadFinancials(load);
  const party = resolveFeeParty(user, load);
  const feePercent = party === 'carrier' ? CARRIER_FEE_PERCENT : POSTER_FEE_PERCENT;
  const feeDollars = party === 'carrier' ? fin.carrier_fee_amount : fin.poster_fee_amount;
  const feeAmount = Math.round(feeDollars * 100);
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
          description: `${feePercent}% platform fee (${party}) on $${rate.toLocaleString()} load`,
        },
      },
      quantity: 1,
    }],
    metadata: {
      load_id: loadId,
      fee_type: 'load_platform_fee',
      fee_party: party,
    },
    success_url: `${appUrl}/portal/loads?fee=success&load=${loadId}`,
    cancel_url: `${appUrl}/portal/loads?fee=cancel&load=${loadId}`,
  });

  updateEntity('Load', loadId, {
    platform_fee_checkout_session_id: session.id,
    platform_fee_status: 'checkout_started',
  });

  return { success: true, url: session.url, sessionId: session.id, feeAmountCents: feeAmount, feeParty: party };
}

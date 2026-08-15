/** Client-side load marketplace financial helpers. */
export const POSTER_FEE_PERCENT = 1.5;
export const CARRIER_FEE_PERCENT = 1.5;
export const PLATFORM_FEE_PERCENT = POSTER_FEE_PERCENT + CARRIER_FEE_PERCENT;

function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

export function computeLoadFinancials(load) {
  const loadValue = Number(load?.rate) || 0;
  if (!loadValue) {
    return {
      load_value: 0,
      poster_fee_amount: 0,
      carrier_fee_amount: 0,
      fleetco_fee_amount: 0,
      poster_fee_percent: POSTER_FEE_PERCENT,
      carrier_fee_percent: CARRIER_FEE_PERCENT,
      fleetco_fee_percent: PLATFORM_FEE_PERCENT,
      poster_payout_amount: 0,
      carrier_payout_amount: 0,
    };
  }
  const posterFee = roundMoney(loadValue * POSTER_FEE_PERCENT / 100);
  const carrierFee = roundMoney(loadValue * CARRIER_FEE_PERCENT / 100);
  const fleetcoFee = roundMoney(posterFee + carrierFee);
  return {
    load_value: loadValue,
    poster_fee_amount: posterFee,
    carrier_fee_amount: carrierFee,
    fleetco_fee_amount: fleetcoFee,
    poster_fee_percent: POSTER_FEE_PERCENT,
    carrier_fee_percent: CARRIER_FEE_PERCENT,
    fleetco_fee_percent: PLATFORM_FEE_PERCENT,
    carrier_payout_amount: roundMoney(loadValue - carrierFee),
    poster_payout_amount: roundMoney(loadValue - posterFee),
  };
}

export function formatUsd(amount) {
  return `$${(Number(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Which fee applies to the current user on this load. */
export function userLoadFeeParty(user, load) {
  if (!user || !load) return null;
  if (user.customer_id && load.customer_id && user.customer_id === load.customer_id) return 'poster';
  const carrierId = load.booked_by_customer_id || load.assigned_customer_id;
  if (user.customer_id && carrierId && user.customer_id === carrierId) return 'carrier';
  if (load.booked_by_user_id === user.id) return 'carrier';
  return null;
}

export function userLoadFeeAmount(user, load) {
  const fin = computeLoadFinancials(load);
  const party = userLoadFeeParty(user, load);
  if (party === 'poster') return fin.poster_fee_amount;
  if (party === 'carrier') return fin.carrier_fee_amount;
  return fin.fleetco_fee_amount;
}

export function userLoadFeePercent(user, load) {
  const party = userLoadFeeParty(user, load);
  if (party === 'poster') return POSTER_FEE_PERCENT;
  if (party === 'carrier') return CARRIER_FEE_PERCENT;
  return PLATFORM_FEE_PERCENT;
}

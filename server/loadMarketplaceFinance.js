/** Platform fees: poster and carrier each pay 1.5% of load value to FleetCo. */
export const POSTER_FEE_PERCENT = 1.5;
export const CARRIER_FEE_PERCENT = 1.5;
/** Combined FleetCo take on total load value. */
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
    /** Carrier net haul pay after their platform fee. */
    carrier_payout_amount: roundMoney(loadValue - carrierFee),
    /** Legacy field — poster-side net on posted rate (rate minus poster fee). */
    poster_payout_amount: roundMoney(loadValue - posterFee),
  };
}

export function feeForParty(party) {
  if (party === 'poster') return POSTER_FEE_PERCENT;
  if (party === 'carrier') return CARRIER_FEE_PERCENT;
  return PLATFORM_FEE_PERCENT;
}

export function applyFinancialsToLoad(load) {
  return { ...load, ...computeLoadFinancials(load) };
}

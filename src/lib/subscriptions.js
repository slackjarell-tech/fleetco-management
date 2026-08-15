/** Per-unit subscription pricing — $35/unit/mo; 5% off when billed annually. */
export const PRICE_PER_UNIT_MONTHLY = 35;
export const YEARLY_DISCOUNT_PERCENT = 5;
export const DEFAULT_SUBSCRIPTION_PLAN = 'Per Unit';

export const SUBSCRIPTION_PLANS = {
  'Per Unit': { label: 'Per Unit', perUnitMonthly: PRICE_PER_UNIT_MONTHLY },
  /** @deprecated Legacy plan names — same per-unit pricing */
  Starter: { label: 'Per Unit', perUnitMonthly: PRICE_PER_UNIT_MONTHLY },
  Growth: { label: 'Per Unit', perUnitMonthly: PRICE_PER_UNIT_MONTHLY },
};

export function unitCountFromCustomer(customerOrUnits) {
  if (typeof customerOrUnits === 'number') return Math.max(1, Math.round(customerOrUnits));
  const n = Number(customerOrUnits?.fleet_size);
  return Math.max(1, Number.isFinite(n) && n > 0 ? Math.round(n) : 1);
}

export function monthlyTotalForUnits(unitCount) {
  const units = Math.max(1, Math.round(Number(unitCount) || 1));
  return Math.round(units * PRICE_PER_UNIT_MONTHLY * 100) / 100;
}

export function yearlyTotal(monthlyTotal) {
  const monthly = Number(monthlyTotal) || 0;
  return Math.round(monthly * 12 * (1 - YEARLY_DISCOUNT_PERCENT / 100) * 100) / 100;
}

export function yearlyMonthlyEquivalent(monthlyTotal) {
  return Math.round((yearlyTotal(monthlyTotal) / 12) * 100) / 100;
}

export function subscriptionAmount(planName, term, unitCount = 1) {
  if (!SUBSCRIPTION_PLANS[planName] && planName !== DEFAULT_SUBSCRIPTION_PLAN) return null;
  const monthly = monthlyTotalForUnits(unitCount);
  if (term === 'yearly') return yearlyTotal(monthly);
  return monthly;
}

export function subscriptionAmountForCustomer(customer, term) {
  const plan = customer?.subscription_plan || DEFAULT_SUBSCRIPTION_PLAN;
  const billingTerm = term || customer?.subscription_term || 'monthly';
  return subscriptionAmount(plan, billingTerm, unitCountFromCustomer(customer));
}

export function formatPrice(amount) {
  return `$${(Number(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function pricingSummary(unitCount, term = 'monthly') {
  const units = Math.max(1, Math.round(Number(unitCount) || 1));
  const monthly = monthlyTotalForUnits(units);
  const yearly = yearlyTotal(monthly);
  return {
    units,
    perUnitMonthly: PRICE_PER_UNIT_MONTHLY,
    monthlyTotal: monthly,
    yearlyTotal: yearly,
    yearlyMonthlyEquivalent: yearlyMonthlyEquivalent(monthly),
    term,
    amountDue: term === 'yearly' ? yearly : monthly,
    discountPercent: YEARLY_DISCOUNT_PERCENT,
  };
}

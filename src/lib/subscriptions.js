/** Subscription plans — monthly base prices; yearly = 10% off vs 12× monthly */
export const SUBSCRIPTION_PLANS = {
  Starter: { monthly: 299, fleetMax: 5, label: 'Starter' },
  Growth: { monthly: 599, fleetMax: 15, label: 'Growth' },
};

export function yearlyTotal(monthlyPrice) {
  return Math.round(monthlyPrice * 12 * 0.9);
}

export function yearlyMonthlyEquivalent(monthlyPrice) {
  return Math.round((monthlyPrice * 12 * 0.9) / 12);
}

export function subscriptionAmount(planName, term) {
  const plan = SUBSCRIPTION_PLANS[planName];
  if (!plan) return null;
  if (term === 'yearly') return yearlyTotal(plan.monthly);
  return plan.monthly;
}

export function formatPrice(amount) {
  return `$${amount.toLocaleString()}`;
}

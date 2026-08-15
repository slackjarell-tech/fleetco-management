/** Freight broker accounts — load board only, no monthly subscription. */
export const BROKER_ACCOUNT_TYPE = 'freight_broker';
export const BROKER_SUBSCRIPTION_PLAN = 'Load Board';

export function isBrokerAccount(customer) {
  if (!customer) return false;
  return customer.account_type === BROKER_ACCOUNT_TYPE
    || customer.subscription_plan === BROKER_SUBSCRIPTION_PLAN
    || customer.billing_model === 'load_board_transaction';
}

export function brokerBillingSnapshot(customer) {
  return {
    status: 'current',
    daysUntilDue: null,
    dueAt: null,
    isOverdue: false,
    isPaused: false,
    canPause: false,
    amount: 0,
    term: null,
    plan: BROKER_SUBSCRIPTION_PLAN,
    lastPaymentAt: null,
    isBrokerAccount: true,
    billingModel: 'load_board_transaction',
  };
}

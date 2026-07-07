/** Subscription billing — due dates, reminders, pause eligibility */
export const REMINDER_THRESHOLDS = [7, 3, 1, 0];

export function computeNextDueDate(fromIso, term = 'monthly') {
  const d = new Date(fromIso);
  if (Number.isNaN(d.getTime())) return null;
  if (term === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}

export function daysUntilDue(dueIso) {
  if (!dueIso) return null;
  const due = new Date(dueIso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - now) / 86400000);
}

export function getBillingSnapshot(customer) {
  if (!customer) return null;

  const dueAt = customer.next_payment_due_at || customer.payment_collected_at || null;
  const days = dueAt != null ? daysUntilDue(dueAt) : null;
  const isPaused = !!customer.system_paused;
  const isOverdue = days != null && days < 0;

  let status = 'current';
  if (isPaused) status = 'paused';
  else if (isOverdue) status = 'overdue';
  else if (days != null && days <= 7) status = 'due_soon';

  return {
    status,
    daysUntilDue: days,
    dueAt,
    isOverdue,
    isPaused,
    canPause: !isPaused && (isOverdue || status === 'due_soon'),
    amount: customer.subscription_amount ?? null,
    term: customer.subscription_term || 'monthly',
    plan: customer.subscription_plan || '',
    lastPaymentAt: customer.last_payment_at || customer.payment_collected_at || null,
  };
}

export function formatCountdown(days) {
  if (days == null) return 'Due date not set';
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Payment due today';
  if (days === 1) return 'Payment due tomorrow';
  return `Payment due in ${days} days`;
}

export function reminderTypeForDays(days) {
  if (days == null) return null;
  if (days < 0) return 'payment_overdue';
  if (days === 0) return 'payment_due_today';
  if (days === 1) return 'payment_due_1d';
  if (days <= 3) return 'payment_due_3d';
  if (days <= 7) return 'payment_due_7d';
  return null;
}

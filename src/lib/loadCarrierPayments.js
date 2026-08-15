import { isFreightBroker } from './loadBoardAccess.js';

export const CARRIER_PAYMENT_TERMS = [
  { id: 'net_7', label: 'Net 7', description: 'Carrier paid within 7 days of delivery' },
  { id: 'net_15', label: 'Net 15', description: 'Carrier paid within 15 days of delivery' },
];

export const PAYMENT_STATUS_LABELS = {
  awaiting_delivery: 'Awaiting delivery',
  pending: 'Payment pending',
  sent: 'Broker marked paid',
  paid: 'Paid — confirmed',
  overdue: 'Overdue — SLT notified',
  disputed: 'Dispute — SLT involved',
};

export const PAYMENT_STATUS_COLORS = {
  awaiting_delivery: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  disputed: 'bg-purple-100 text-purple-800',
};

export function paymentTermsLabel(terms) {
  return CARRIER_PAYMENT_TERMS.find((t) => t.id === terms)?.label || terms || '—';
}

export function paymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || status || '—';
}

export function isPaymentOverdue(load) {
  if (!load?.carrier_payment_due_at) return false;
  if (load.carrier_payment_status === 'paid') return false;
  return new Date(load.carrier_payment_due_at).getTime() < Date.now();
}

export function loadRequiresCarrierPaymentTerms(user) {
  return isFreightBroker(user);
}

export function canMarkCarrierPaymentSent(user, load) {
  if (!user || !load) return false;
  if (load.status !== 'delivered') return false;
  if (!load.carrier_payment_terms) return false;
  if (load.carrier_payment_status === 'paid') return false;
  if (user.customer_id && load.customer_id === user.customer_id) return true;
  if (load.posted_by_user_id === user.id) return true;
  return false;
}

export function canConfirmCarrierPayment(user, load) {
  if (!user || !load) return false;
  if (load.status !== 'delivered') return false;
  if (!load.carrier_payment_terms) return false;
  if (load.carrier_payment_status === 'paid') return false;
  const carrierId = load.booked_by_customer_id || load.assigned_customer_id;
  if (user.customer_id && carrierId && user.customer_id === carrierId) return true;
  if (load.booked_by_user_id === user.id) return true;
  return false;
}

export function formatPaymentDueDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { dateStyle: 'medium' });
}

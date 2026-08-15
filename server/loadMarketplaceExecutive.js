import {
  createEntity,
  filterEntities,
  getEntity,
  listEntities,
} from './db.js';
import { isFleetCoInternal } from './roles.js';
import { computeLoadFinancials } from './loadMarketplaceFinance.js';
import { paymentTermsLabel } from './loadCarrierPayments.js';

function isAdminRole(role) {
  return isFleetCoInternal(role) || role === 'admin' || role === 'owner';
}

function getLoadParties(load) {
  const posterCustomerId = load.customer_id || null;
  const carrierCustomerId = load.booked_by_customer_id || load.assigned_customer_id || null;
  return { posterCustomerId, carrierCustomerId };
}

export function canAccessLoadThread(user, load) {
  if (!user || !load) return false;
  if (isAdminRole(user.role)) return true;
  const { posterCustomerId, carrierCustomerId } = getLoadParties(load);
  if (user.customer_id && user.customer_id === posterCustomerId) return true;
  if (user.customer_id && user.customer_id === carrierCustomerId) return true;
  if (load.booked_by_user_id === user.id) return true;
  return false;
}

export function listLoadMessages(user, { loadId }) {
  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');
  if (!canAccessLoadThread(user, load)) throw new Error('Not authorized');

  const messages = filterEntities('LoadMessage', { load_id: loadId }, 'created_date', 200);
  return { messages, load_id: loadId };
}

export function postLoadMessage(user, { loadId, body }) {
  if (!body?.trim()) throw new Error('Message is required');
  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');
  if (!canAccessLoadThread(user, load)) throw new Error('Not authorized');

  const msg = createEntity('LoadMessage', {
    load_id: loadId,
    sender_user_id: user.id,
    sender_name: user.full_name || user.email,
    sender_customer_id: user.customer_id || null,
    body: body.trim(),
  });
  return { success: true, message: msg };
}

export function canViewExecutiveLoadMarketplace(role) {
  return isAdminRole(role) || role === 'fleet_manager';
}

function customerLabel(customers, id) {
  if (!id) return '—';
  const c = customers.find((x) => x.id === id);
  return c?.company_name || c?.contact_name || id.slice(0, 8);
}

function userLabel(users, id) {
  if (!id) return '—';
  return users.find((u) => u.id === id)?.full_name || '—';
}

export function getExecutiveLoadMarketplace(user) {
  if (!canViewExecutiveLoadMarketplace(user?.role)) {
    throw new Error('Executive or fleet manager access required');
  }

  const loads = listEntities('Load').filter((l) =>
    l.marketplace_visible !== false
    || l.booking_status
    || l.posting_source
    || l.booked_by_customer_id
    || l.platform_fee_amount,
  );

  const customers = listEntities('Customer');
  const users = listEntities('User');
  const allMessages = listEntities('LoadMessage');

  const enriched = loads.map((load) => {
    const computed = computeLoadFinancials(load);
    const fin = {
      load_value: Number(load.load_value ?? computed.load_value) || 0,
      poster_fee_amount: Number(load.poster_fee_amount ?? computed.poster_fee_amount) || 0,
      carrier_fee_amount: Number(load.carrier_fee_amount ?? computed.carrier_fee_amount) || 0,
      fleetco_fee_amount: Number(load.fleetco_fee_amount ?? load.platform_fee_amount ?? computed.fleetco_fee_amount) || 0,
      poster_payout_amount: Number(load.poster_payout_amount ?? computed.poster_payout_amount) || 0,
      carrier_payout_amount: Number(load.carrier_payout_amount ?? computed.carrier_payout_amount) || 0,
    };
    const thread = allMessages.filter((m) => m.load_id === load.id);
    return {
      ...load,
      ...fin,
      carrier_payment_terms_label: paymentTermsLabel(load.carrier_payment_terms),
      poster_company: customerLabel(customers, load.customer_id),
      carrier_company: customerLabel(customers, load.booked_by_customer_id || load.assigned_customer_id),
      poster_contact: userLabel(users, load.posted_by_user_id),
      booked_by_name: userLabel(users, load.booked_by_user_id),
      assigned_driver_name: userLabel(users, load.assigned_driver_id || load.booked_driver_id),
      message_count: thread.length,
      last_message_at: thread.length ? thread[thread.length - 1].created_date : null,
    };
  }).sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));

  const totals = enriched.reduce(
    (acc, l) => {
      acc.load_value += l.load_value || 0;
      acc.fleetco_fee += l.fleetco_fee_amount || 0;
      acc.poster_fee += l.poster_fee_amount || 0;
      acc.carrier_fee += l.carrier_fee_amount || 0;
      acc.carrier_payout += l.carrier_payout_amount || 0;
      if (l.booking_status === 'accepted' || l.status === 'assigned' || l.status === 'in_transit' || l.status === 'delivered') {
        acc.accepted_count += 1;
      }
      if (l.status === 'delivered') acc.delivered_count += 1;
      if (['overdue', 'disputed'].includes(l.carrier_payment_status)) acc.payment_issues += 1;
      if (l.carrier_payment_status === 'overdue') acc.overdue_payments += 1;
      return acc;
    },
    { load_value: 0, fleetco_fee: 0, poster_fee: 0, carrier_fee: 0, carrier_payout: 0, accepted_count: 0, delivered_count: 0, payment_issues: 0, overdue_payments: 0 },
  );

  return {
    loads: enriched,
    totals,
    load_count: enriched.length,
  };
}

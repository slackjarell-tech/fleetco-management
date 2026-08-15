import { createEntity, filterEntities, getEntity, listEntities } from './db.js';
import { isFleetCoInternal } from './roles.js';
import { canAccessLoadThread } from './loadMarketplaceComms.js';

export const MARKETPLACE_EVENT_ACTIONS = [
  'load_posted',
  'load_booked',
  'booking_accepted',
  'booking_declined',
  'load_delivered',
  'message_sent',
];

function isSltRole(role) {
  return isFleetCoInternal(role) || role === 'admin' || role === 'owner' || role === 'fleet_manager';
}

export function logLoadMarketplaceEvent({
  loadId,
  action,
  user,
  summary,
  metadata = {},
}) {
  if (!loadId || !action) return null;
  return createEntity('LoadMarketplaceEvent', {
    load_id: loadId,
    action,
    actor_user_id: user?.id || null,
    actor_name: user?.full_name || user?.email || 'System',
    actor_role: user?.role || null,
    actor_customer_id: user?.customer_id || null,
    summary: summary || action,
    metadata_json: JSON.stringify(metadata),
    immutable: true,
  });
}

export function listLoadMarketplaceEvents(user, { loadId }) {
  const load = getEntity('Load', loadId);
  if (!load) throw new Error('Load not found');

  if (!canAccessLoadThread(user, load) && !isSltRole(user?.role)) {
    throw new Error('Not authorized');
  }

  const events = filterEntities('LoadMarketplaceEvent', { load_id: loadId }, 'created_date', 500);
  return { events, load_id: loadId };
}

export function getSltMarketplaceOversight(user) {
  if (!isSltRole(user?.role)) {
    throw new Error('SLT access required');
  }

  const loads = listEntities('Load').filter((l) =>
    l.marketplace_visible !== false
    || l.booking_status
    || l.posting_source === 'broker'
    || l.booked_by_customer_id
    || l.carrier_payment_terms,
  );

  const messages = listEntities('LoadMessage').sort((a, b) =>
    (a.created_date || '').localeCompare(b.created_date || ''),
  );
  const events = listEntities('LoadMarketplaceEvent').sort((a, b) =>
    (a.created_date || '').localeCompare(b.created_date || ''),
  );
  const customers = listEntities('Customer');
  const users = listEntities('User');

  const customerName = (id) => customers.find((c) => c.id === id)?.company_name || '—';
  const userName = (id) => users.find((u) => u.id === id)?.full_name || users.find((u) => u.id === id)?.email || '—';

  const enrichedMessages = messages.map((m) => {
    const load = loads.find((l) => l.id === m.load_id) || getEntity('Load', m.load_id);
    return {
      ...m,
      load_number: load?.load_number || '—',
      load_route: load ? `${load.origin || '?'} → ${load.destination || '?'}` : '—',
      poster_company: customerName(load?.customer_id),
      carrier_company: customerName(load?.booked_by_customer_id || load?.assigned_customer_id),
    };
  });

  const enrichedEvents = events.map((e) => {
    const load = loads.find((l) => l.id === e.load_id) || getEntity('Load', e.load_id);
    return {
      ...e,
      load_number: load?.load_number || '—',
      load_route: load ? `${load.origin || '?'} → ${load.destination || '?'}` : '—',
      poster_company: customerName(load?.customer_id),
      carrier_company: customerName(load?.booked_by_customer_id || load?.assigned_customer_id),
    };
  });

  return {
    load_count: loads.length,
    message_count: messages.length,
    event_count: events.length,
    messages: enrichedMessages.slice(-500),
    events: enrichedEvents.slice(-500),
    loads: loads.map((l) => ({
      id: l.id,
      load_number: l.load_number,
      origin: l.origin,
      destination: l.destination,
      status: l.status,
      booking_status: l.booking_status,
      poster_company: customerName(l.customer_id),
      carrier_company: customerName(l.booked_by_customer_id || l.assigned_customer_id),
      posted_by_name: userName(l.posted_by_user_id),
      booked_by_name: userName(l.booked_by_user_id),
      booked_at: l.booked_at,
      accepted_at: l.accepted_at,
      delivered_at: l.delivered_at,
    })).sort((a, b) => (b.booked_at || b.accepted_at || '').localeCompare(a.booked_at || a.accepted_at || '')),
  };
}

/**
 * Multi-tenant entity scoping for customer portal users and internal "view as customer" mode.
 * Read filters only — never deletes or mutates data when context changes.
 */
import { getEntity, listEntities, listUsers } from './db.js';

export const INTERNAL_ROLES = ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'];

/** Entity types with no customer linkage — visible in all scoped views. */
export const GLOBAL_ENTITY_TYPES = new Set([
  'FuelStation',
  'Vendor',
  'PartInventory',
  'ServiceTemplate',
  'Inquiry',
  'MarketingSocialPost',
  'MarketingScheduledCall',
  'MarketingActivityLog',
  'MarketingReportRun',
  'DomainEmail',
  'UsageFeedback',
  'FuelStation',
]);

export function isInternalRole(role) {
  return INTERNAL_ROLES.includes(role);
}

/**
 * Resolve which customer data the actor may access.
 * Portal users are always locked to their customer_id (header ignored).
 */
export function resolveCustomerContext(actor, requestedCustomerId) {
  if (!actor) {
    return { mode: 'none', customerId: null };
  }

  if (actor.customer_id && !isInternalRole(actor.role)) {
    return { mode: 'portal', customerId: actor.customer_id };
  }

  if (!isInternalRole(actor.role)) {
    return { mode: 'none', customerId: null };
  }

  if (!requestedCustomerId || typeof requestedCustomerId !== 'string') {
    return { mode: 'global', customerId: null };
  }

  const customer = getEntity('Customer', requestedCustomerId.trim());
  if (!customer) {
    return { mode: 'global', customerId: null };
  }

  return {
    mode: 'impersonate',
    customerId: customer.id,
    customerName: customer.company_name || customer.contact_name || customer.id,
  };
}

export function buildScopeIndex(customerId) {
  if (!customerId) {
    return { vehicleIds: null, userIds: null };
  }

  const vehicleIds = new Set(
    listEntities('Vehicle')
      .filter(
        (v) => v.customer_id === customerId || v.assigned_customer_id === customerId,
      )
      .map((v) => v.id),
  );

  const userIds = new Set(
    listUsers()
      .filter((u) => u.customer_id === customerId)
      .map((u) => u.id),
  );

  return { vehicleIds, userIds };
}

function matchesCustomerField(item, customerId) {
  if (!item || !customerId) return false;
  if (item.customer_id === customerId) return true;
  if (item.assigned_customer_id === customerId) return true;
  return false;
}

export function entityBelongsToCustomer(type, item, customerId, scopeIndex) {
  if (!customerId || !item) return true;

  if (type === 'Customer') {
    return item.id === customerId;
  }

  if (GLOBAL_ENTITY_TYPES.has(type)) {
    return true;
  }

  if (matchesCustomerField(item, customerId)) {
    return true;
  }

  const { vehicleIds, userIds } = scopeIndex || buildScopeIndex(customerId);

  if (item.vehicle_id && vehicleIds?.has(item.vehicle_id)) {
    return true;
  }

  if (item.user_id && userIds?.has(item.user_id)) {
    return true;
  }

  if (type === 'DriverLocation' && item.user_id && userIds?.has(item.user_id)) {
    return true;
  }

  if (type === 'DeliveryStop' && item.route_id) {
    const route = getEntity('DeliveryRoute', item.route_id);
    if (route && matchesCustomerField(route, customerId)) return true;
  }

  if (type === 'YardPlacement' && item.yard_id) {
    const yard = getEntity('Yard', item.yard_id);
    if (yard && matchesCustomerField(yard, customerId)) return true;
  }

  if (type === 'VehicleDocument' && item.vehicle_id && vehicleIds?.has(item.vehicle_id)) {
    return true;
  }

  if (type === 'DriverDocument' && item.driver_id && userIds?.has(item.driver_id)) {
    return true;
  }

  if (type === 'PayrollRecord') {
    if (item.driver_id && userIds?.has(item.driver_id)) return true;
    if (item.employee_user_id && userIds?.has(item.employee_user_id)) return true;
  }

  if (type === 'VehicleAccessory') {
    if (matchesCustomerField(item, customerId)) return true;
    if (item.vehicle_id && vehicleIds?.has(item.vehicle_id)) return true;
    return false;
  }

  if (type === 'DashcamFrame' && item.session_id) {
    const session = getEntity('DashcamSession', item.session_id);
    if (session?.user_id && userIds?.has(session.user_id)) return true;
  }

  return false;
}

export function filterEntitiesForContext(type, items, ctx, scopeIndex) {
  if (!ctx?.customerId) return items;
  const index = scopeIndex || buildScopeIndex(ctx.customerId);
  return items.filter((item) => entityBelongsToCustomer(type, item, ctx.customerId, index));
}

export function assertEntityAccess(type, item, ctx, scopeIndex) {
  if (!ctx?.customerId) return true;
  if (!entityBelongsToCustomer(type, item, ctx.customerId, scopeIndex)) {
    const err = new Error('Access denied for this customer context');
    err.status = 403;
    throw err;
  }
  return true;
}

/** Stamp customer_id on creates when internal staff work inside a customer view. */
export function stampEntityForCreate(type, data, ctx) {
  if (!ctx?.customerId || !data || typeof data !== 'object') return data;
  const next = { ...data };

  const customerFieldTypes = new Set([
    'Load',
    'Invoice',
    'PurchaseOrder',
    'PayrollRun',
    'PayrollRecord',
    'ChartOfAccount',
    'JournalEntry',
    'Yard',
    'Message',
    'Subscription',
    'PendingAccount',
    'PaymentReminder',
    'DeliveryRoute',
    'PortalActivity',
  ]);

  if (type === 'Vehicle' && !next.customer_id && !next.assigned_customer_id) {
    next.customer_id = ctx.customerId;
  }

  if (type === 'VehicleAccessory' && !next.customer_id) {
    next.customer_id = ctx.customerId;
  }

  if (type === 'DriverDocument' && !next.customer_id) {
    next.customer_id = ctx.customerId;
  }

  if (customerFieldTypes.has(type) && !next.customer_id) {
    next.customer_id = ctx.customerId;
  }

  return next;
}

/** Protect customer accounts and logins while viewing as a customer. */
export function assertDeleteAllowed(type, ctx, actor) {
  if (!ctx?.customerId || ctx.mode !== 'impersonate') return true;

  if (type === 'Customer') {
    const err = new Error('Exit customer view before deleting customer records');
    err.status = 403;
    throw err;
  }

  if (type === 'User' && isInternalRole(actor?.role)) {
    const err = new Error('Exit customer view before deleting user accounts — this protects customer logins');
    err.status = 403;
    throw err;
  }

  return true;
}

export function filterUsersForContext(users, ctx) {
  if (!ctx?.customerId) return users;
  return users.filter((u) => u.customer_id === ctx.customerId);
}

export function readCustomerContextHeader(req) {
  const raw = req.headers['x-customer-context'];
  if (!raw || typeof raw !== 'string') return null;
  return raw.trim() || null;
}

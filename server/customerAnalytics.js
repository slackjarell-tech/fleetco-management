/**
 * Customer usage analytics — computed from portal activity + operational data.
 * Append-only tracking; never mutates users or customer accounts.
 */
import { createEntity, filterEntities, listEntities, listUsers } from './db.js';

const SECTION_LABELS = [
  'Dashboard',
  'Operations',
  'Fleet',
  'Maintenance',
  'Drivers & Payroll',
  'Compliance',
  'Finance',
  'Other',
];

function vehiclesForCustomer(customerId) {
  return listEntities('Vehicle').filter(
    (v) => v.customer_id === customerId || v.assigned_customer_id === customerId,
  );
}

function vehicleIdsForCustomer(customerId) {
  return new Set(vehiclesForCustomer(customerId).map((v) => v.id));
}

function workOrdersForCustomer(customerId) {
  const ids = vehicleIdsForCustomer(customerId);
  return listEntities('WorkOrder').filter((wo) => ids.has(wo.vehicle_id));
}

function countByField(items, field) {
  const counts = {};
  for (const item of items) {
    const key = item[field] || 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function aggregatePartsFromWorkOrders(workOrders) {
  const parts = {};
  for (const wo of workOrders) {
    for (const p of wo.parts || []) {
      const key = p.part_number || p.description || 'Unnamed part';
      if (!parts[key]) {
        parts[key] = {
          part_number: p.part_number || '',
          description: p.description || key,
          quantity: 0,
          total_cost: 0,
        };
      }
      parts[key].quantity += Number(p.quantity) || 1;
      parts[key].total_cost += Number(p.total_cost) || 0;
    }
  }
  return Object.values(parts).sort((a, b) => b.quantity - a.quantity);
}

function portalActivityForCustomer(customerId) {
  return filterEntities('PortalActivity', { customer_id: customerId }, '-visited_at', 2000);
}

function sectionUsageFromActivity(events) {
  const counts = {};
  for (const e of events) {
    const section = e.section || 'Other';
    counts[section] = (counts[section] || 0) + 1;
  }
  return SECTION_LABELS.map((name) => ({
    name,
    visits: counts[name] || 0,
  })).sort((a, b) => b.visits - a.visits);
}

function inferredSectionUsage(customerId) {
  const vIds = vehicleIdsForCustomer(customerId);
  const counts = {
    Dashboard: 1,
    Operations: listEntities('Load').filter((l) => l.customer_id === customerId).length,
    Fleet: vehiclesForCustomer(customerId).length,
    Maintenance: listEntities('WorkOrder').filter((wo) => vIds.has(wo.vehicle_id)).length
      + listEntities('Inspection').filter((i) => vIds.has(i.vehicle_id)).length,
    'Drivers & Payroll': listUsers().filter((u) => u.customer_id === customerId && u.role === 'driver').length,
    Compliance: listEntities('HOSLog').filter((h) => vIds.has(h.vehicle_id)).length
      + listEntities('Incident').filter((i) => vIds.has(i.vehicle_id)).length,
    Finance: listEntities('Invoice').filter((i) => i.customer_id === customerId).length
      + listEntities('FuelLog').filter((f) => vIds.has(f.vehicle_id)).length,
    Other: listEntities('Message').filter((m) => m.customer_id === customerId).length,
  };
  return SECTION_LABELS.map((name) => ({ name, visits: counts[name] || 0 }))
    .sort((a, b) => b.visits - a.visits);
}

function sidebarModulesForCustomer(customerId) {
  const users = listUsers().filter((u) => u.customer_id === customerId);
  const modules = new Set();
  for (const u of users) {
    for (const m of u.sidebar_modules || []) modules.add(m);
  }
  return [...modules];
}

export function buildCustomerAnalytics(customerId) {
  const customer = listEntities('Customer').find((c) => c.id === customerId);
  if (!customer) return null;

  const workOrders = workOrdersForCustomer(customerId);
  const activity = portalActivityForCustomer(customerId);
  const sectionUsage = activity.length
    ? sectionUsageFromActivity(activity)
    : inferredSectionUsage(customerId);

  const vehicles = vehiclesForCustomer(customerId);
  const teamUsers = listUsers().filter((u) => u.customer_id === customerId);

  return {
    customerId,
    company_name: customer.company_name,
    contact_name: customer.contact_name,
    subscription_plan: customer.subscription_plan,
    fleet_size: customer.fleet_size,
    sidebar_modules: sidebarModulesForCustomer(customerId),
    team_count: teamUsers.length,
    section_usage: sectionUsage,
    activity_events: activity.length,
    entity_counts: {
      vehicles: vehicles.length,
      loads: listEntities('Load').filter((l) => l.customer_id === customerId).length,
      work_orders: workOrders.length,
      open_work_orders: workOrders.filter((wo) => !['completed', 'cancelled'].includes(wo.status)).length,
      inspections: listEntities('Inspection').filter((i) => vehicleIdsForCustomer(customerId).has(i.vehicle_id)).length,
      fuel_logs: listEntities('FuelLog').filter((f) => vehicleIdsForCustomer(customerId).has(f.vehicle_id)).length,
      invoices: listEntities('Invoice').filter((i) => i.customer_id === customerId).length,
      drivers: teamUsers.filter((u) => u.role === 'driver').length,
    },
    work_orders_by_status: countByField(workOrders, 'status'),
    work_orders_by_type: countByField(workOrders, 'repair_type'),
    top_parts: aggregatePartsFromWorkOrders(workOrders).slice(0, 15),
    recent_activity: activity.slice(0, 25).map((e) => ({
      path: e.path,
      section: e.section,
      user_email: e.user_email,
      visited_at: e.visited_at,
    })),
  };
}

export function buildAllCustomersAnalytics() {
  const customers = listEntities('Customer');
  return customers
    .map((c) => buildCustomerAnalytics(c.id))
    .filter(Boolean)
    .sort((a, b) => {
      const aTotal = a.section_usage.reduce((s, x) => s + x.visits, 0);
      const bTotal = b.section_usage.reduce((s, x) => s + x.visits, 0);
      return bTotal - aTotal;
    });
}

export function trackPortalVisit({ user, customerId, path, section }) {
  if (!customerId || !path) return null;
  return createEntity('PortalActivity', {
    customer_id: customerId,
    user_id: user?.id || null,
    user_email: user?.email || null,
    user_role: user?.role || null,
    path,
    section: section || 'Other',
    visited_at: new Date().toISOString(),
  });
}

/**
 * Cross-entity portal search scoped to customer context (and internal view-as).
 */
import { filterEntities, listEntities, listUsers } from './db.js';
import {
  buildScopeIndex,
  filterEntitiesForContext,
  filterUsersForContext,
  resolveCustomerContext,
} from './entityScope.js';
import { isDriverCapableUser } from './driverAccess.js';

const MAX_PER_TYPE = 6;
const MAX_TOTAL = 40;

const ENTITY_SEARCH_CONFIG = [
  {
    type: 'Vehicle',
    category: 'Fleet units',
    path: '/portal/fleet',
    fields: ['unit_number', 'vin', 'make', 'model', 'license_plate', 'trailer_type', 'notes'],
    title: (r) => `Unit ${r.unit_number || r.id}` + (r.make ? ` — ${[r.make, r.model].filter(Boolean).join(' ')}` : ''),
    subtitle: (r) => [r.vin && `VIN ${r.vin}`, r.status, r.license_plate].filter(Boolean).join(' · '),
    queryField: (r) => r.unit_number || r.vin || '',
  },
  {
    type: 'WorkOrder',
    category: 'Work orders',
    path: '/portal/workorders',
    fields: ['work_order_number', 'title', 'description', 'status', 'repair_type', 'maintenance_strategy'],
    title: (r) => r.work_order_number ? `WO ${r.work_order_number}` : (r.title || 'Work order'),
    subtitle: (r) => [r.status, r.repair_type, r.description?.slice(0, 60)].filter(Boolean).join(' · '),
    queryField: (r) => r.work_order_number || r.title || '',
  },
  {
    type: 'Invoice',
    category: 'Invoices',
    path: '/portal/invoices',
    fields: ['invoice_number', 'status', 'notes', 'customer_name', 'reference'],
    title: (r) => r.invoice_number ? `Invoice ${r.invoice_number}` : `Invoice ${r.id?.slice(0, 8)}`,
    subtitle: (r) => [r.status, r.total != null && `$${r.total}`, r.due_date].filter(Boolean).join(' · '),
    queryField: (r) => r.invoice_number || '',
  },
  {
    type: 'PartInventory',
    category: 'Parts',
    path: '/portal/parts',
    fields: ['part_number', 'description', 'category', 'supplier', 'manufacturer', 'location'],
    title: (r) => r.part_number || r.description?.slice(0, 40) || 'Part',
    subtitle: (r) => [r.description, r.category, r.quantity_on_hand != null && `Qty ${r.quantity_on_hand}`].filter(Boolean).join(' · '),
    queryField: (r) => r.part_number || r.description || '',
  },
  {
    type: 'Vendor',
    category: 'Vendors',
    path: '/portal/vendors',
    fields: ['name', 'company_name', 'contact_name', 'email', 'phone', 'vendor_type', 'city', 'state', 'notes'],
    title: (r) => r.name || r.company_name || r.contact_name || 'Vendor',
    subtitle: (r) => [r.vendor_type, r.city, r.phone, r.email].filter(Boolean).join(' · '),
    queryField: (r) => r.name || r.company_name || '',
  },
  {
    type: 'Load',
    category: 'Loads',
    path: '/portal/loads',
    fields: ['load_number', 'origin', 'destination', 'commodity', 'status', 'reference_number', 'broker_name'],
    title: (r) => r.load_number ? `Load ${r.load_number}` : `${r.origin || '?'} → ${r.destination || '?'}`,
    subtitle: (r) => [r.status, r.commodity, r.rate != null && `$${r.rate}`].filter(Boolean).join(' · '),
    queryField: (r) => r.load_number || r.origin || '',
  },
  {
    type: 'FuelLog',
    category: 'Fuel logs',
    path: '/portal/fuel',
    fields: ['location', 'city', 'state', 'fuel_type', 'notes'],
    title: (r) => r.location || [r.city, r.state].filter(Boolean).join(', ') || 'Fuel log',
    subtitle: (r) => [r.date, r.gallons != null && `${r.gallons} gal`, r.total_cost != null && `$${r.total_cost}`].filter(Boolean).join(' · '),
    queryField: (r) => r.location || r.city || '',
  },
  {
    type: 'PurchaseOrder',
    category: 'Purchase orders',
    path: '/portal/vendors',
    fields: ['po_number', 'status', 'notes', 'vendor_name'],
    title: (r) => r.po_number ? `PO ${r.po_number}` : 'Purchase order',
    subtitle: (r) => [r.status, r.vendor_name, r.total != null && `$${r.total}`].filter(Boolean).join(' · '),
    queryField: (r) => r.po_number || '',
  },
  {
    type: 'FuelCard',
    category: 'Fuel cards',
    path: '/portal/fuel',
    fields: ['card_label', 'last_four', 'issuer', 'notes'],
    title: (r) => r.card_label || (r.last_four ? `Card ····${r.last_four}` : 'Fuel card'),
    subtitle: (r) => [r.issuer, r.status].filter(Boolean).join(' · '),
    queryField: (r) => r.last_four || r.card_label || '',
  },
  {
    type: 'Inspection',
    category: 'Inspections',
    path: '/portal/inspections',
    fields: ['inspection_type', 'status', 'notes', 'location'],
    title: (r) => r.inspection_type || 'Inspection',
    subtitle: (r) => [r.status, r.date, r.location].filter(Boolean).join(' · '),
    queryField: (r) => r.inspection_type || '',
  },
  {
    type: 'Incident',
    category: 'Incidents',
    path: '/portal/incidents',
    fields: ['incident_type', 'status', 'description', 'location'],
    title: (r) => r.incident_type || 'Incident',
    subtitle: (r) => [r.status, r.description?.slice(0, 50)].filter(Boolean).join(' · '),
    queryField: (r) => r.incident_type || '',
  },
  {
    type: 'HOSLog',
    category: 'HOS logs',
    path: '/portal/hos',
    fields: ['status', 'notes', 'location'],
    title: () => 'HOS log entry',
    subtitle: (r) => [r.date, r.status, r.location].filter(Boolean).join(' · '),
    queryField: () => '',
  },
];

function normalizeQuery(q) {
  return String(q || '').trim().toLowerCase();
}

function recordMatches(record, needle, fields) {
  if (!needle || needle.length < 2) return false;
  for (const field of fields) {
    const val = record[field];
    if (val == null) continue;
    if (String(val).toLowerCase().includes(needle)) return true;
  }
  return false;
}

function searchUsers(needle, user, ctx) {
  if (!needle || needle.length < 2) return [];
  let users = listUsers();
  if (user.customer_id) {
    users = users.filter((u) => u.customer_id === user.customer_id);
  } else if (ctx.customerId) {
    users = users.filter((u) => u.customer_id === ctx.customerId);
  } else if (!['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(user.role)) {
    return [];
  }
  users = filterUsersForContext(users, ctx);

  const hits = [];
  for (const u of users) {
    const hay = [
      u.full_name,
      u.email,
      u.employee_number,
      u.phone,
      u.role,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!hay.includes(needle)) continue;
    const isDriver = isDriverCapableUser(u);
    hits.push({
      category: isDriver ? 'Drivers' : 'Team members',
      type: 'User',
      id: u.id,
      title: u.full_name || u.email,
      subtitle: [isDriver ? 'Driver' : u.role?.replace(/_/g, ' '), u.email, u.employee_number && `#${u.employee_number}`]
        .filter(Boolean)
        .join(' · '),
      href: `/portal/drivers?q=${encodeURIComponent(u.full_name || u.email || needle)}`,
    });
    if (hits.length >= MAX_PER_TYPE) break;
  }
  return hits;
}

export function runPortalSearch(rawQuery, user, requestedCustomerId) {
  const needle = normalizeQuery(rawQuery);
  if (needle.length < 2) {
    return { query: rawQuery, results: [], message: 'Enter at least 2 characters' };
  }

  const ctx = resolveCustomerContext(user, requestedCustomerId);
  if (ctx.customerId) {
    ctx.scopeIndex = buildScopeIndex(ctx.customerId);
  }

  const results = [];
  results.push(...searchUsers(needle, user, ctx));

  for (const config of ENTITY_SEARCH_CONFIG) {
    if (results.length >= MAX_TOTAL) break;
    let items = listEntities(config.type);
    items = filterEntitiesForContext(config.type, items, ctx, ctx.scopeIndex);
    const typeHits = [];
    for (const record of items) {
      if (!recordMatches(record, needle, config.fields)) continue;
      const q = config.queryField(record) || needle;
      typeHits.push({
        category: config.category,
        type: config.type,
        id: record.id,
        title: config.title(record),
        subtitle: config.subtitle(record) || '',
        href: `${config.path}?q=${encodeURIComponent(String(q).slice(0, 80))}`,
      });
      if (typeHits.length >= MAX_PER_TYPE) break;
    }
    results.push(...typeHits);
    if (results.length >= MAX_TOTAL) break;
  }

  return {
    query: rawQuery,
    results: results.slice(0, MAX_TOTAL),
    count: results.length,
  };
}

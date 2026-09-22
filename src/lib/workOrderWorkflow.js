/** Work order status lifecycle: intake → estimate → approval → repair */

import { normalizeCustomerRole } from '@/lib/customerRoles';

export const CUSTOMER_WO_ROLES = new Set([
  'customer_owner',
  'customer_fleet_manager',
  'customer_fleet_coordinator',
  'customer_parts_manager',
  'user',
]);

/** View + comment only — no create/edit/delete */
export const WO_COMMENT_ONLY_ROLES = new Set(['driver', 'customer_hr']);

export const WO_STATUSES = [
  'awaiting_estimate',
  'awaiting_approval',
  'awaiting_authorization',
  'open',
  'in_progress',
  'parts_ordered',
  'awaiting_parts',
  'completed',
  'cancelled',
];

export const STATUS_LABELS = {
  awaiting_estimate: 'Diagnosis / estimate',
  awaiting_approval: 'Internal review',
  awaiting_authorization: 'Awaiting customer OK',
  open: 'Authorized — ready',
  in_progress: 'In progress',
  parts_ordered: 'Parts ordered',
  awaiting_parts: 'Awaiting parts',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS = {
  awaiting_estimate: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  awaiting_approval: 'bg-violet-100 text-violet-800 border-violet-200',
  awaiting_authorization: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  parts_ordered: 'bg-purple-100 text-purple-700 border-purple-200',
  awaiting_parts: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const APPROVER_ROLES = new Set([
  'owner',
  'executive',
  'fleet_manager',
  'customer_fleet_manager',
  'customer_owner',
]);

/** Shop floor — primarily tech; leads can help in a pinch */
export const MECHANIC_ROLES = new Set(['tech', 'executive', 'owner']);

export const MANAGER_ROLES = new Set([
  'owner',
  'executive',
  'fleet_manager',
  'fleet_coordinator',
  'customer_fleet_manager',
  'customer_owner',
]);

export function complaintToTitle(complaint) {
  const line = (complaint || '').trim().split('\n')[0].trim();
  if (!line) return 'Repair request';
  return line.length > 72 ? `${line.slice(0, 69)}…` : line;
}

export function normalizeWorkOrder(wo) {
  const base = {
    wo_number: `WO-${Date.now().toString().slice(-6)}`,
    title: '',
    repair_type: 'Other',
    status: 'awaiting_estimate',
    priority: 'medium',
    vehicle_id: '',
    assigned_tech_id: '',
    opened_date: new Date().toISOString().split('T')[0],
    due_date: '',
    odometer: '',
    complaint: '',
    diagnosis: '',
    repair_notes: '',
    service_tasks: [],
    parts: [],
    labor_hours: 0,
    labor_rate: 75,
    labor_cost: 0,
    parts_total: 0,
    total_cost: 0,
    warranty_repair: false,
    shop_name: '',
    mechanic_notes_log: [],
    work_order_comments: [],
    // Check-in / intake (RO drop-off)
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    contact_method: 'phone',
    fuel_level: '',
    dash_warnings: '',
    body_damage_notes: '',
    check_in_notes: '',
    require_customer_authorization: true,
    // Authorization
    customer_signature: '',
    authorization_method: '',
    authorized_at: '',
    authorized_by_name: '',
    // Estimate / invoice
    tax_percent: 0,
    tax_amount: 0,
    // QC & checkout
    qc_passed: false,
    qc_notes: '',
    qc_by: '',
    qc_at: '',
    actual_labor_hours: null,
    payment_status: 'pending',
    completed_date: '',
  };
  if (!wo) return base;
  const merged = {
    ...base,
    ...wo,
    service_tasks: Array.isArray(wo.service_tasks) ? wo.service_tasks : [],
    parts: Array.isArray(wo.parts) ? wo.parts : [],
    mechanic_notes_log: Array.isArray(wo.mechanic_notes_log) ? wo.mechanic_notes_log : [],
    work_order_comments: Array.isArray(wo.work_order_comments) ? wo.work_order_comments : [],
  };
  return computeWorkOrderTotals(merged);
}

/** Itemized RO totals (parts + labor + tax) */
export function computeWorkOrderTotals(wo) {
  const parts = wo.parts || [];
  const partsTotal = parts.reduce((s, p) => s + (p.total_cost || 0), 0);
  const laborHours = wo.labor_hours || 0;
  const laborRate = wo.labor_rate ?? 75;
  const laborCost = laborHours * laborRate;
  const subtotal = partsTotal + laborCost;
  const taxPct = parseFloat(wo.tax_percent) || 0;
  const taxAmount = Math.round(subtotal * (taxPct / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return {
    ...wo,
    parts_total: partsTotal,
    labor_cost: laborCost,
    tax_amount: taxAmount,
    total_cost: total,
  };
}

/** Industry RO phase for progress UI */
export function getRepairOrderPhase(wo) {
  const s = wo?.status;
  if (s === 'completed' || s === 'cancelled') return 'checkout';
  if (['open', 'in_progress', 'parts_ordered', 'awaiting_parts'].includes(s)) return 'repair';
  if (s === 'awaiting_approval' || s === 'awaiting_authorization') return 'authorization';
  if (s === 'awaiting_estimate') {
    if (wo?.diagnosis || wo?.parts?.length || wo?.service_tasks?.length) return 'diagnosis';
    return 'check_in';
  }
  return 'check_in';
}

export function canApproveWorkOrder(user) {
  return user && APPROVER_ROLES.has(user.role);
}

export function canSubmitEstimate(user) {
  return user && MECHANIC_ROLES.has(user.role);
}

export function isWorkOrderCommentOnlyUser(user) {
  if (!user?.customer_id) return false;
  const role = normalizeCustomerRole(user.role);
  return WO_COMMENT_ONLY_ROLES.has(user.role) || WO_COMMENT_ONLY_ROLES.has(role);
}

export function canViewWorkOrders(user) {
  if (!user) return false;
  if (!user.customer_id) {
    return MANAGER_ROLES.has(user.role) || MECHANIC_ROLES.has(user.role) || user.role === 'tech';
  }
  const role = normalizeCustomerRole(user.role);
  return (
    CUSTOMER_WO_ROLES.has(user.role)
    || CUSTOMER_WO_ROLES.has(role)
    || WO_COMMENT_ONLY_ROLES.has(user.role)
    || WO_COMMENT_ONLY_ROLES.has(role)
  );
}

export function canAddWorkOrderComment(user) {
  return isWorkOrderCommentOnlyUser(user);
}

export function isCustomerPortalWorkOrderUser(user) {
  if (!user?.customer_id || isWorkOrderCommentOnlyUser(user)) return false;
  const role = normalizeCustomerRole(user.role);
  return CUSTOMER_WO_ROLES.has(user.role) || CUSTOMER_WO_ROLES.has(role);
}

export function canCreateWorkOrder(user) {
  if (!user) return false;
  if (MANAGER_ROLES.has(user.role)) return true;
  return isCustomerPortalWorkOrderUser(user);
}

/** Customer may edit intake / authorize before shop starts repair */
export function canCustomerEditWorkOrder(user, wo) {
  if (!isCustomerPortalWorkOrderUser(user) || !wo) return false;
  return ['awaiting_estimate', 'awaiting_authorization'].includes(wo.status);
}

export function isInternalWorkOrderStaff(user) {
  return user && MANAGER_ROLES.has(user.role) && !user.customer_id;
}

export function filterVehiclesForWorkOrderUser(user, vehicles) {
  if (!user?.customer_id) return vehicles;
  return vehicles.filter(
    (v) => v.customer_id === user.customer_id || v.assigned_customer_id === user.customer_id,
  );
}

export function workOrderBelongsToCustomerFleet(wo, user, vehicles) {
  if (!user?.customer_id || !wo) return true;
  if (wo.customer_id === user.customer_id) return true;
  const fleetIds = new Set(filterVehiclesForWorkOrderUser(user, vehicles).map((v) => v.id));
  return fleetIds.has(wo.vehicle_id);
}

/** HR: full fleet. Drivers: assigned unit(s) when assigned, else full fleet. */
export function workOrderVisibleToPortalUser(wo, user, vehicles) {
  if (!user?.customer_id || !wo) return true;
  if (!workOrderBelongsToCustomerFleet(wo, user, vehicles)) return false;
  const role = normalizeCustomerRole(user.role);
  if (role === 'customer_hr' || user.role === 'customer_hr') return true;
  if (role !== 'driver' && user.role !== 'driver') return true;
  const assignedIds = vehicles.filter((v) => v.assigned_driver_id === user.id).map((v) => v.id);
  if (!assignedIds.length) return true;
  return assignedIds.includes(wo.vehicle_id);
}

export function canManageWorkOrders(user) {
  return user && (MANAGER_ROLES.has(user.role) || MECHANIC_ROLES.has(user.role));
}

export function isMechanicUser(user) {
  return user?.role === 'tech';
}

/** Work orders visible on the mechanic shop queue */
export function mechanicQueueFilter(wo, user) {
  if (!user || user.role !== 'tech') return true;
  if (wo.assigned_tech_id && wo.assigned_tech_id === user.id) return true;
  if (wo.status === 'awaiting_estimate' && !wo.assigned_tech_id) return true;
  return false;
}

export function getWorkOrderEditorKind(user, wo) {
  if (isMechanicUser(user) && wo && canSubmitEstimate(user)) {
    if (['awaiting_estimate', 'open', 'in_progress', 'parts_ordered', 'awaiting_parts'].includes(wo.status)) {
      return 'mechanic';
    }
  }
  if (isWorkOrderCommentOnlyUser(user)) return 'comment';
  if (isCustomerPortalWorkOrderUser(user)) {
    if (!wo) return 'customer';
    if (canCustomerEditWorkOrder(user, wo)) return 'customer';
    return 'view';
  }
  if (canCreateWorkOrder(user)) return 'manager';
  return 'view';
}

export function isEstimatePhase(status) {
  return status === 'awaiting_estimate' || status === 'awaiting_approval';
}

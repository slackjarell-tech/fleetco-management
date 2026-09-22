import { getEntity, updateEntity, nowIso } from './db.js';
import { assertEntityAccess, buildScopeIndex } from './entityScope.js';

const WO_COMMENT_ONLY_ROLES = new Set(['driver', 'customer_hr']);

export function isWorkOrderCommentOnlyRole(role) {
  return WO_COMMENT_ONLY_ROLES.has(role);
}

export function appendWorkOrderComment(workOrderId, user, commentText, ctx) {
  const text = (commentText || '').trim();
  if (!text) throw new Error('Comment cannot be empty');
  if (!user?.customer_id) throw new Error('Customer portal access required');
  if (!isWorkOrderCommentOnlyRole(user.role)) {
    throw new Error('This endpoint is for driver and HR comment-only access');
  }

  const existing = getEntity('WorkOrder', workOrderId);
  if (!existing) throw new Error('Work order not found');

  const scopeIndex = ctx?.scopeIndex || buildScopeIndex(user.customer_id);
  assertEntityAccess('WorkOrder', existing, { customerId: user.customer_id, scopeIndex }, scopeIndex);

  const entry = {
    at: nowIso(),
    by: user.full_name || user.email || 'User',
    by_role: user.role,
    user_id: user.id,
    text,
  };

  const work_order_comments = [...(existing.work_order_comments || []), entry];
  return updateEntity('WorkOrder', workOrderId, { ...existing, work_order_comments });
}

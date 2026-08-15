import { getEntity, updateEntity, nowIso } from './db.js';
import { isFleetCoInternal } from './roles.js';

export const LOAD_BOARD_FEE_PERCENT = 3.5;

export function hasLoadBoardFeeAcknowledgment(user) {
  if (!user) return false;
  if (isFleetCoInternal(user.role)) return true;
  if (user.load_board_fee_acknowledged_at) return true;
  if (user.customer_id) {
    const customer = getEntity('Customer', user.customer_id);
    if (customer?.load_board_fee_acknowledged_at) return true;
  }
  return false;
}

export function acknowledgeLoadBoardFee(user, { source = 'portal' } = {}) {
  if (!user) throw new Error('Unauthorized');
  const at = nowIso();
  updateEntity('User', user.id, {
    load_board_fee_acknowledged_at: at,
    load_board_fee_acknowledged_source: source,
  });
  if (user.customer_id) {
    updateEntity('Customer', user.customer_id, {
      load_board_fee_acknowledged_at: at,
      load_board_fee_acknowledged_source: source,
    });
  }
  return { success: true, acknowledged_at: at };
}

export function recordLoadBoardFeeAcknowledgmentOnCustomer(customerId, { source = 'checkout' } = {}) {
  if (!customerId) return null;
  const at = nowIso();
  return updateEntity('Customer', customerId, {
    load_board_fee_acknowledged_at: at,
    load_board_fee_acknowledged_source: source,
  });
}

export function requireLoadBoardFeeAcknowledgment(body) {
  if (!body?.load_board_fee_acknowledged) {
    throw new Error(
      `You must agree to the ${LOAD_BOARD_FEE_PERCENT}% load board platform fee and credit card on file before continuing.`,
    );
  }
  return true;
}

import {
  createEntity,
  filterEntities,
  findUserById,
  getEntity,
  nowIso,
  updateEntity,
} from './db.js';
import { isInternalRole } from './entityScope.js';
import { canManageCustomerFunding } from './payrollBanking.js';
import { decryptSensitive } from './payrollVault.js';

export function assertCanDisburse(user) {
  if (canManageCustomerFunding(user) || isInternalRole(user.role)) return;
  throw new Error('Only customer HR/owner or FleetCo staff can initiate direct deposit');
}

function buildAchCsvRows(customerId, records) {
  const funding = filterEntities('CustomerFundingAccount', { customer_id: customerId, status: 'active' }, null, 1)[0];
  if (!funding) throw new Error('Company funding bank account not configured');

  const lines = [
    'EmployeeName,EmployeeEmail,NetPay,RoutingNumber,AccountNumber,AccountType,PayrollRecordId',
  ];

  for (const rec of records) {
    const payeeUserId = rec.driver_id || rec.employee_user_id;
    if (!payeeUserId) continue;
    const bank = filterEntities('PayeeBankAccount', { user_id: payeeUserId, status: 'active' }, null, 1)[0];
    if (!bank) continue;

    const routing = decryptSensitive(bank.routing_ciphertext, bank.routing_enc_mode);
    const account = decryptSensitive(bank.account_ciphertext, bank.account_enc_mode);
    const user = findUserById(payeeUserId);

    lines.push(
      [
        `"${(rec.driver_name || user?.full_name || '').replace(/"/g, '')}"`,
        `"${user?.email || ''}"`,
        Number(rec.net_pay || 0).toFixed(2),
        routing,
        account,
        bank.account_type || 'checking',
        rec.id,
      ].join(','),
    );
  }

  if (lines.length <= 1) {
    throw new Error('No payees with bank info found for the selected payroll records');
  }

  return lines.join('\n');
}

export function initiateDirectDeposit(user, { customer_id, payroll_record_ids, note }) {
  assertCanDisburse(user);
  const customerId = customer_id || user.customer_id;
  if (!customerId) throw new Error('customer_id required');

  const ids = payroll_record_ids || [];
  if (!ids.length) throw new Error('payroll_record_ids required');

  const records = ids.map((id) => getEntity('PayrollRecord', id)).filter(Boolean);
  const scoped = records.filter((r) => !r.customer_id || r.customer_id === customerId);
  if (scoped.length !== records.length) {
    throw new Error('One or more payroll records are outside your organization');
  }

  const eligible = scoped.filter((r) => ['approved', 'paid'].includes(r.status) && (r.net_pay || 0) > 0);
  if (!eligible.length) {
    throw new Error('Select approved payroll records with net pay greater than zero');
  }

  const batchId = `DD-${Date.now()}`;
  const ts = nowIso();
  const disbursements = [];

  for (const rec of eligible) {
    const payeeUserId = rec.driver_id || rec.employee_user_id;
    const bank = payeeUserId
      ? filterEntities('PayeeBankAccount', { user_id: payeeUserId, status: 'active' }, null, 1)[0]
      : null;

    const item = createEntity('PayrollDisbursement', {
      batch_id: batchId,
      customer_id: customerId,
      payroll_record_id: rec.id,
      payee_user_id: payeeUserId || '',
      amount: rec.net_pay,
      status: bank ? 'ready_for_export' : 'missing_bank',
      payment_method: 'ach',
      note: note || '',
      initiated_by: user.email,
      initiated_at: ts,
    });
    disbursements.push(item);

    if (bank && rec.status === 'approved') {
      updateEntity('PayrollRecord', rec.id, { status: 'paid', payment_method: 'Direct Deposit', paid_at: ts });
    }
  }

  let achExport = null;
  try {
    achExport = buildAchCsvRows(customerId, eligible);
  } catch (err) {
    achExport = null;
  }

  createEntity('PayrollDisbursementBatch', {
    batch_id: batchId,
    customer_id: customerId,
    record_count: disbursements.length,
    total_amount: disbursements.reduce((s, d) => s + (d.amount || 0), 0),
    status: achExport ? 'ready_for_export' : 'needs_setup',
    initiated_by: user.email,
    initiated_at: ts,
  });

  return {
    success: true,
    batch_id: batchId,
    disbursements,
    ach_export_csv: achExport,
    message: achExport
      ? 'Direct deposit batch created. Download the ACH CSV and upload to your bank, or connect a payment processor later.'
      : 'Batch created but ACH file could not be built — add company funding account and employee bank profiles.',
  };
}

/** Default chart of accounts for fleet operators (simplified). */

export const DEFAULT_CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Cash & Bank', type: 'Asset', normal_balance: 'debit' },
  { code: '1100', name: 'Accounts Receivable', type: 'Asset', normal_balance: 'debit' },
  { code: '1200', name: 'Parts Inventory', type: 'Asset', normal_balance: 'debit' },
  { code: '1500', name: 'Vehicles & Equipment', type: 'Asset', normal_balance: 'debit' },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', normal_balance: 'credit' },
  { code: '2100', name: 'Payroll Taxes Payable', type: 'Liability', normal_balance: 'credit' },
  { code: '2200', name: 'Sales Tax Payable', type: 'Liability', normal_balance: 'credit' },
  { code: '3000', name: 'Owner Equity', type: 'Equity', normal_balance: 'credit' },
  { code: '4000', name: 'Freight Revenue', type: 'Revenue', normal_balance: 'credit' },
  { code: '4100', name: 'Management Services Revenue', type: 'Revenue', normal_balance: 'credit' },
  { code: '5000', name: 'Fuel Expense', type: 'Expense', normal_balance: 'debit' },
  { code: '5100', name: 'Repairs & Maintenance', type: 'Expense', normal_balance: 'debit' },
  { code: '5200', name: 'Payroll Expense', type: 'Expense', normal_balance: 'debit' },
  { code: '5300', name: 'Parts & Supplies', type: 'Expense', normal_balance: 'debit' },
  { code: '5400', name: 'Insurance', type: 'Expense', normal_balance: 'debit' },
  { code: '5500', name: 'Permits & Compliance', type: 'Expense', normal_balance: 'debit' },
];

export function accountMap(accounts) {
  return Object.fromEntries((accounts || []).map(a => [a.code, a]));
}

export function journalEntryBalanced(lineItems) {
  const debit = lineItems.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const credit = lineItems.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  return Math.abs(debit - credit) < 0.01;
}

export function suggestJournalForPO(po) {
  const total = Number(po.total) || 0;
  const tax = Number(po.tax_amount) || 0;
  const partsCost = total - tax - (Number(po.shipping) || 0);
  return {
    description: `PO ${po.po_number} — ${po.vendor_name || 'vendor'}`,
    line_items: [
      { account_code: '5300', account_name: 'Parts & Supplies', debit: partsCost, credit: 0, memo: 'Parts PO' },
      { account_code: '2200', account_name: 'Sales Tax Payable', debit: tax, credit: 0, memo: 'Sales tax' },
      { account_code: '2000', account_name: 'Accounts Payable', debit: 0, credit: total, memo: po.po_number },
    ],
  };
}

export function suggestJournalForPayrollRun(run) {
  const net = Number(run.total_net) || 0;
  const taxes = Number(run.total_taxes) || 0;
  const gross = Number(run.total_gross) || 0;
  return {
    description: `Payroll run ${run.run_number}`,
    line_items: [
      { account_code: '5200', account_name: 'Payroll Expense', debit: gross, credit: 0, memo: 'Gross wages' },
      { account_code: '2100', account_name: 'Payroll Taxes Payable', debit: 0, credit: taxes, memo: 'Withholdings' },
      { account_code: '1000', account_name: 'Cash & Bank', debit: 0, credit: net, memo: 'Net pay' },
    ],
  };
}

export async function ensureDefaultChart(api, customerId) {
  const existing = await api.entities.ChartOfAccount.list();
  const hasMine = existing.some(a => a.customer_id === customerId || (!customerId && !a.customer_id));
  if (hasMine && existing.length >= DEFAULT_CHART_OF_ACCOUNTS.length) return existing;

  const created = [];
  for (const acct of DEFAULT_CHART_OF_ACCOUNTS) {
    if (existing.some(e => e.code === acct.code && e.customer_id === customerId)) continue;
    const row = await api.entities.ChartOfAccount.create({
      ...acct,
      customer_id: customerId || null,
      active: true,
    });
    created.push(row);
  }
  return [...existing, ...created];
}

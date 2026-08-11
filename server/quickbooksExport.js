import { filterEntities } from './db.js';
import { isFleetCoInternal } from './roles.js';

function csvEscape(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportQuickBooksCsv(user, { customerId, startDate, endDate } = {}) {
  if (!user) throw new Error('Unauthorized');

  let cid = customerId || user.customer_id;
  if (!cid && !isFleetCoInternal(user.role)) {
    throw new Error('Customer context required');
  }

  let entries = filterEntities('JournalEntry', cid ? { customer_id: cid } : {});
  if (startDate) entries = entries.filter((e) => (e.entry_date || e.created_date || '') >= startDate);
  if (endDate) entries = entries.filter((e) => (e.entry_date || e.created_date || '') <= endDate);

  const lines = [];
  lines.push([
    'Date',
    'Account',
    'Debit',
    'Credit',
    'Memo',
    'Reference',
    'Customer',
  ].join(','));

  for (const entry of entries) {
    const date = (entry.entry_date || entry.created_date || '').slice(0, 10);
    for (const line of entry.lines || []) {
      lines.push([
        csvEscape(date),
        csvEscape(line.account_name || line.account_code || ''),
        csvEscape(line.debit || ''),
        csvEscape(line.credit || ''),
        csvEscape(line.memo || entry.memo || ''),
        csvEscape(entry.reference || entry.id || ''),
        csvEscape(entry.customer_name || ''),
      ].join(','));
    }
  }

  let invoices = filterEntities('Invoice', cid ? { customer_id: cid } : {});
  if (startDate) invoices = invoices.filter((i) => (i.invoice_date || i.created_date || '') >= startDate);
  if (endDate) invoices = invoices.filter((i) => (i.invoice_date || i.created_date || '') <= endDate);

  lines.push('');
  lines.push(['Invoice Export'].join(','));
  lines.push(['Date', 'Invoice #', 'Customer', 'Amount', 'Status', 'Memo'].join(','));
  for (const inv of invoices) {
    lines.push([
      csvEscape((inv.invoice_date || inv.created_date || '').slice(0, 10)),
      csvEscape(inv.invoice_number || inv.id),
      csvEscape(inv.bill_to_name || inv.customer_name || ''),
      csvEscape(inv.total || inv.amount || ''),
      csvEscape(inv.status || ''),
      csvEscape(inv.notes || ''),
    ].join(','));
  }

  return {
    filename: `fleetco-quickbooks-${new Date().toISOString().slice(0, 10)}.csv`,
    content: lines.join('\n'),
    entryCount: entries.length,
    invoiceCount: invoices.length,
  };
}

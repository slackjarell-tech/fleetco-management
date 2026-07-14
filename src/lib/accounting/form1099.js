/** 1099-NEC contractor payment summary for year-end filing prep. */

export function build1099Summary(payrollRecords, users, taxYear) {
  const year = taxYear || new Date().getFullYear();
  const contractors = {};

  (payrollRecords || []).forEach(r => {
    if (r.pay_type !== '1099') return;
    if (r.status !== 'paid' && r.status !== 'approved') return;
    const end = r.pay_period_end || r.pay_period_start || '';
    if (end && !String(end).startsWith(String(year))) return;

    const key = r.driver_id || r.driver_name;
    if (!contractors[key]) {
      const user = (users || []).find(u => u.id === r.driver_id);
      contractors[key] = {
        contractor_id: r.driver_id,
        legal_name: r.driver_name || user?.full_name || 'Unknown',
        email: user?.email || '',
        tax_id: user?.tax_id || user?.ssn_last4 ? `***-**-${user.ssn_last4}` : '',
        address: user?.address || '',
        city: user?.city || '',
        state: user?.state || '',
        zip: user?.zip || '',
        payments: 0,
        payment_count: 0,
      };
    }
    contractors[key].payments += Number(r.net_pay ?? r.gross_pay) || 0;
    contractors[key].payment_count += 1;
  });

  return Object.values(contractors)
    .filter(c => c.payments >= 600)
    .sort((a, b) => b.payments - a.payments);
}

export function form1099CsvRows(summary, payer = {}) {
  const rows = [[
    'Contractor Name', 'Email', 'Tax ID (last 4 if on file)', 'Address', 'City', 'State', 'ZIP',
    'Box 1 Nonemployee Compensation', 'Payment Count', 'Payer Name', 'Payer TIN', 'Tax Year',
  ]];
  summary.forEach(c => {
    rows.push([
      c.legal_name,
      c.email,
      c.tax_id,
      c.address,
      c.city,
      c.state,
      c.zip,
      c.payments.toFixed(2),
      c.payment_count,
      payer.name || 'FleetCo Management LLC',
      payer.tin || '',
      payer.taxYear || new Date().getFullYear(),
    ]);
  });
  return rows;
}

export function download1099Csv(summary, payer, filename) {
  const rows = form1099CsvRows(summary, payer);
  const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `1099-NEC_Summary_${payer.taxYear || new Date().getFullYear()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Aggregate Time Clock shift hours for payroll import. */

export function filterTimeClockEntries(entries, { dateFrom, dateTo, userId, customerUserIds } = {}) {
  return (entries || []).filter(e => {
    if (e.entry_type !== 'shift') return false;
    const day = (e.date || e.clock_in || '').slice(0, 10);
    if (dateFrom && day && day < dateFrom) return false;
    if (dateTo && day && day > dateTo) return false;
    if (userId && e.user_id !== userId) return false;
    if (customerUserIds?.length && !customerUserIds.includes(e.user_id)) return false;
    return true;
  });
}

export function minutesForEntry(entry) {
  if (entry.duration_minutes != null) return Number(entry.duration_minutes) || 0;
  if (entry.clock_in && entry.clock_out) {
    return Math.max(0, (new Date(entry.clock_out) - new Date(entry.clock_in)) / 60000);
  }
  return 0;
}

export function hoursByUser(entries, options = {}) {
  const filtered = filterTimeClockEntries(entries, options);
  const map = {};
  filtered.forEach(e => {
    const mins = minutesForEntry(e);
    if (!map[e.user_id]) {
      map[e.user_id] = { user_id: e.user_id, user_name: e.user_name, minutes: 0, shifts: 0 };
    }
    map[e.user_id].minutes += mins;
    map[e.user_id].shifts += 1;
  });
  return Object.values(map).map(row => ({
    ...row,
    hours: round2(row.minutes / 60),
  })).sort((a, b) => b.hours - a.hours);
}

export function buildPayrollDraftFromTimeClock({ driver, hours, periodStart, periodEnd, hourlyRate = 0, payType = 'Hourly' }) {
  const gross = round2(hours * hourlyRate);
  return {
    driver_id: driver.id,
    driver_name: driver.full_name,
    pay_type: payType,
    pay_period_start: periodStart,
    pay_period_end: periodEnd,
    hours_worked: hours,
    hourly_rate: hourlyRate,
    gross_pay: gross,
    bonuses: 0,
    deductions: 0,
    net_pay: gross,
    status: 'draft',
    payment_method: 'Direct Deposit',
    notes: `Auto-imported from Time Clock (${hours} hrs)`,
  };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

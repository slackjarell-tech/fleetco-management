import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calculateW2Withholding, calculate1099Estimate } from '@/lib/accounting/taxEngine';

const PAY_TYPES = ['W2', '1099', 'Per Mile', 'Per Stop', 'Salary', 'Hourly'];
const PAYMENT_METHODS = ['Direct Deposit', 'Check', 'Cash', 'Zelle', 'Other'];

const PAY_TYPE_DESCRIPTIONS = {
  W2: 'Employee — taxes withheld by employer. Enter hours worked × hourly rate.',
  '1099': 'Independent contractor — driver handles own taxes. Enter flat amount or calculated earnings.',
  'Per Mile': 'Pay based on miles driven. Pull from HOS logs or enter manually.',
  'Per Stop': 'Pay based on completed delivery stops.',
  Salary: 'Fixed pay for this pay period regardless of hours.',
  Hourly: 'Hours worked × hourly rate (similar to W2 but may be contract-based).',
};

// Get week range defaults
const getDefaultPeriod = () => {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

export default function PayrollRunModal({ record, drivers, hosLogs, deliveryStops, onSave, onClose, customerState = 'TX' }) {
  const period = getDefaultPeriod();

  const [form, setForm] = useState({
    driver_id: record?.driver_id || '',
    driver_name: record?.driver_name || '',
    pay_type: record?.pay_type || 'W2',
    pay_period_start: record?.pay_period_start || period.start,
    pay_period_end: record?.pay_period_end || period.end,
    hours_worked: record?.hours_worked || '',
    hourly_rate: record?.hourly_rate || '',
    miles_driven: record?.miles_driven || '',
    rate_per_mile: record?.rate_per_mile || '',
    stops_completed: record?.stops_completed || '',
    rate_per_stop: record?.rate_per_stop || '',
    salary_amount: record?.salary_amount || '',
    gross_pay: record?.gross_pay || 0,
    bonuses: record?.bonuses || 0,
    deductions: record?.deductions || 0,
    net_pay: record?.net_pay || 0,
    status: record?.status || 'draft',
    payment_method: record?.payment_method || 'Direct Deposit',
    notes: record?.notes || '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Auto-fill driver name when driver selected
  const handleDriverChange = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    set('driver_id', driverId);
    if (driver) set('driver_name', driver.full_name);

    // Auto-fill HOS hours for this driver in this period
    const driverLogs = hosLogs.filter(l =>
      l.driver_id === driverId &&
      l.log_date >= form.pay_period_start &&
      l.log_date <= form.pay_period_end
    );
    const totalHours = driverLogs.reduce((s, l) => s + (l.hours_driving || 0) + (l.hours_on_duty || 0), 0);
    const totalMiles = driverLogs.reduce((s, l) => s + (l.total_miles || 0), 0);
    if (totalHours > 0) set('hours_worked', parseFloat(totalHours.toFixed(2)));
    if (totalMiles > 0) set('miles_driven', parseFloat(totalMiles.toFixed(1)));

    // Auto-fill stops
    const driverStops = deliveryStops.filter(s => {
      // We'd need route info — just use count for now
      return false; // placeholder
    });
  };

  // Auto-calculate gross pay and tax withholdings
  useEffect(() => {
    let gross = 0;
    const pt = form.pay_type;
    if (pt === 'W2' || pt === 'Hourly') {
      gross = (parseFloat(form.hours_worked) || 0) * (parseFloat(form.hourly_rate) || 0);
    } else if (pt === 'Per Mile') {
      gross = (parseFloat(form.miles_driven) || 0) * (parseFloat(form.rate_per_mile) || 0);
    } else if (pt === 'Per Stop') {
      gross = (parseFloat(form.stops_completed) || 0) * (parseFloat(form.rate_per_stop) || 0);
    } else if (pt === 'Salary') {
      gross = parseFloat(form.salary_amount) || 0;
    } else if (pt === '1099') {
      const fromHours = (parseFloat(form.hours_worked) || 0) * (parseFloat(form.hourly_rate) || 0);
      const fromMiles = (parseFloat(form.miles_driven) || 0) * (parseFloat(form.rate_per_mile) || 0);
      gross = fromHours + fromMiles || parseFloat(form.salary_amount) || 0;
    }
    gross += parseFloat(form.bonuses) || 0;

    let deductions = parseFloat(form.deductions) || 0;
    let net = gross - deductions;

    if (pt === 'W2' || pt === 'Hourly') {
      const tax = calculateW2Withholding(gross, { state: customerState });
      deductions = tax.totalEmployeeWithholding;
      net = tax.netPay;
    } else if (pt === '1099') {
      deductions = 0;
      net = gross;
    }

    setForm(p => ({
      ...p,
      gross_pay: parseFloat(gross.toFixed(2)),
      deductions: parseFloat(deductions.toFixed(2)),
      net_pay: parseFloat(net.toFixed(2)),
    }));
  }, [form.pay_type, form.hours_worked, form.hourly_rate, form.miles_driven, form.rate_per_mile, form.stops_completed, form.rate_per_stop, form.salary_amount, form.bonuses, customerState]);

  const taxPreview = useMemo(() => {
    const gross = parseFloat(form.gross_pay) || 0;
    if (form.pay_type === 'W2' || form.pay_type === 'Hourly') {
      return calculateW2Withholding(gross, { state: customerState });
    }
    if (form.pay_type === '1099') return calculate1099Estimate(gross);
    return null;
  }, [form.gross_pay, form.pay_type, customerState]);

  const canSave = form.driver_id && form.pay_type && form.pay_period_start && form.pay_period_end;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl">
          <div>
            <div className="text-white font-black">{record ? 'Edit Payroll Entry' : 'Run Payroll'}</div>
            <div className="text-slate-400 text-xs">Select driver, pay type, and period</div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Driver */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Driver *</label>
            <select value={form.driver_id} onChange={e => handleDriverChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">— Select driver —</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
          </div>

          {/* Pay Type */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Pay Type *</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {PAY_TYPES.map(pt => (
                <button key={pt} onClick={() => set('pay_type', pt)}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-bold transition-all ${
                    form.pay_type === pt
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-200 text-slate-500 hover:border-amber-300'
                  }`}>
                  {pt}
                </button>
              ))}
            </div>
            {form.pay_type && (
              <div className="flex gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                {PAY_TYPE_DESCRIPTIONS[form.pay_type]}
              </div>
            )}
          </div>

          {/* Pay Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Period Start *</label>
              <Input type="date" value={form.pay_period_start} onChange={e => set('pay_period_start', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Period End *</label>
              <Input type="date" value={form.pay_period_end} onChange={e => set('pay_period_end', e.target.value)} />
            </div>
          </div>

          {/* Pay inputs based on type */}
          {(form.pay_type === 'W2' || form.pay_type === 'Hourly') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Hours Worked</label>
                <Input type="number" placeholder="0.00" value={form.hours_worked} onChange={e => set('hours_worked', e.target.value)} />
                <p className="text-xs text-slate-400 mt-1">Auto-filled from HOS logs</p>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Hourly Rate ($)</label>
                <Input type="number" placeholder="0.00" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} />
              </div>
            </div>
          )}

          {form.pay_type === '1099' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Hours (optional)</label>
                  <Input type="number" placeholder="0.00" value={form.hours_worked} onChange={e => set('hours_worked', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Rate/Hr ($)</label>
                  <Input type="number" placeholder="0.00" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Miles (optional)</label>
                  <Input type="number" placeholder="0" value={form.miles_driven} onChange={e => set('miles_driven', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Rate/Mile ($)</label>
                  <Input type="number" placeholder="0.00" value={form.rate_per_mile} onChange={e => set('rate_per_mile', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Or: Fixed Amount ($)</label>
                <Input type="number" placeholder="0.00" value={form.salary_amount} onChange={e => set('salary_amount', e.target.value)} />
              </div>
            </div>
          )}

          {form.pay_type === 'Per Mile' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Miles Driven</label>
                <Input type="number" placeholder="0" value={form.miles_driven} onChange={e => set('miles_driven', e.target.value)} />
                <p className="text-xs text-slate-400 mt-1">Auto-filled from HOS logs</p>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Rate Per Mile ($)</label>
                <Input type="number" placeholder="0.00" value={form.rate_per_mile} onChange={e => set('rate_per_mile', e.target.value)} />
              </div>
            </div>
          )}

          {form.pay_type === 'Per Stop' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Stops Completed</label>
                <Input type="number" placeholder="0" value={form.stops_completed} onChange={e => set('stops_completed', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Rate Per Stop ($)</label>
                <Input type="number" placeholder="0.00" value={form.rate_per_stop} onChange={e => set('rate_per_stop', e.target.value)} />
              </div>
            </div>
          )}

          {form.pay_type === 'Salary' && (
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Salary Amount ($)</label>
              <Input type="number" placeholder="0.00" value={form.salary_amount} onChange={e => set('salary_amount', e.target.value)} />
            </div>
          )}

          {/* Bonuses & Deductions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Bonuses ($)</label>
              <Input type="number" placeholder="0.00" value={form.bonuses} onChange={e => set('bonuses', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">
                {form.pay_type === 'W2' || form.pay_type === 'Hourly' ? 'Tax withholdings ($)' : 'Deductions ($)'}
              </label>
              <Input type="number" placeholder="0.00" value={form.deductions}
                readOnly={form.pay_type === 'W2' || form.pay_type === 'Hourly'}
                onChange={e => set('deductions', e.target.value)} />
            </div>
          </div>

          {taxPreview?.breakdown && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
              <div className="font-black text-amber-900 mb-1">Tax breakdown (auto-calculated)</div>
              {taxPreview.breakdown.map(b => (
                <div key={b.label} className="flex justify-between text-amber-800">
                  <span>{b.label}</span><span>${b.amount}</span>
                </div>
              ))}
              {taxPreview.employerTaxes != null && (
                <div className="flex justify-between text-amber-700 pt-1 border-t border-amber-200 font-semibold">
                  <span>Employer taxes (est.)</span><span>${taxPreview.employerTaxes}</span>
                </div>
              )}
            </div>
          )}

          {/* Auto-calculated Pay Summary */}
          <div className="bg-slate-900 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span className="text-white font-black text-sm">Pay Summary</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Gross Pay</span>
              <span className="text-white font-bold">${(form.gross_pay - (parseFloat(form.bonuses) || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Bonuses</span>
              <span className="text-green-400 font-bold">+${(parseFloat(form.bonuses) || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Deductions</span>
              <span className="text-red-400 font-bold">-${(parseFloat(form.deductions) || 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between">
              <span className="text-white font-black">Net Pay</span>
              <span className="text-amber-400 font-black text-lg">${form.net_pay.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Payment Method</label>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="Any additional notes..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5 pt-3 border-t border-slate-100">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
            onClick={() => onSave(form)}
            disabled={!canSave}
          >
            {record ? 'Save Changes' : 'Create Payroll Entry'}
          </Button>
        </div>
      </div>
    </div>
  );
}
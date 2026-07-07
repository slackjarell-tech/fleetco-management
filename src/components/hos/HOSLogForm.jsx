import React, { useState } from 'react';
import { Plus, Trash2, X, Save } from 'lucide-react';
import HOSGrid from './HOSGrid';
import HOSViolations, { detectViolations } from './HOSViolations';

const STATUS_OPTIONS = [
  { value: 'off_duty', label: 'Off Duty' },
  { value: 'sleeper_berth', label: 'Sleeper Berth' },
  { value: 'driving', label: 'Driving' },
  { value: 'on_duty_not_driving', label: 'On Duty (Not Driving)' },
];

function minutesToHours(segments, status) {
  return segments
    .filter(s => s.status === status && s.start_time && s.end_time)
    .reduce((sum, s) => {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      const mins = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
      return sum + mins / 60;
    }, 0);
}

export default function HOSLogForm({ vehicles, users, onSave, onClose, initialData = null, currentUser }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    driver_id: initialData?.driver_id || currentUser?.id || '',
    vehicle_id: initialData?.vehicle_id || '',
    log_date: initialData?.log_date || today,
    carrier_name: initialData?.carrier_name || '',
    starting_location: initialData?.starting_location || '',
    ending_location: initialData?.ending_location || '',
    odometer_start: initialData?.odometer_start ?? '',
    odometer_end: initialData?.odometer_end ?? '',
    shipping_docs: initialData?.shipping_docs || '',
    remarks: initialData?.remarks || '',
    signature_confirmed: initialData?.signature_confirmed || false,
    duty_segments: initialData?.duty_segments || [],
    status: initialData?.status || 'draft',
  });

  const [newSeg, setNewSeg] = useState({ status: 'driving', start_time: '', end_time: '', location: '', notes: '' });

  const addSegment = () => {
    if (!newSeg.start_time || !newSeg.end_time) return;
    setForm(f => ({ ...f, duty_segments: [...f.duty_segments, { ...newSeg }] }));
    setNewSeg({ status: 'driving', start_time: '', end_time: '', location: '', notes: '' });
  };

  const removeSegment = (i) => setForm(f => ({ ...f, duty_segments: f.duty_segments.filter((_, idx) => idx !== i) }));

  const hours_driving = minutesToHours(form.duty_segments, 'driving');
  const hours_on_duty = minutesToHours(form.duty_segments, 'on_duty_not_driving');
  const hours_sleeper = minutesToHours(form.duty_segments, 'sleeper_berth');
  const hours_off_duty = minutesToHours(form.duty_segments, 'off_duty');
  const total_miles = form.odometer_end && form.odometer_start ? Number(form.odometer_end) - Number(form.odometer_start) : 0;

  const logForViolations = { ...form, hours_driving, hours_on_duty, hours_sleeper, hours_off_duty };
  const violations = detectViolations(logForViolations);

  const handleSubmit = (submitStatus) => {
    onSave({
      ...form,
      hours_driving: parseFloat(hours_driving.toFixed(2)),
      hours_on_duty: parseFloat(hours_on_duty.toFixed(2)),
      hours_sleeper: parseFloat(hours_sleeper.toFixed(2)),
      hours_off_duty: parseFloat(hours_off_duty.toFixed(2)),
      total_miles: total_miles || undefined,
      violations,
      status: submitStatus,
    });
  };

  const drivers = users.filter(u => u.role === 'driver');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center py-6 px-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
            <div>
              <h2 className="text-lg font-black text-slate-900">Driver's Daily Log</h2>
              <p className="text-xs text-slate-500">FMCSA Hours of Service Record</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 space-y-6">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Date *</label>
                <input type="date" value={form.log_date} onChange={e => setForm(f => ({ ...f, log_date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Driver *</label>
                <select value={form.driver_id} onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                  <option value="">Select driver...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Vehicle</label>
                <select value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>Unit {v.unit_number} — {v.make} {v.model}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Carrier Name</label>
                <input value={form.carrier_name} onChange={e => setForm(f => ({ ...f, carrier_name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Your company name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Starting Location</label>
                <input value={form.starting_location} onChange={e => setForm(f => ({ ...f, starting_location: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="City, ST" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ending Location</label>
                <input value={form.ending_location} onChange={e => setForm(f => ({ ...f, ending_location: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="City, ST" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Odometer Start</label>
                <input type="number" value={form.odometer_start} onChange={e => setForm(f => ({ ...f, odometer_start: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Odometer End</label>
                <input type="number" value={form.odometer_end} onChange={e => setForm(f => ({ ...f, odometer_end: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Shipping Docs / BOL</label>
                <input value={form.shipping_docs} onChange={e => setForm(f => ({ ...f, shipping_docs: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="BOL numbers" />
              </div>
            </div>

            {/* Duty segments */}
            <div>
              <div className="text-sm font-black text-slate-700 mb-3">Duty Status Log</div>

              {/* Add row */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                    <select value={newSeg.status} onChange={e => setNewSeg(s => ({ ...s, status: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                      {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">From</label>
                    <input type="time" value={newSeg.start_time} onChange={e => setNewSeg(s => ({ ...s, start_time: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">To</label>
                    <input type="time" value={newSeg.end_time} onChange={e => setNewSeg(s => ({ ...s, end_time: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Location</label>
                    <input placeholder="City, ST" value={newSeg.location} onChange={e => setNewSeg(s => ({ ...s, location: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <button onClick={addSegment}
                    className="flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-3 py-2 rounded-lg text-xs">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Segments list */}
              {form.duty_segments.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {form.duty_segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        seg.status === 'driving' ? 'bg-emerald-500' :
                        seg.status === 'on_duty_not_driving' ? 'bg-amber-400' :
                        seg.status === 'sleeper_berth' ? 'bg-blue-400' : 'bg-slate-300'
                      }`} />
                      <span className="font-bold text-slate-700 w-36 flex-shrink-0">{STATUS_OPTIONS.find(o => o.value === seg.status)?.label}</span>
                      <span className="text-slate-500">{seg.start_time} – {seg.end_time}</span>
                      {seg.location && <span className="text-slate-400 truncate">{seg.location}</span>}
                      <button onClick={() => removeSegment(i)} className="ml-auto text-slate-300 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Visual grid */}
              {form.duty_segments.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-bold text-slate-500 mb-3">24-HOUR GRID</div>
                  <HOSGrid segments={form.duty_segments} />
                </div>
              )}
            </div>

            {/* Hours summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Off Duty', val: hours_off_duty, color: 'text-slate-500' },
                { label: 'Sleeper', val: hours_sleeper, color: 'text-blue-600' },
                { label: 'Driving', val: hours_driving, color: 'text-emerald-600' },
                { label: 'On Duty', val: hours_on_duty, color: 'text-amber-600' },
              ].map(h => (
                <div key={h.label} className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className={`text-xl font-black ${h.color}`}>{h.val.toFixed(1)}</div>
                  <div className="text-xs text-slate-400">{h.label} hrs</div>
                </div>
              ))}
            </div>

            {/* Violations */}
            <div>
              <div className="text-sm font-black text-slate-700 mb-2">FMCSA Compliance Check</div>
              <HOSViolations violations={violations} />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Remarks</label>
              <textarea rows={2} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                placeholder="Additional remarks..." />
            </div>

            {/* Certification */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={form.signature_confirmed}
                onChange={e => setForm(f => ({ ...f, signature_confirmed: e.target.checked }))}
                className="mt-0.5 accent-amber-500" />
              <span className="text-xs text-slate-600">
                I hereby certify that my data entries are true and accurate to the best of my knowledge.
                <span className="font-bold"> 49 CFR 395.8(j).</span>
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button onClick={() => handleSubmit('draft')}
              className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-lg text-sm">
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button
              disabled={!form.driver_id || !form.signature_confirmed}
              onClick={() => handleSubmit('submitted')}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-black px-4 py-2.5 rounded-lg text-sm">
              Submit Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
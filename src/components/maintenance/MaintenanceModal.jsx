import React, { useState } from 'react';
import { X } from 'lucide-react';

const SERVICE_TYPES = ['Oil Change','Tire Rotation','Brake Service','Transmission Service','Air Filter','Fuel Filter','Coolant Flush','Belt Replacement','Spark Plugs','DEF System','DPF Filter','Annual Inspection','Custom'];

export default function MaintenanceModal({ schedule, vehicles, onSave, onClose }) {
  const [form, setForm] = useState(schedule || {
    vehicle_id: '', service_type: 'Oil Change', status: 'scheduled',
    due_date: '', due_mileage: '', interval_miles: '', interval_days: '',
    last_service_date: '', last_service_mileage: '', assigned_tech: '', estimated_cost: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-black text-slate-900">{schedule ? 'Edit PM Schedule' : 'Schedule Preventive Maintenance'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Vehicle *</label>
            <select required value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
              <option value="">Select vehicle</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>Unit {v.unit_number} - {v.make} {v.model}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Service Type *</label>
              <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                <option value="scheduled">Scheduled</option>
                <option value="upcoming">Due Soon</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Due Date</label>
              <input type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Due Mileage</label>
              <input type="number" value={form.due_mileage || ''} onChange={e => setForm(f => ({ ...f, due_mileage: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Miles" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Interval (miles)</label>
              <input type="number" value={form.interval_miles || ''} onChange={e => setForm(f => ({ ...f, interval_miles: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. 5000" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Interval (days)</label>
              <input type="number" value={form.interval_days || ''} onChange={e => setForm(f => ({ ...f, interval_days: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. 90" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Last Service Date</label>
              <input type="date" value={form.last_service_date || ''} onChange={e => setForm(f => ({ ...f, last_service_date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Est. Cost ($)</label>
              <input type="number" value={form.estimated_cost || ''} onChange={e => setForm(f => ({ ...f, estimated_cost: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Assigned Tech</label>
            <input type="text" value={form.assigned_tech || ''} onChange={e => setForm(f => ({ ...f, assigned_tech: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Technician name" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 h-20 resize-none" placeholder="Notes..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2.5 rounded-lg text-sm disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { X } from 'lucide-react';

const CHECKLIST_ITEMS = ['Brakes', 'Tires', 'Lights', 'Mirrors', 'Wipers', 'Horn', 'Steering', 'Fuel System', 'Exhaust', 'Coupling Devices', 'Emergency Equipment', 'Cargo Securement'];

export default function InspectionModal({ inspection, vehicles, onSave, onClose }) {
  const [form, setForm] = useState(inspection || {
    vehicle_id: '', inspection_type: 'Pre-Trip', inspection_date: new Date().toISOString().split('T')[0],
    inspector_name: '', odometer: '', status: 'pending', notes: '',
    items_checked: CHECKLIST_ITEMS.map(item => ({ item, result: 'ok', notes: '' })),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const updateItem = (idx, field, value) => {
    const items = [...(form.items_checked || [])];
    items[idx] = { ...items[idx], [field]: value };
    setForm(f => ({ ...f, items_checked: items }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-black text-slate-900">{inspection ? 'Edit Inspection' : 'New Inspection'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Vehicle *</label>
              <select required value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>Unit {v.unit_number} - {v.make} {v.model}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Type *</label>
              <select value={form.inspection_type} onChange={e => setForm(f => ({ ...f, inspection_type: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                {['Pre-Trip','Post-Trip','Annual DOT','Brake Inspection','Tire Inspection','Safety Check','Emissions','Custom'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Date *</label>
              <input type="date" required value={form.inspection_date} onChange={e => setForm(f => ({ ...f, inspection_date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Inspector Name</label>
              <input type="text" value={form.inspector_name || ''} onChange={e => setForm(f => ({ ...f, inspector_name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Inspector name" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Odometer</label>
              <input type="number" value={form.odometer || ''} onChange={e => setForm(f => ({ ...f, odometer: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Miles" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Result</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                <option value="pending">Pending</option>
                <option value="passed">Passed</option>
                <option value="needs_attention">Needs Attention</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase block mb-2">Inspection Checklist</label>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-bold text-slate-500">Item</th>
                    <th className="text-left px-3 py-2 text-xs font-bold text-slate-500">Result</th>
                    <th className="text-left px-3 py-2 text-xs font-bold text-slate-500">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(form.items_checked || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-slate-700 font-medium">{item.item}</td>
                      <td className="px-3 py-2">
                        <select value={item.result} onChange={e => updateItem(idx, 'result', e.target.value)}
                          className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white">
                          <option value="ok">✓ OK</option>
                          <option value="defect">✗ Defect</option>
                          <option value="na">N/A</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input value={item.notes || ''} onChange={e => updateItem(idx, 'notes', e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                          placeholder="Optional note" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Additional Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 h-20 resize-none" placeholder="Any additional notes..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2.5 rounded-lg text-sm disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
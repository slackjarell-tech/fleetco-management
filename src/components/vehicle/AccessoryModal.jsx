import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACCESSORY_TYPES = [
  'crane', 'welder', 'reefer', 'liftgate', 'apu', 'pto', 'compressor', 'generator', 'other',
];

export default function AccessoryModal({ accessory, vehicles, customerId, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    accessory_type: accessory?.accessory_type || 'crane',
    brand: accessory?.brand || '',
    model: accessory?.model || '',
    serial_number: accessory?.serial_number || '',
    install_date: accessory?.install_date || '',
    warranty_expiry: accessory?.warranty_expiry || '',
    vehicle_id: accessory?.vehicle_id || '',
    notes: accessory?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      customer_id: accessory?.customer_id || customerId || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-black text-slate-900">
            {accessory ? 'Edit Accessory' : 'Add Vehicle Accessory'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 capitalize"
                value={form.accessory_type}
                onChange={(e) => set('accessory_type', e.target.value)}
              >
                {ACCESSORY_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Vehicle</label>
              <select
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.vehicle_id}
                onChange={(e) => set('vehicle_id', e.target.value)}
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.unit_number} — {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Brand *</label>
              <input
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
                placeholder="e.g. Auto Crane"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Model</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.model}
                onChange={(e) => set('model', e.target.value)}
                placeholder="Model number"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Serial Number *</label>
            <input
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={form.serial_number}
              onChange={(e) => set('serial_number', e.target.value)}
              placeholder="Manufacturer serial"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Install Date</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.install_date}
                onChange={(e) => set('install_date', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Warranty Expiry</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.warranty_expiry}
                onChange={(e) => set('warranty_expiry', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
            <textarea
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-semibold"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                {saving ? 'Saving...' : 'Save Accessory'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

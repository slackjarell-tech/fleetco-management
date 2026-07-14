import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['Engine', 'Transmission', 'Brakes', 'Tires', 'Electrical', 'HVAC', 'Suspension', 'Fuel System', 'Exhaust', 'Body', 'Filters', 'Fluids', 'Other'];

export default function PartModal({ part, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    part_number: part?.part_number || '',
    description: part?.description || '',
    category: part?.category || '',
    quantity_on_hand: part?.quantity_on_hand ?? 0,
    reorder_point: part?.reorder_point ?? 1,
    unit_cost: part?.unit_cost || '',
    supplier: part?.supplier || '',
    location: part?.location || '',
    notes: part?.notes || '',
    compatible_makes: part?.compatible_makes || '',
    compatible_models: part?.compatible_models || '',
    compatible_engines: part?.compatible_engines || '',
    compatible_brands: part?.compatible_brands || '',
    accessory_types: part?.accessory_types || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      quantity_on_hand: Number(form.quantity_on_hand) || 0,
      reorder_point: Number(form.reorder_point) || 1,
      unit_cost: form.unit_cost !== '' ? Number(form.unit_cost) : undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-black text-slate-900">{part ? 'Edit Part' : 'Add Part'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Part Number</label>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.part_number} onChange={e => set('part_number', e.target.value)} placeholder="e.g. BRK-1234" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Description *</label>
            <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={form.description} onChange={e => set('description', e.target.value)} placeholder="Part description" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Qty on Hand</label>
              <input type="number" min={0} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.quantity_on_hand} onChange={e => set('quantity_on_hand', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Reorder At</label>
              <input type="number" min={0} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.reorder_point} onChange={e => set('reorder_point', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Unit Cost ($)</label>
              <input type="number" min={0} step="0.01" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Supplier</label>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Vendor name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Location (Shelf/Bin)</label>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. A-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
            <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vehicle / Accessory Fitment (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Compatible Makes</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={form.compatible_makes} onChange={e => set('compatible_makes', e.target.value)} placeholder="Freightliner, Kenworth" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Compatible Models</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={form.compatible_models} onChange={e => set('compatible_models', e.target.value)} placeholder="Cascadia, T680" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Compatible Engines</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={form.compatible_engines} onChange={e => set('compatible_engines', e.target.value)} placeholder="Cummins ISX" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Accessory Brands</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={form.compatible_brands} onChange={e => set('compatible_brands', e.target.value)} placeholder="Miller, Auto Crane" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Accessory Types</label>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.accessory_types} onChange={e => set('accessory_types', e.target.value)} placeholder="crane, welder, reefer" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {onDelete ? (
              <button type="button" onClick={onDelete} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-semibold">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                {saving ? 'Saving...' : 'Save Part'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
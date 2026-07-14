import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calculateSalesTax } from '@/lib/accounting/taxEngine';

function lineTotal(line) {
  return (Number(line.quantity) || 0) * (Number(line.unit_cost) || 0);
}

export default function PurchaseOrderModal({ po, parts, vendors, user, customerState, onSave, onClose }) {
  const [form, setForm] = useState({
    vendor_id: po?.vendor_id || '',
    tax_state: po?.tax_state || customerState || 'TX',
    shipping: po?.shipping || 0,
    notes: po?.notes || '',
    needed_by: po?.needed_by || '',
    work_order_id: po?.work_order_id || '',
    line_items: po?.line_items?.length ? po.line_items : [{ part_id: '', part_number: '', description: '', quantity: 1, unit_cost: 0 }],
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const subtotal = useMemo(
    () => form.line_items.reduce((s, l) => s + lineTotal(l), 0),
    [form.line_items],
  );

  const taxCalc = useMemo(
    () => calculateSalesTax(subtotal, form.tax_state),
    [subtotal, form.tax_state],
  );

  const total = useMemo(
    () => round2(taxCalc.total + (Number(form.shipping) || 0)),
    [taxCalc.total, form.shipping],
  );

  const updateLine = (idx, field, value) => {
    setForm(p => {
      const items = [...p.line_items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === 'part_id' && value) {
        const part = parts.find(x => x.id === value);
        if (part) {
          items[idx].part_number = part.part_number || '';
          items[idx].description = part.description || '';
          items[idx].unit_cost = part.unit_cost || 0;
        }
      }
      return { ...p, line_items: items };
    });
  };

  const addLine = () => setForm(p => ({
    ...p,
    line_items: [...p.line_items, { part_id: '', part_number: '', description: '', quantity: 1, unit_cost: 0 }],
  }));

  const removeLine = (idx) => setForm(p => ({
    ...p,
    line_items: p.line_items.filter((_, i) => i !== idx),
  }));

  const handleSubmit = (asDraft) => {
    const payload = {
      vendor_id: form.vendor_id,
      vendor_name: vendors.find(v => v.id === form.vendor_id)?.name || '',
      tax_state: form.tax_state,
      shipping: Number(form.shipping) || 0,
      notes: form.notes,
      needed_by: form.needed_by,
      work_order_id: form.work_order_id || null,
      line_items: form.line_items.map(l => ({
        ...l,
        quantity: Number(l.quantity) || 0,
        unit_cost: Number(l.unit_cost) || 0,
        total: lineTotal(l),
      })),
      subtotal: round2(subtotal),
      tax_rate: taxCalc.rate,
      tax_amount: taxCalc.tax,
      total,
      status: asDraft ? 'draft' : 'submitted',
      requested_by_id: user?.id,
      requested_by_name: user?.full_name,
      requested_at: new Date().toISOString(),
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-900 rounded-t-2xl">
          <div>
            <div className="text-white font-black">{po ? 'Edit Purchase Order' : 'New Parts Purchase Request'}</div>
            <div className="text-slate-400 text-xs">Parts manager submits · Fleet/accounting approves & issues PO</div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Vendor *</label>
              <select value={form.vendor_id} onChange={e => set('vendor_id', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Needed by</label>
              <Input type="date" value={form.needed_by} onChange={e => set('needed_by', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Tax state</label>
              <Input value={form.tax_state} onChange={e => set('tax_state', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Shipping ($)</label>
              <Input type="number" min="0" step="0.01" value={form.shipping} onChange={e => set('shipping', e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-500 uppercase">Line items</label>
              <button type="button" onClick={addLine} className="text-xs font-bold text-amber-600 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add line
              </button>
            </div>
            <div className="space-y-2">
              {form.line_items.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end border border-slate-100 rounded-lg p-2">
                  <div className="col-span-12 sm:col-span-4">
                    <select value={line.part_id} onChange={e => updateLine(idx, 'part_id', e.target.value)}
                      className="w-full border rounded px-2 py-1.5 text-xs">
                      <option value="">Custom part</option>
                      {parts.map(p => (
                        <option key={p.id} value={p.id}>{p.part_number} — {p.description}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input placeholder="Qty" type="number" min="1" value={line.quantity}
                      onChange={e => updateLine(idx, 'quantity', e.target.value)} className="text-xs" />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input placeholder="Unit $" type="number" min="0" step="0.01" value={line.unit_cost}
                      onChange={e => updateLine(idx, 'unit_cost', e.target.value)} className="text-xs" />
                  </div>
                  <div className="col-span-3 sm:col-span-3 text-xs font-bold text-slate-700 py-2">
                    ${lineTotal(line).toFixed(2)}
                  </div>
                  <div className="col-span-1">
                    <button type="button" onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {!line.part_id && (
                    <div className="col-span-12 grid sm:grid-cols-2 gap-2">
                      <Input placeholder="Part #" value={line.part_number} onChange={e => updateLine(idx, 'part_number', e.target.value)} className="text-xs" />
                      <Input placeholder="Description" value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} className="text-xs" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Sales tax ({(taxCalc.rate * 100).toFixed(2)}%)</span><span className="font-bold">${taxCalc.tax.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span className="font-bold">${(Number(form.shipping) || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-base pt-2 border-t border-slate-200">
              <span className="font-black">PO Total</span><span className="font-black text-emerald-700">${total.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Notes / justification</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Why these parts are needed..." />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSubmit(true)}>Save draft</Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" onClick={() => handleSubmit(false)}>
            Submit for approval
          </Button>
        </div>
      </div>
    </div>
  );
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

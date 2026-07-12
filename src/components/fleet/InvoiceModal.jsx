import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Trash2 } from 'lucide-react';

export default function InvoiceModal({ invoice, vehicles, users, customers = [], onSave, onClose }) {
  const customerOptions = customers.length > 0
    ? customers.map((c) => ({ id: c.id, label: c.company_name || c.contact_name }))
    : users.filter((u) => u.customer_id).map((u) => ({ id: u.customer_id || u.id, label: u.full_name }));
  const [form, setForm] = useState({
    invoice_number: invoice?.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
    type: invoice?.type || 'labor_and_parts',
    status: invoice?.status || 'draft',
    vehicle_id: invoice?.vehicle_id || '',
    customer_id: invoice?.customer_id || '',
    issue_date: invoice?.issue_date || new Date().toISOString().slice(0,10),
    due_date: invoice?.due_date || '',
    tax: invoice?.tax || 0,
    notes: invoice?.notes || '',
    line_items: invoice?.line_items || [{ description: '', quantity: 1, unit_price: 0, type: 'labor' }],
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const updateItem = (i, k, v) => {
    const items = [...form.line_items];
    items[i] = { ...items[i], [k]: v };
    setForm(p => ({ ...p, line_items: items }));
  };

  const addItem = () => setForm(p => ({ ...p, line_items: [...p.line_items, { description: '', quantity: 1, unit_price: 0, type: 'parts' }] }));
  const removeItem = (i) => setForm(p => ({ ...p, line_items: p.line_items.filter((_, idx) => idx !== i) }));

  const subtotal = form.line_items.reduce((s, item) => s + (Number(item.quantity) * Number(item.unit_price)), 0);
  const total = subtotal + Number(form.tax || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, subtotal, total: total, tax: Number(form.tax) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{invoice ? 'Edit Invoice' : 'New Invoice'}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Invoice # *</Label>
              <Input value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['labor','parts','labor_and_parts','fuel','other'].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Customer *</Label>
              <Select value={form.customer_id} onValueChange={v => set('customer_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customerOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle</Label>
              <Select value={form.vehicle_id} onValueChange={v => set('vehicle_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>Unit #{v.unit_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Issue Date</Label>
              <Input type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['draft','sent','paid','overdue'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Line Items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="w-3.5 h-3.5 mr-1" />Add Item</Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 px-1">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1"></div>
              </div>
              {form.line_items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg p-2">
                  <Input className="col-span-5 h-8 text-sm bg-white" placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  <Select value={item.type} onValueChange={v => updateItem(i, 'type', v)}>
                    <SelectTrigger className="col-span-2 h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="parts">Parts</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="col-span-2 h-8 text-sm text-right bg-white" type="number" min="0" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                  <Input className="col-span-2 h-8 text-sm text-right bg-white" type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                  <Button type="button" size="icon" variant="ghost" className="col-span-1 h-8 w-8" onClick={() => removeItem(i)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>Tax ($)</span>
              <Input type="number" min="0" step="0.01" value={form.tax} onChange={e => set('tax', e.target.value)} className="w-28 h-7 text-right text-sm" />
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-lg pt-2 border-t border-slate-200">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="mt-1" rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
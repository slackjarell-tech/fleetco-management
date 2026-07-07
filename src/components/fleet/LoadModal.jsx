import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

export default function LoadModal({ load, vehicles, users, onSave, onClose }) {
  const drivers = users.filter(u => u.role === 'driver');
  const customers = users.filter(u => u.role === 'customer');

  const [form, setForm] = useState({
    load_number: load?.load_number || '',
    status: load?.status || 'available',
    origin: load?.origin || '',
    destination: load?.destination || '',
    pickup_date: load?.pickup_date || '',
    delivery_date: load?.delivery_date || '',
    rate: load?.rate || '',
    miles: load?.miles || '',
    weight: load?.weight || '',
    commodity: load?.commodity || '',
    broker: load?.broker || '',
    assigned_driver_id: load?.assigned_driver_id || '',
    assigned_vehicle_id: load?.assigned_vehicle_id || '',
    customer_id: load?.customer_id || '',
    notes: load?.notes || '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      rate: form.rate ? Number(form.rate) : null,
      miles: form.miles ? Number(form.miles) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{load ? 'Edit Load' : 'New Load'}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Load Number *</Label>
              <Input value={form.load_number} onChange={e => set('load_number', e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['available','assigned','in_transit','delivered','cancelled'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origin *</Label>
              <Input value={form.origin} onChange={e => set('origin', e.target.value)} required className="mt-1" placeholder="City, ST" />
            </div>
            <div>
              <Label>Destination *</Label>
              <Input value={form.destination} onChange={e => set('destination', e.target.value)} required className="mt-1" placeholder="City, ST" />
            </div>
            <div>
              <Label>Pickup Date</Label>
              <Input type="date" value={form.pickup_date} onChange={e => set('pickup_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Delivery Date</Label>
              <Input type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Rate ($)</Label>
              <Input type="number" value={form.rate} onChange={e => set('rate', e.target.value)} className="mt-1" placeholder="0.00" />
            </div>
            <div>
              <Label>Miles</Label>
              <Input type="number" value={form.miles} onChange={e => set('miles', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Weight</Label>
              <Input value={form.weight} onChange={e => set('weight', e.target.value)} className="mt-1" placeholder="e.g. 44,000 lbs" />
            </div>
            <div>
              <Label>Commodity</Label>
              <Input value={form.commodity} onChange={e => set('commodity', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Broker</Label>
              <Input value={form.broker} onChange={e => set('broker', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Assigned Driver</Label>
              <Select value={form.assigned_driver_id} onValueChange={v => set('assigned_driver_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle</Label>
              <Select value={form.assigned_vehicle_id} onValueChange={v => set('assigned_vehicle_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>Unit #{v.unit_number} — {v.make} {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Customer</Label>
              <Select value={form.customer_id} onValueChange={v => set('customer_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="mt-1" rows={3} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              {load ? 'Update Load' : 'Create Load'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
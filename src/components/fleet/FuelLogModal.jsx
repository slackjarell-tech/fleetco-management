import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

export default function FuelLogModal({ log, vehicles, users, currentUser, onSave, onClose }) {
  const isAdmin = currentUser?.role === 'admin';
  const drivers = users.filter(u => u.role === 'driver');

  const [form, setForm] = useState({
    vehicle_id: log?.vehicle_id || '',
    driver_id: log?.driver_id || (!isAdmin ? currentUser?.id : ''),
    date: log?.date || new Date().toISOString().slice(0, 10),
    gallons: log?.gallons || '',
    price_per_gallon: log?.price_per_gallon || '',
    total_cost: log?.total_cost || '',
    odometer_reading: log?.odometer_reading || '',
    location: log?.location || '',
    fuel_type: log?.fuel_type || 'diesel',
    notes: log?.notes || '',
  });

  const set = (k, v) => {
    const updated = { ...form, [k]: v };
    // Auto-calc total when gallons or ppg change
    if ((k === 'gallons' || k === 'price_per_gallon') && updated.gallons && updated.price_per_gallon) {
      updated.total_cost = (Number(updated.gallons) * Number(updated.price_per_gallon)).toFixed(2);
    }
    setForm(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      gallons: Number(form.gallons),
      price_per_gallon: Number(form.price_per_gallon),
      total_cost: Number(form.total_cost),
      odometer_reading: form.odometer_reading ? Number(form.odometer_reading) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{log ? 'Edit Fuel Log' : 'Log Fuel Purchase'}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vehicle *</Label>
              <Select value={form.vehicle_id} onValueChange={v => set('vehicle_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>Unit #{v.unit_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} required className="mt-1" />
            </div>
            {isAdmin && (
              <div className="col-span-2">
                <Label>Driver</Label>
                <Select value={form.driver_id} onValueChange={v => set('driver_id', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select driver" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Gallons *</Label>
              <Input type="number" step="0.001" value={form.gallons} onChange={e => set('gallons', e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Price/Gallon *</Label>
              <Input type="number" step="0.001" value={form.price_per_gallon} onChange={e => set('price_per_gallon', e.target.value)} required className="mt-1" placeholder="$0.000" />
            </div>
            <div>
              <Label>Total Cost *</Label>
              <Input type="number" step="0.01" value={form.total_cost} onChange={e => set('total_cost', e.target.value)} required className="mt-1 bg-amber-50 font-bold" />
            </div>
            <div>
              <Label>Odometer Reading</Label>
              <Input type="number" value={form.odometer_reading} onChange={e => set('odometer_reading', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Fuel Type</Label>
              <Select value={form.fuel_type} onValueChange={v => set('fuel_type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="gasoline">Gasoline</SelectItem>
                  <SelectItem value="DEF">DEF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={e => set('location', e.target.value)} className="mt-1" placeholder="City, ST or station name" />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="mt-1" rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              {log ? 'Update Log' : 'Save Fuel Log'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
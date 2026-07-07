import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RouteModal({ route, users, vehicles, onSave, onClose }) {
  const [form, setForm] = useState({
    route_name: route?.route_name || '',
    route_date: route?.route_date || new Date().toISOString().split('T')[0],
    driver_id: route?.driver_id || '',
    vehicle_id: route?.vehicle_id || '',
    status: route?.status || 'pending',
    notes: route?.notes || '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const drivers = users.filter(u => u.role === 'driver');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-black text-slate-900">{route ? 'Edit Route' : 'New Delivery Route'}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Route Name *</label>
            <Input value={form.route_name} onChange={e => set('route_name', e.target.value)} placeholder="e.g. Zone A — Morning Run" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Date *</label>
            <Input type="date" value={form.route_date} onChange={e => set('route_date', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Assign Driver</label>
            <select value={form.driver_id} onChange={e => set('driver_id', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">— No driver yet —</option>
              {drivers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Assign Vehicle</label>
            <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">— No vehicle yet —</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>Unit #{v.unit_number} — {v.make} {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
            onClick={() => onSave(form)} disabled={!form.route_name || !form.route_date}>
            {route ? 'Save Changes' : 'Create Route'}
          </Button>
        </div>
      </div>
    </div>
  );
}
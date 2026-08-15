import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { CreditCard, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DriverFuelCards() {
  const { user } = useOutletContext();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', network: '', last_four: '', notes: '' });

  const load = async () => {
    const all = await api.entities.FuelCard.filter({ driver_id: user.id });
    setCards(all);
    setLoading(false);
  };

  useEffect(() => { if (user?.id) load(); }, [user?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    await api.entities.FuelCard.create({
      ...form,
      driver_id: user.id,
      driver_name: user.full_name,
      customer_id: user.customer_id || '',
      status: 'active',
    });
    setForm({ label: '', network: '', last_four: '', notes: '' });
    setShowForm(false);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" /> Fuel Cards
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Last 4 digits only — never store full card numbers</p>
        </div>
        <Button size="sm" className="bg-amber-500 text-slate-900 font-bold" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {cards.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-400 text-sm">No fuel cards on file. Add one to link receipts.</div>
      )}

      <div className="space-y-2">
        {cards.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="font-bold text-slate-900">{c.label || c.network || 'Fuel card'}</div>
            <div className="text-sm text-slate-600">{c.network} · **** {c.last_four}</div>
            {c.notes && <div className="text-xs text-slate-400 mt-1">{c.notes}</div>}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black">Add fuel card</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Company card" className="mt-1" /></div>
            <div><Label>Network</Label><Input value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} placeholder="WEX, Comdata, FleetOne" className="mt-1" /></div>
            <div><Label>Last 4 digits *</Label><Input value={form.last_four} onChange={(e) => setForm({ ...form, last_four: e.target.value.slice(0, 4) })} maxLength={4} required className="mt-1" /></div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" /></div>
            <Button type="submit" className="w-full bg-amber-500 text-slate-900 font-bold">Save card</Button>
          </form>
        </div>
      )}
    </div>
  );
}

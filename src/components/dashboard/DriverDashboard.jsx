import React from 'react';
import { Package, Fuel, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function DriverDashboard({ user, data }) {
  const { loads, fuel } = data;

  const myLoads = loads.filter(l => l.assigned_driver_id === user?.id);
  const myFuel = fuel.filter(f => f.driver_id === user?.id);

  const activeLoads = myLoads.filter(l => ['assigned', 'in_transit'].includes(l.status));
  const completedLoads = myLoads.filter(l => l.status === 'delivered');
  const totalFuelCost = myFuel.reduce((s, f) => s + (f.total_cost || 0), 0);
  const totalMiles = myLoads.filter(l => l.miles).reduce((s, l) => s + (l.miles || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-white">Welcome, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-slate-400 text-sm">Driver Dashboard</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Loads', value: activeLoads.length, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
          { label: 'Completed', value: completedLoads.length, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/30' },
          { label: 'Total Miles', value: totalMiles.toLocaleString(), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-900/30' },
          { label: 'Fuel Cost', value: `$${totalFuelCost.toFixed(0)}`, icon: Fuel, color: 'text-purple-400', bg: 'bg-purple-900/30' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3">My Active Loads</div>
        {activeLoads.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">No active loads assigned</div>
        ) : activeLoads.map(l => (
          <div key={l.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
            <div>
              <div className="text-white font-semibold text-sm">#{l.load_number}</div>
              <div className="text-slate-400 text-xs">{l.origin} → {l.destination}</div>
              {l.pickup_date && <div className="text-slate-500 text-xs mt-0.5">Pickup: {l.pickup_date}</div>}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              l.status === 'in_transit' ? 'bg-blue-900/40 text-blue-400' : 'bg-yellow-900/40 text-yellow-400'
            }`}>{l.status?.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3">Recent Fuel Logs</div>
        {myFuel.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">No fuel logs yet</div>
        ) : myFuel.slice(0, 5).map(f => (
          <div key={f.id} className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0">
            <div>
              <div className="text-white text-sm font-semibold">{f.date}</div>
              <div className="text-slate-400 text-xs">{f.gallons} gal @ ${f.price_per_gallon?.toFixed(2)}/gal</div>
            </div>
            <div className="text-yellow-400 font-black text-sm">${(f.total_cost || 0).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
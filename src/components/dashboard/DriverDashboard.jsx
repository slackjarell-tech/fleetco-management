import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Fuel, CheckCircle, Clock, TrendingUp, Route, ScanLine,
  Video, ClipboardCheck, Navigation, Truck, MapPin,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { path: '/driver/loads', label: 'My Loads', desc: 'OTR & freight', icon: Truck, color: 'text-amber-400', bg: 'bg-amber-900/30' },
  { path: '/driver/route', label: 'Delivery Route', desc: 'Last-mile & parcels', icon: Route, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
  { path: '/driver/scan', label: 'Scan', desc: 'Packages & manifests', icon: ScanLine, color: 'text-blue-400', bg: 'bg-blue-900/30' },
  { path: '/driver/dashcam', label: 'Dashcam', desc: 'ELD & road video', icon: Video, color: 'text-purple-400', bg: 'bg-purple-900/30' },
  { path: '/driver/navigation', label: 'Navigate', desc: 'Turn-by-turn', icon: Navigation, color: 'text-cyan-400', bg: 'bg-cyan-900/30' },
  { path: '/driver/hos', label: 'HOS Logs', desc: 'Hours of service', icon: ClipboardCheck, color: 'text-orange-400', bg: 'bg-orange-900/30' },
];

export default function DriverDashboard({ user, data, delivery }) {
  const { loads, fuel } = data;
  const { route, stops, pendingStops } = delivery || {};

  const myLoads = loads.filter((l) => l.assigned_driver_id === user?.id);
  const myFuel = fuel.filter((f) => f.driver_id === user?.id);

  const activeLoads = myLoads.filter((l) => ['assigned', 'in_transit'].includes(l.status));
  const completedLoads = myLoads.filter((l) => l.status === 'delivered');
  const totalFuelCost = myFuel.reduce((s, f) => s + (f.total_cost || 0), 0);
  const totalMiles = myLoads.filter((l) => l.miles).reduce((s, l) => s + (l.miles || 0), 0);

  const modes = [];
  if (activeLoads.length > 0 || myLoads.length > 0) modes.push('Freight / OTR');
  if (route) modes.push('Last-mile delivery');
  if (modes.length === 0) modes.push('Ready for assignment');

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-white">Welcome, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-slate-400 text-sm">FleetCo Driver — {modes.join(' · ')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Loads', value: activeLoads.length, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
          { label: 'Route Stops', value: pendingStops ?? 0, icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
          { label: 'Total Miles', value: totalMiles.toLocaleString(), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-900/30' },
          { label: 'Fuel Cost', value: `$${totalFuelCost.toFixed(0)}`, icon: Fuel, color: 'text-purple-400', bg: 'bg-purple-900/30' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="bg-slate-800 border border-slate-700 rounded-xl p-3 hover:border-amber-500/50 transition-colors"
          >
            <div className={`w-8 h-8 ${action.bg} rounded-lg flex items-center justify-center mb-2`}>
              <action.icon className={`w-4 h-4 ${action.color}`} />
            </div>
            <div className="text-white font-bold text-sm">{action.label}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">{action.desc}</div>
          </Link>
        ))}
      </div>

      {route && (
        <div className="bg-slate-800 rounded-xl p-5 border border-emerald-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Today&apos;s Delivery Route</div>
            <Link to="/driver/route" className="text-xs text-amber-400 font-bold">Open →</Link>
          </div>
          <div className="text-white font-semibold">{route.route_name || 'Delivery route'}</div>
          <div className="text-slate-400 text-xs mt-1">
            {(stops?.length || 0)} stops · {pendingStops ?? 0} remaining
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3">My Active Loads</div>
        {activeLoads.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-6">No active freight loads — check delivery route or wait for dispatch</div>
        ) : activeLoads.map((l) => (
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
          <div className="text-slate-500 text-sm text-center py-6">No fuel logs yet</div>
        ) : myFuel.slice(0, 5).map((f) => (
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

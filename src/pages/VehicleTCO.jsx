import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { DollarSign, Truck, TrendingDown, Wrench, Fuel, ChevronDown, ChevronUp, Search, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const USEFUL_LIFE_YEARS = { truck: 10, trailer: 15 };

function calcDepreciation(vehicle) {
  if (!vehicle.purchase_price || !vehicle.purchase_date) return null;
  const yearsOwned = (new Date() - new Date(vehicle.purchase_date)) / (365.25 * 86400000);
  const usefulLife = USEFUL_LIFE_YEARS[vehicle.unit_type] || 10;
  const annualDep = vehicle.purchase_price / usefulLife;
  const accumulated = Math.min(annualDep * yearsOwned, vehicle.purchase_price * 0.9);
  const currentValue = Math.max(vehicle.purchase_price - accumulated, vehicle.purchase_price * 0.1);
  return { yearsOwned: yearsOwned.toFixed(1), annualDep, accumulated, currentValue };
}

function fmt(n) {
  return `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function VehicleTCO() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [sortBy, setSortBy] = useState('tco');

  useEffect(() => {
    api.auth.me().then(async u => {
      setUser(u);
      const [vs, fs, ws, ls] = await Promise.all([
        api.entities.Vehicle.list(),
        api.entities.FuelLog.list('-date', 2000),
        api.entities.WorkOrder.list('-opened_date', 2000),
        api.entities.Load.list('-pickup_date', 2000),
      ]);
      let filteredVehicles = vs;
      if (u?.customer_id) filteredVehicles = vs.filter(v => v.assigned_customer_id === u.customer_id);
      setVehicles(filteredVehicles);
      setFuelLogs(fs);
      setWorkOrders(ws);
      setLoads(ls);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const tcoData = useMemo(() => {
    return vehicles.map(v => {
      const vFuel = fuelLogs.filter(f => f.vehicle_id === v.id);
      const vWork = workOrders.filter(w => w.vehicle_id === v.id);
      const vLoads = loads.filter(l => l.assigned_vehicle_id === v.id && l.status === 'delivered');

      const totalFuelCost = vFuel.reduce((s, f) => s + (f.total_cost || 0), 0);
      const totalRepairCost = vWork.reduce((s, w) => s + (w.total_cost || 0), 0);
      const totalMiles = vLoads.reduce((s, l) => s + (l.miles || 0), 0);
      const totalRevenue = vLoads.reduce((s, l) => s + (l.rate || 0), 0);
      const dep = calcDepreciation(v);
      const depCost = dep?.accumulated || 0;
      const tco = totalFuelCost + totalRepairCost + depCost;
      const costPerMile = totalMiles > 0 ? tco / totalMiles : null;
      const repairRatio = v.purchase_price > 0 ? (totalRepairCost / v.purchase_price) * 100 : null;

      return {
        vehicle: v, totalFuelCost, totalRepairCost, totalMiles, totalRevenue,
        depCost, tco, costPerMile, repairRatio, dep,
        netPnL: totalRevenue - tco,
        fuelLogs: vFuel.length, workOrderCount: vWork.length,
      };
    }).filter(d => d.tco > 0 || d.vehicle.purchase_price > 0)
      .sort((a, b) =>
        sortBy === 'tco' ? b.tco - a.tco :
        sortBy === 'cpm' ? (b.costPerMile || 0) - (a.costPerMile || 0) :
        sortBy === 'repair' ? b.totalRepairCost - a.totalRepairCost : 0
      );
  }, [vehicles, fuelLogs, workOrders, loads, sortBy]);

  const filtered = useMemo(() =>
    tcoData.filter(d => !search ||
      d.vehicle.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
      `${d.vehicle.year} ${d.vehicle.make} ${d.vehicle.model}`.toLowerCase().includes(search.toLowerCase())
    ), [tcoData, search]);

  const totals = useMemo(() => ({
    tco: filtered.reduce((s, d) => s + d.tco, 0),
    fuel: filtered.reduce((s, d) => s + d.totalFuelCost, 0),
    repair: filtered.reduce((s, d) => s + d.totalRepairCost, 0),
    revenue: filtered.reduce((s, d) => s + d.totalRevenue, 0),
  }), [filtered]);

  const chartData = filtered.slice(0, 10).map(d => ({
    name: `Unit ${d.vehicle.unit_number}`,
    Fuel: Math.round(d.totalFuelCost),
    Repairs: Math.round(d.totalRepairCost),
    Depreciation: Math.round(d.depCost),
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-black flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-400" /> Total Cost of Ownership (TCO)
        </h1>
        <p className="text-slate-300 text-xs mt-1">Fuel + Repair + Depreciation per vehicle — drives replace-vs-repair decisions</p>
      </div>

      {/* Fleet Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Fleet TCO', value: fmt(totals.tco), color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Total Fuel Cost', value: fmt(totals.fuel), color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Total Repair Cost', value: fmt(totals.repair), color: 'text-orange-700', bg: 'bg-orange-50' },
          { label: 'Total Revenue', value: fmt(totals.revenue), color: 'text-emerald-700', bg: 'bg-emerald-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl border border-slate-100 p-4`}>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-black text-slate-700 text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-500" /> Cost Breakdown — Top 10 Units
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `$${v.toLocaleString()}`} />
              <Bar dataKey="Fuel" stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
              <Bar dataKey="Repairs" stackId="a" fill="#ef4444" />
              <Bar dataKey="Depreciation" stackId="a" fill="#94a3b8" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs">
            {[['#f59e0b','Fuel'],['#ef4444','Repairs'],['#94a3b8','Depreciation']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm flex-shrink-0" style={{background:c}}/>{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicle..."
            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">Sort:</span>
          {[['tco','Total TCO'],['repair','Repair Cost'],['cpm','Cost/Mile']].map(([v,l]) => (
            <button key={v} onClick={() => setSortBy(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${sortBy===v?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Vehicle List */}
      <div className="space-y-3">
        {filtered.map(d => {
          const isExpanded = expanded[d.vehicle.id];
          const repairWarning = d.repairRatio !== null && d.repairRatio > 50;
          return (
            <div key={d.vehicle.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50"
                onClick={() => setExpanded(p => ({ ...p, [d.vehicle.id]: !p[d.vehicle.id] }))}>
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900">Unit {d.vehicle.unit_number}</span>
                    <span className="text-xs text-slate-400">{d.vehicle.year} {d.vehicle.make} {d.vehicle.model}</span>
                    {repairWarning && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">⚠️ High Repair Cost</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Fuel className="w-3 h-3 text-amber-500" /> Fuel: {fmt(d.totalFuelCost)}</span>
                    <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-red-400" /> Repairs: {fmt(d.totalRepairCost)}</span>
                    <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-slate-400" /> Dep: {fmt(d.depCost)}</span>
                    {d.costPerMile && <span className="text-slate-500">• {d.costPerMile.toFixed(2)}/mi</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-black text-red-600">{fmt(d.tco)}</div>
                  <div className="text-xs text-slate-400">Total TCO</div>
                  {d.netPnL !== 0 && (
                    <div className={`text-xs font-bold ${d.netPnL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      Net: {fmt(d.netPnL)}
                    </div>
                  )}
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div><div className="text-xs text-slate-400">Purchase Price</div><div className="font-black text-slate-700">{fmt(d.vehicle.purchase_price)}</div></div>
                    <div><div className="text-xs text-slate-400">Est. Current Value</div><div className="font-black text-emerald-700">{d.dep ? fmt(d.dep.currentValue) : '—'}</div></div>
                    <div><div className="text-xs text-slate-400">Years Owned</div><div className="font-black text-slate-700">{d.dep?.yearsOwned || '—'} yrs</div></div>
                    <div><div className="text-xs text-slate-400">Annual Depreciation</div><div className="font-black text-slate-700">{d.dep ? fmt(d.dep.annualDep) : '—'}</div></div>
                    <div><div className="text-xs text-slate-400">Total Miles (Delivered)</div><div className="font-black text-blue-700">{d.totalMiles.toLocaleString()} mi</div></div>
                    <div><div className="text-xs text-slate-400">Cost Per Mile</div><div className="font-black text-orange-700">{d.costPerMile ? `$${d.costPerMile.toFixed(3)}` : '—'}</div></div>
                    <div><div className="text-xs text-slate-400">Repair / Purchase %</div><div className={`font-black ${repairWarning ? 'text-red-600' : 'text-slate-700'}`}>{d.repairRatio !== null ? `${d.repairRatio.toFixed(1)}%` : '—'}</div></div>
                    <div><div className="text-xs text-slate-400">Total Revenue</div><div className="font-black text-emerald-700">{fmt(d.totalRevenue)}</div></div>
                  </div>
                  {repairWarning && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
                      ⚠️ Repair costs exceed 50% of purchase price — consider replacement analysis for this unit.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No TCO data available</p>
            <p className="text-xs mt-1">Add purchase price/date to vehicles and log fuel & work orders to generate TCO</p>
          </div>
        )}
      </div>
    </div>
  );
}
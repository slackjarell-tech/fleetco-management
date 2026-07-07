import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { TrendingUp, TrendingDown, DollarSign, Truck, Container, BarChart2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

function calcDepreciatedValue(vehicle) {
  if (!vehicle.purchase_price) return null;
  let ageYears = 0;
  if (vehicle.purchase_date) {
    ageYears = (Date.now() - new Date(vehicle.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  } else if (vehicle.year) {
    ageYears = new Date().getFullYear() - vehicle.year;
  }
  ageYears = Math.max(0, ageYears);
  let value = vehicle.purchase_price;
  for (let y = 0; y < ageYears; y++) {
    if (y === 0) value *= vehicle.unit_type === 'trailer' ? 0.85 : 0.75;
    else if (y < 5) value *= vehicle.unit_type === 'trailer' ? 0.88 : 0.85;
    else value *= vehicle.unit_type === 'trailer' ? 0.91 : 0.90;
    value = Math.max(value, vehicle.purchase_price * 0.05);
  }
  return Math.round(Math.max(value, vehicle.purchase_price * 0.05));
}

const fmt = (n) => `$${Math.round(n || 0).toLocaleString()}`;

function SummaryCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default function FleetPnL() {
  const [vehicles, setVehicles] = useState([]);
  const [loads, setLoads] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    Promise.all([
      api.entities.Vehicle.list('-created_date', 200),
      api.entities.Load.list('-pickup_date', 1000),
      api.entities.WorkOrder.list('-opened_date', 500),
      api.entities.FuelLog.list('-date', 500),
    ]).then(([vs, ls, wos, fuel]) => {
      setVehicles(vs);
      setLoads(ls);
      setWorkOrders(wos);
      setFuelLogs(fuel);
      setLoading(false);
    });
  }, []);

  const rows = useMemo(() => {
    return vehicles.map(v => {
      const vLoads = loads.filter(l => l.assigned_vehicle_id === v.id && l.status === 'delivered');
      const vWOs = workOrders.filter(w => w.vehicle_id === v.id && w.status === 'completed');
      const vFuel = fuelLogs.filter(f => f.vehicle_id === v.id);

      const revenue = vLoads.reduce((s, l) => s + (l.rate || 0), 0);
      const repairCost = vWOs.reduce((s, w) => s + (w.total_cost || 0), 0);
      const fuelCost = vFuel.reduce((s, f) => s + (f.total_cost || 0), 0);
      const totalCost = repairCost + fuelCost;
      const profit = revenue - totalCost;
      const miles = vLoads.reduce((s, l) => s + (l.miles || 0), 0);
      const depreciatedValue = calcDepreciatedValue(v);

      return {
        ...v,
        revenue,
        repairCost,
        fuelCost,
        totalCost,
        profit,
        miles,
        depreciatedValue,
        loadCount: vLoads.length,
        rpm: miles > 0 ? revenue / miles : 0,
        cpm: miles > 0 ? totalCost / miles : 0,
      };
    });
  }, [vehicles, loads, workOrders, fuelLogs]);

  const filtered = useMemo(() => {
    let r = filterType === 'all' ? rows : rows.filter(v => v.unit_type === filterType || (!v.unit_type && filterType === 'truck'));
    return [...r].sort((a, b) => {
      if (sortBy === 'profit') return b.profit - a.profit;
      if (sortBy === 'revenue') return b.revenue - a.revenue;
      if (sortBy === 'cost') return b.totalCost - a.totalCost;
      if (sortBy === 'value') return (b.depreciatedValue || 0) - (a.depreciatedValue || 0);
      return 0;
    });
  }, [rows, sortBy, filterType]);

  const totals = useMemo(() => ({
    revenue: rows.reduce((s, r) => s + r.revenue, 0),
    cost: rows.reduce((s, r) => s + r.totalCost, 0),
    profit: rows.reduce((s, r) => s + r.profit, 0),
    fleetValue: rows.reduce((s, r) => s + (r.depreciatedValue || 0), 0),
  }), [rows]);

  const chartData = useMemo(() =>
    filtered.slice(0, 15).map(v => ({
      name: `#${v.unit_number}`,
      Revenue: Math.round(v.revenue),
      Costs: Math.round(v.totalCost),
      Profit: Math.round(v.profit),
    })),
    [filtered]
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Fleet P&L Dashboard</h1>
        <p className="text-slate-500 text-sm">Revenue vs. costs with current depreciated asset value — per unit</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Revenue" value={fmt(totals.revenue)} sub="from delivered loads" icon={TrendingUp} color="text-green-600" />
        <SummaryCard label="Total Costs" value={fmt(totals.cost)} sub="fuel + repairs" icon={TrendingDown} color="text-red-500" />
        <SummaryCard label="Net Profit" value={fmt(totals.profit)} sub="revenue minus costs" icon={DollarSign} color={totals.profit >= 0 ? 'text-green-600' : 'text-red-500'} />
        <SummaryCard label="Fleet Book Value" value={fmt(totals.fleetValue)} sub="depreciated asset value" icon={BarChart2} color="text-amber-600" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm font-bold text-slate-700 mb-4">Revenue vs. Costs by Unit (top {chartData.length})</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Costs" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-sm">
          {['all', 'truck', 'trailer'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-colors ${filterType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t === 'all' ? 'All Units' : t === 'truck' ? '🚛 Trucks' : '📦 Trailers'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm ml-auto">
          <span className="text-slate-400 font-medium">Sort by:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="profit">Net Profit</option>
            <option value="revenue">Revenue</option>
            <option value="cost">Total Cost</option>
            <option value="value">Asset Value</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-slate-300 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-bold">Unit</th>
                <th className="px-4 py-3 text-right font-bold">Loads</th>
                <th className="px-4 py-3 text-right font-bold">Revenue</th>
                <th className="px-4 py-3 text-right font-bold">Fuel</th>
                <th className="px-4 py-3 text-right font-bold">Repairs</th>
                <th className="px-4 py-3 text-right font-bold">Total Cost</th>
                <th className="px-4 py-3 text-right font-bold">Net Profit</th>
                <th className="px-4 py-3 text-right font-bold">Rev/mi</th>
                <th className="px-4 py-3 text-right font-bold">Depr. Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const isProfit = v.profit >= 0;
                return (
                  <tr key={v.id} className={`border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-amber-50 transition-colors`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {v.unit_type === 'trailer'
                          ? <Container className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          : <Truck className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                        <div>
                          <div className="font-bold text-slate-800">#{v.unit_number}</div>
                          <div className="text-xs text-slate-400">{[v.year, v.make, v.model].filter(Boolean).join(' ') || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600">{v.loadCount}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{v.revenue > 0 ? fmt(v.revenue) : '—'}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{v.fuelCost > 0 ? fmt(v.fuelCost) : '—'}</td>
                    <td className="px-4 py-3 text-right text-orange-500">{v.repairCost > 0 ? fmt(v.repairCost) : '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-500">{v.totalCost > 0 ? fmt(v.totalCost) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-black text-base ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                        {v.revenue > 0 || v.totalCost > 0 ? fmt(v.profit) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 text-xs">
                      {v.miles > 0 && v.revenue > 0 ? `$${v.rpm.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {v.depreciatedValue
                        ? <span className="font-semibold text-amber-600">{fmt(v.depreciatedValue)}</span>
                        : <span className="text-xs text-slate-300">No purchase data</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No vehicles found
                  </td>
                </tr>
              )}
            </tbody>
            {/* Totals row */}
            {filtered.length > 1 && (
              <tfoot>
                <tr className="bg-slate-900 text-white border-t-2 border-slate-700">
                  <td className="px-4 py-3 font-black text-sm">TOTALS</td>
                  <td className="px-4 py-3 text-right font-bold">{filtered.reduce((s, v) => s + v.loadCount, 0)}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-400">{fmt(filtered.reduce((s, v) => s + v.revenue, 0))}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-400">{fmt(filtered.reduce((s, v) => s + v.fuelCost, 0))}</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-400">{fmt(filtered.reduce((s, v) => s + v.repairCost, 0))}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-400">{fmt(filtered.reduce((s, v) => s + v.totalCost, 0))}</td>
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const p = filtered.reduce((s, v) => s + v.profit, 0);
                      return <span className={`font-black text-base ${p >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(p)}</span>;
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">—</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-400">{fmt(filtered.reduce((s, v) => s + (v.depreciatedValue || 0), 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
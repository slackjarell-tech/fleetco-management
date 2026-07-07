import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import {
  Globe, Download, AlertTriangle, CheckCircle2, Fuel, MapPin,
  TrendingUp, FileText, RefreshCw, ChevronDown, ChevronUp, BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const QUARTERS = [
  { label: 'Q1 (Jan–Mar)', months: [0, 1, 2], filing: 'Apr 30' },
  { label: 'Q2 (Apr–Jun)', months: [3, 4, 5], filing: 'Jul 31' },
  { label: 'Q3 (Jul–Sep)', months: [6, 7, 8], filing: 'Oct 31' },
  { label: 'Q4 (Oct–Dec)', months: [9, 10, 11], filing: 'Jan 31' },
];

const STATE_TAX_RATES = {
  AL: 0.280, AK: 0.095, AZ: 0.260, AR: 0.285, CA: 0.800, CO: 0.205,
  CT: 0.490, DE: 0.220, FL: 0.330, GA: 0.320, HI: 0.160, ID: 0.320,
  IL: 0.467, IN: 0.530, IA: 0.325, KS: 0.260, KY: 0.246, LA: 0.200,
  ME: 0.312, MD: 0.362, MA: 0.240, MI: 0.263, MN: 0.285, MS: 0.180,
  MO: 0.170, MT: 0.295, NE: 0.246, NV: 0.520, NH: 0.222, NJ: 0.415,
  NM: 0.220, NY: 0.458, NC: 0.362, ND: 0.230, OH: 0.470, OK: 0.190,
  OR: 0.380, PA: 0.747, RI: 0.340, SC: 0.250, SD: 0.280, TN: 0.270,
  TX: 0.200, UT: 0.315, VT: 0.320, VA: 0.272, WA: 0.494, WV: 0.357,
  WI: 0.329, WY: 0.240, DC: 0.235,
};

function extractState(str) {
  if (!str) return null;
  const m = str.match(/\b([A-Z]{2})\b/);
  return m && STATE_TAX_RATES[m[1]] ? m[1] : null;
}

const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export default function IFTADashboard() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loads, setLoads] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentQuarterIdx = Math.floor(new Date().getMonth() / 3);
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(currentQuarterIdx);
  const [expandedState, setExpandedState] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      api.entities.FuelLog.list('-date', 1000),
      api.entities.Load.list('-pickup_date', 1000),
      api.entities.Vehicle.list(),
    ]).then(([fl, ld, vh]) => {
      setFuelLogs(fl);
      setLoads(ld);
      setVehicles(vh);
      setLoading(false);
    });
  }, []);

  const qMonths = QUARTERS[quarter].months;

  const filteredFuel = useMemo(() => fuelLogs.filter(l => {
    if (!l.date) return false;
    const d = new Date(l.date);
    return d.getFullYear() === year && qMonths.includes(d.getMonth());
  }), [fuelLogs, year, quarter]);

  const filteredLoads = useMemo(() => loads.filter(l => {
    const dateStr = l.pickup_date || l.delivery_date;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === year && qMonths.includes(d.getMonth());
  }), [loads, year, quarter]);

  // Miles by state from Loads (origin/destination)
  const milesByState = useMemo(() => {
    const map = {};
    filteredLoads.forEach(load => {
      const originState = extractState((load.origin || '').toUpperCase());
      const destState = extractState((load.destination || '').toUpperCase());
      const miles = load.miles || 0;
      if (originState && miles > 0) {
        map[originState] = (map[originState] || 0) + miles / 2;
      }
      if (destState && miles > 0) {
        map[destState] = (map[destState] || 0) + miles / 2;
      }
    });
    return Object.entries(map).map(([state, miles]) => ({ state, miles: Math.round(miles) }))
      .sort((a, b) => b.miles - a.miles);
  }, [filteredLoads]);

  // Fuel by state
  const fuelByState = useMemo(() => {
    const map = {};
    filteredFuel.forEach(l => {
      const state = extractState((l.location || '').toUpperCase());
      if (!state) return;
      if (!map[state]) map[state] = { gallons: 0, cost: 0, count: 0 };
      map[state].gallons += l.gallons || 0;
      map[state].cost += l.total_cost || 0;
      map[state].count++;
    });
    return Object.entries(map).map(([state, d]) => ({
      state, ...d,
      taxRate: STATE_TAX_RATES[state] || 0.25,
      taxOwed: d.gallons * (STATE_TAX_RATES[state] || 0.25),
    })).sort((a, b) => b.gallons - a.gallons);
  }, [filteredFuel]);

  // Merged state summary: miles + fuel
  const stateSummary = useMemo(() => {
    const allStates = new Set([
      ...milesByState.map(s => s.state),
      ...fuelByState.map(s => s.state),
    ]);
    return Array.from(allStates).map(state => {
      const miles = milesByState.find(s => s.state === state)?.miles || 0;
      const fuel = fuelByState.find(s => s.state === state) || { gallons: 0, cost: 0, count: 0, taxOwed: 0, taxRate: STATE_TAX_RATES[state] || 0.25 };
      const totalTax = fuel.taxOwed;
      return { state, miles, ...fuel, totalTax };
    }).sort((a, b) => b.miles - a.miles || b.gallons - a.gallons);
  }, [milesByState, fuelByState]);

  const totals = useMemo(() => ({
    miles: milesByState.reduce((s, r) => s + r.miles, 0),
    gallons: fuelByState.reduce((s, r) => s + r.gallons, 0),
    cost: fuelByState.reduce((s, r) => s + r.cost, 0),
    tax: fuelByState.reduce((s, r) => s + r.taxOwed, 0),
    loads: filteredLoads.length,
    fillUps: filteredFuel.length,
    states: stateSummary.length,
    untaggedFuel: filteredFuel.filter(l => !extractState((l.location || '').toUpperCase())).length,
  }), [milesByState, fuelByState, filteredLoads, filteredFuel, stateSummary]);

  const filingDeadline = QUARTERS[quarter].filing;

  const exportCSV = () => {
    const rows = [
      ['IFTA Report', `${year} ${QUARTERS[quarter].label}`, '', '', '', ''],
      ['', '', '', '', '', ''],
      ['State', 'Miles Traveled', 'Gallons Purchased', 'Tax Rate ($/gal)', 'Est. Tax Owed', 'Fuel Cost'],
      ...stateSummary.map(s => [
        s.state,
        s.miles,
        s.gallons.toFixed(3),
        (s.taxRate || 0).toFixed(3),
        s.totalTax.toFixed(2),
        s.cost.toFixed(2),
      ]),
      ['', '', '', '', '', ''],
      ['TOTALS', totals.miles, totals.gallons.toFixed(3), '', totals.tax.toFixed(2), totals.cost.toFixed(2)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IFTA_${year}_Q${quarter + 1}_Report.csv`;
    a.click();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-950 to-blue-800 rounded-2xl p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-300" /> IFTA Monitoring Dashboard
            </h1>
            <p className="text-blue-300 text-xs mt-0.5">International Fuel Tax Agreement — FMCSA Compliance Reporting</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-200 bg-blue-900/50 rounded-lg px-3 py-1.5 w-fit">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              Filing deadline for {QUARTERS[quarter].label}: <strong className="text-amber-300 ml-1">{filingDeadline}</strong>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="bg-blue-900 border border-blue-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
              {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={quarter} onChange={e => setQuarter(Number(e.target.value))}
              className="bg-blue-900 border border-blue-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
              {QUARTERS.map((q, i) => <option key={i} value={i}>{q.label}</option>)}
            </select>
            <Button size="sm" onClick={exportCSV}
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Miles', value: totals.miles > 0 ? totals.miles.toLocaleString() : '—', sub: `${totals.loads} loads · ${totals.states} states`, color: 'text-blue-700', bg: 'bg-blue-50', icon: TrendingUp },
          { label: 'Total Gallons', value: totals.gallons.toFixed(1), sub: `${totals.fillUps} fill-ups logged`, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: Fuel },
          { label: 'Est. IFTA Tax', value: '$' + totals.tax.toFixed(2), sub: 'across all states', color: 'text-red-700', bg: 'bg-red-50', icon: FileText },
          { label: 'Total Fuel Cost', value: '$' + totals.cost.toFixed(2), sub: `$${totals.gallons > 0 ? (totals.cost / totals.gallons).toFixed(3) : '0.000'}/gal avg`, color: 'text-purple-700', bg: 'bg-purple-50', icon: MapPin },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
            <card.icon className={`w-4 h-4 ${card.color} mb-2 opacity-70`} />
            <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {totals.untaggedFuel > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span><strong>{totals.untaggedFuel} fuel log(s)</strong> are missing a state abbreviation in the Location field and won't appear in state reporting. Include the 2-letter state code (e.g. "Dallas, TX") for accurate IFTA filing.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'State Summary', icon: Globe },
          { id: 'miles', label: 'Miles by State', icon: TrendingUp },
          { id: 'fuel', label: 'Fuel by State', icon: Fuel },
          { id: 'chart', label: 'Charts', icon: BarChart2 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview: combined state table */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900">Combined State Activity — {year} {QUARTERS[quarter].label}</h2>
            <span className="text-xs text-slate-400">{stateSummary.length} state(s)</span>
          </div>
          {stateSummary.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No data for this period.</p>
              <p className="text-xs mt-1">Add fuel logs with state codes and loads with state-tagged origins/destinations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-bold text-slate-600">State</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Miles</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Gallons Purchased</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Tax Rate</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Est. Tax Owed</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Fuel Cost</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Fill-ups</th>
                  </tr>
                </thead>
                <tbody>
                  {stateSummary.map((s, i) => (
                    <tr key={s.state} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg text-xs">{s.state}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{s.miles > 0 ? s.miles.toLocaleString() : <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{s.gallons > 0 ? s.gallons.toFixed(3) : <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">${(s.taxRate || 0).toFixed(3)}/gal</td>
                      <td className="px-4 py-3 text-right font-bold text-red-700">{s.totalTax > 0 ? '$' + s.totalTax.toFixed(2) : <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{s.cost > 0 ? '$' + s.cost.toFixed(2) : <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{s.count || 0}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white">
                  <tr>
                    <td className="px-5 py-3 font-black text-sm">TOTALS</td>
                    <td className="px-4 py-3 text-right font-black">{totals.miles > 0 ? totals.miles.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right font-black">{totals.gallons.toFixed(3)}</td>
                    <td />
                    <td className="px-4 py-3 text-right font-black text-red-300">${totals.tax.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black">${totals.cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black">{totals.fillUps}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Miles by State tab */}
      {activeTab === 'miles' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-900">Miles by State</h2>
            <p className="text-xs text-slate-500 mt-0.5">Derived from Load origin/destination state tags — include 2-letter state codes in Load addresses</p>
          </div>
          {milesByState.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No miles data found for this period.</p>
              <p className="text-xs mt-1">Ensure Load Board entries include state abbreviations in origin/destination (e.g. "Dallas, TX").</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-bold text-slate-600">State</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Est. Miles</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {milesByState.map(s => {
                    const pct = totals.miles > 0 ? (s.miles / totals.miles) * 100 : 0;
                    return (
                      <tr key={s.state} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <span className="font-black text-slate-900 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg text-xs">{s.state}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">{s.miles.toLocaleString()} mi</td>
                        <td className="px-4 py-3 w-40">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Fuel by State tab */}
      {activeTab === 'fuel' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-900">Fuel Purchases by State</h2>
            <p className="text-xs text-slate-500 mt-0.5">Based on fuel logs with state abbreviations in the Location field</p>
          </div>
          {fuelByState.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Fuel className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No tagged fuel logs for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-bold text-slate-600">State</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Fill-ups</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Gallons</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Tax Rate</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Est. Tax Owed</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelByState.map(s => (
                    <tr key={s.state} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <span className="font-black text-slate-900 bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg text-xs">{s.state}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{s.count}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{s.gallons.toFixed(3)}</td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">${s.taxRate.toFixed(3)}/gal</td>
                      <td className="px-4 py-3 text-right font-bold text-red-700">${s.taxOwed.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">${s.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white">
                  <tr>
                    <td className="px-5 py-3 font-black">TOTALS</td>
                    <td className="px-4 py-3 text-right font-black">{totals.fillUps}</td>
                    <td className="px-4 py-3 text-right font-black">{totals.gallons.toFixed(3)}</td>
                    <td />
                    <td className="px-4 py-3 text-right font-black text-red-300">${totals.tax.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black">${totals.cost.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Charts tab */}
      {activeTab === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Miles by State Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-black text-slate-900 mb-4 text-sm">Miles by State</h3>
            {milesByState.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={milesByState.slice(0, 12)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="state" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(v) => [v.toLocaleString() + ' mi', 'Miles']} />
                  <Bar dataKey="miles" radius={[4, 4, 0, 0]}>
                    {milesByState.slice(0, 12).map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Fuel by State Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-black text-slate-900 mb-4 text-sm">Gallons Purchased by State</h3>
            {fuelByState.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={fuelByState.slice(0, 12)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="state" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(v) => [v.toFixed(1) + ' gal', 'Gallons']} />
                  <Bar dataKey="gallons" radius={[4, 4, 0, 0]}>
                    {fuelByState.slice(0, 12).map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tax by State Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
            <h3 className="font-black text-slate-900 mb-4 text-sm">Estimated IFTA Tax Owed by State</h3>
            {fuelByState.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={fuelByState.slice(0, 20)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="state" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(v) => ['$' + v.toFixed(2), 'Est. Tax']} />
                  <Bar dataKey="taxOwed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* FMCSA Compliance Reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
        <div className="font-black text-blue-900 text-sm mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-600" /> FMCSA / IFTA Compliance Checklist</div>
        <div className="grid sm:grid-cols-2 gap-1">
          {[
            'Quarterly returns due: Apr 30, Jul 31, Oct 31, Jan 31',
            'Report all miles traveled in each IFTA member jurisdiction',
            'Keep fuel receipts and trip records for 4 years',
            'Report fuel purchased in each jurisdiction separately',
            'File with your base jurisdiction — not each state individually',
            'Verify current tax rates before final filing (rates change quarterly)',
          ].map(item => (
            <div key={item} className="flex items-start gap-1.5">
              <span className="text-blue-500 mt-0.5">•</span> {item}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
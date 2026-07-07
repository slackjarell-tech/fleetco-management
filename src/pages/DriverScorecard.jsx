import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { Star, TrendingUp, TrendingDown, Users, CheckCircle2, AlertTriangle, Truck, MapPin, ShieldCheck, ChevronDown, ChevronUp, Search, Award } from 'lucide-react';

function calcScore(stats) {
  // Weighted scoring: delivery completion 40%, HOS violations 25%, DVIR defects 20%, load completion 15%
  let score = 100;
  if (stats.totalLoads > 0) {
    const deliveryRate = stats.deliveredLoads / stats.totalLoads;
    score -= (1 - deliveryRate) * 40;
  }
  score -= Math.min(stats.hosViolations * 5, 25);
  score -= Math.min(stats.dvirDefects * 4, 20);
  if (stats.totalLoads === 0) score = 0;
  return Math.max(0, Math.round(score));
}

function scoreGrade(score) {
  if (score >= 90) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  if (score >= 80) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  if (score >= 70) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  if (score >= 60) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { grade: 'F', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
}

export default function DriverScorecard() {
  const [user, setUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loads, setLoads] = useState([]);
  const [hosLogs, setHosLogs] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [sortBy, setSortBy] = useState('score');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-01-01`;
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    api.auth.me().then(async u => {
      setUser(u);
      const [us, ls, hs, ins, fs] = await Promise.all([
        api.entities.User.list(),
        api.entities.Load.list('-pickup_date', 1000),
        api.entities.HOSLog.list('-log_date', 1000),
        api.entities.Inspection.list('-inspection_date', 1000),
        api.entities.FuelLog.list('-date', 1000),
      ]);
      let driverList = us.filter(u => u.role === 'driver');
      if (u?.customer_id) driverList = driverList.filter(d => d.customer_id === u.customer_id);
      setDrivers(driverList);
      setLoads(ls);
      setHosLogs(hs);
      setInspections(ins);
      setFuelLogs(fs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const scorecards = useMemo(() => {
    const fLoads = loads.filter(l => (!l.pickup_date || l.pickup_date >= dateFrom) && (!l.pickup_date || l.pickup_date <= dateTo));
    const fHos = hosLogs.filter(h => h.log_date >= dateFrom && h.log_date <= dateTo);
    const fIns = inspections.filter(i => i.inspection_date >= dateFrom && i.inspection_date <= dateTo);
    const fFuel = fuelLogs.filter(f => f.date >= dateFrom && f.date <= dateTo);

    return drivers.map(driver => {
      const driverLoads = fLoads.filter(l => l.assigned_driver_id === driver.id);
      const driverHos = fHos.filter(h => h.driver_id === driver.id);
      const driverIns = fIns.filter(i => i.driver_id === driver.id);
      const driverFuel = fFuel.filter(f => f.driver_id === driver.id);

      const totalLoads = driverLoads.length;
      const deliveredLoads = driverLoads.filter(l => l.status === 'delivered').length;
      const totalMiles = driverLoads.reduce((s, l) => s + (l.miles || 0), 0);
      const totalRevenue = driverLoads.filter(l => l.status === 'delivered').reduce((s, l) => s + (l.rate || 0), 0);
      const hosViolations = driverHos.reduce((s, h) => s + (h.violations?.length || 0), 0);
      const dvirDefects = driverIns.filter(i => i.defects_found).length;
      const totalFuelCost = driverFuel.reduce((s, f) => s + (f.total_cost || 0), 0);
      const totalFuelGallons = driverFuel.reduce((s, f) => s + (f.gallons || 0), 0);
      const avgMpg = totalFuelGallons > 0 && totalMiles > 0 ? (totalMiles / totalFuelGallons).toFixed(1) : null;

      const stats = { totalLoads, deliveredLoads, hosViolations, dvirDefects };
      const score = calcScore(stats);
      const grade = scoreGrade(score);

      return {
        driver, score, grade,
        totalLoads, deliveredLoads, totalMiles, totalRevenue,
        hosViolations, dvirDefects, totalFuelCost, avgMpg,
        deliveryRate: totalLoads > 0 ? Math.round((deliveredLoads / totalLoads) * 100) : 0,
      };
    }).filter(s => s.totalLoads > 0).sort((a, b) =>
      sortBy === 'score' ? b.score - a.score :
      sortBy === 'revenue' ? b.totalRevenue - a.totalRevenue :
      sortBy === 'miles' ? b.totalMiles - a.totalMiles : 0
    );
  }, [drivers, loads, hosLogs, inspections, fuelLogs, dateFrom, dateTo, sortBy]);

  const filtered = useMemo(() =>
    scorecards.filter(s => !search || s.driver.full_name?.toLowerCase().includes(search.toLowerCase())),
    [scorecards, search]
  );

  const fleetAvgScore = useMemo(() =>
    filtered.length ? Math.round(filtered.reduce((s, d) => s + d.score, 0) / filtered.length) : 0,
    [filtered]
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Driver Scorecards
            </h1>
            <p className="text-slate-300 text-xs mt-1">Performance scores based on delivery rate, HOS violations, DVIR defects, and revenue</p>
          </div>
          <div className="bg-slate-800 rounded-xl px-4 py-2 text-center">
            <div className="text-3xl font-black text-amber-400">{fleetAvgScore}</div>
            <div className="text-xs text-slate-400">Fleet Avg Score</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2">
            <span className="text-slate-400 text-xs">From</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search driver..."
            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">Sort:</span>
          {[['score', 'Score'], ['revenue', 'Revenue'], ['miles', 'Miles']].map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                sortBy === val ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Scorecard List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No driver data for this period</p>
          <p className="text-xs mt-1">Drivers need assigned loads to generate scorecards</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s, idx) => (
            <div key={s.driver.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50"
                onClick={() => setExpanded(p => ({ ...p, [s.driver.id]: !p[s.driver.id] }))}>
                {/* Rank */}
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-black text-slate-500">
                  {idx + 1}
                </div>
                {/* Avatar */}
                <div className={`w-10 h-10 ${s.grade.bg} border ${s.grade.border} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-lg font-black ${s.grade.color}`}>{s.grade.grade}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-slate-900">{s.driver.full_name}</div>
                  <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {s.deliveredLoads}/{s.totalLoads} loads delivered</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.totalMiles.toLocaleString()} mi</span>
                    {s.hosViolations > 0 && <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="w-3 h-3" /> {s.hosViolations} HOS violations</span>}
                    {s.dvirDefects > 0 && <span className="flex items-center gap-1 text-orange-500"><ShieldCheck className="w-3 h-3" /> {s.dvirDefects} DVIR defects</span>}
                  </div>
                </div>
                {/* Score Bar */}
                <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 w-32">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${s.score >= 80 ? 'bg-green-500' : s.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${s.score}%` }} />
                    </div>
                    <span className={`text-sm font-black ${s.grade.color}`}>{s.score}</span>
                  </div>
                  <span className="text-xs text-slate-400">{s.deliveryRate}% delivery rate</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-black text-emerald-600">${s.totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">revenue</div>
                </div>
                {expanded[s.driver.id] ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </div>

              {expanded[s.driver.id] && (
                <div className="border-t border-slate-100 px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50">
                  {[
                    { label: 'Delivery Rate', value: `${s.deliveryRate}%`, color: s.deliveryRate >= 90 ? 'text-green-600' : s.deliveryRate >= 75 ? 'text-yellow-600' : 'text-red-600' },
                    { label: 'Total Miles', value: s.totalMiles.toLocaleString(), color: 'text-blue-600' },
                    { label: 'HOS Violations', value: s.hosViolations, color: s.hosViolations === 0 ? 'text-green-600' : 'text-red-600' },
                    { label: 'DVIR Defects', value: s.dvirDefects, color: s.dvirDefects === 0 ? 'text-green-600' : 'text-orange-600' },
                    { label: 'Total Revenue', value: `$${s.totalRevenue.toLocaleString()}`, color: 'text-emerald-700' },
                    { label: 'Fuel Cost', value: `$${s.totalFuelCost.toLocaleString()}`, color: 'text-amber-700' },
                    { label: 'Avg MPG', value: s.avgMpg || 'N/A', color: 'text-slate-700' },
                    { label: 'Performance Score', value: `${s.score}/100`, color: s.grade.color },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="text-xs text-slate-400 font-semibold">{label}</div>
                      <div className={`text-lg font-black ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
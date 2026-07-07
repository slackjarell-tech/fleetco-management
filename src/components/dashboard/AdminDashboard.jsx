import React, { useMemo } from 'react';
import ComplianceAlertBanner from '@/components/dashboard/ComplianceAlertBanner';
import TodayActivityFeed from '@/components/dashboard/TodayActivityFeed';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Area, AreaChart, ComposedChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Truck, DollarSign,
  Package, Fuel, ClipboardList, Activity, Wrench, CheckCircle2
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const pct = (a, b) => (b === 0 ? 0 : Math.round(((a - b) / b) * 100));

const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = subMonths(new Date(), 5 - i);
  return { label: format(d, 'MMM'), start: startOfMonth(d), end: endOfMonth(d) };
});

function inMonth(dateStr, { start, end }) {
  if (!dateStr) return false;
  try { return isWithinInterval(parseISO(dateStr), { start, end }); } catch { return false; }
}

// ── Sub-components ─────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, delta, icon: Icon, accent = 'text-yellow-400', bg = 'bg-yellow-500/10' }) => (
  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
      <div className={`${bg} p-1.5 rounded-lg`}>
        {Icon && <Icon className={`w-3.5 h-3.5 ${accent}`} />}
      </div>
    </div>
    <div className={`text-2xl font-black ${accent}`}>{value}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
    {delta !== undefined && (
      <div className={`flex items-center gap-1 text-xs font-semibold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(delta)}% vs prev month
      </div>
    )}
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div className="mb-4">
    <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest">{children}</div>
    {sub && <div className="text-slate-500 text-xs mt-0.5">{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label, prefix = '$' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="font-bold" style={{ color: p.color }}>
          {p.name}: {prefix === '$' ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function AdminDashboard({ data }) {
  const { loads, invoices, fuel, vehicles, workOrders } = data;

  // ── Financial KPIs ──
  const totalBilled      = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalCollected   = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const totalOutstanding = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0);
  const overdueAmt       = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total || 0), 0);
  const overdueCount     = invoices.filter(i => i.status === 'overdue').length;
  const totalRevenue     = loads.filter(l => l.status === 'delivered').reduce((s, l) => s + (l.rate || 0), 0);

  // ── Work Order KPIs ──
  const openWOs      = workOrders.filter(w => w.status === 'open').length;
  const inProgressWOs= workOrders.filter(w => w.status === 'in_progress').length;
  const completedWOs = workOrders.filter(w => w.status === 'completed').length;
  const totalRepair  = workOrders.filter(w => w.status === 'completed').reduce((s, w) => s + (w.total_cost || 0), 0);
  const avgRepairCost= completedWOs > 0 ? totalRepair / completedWOs : 0;

  // ── Fleet KPIs ──
  const totalVehicles   = vehicles.length;
  const activeVehicles  = vehicles.filter(v => v.status === 'active').length;
  const inShopVehicles  = vehicles.filter(v => v.status === 'in_shop').length;
  const inactiveVehicles= vehicles.filter(v => v.status === 'inactive').length;
  const uptimePct       = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
  const totalFuelCost   = fuel.reduce((s, f) => s + (f.total_cost || 0), 0);
  const totalGallons    = fuel.reduce((s, f) => s + (f.gallons || 0), 0);

  // ── Net Savings ──
  const totalCosts   = totalRepair + totalFuelCost;
  const totalSaved   = totalCollected - totalCosts;

  // ── Load KPIs ──
  const activeLoads    = loads.filter(l => ['assigned', 'in_transit'].includes(l.status)).length;
  const completedLoads = loads.filter(l => l.status === 'delivered').length;
  const availableLoads = loads.filter(l => l.status === 'available').length;

  // ── 6-month Trend data ──
  const monthlyTrend = useMemo(() => MONTHS.map(m => {
    const revenue  = invoices.filter(i => i.status === 'paid' && inMonth(i.issue_date || i.created_date, m))
                             .reduce((s, i) => s + (i.total || 0), 0);
    const repairs  = workOrders.filter(w => w.status === 'completed' && inMonth(w.completed_date || w.created_date, m))
                               .reduce((s, w) => s + (w.total_cost || 0), 0);
    const fuelCost = fuel.filter(f => inMonth(f.date, m)).reduce((s, f) => s + (f.total_cost || 0), 0);
    const loadsD   = loads.filter(l => l.status === 'delivered' && inMonth(l.delivery_date || l.created_date, m)).length;
    return { month: m.label, Revenue: Math.round(revenue), Repairs: Math.round(repairs), Fuel: Math.round(fuelCost), Loads: loadsD };
  }), [invoices, workOrders, fuel, loads]);

  // Delta vs prev month
  const curMonth  = monthlyTrend[5] || {};
  const prevMonth = monthlyTrend[4] || {};
  const revDelta  = pct(curMonth.Revenue, prevMonth.Revenue);
  const repDelta  = pct(curMonth.Repairs, prevMonth.Repairs);

  // ── Monthly fuel cost breakdown ──
  const fuelByMonth = useMemo(() => MONTHS.map(m => {
    const logs = fuel.filter(f => inMonth(f.date, m));
    const diesel = logs.filter(f => f.fuel_type === 'diesel' || !f.fuel_type).reduce((s, f) => s + (f.total_cost || 0), 0);
    const gasoline = logs.filter(f => f.fuel_type === 'gasoline').reduce((s, f) => s + (f.total_cost || 0), 0);
    const def = logs.filter(f => f.fuel_type === 'DEF').reduce((s, f) => s + (f.total_cost || 0), 0);
    const gallons = logs.reduce((s, f) => s + (f.gallons || 0), 0);
    return { month: m.label, Diesel: Math.round(diesel), Gasoline: Math.round(gasoline), DEF: Math.round(def), Gallons: Math.round(gallons) };
  }), [fuel]);

  // ── Vehicle Uptime by month (derived from work orders in-shop events) ──
  const uptimeTrend = useMemo(() => MONTHS.map(m => {
    // vehicles that had an open/in-progress WO that month = "down"
    const downVehicleIds = new Set(
      workOrders
        .filter(w => ['open','in_progress','awaiting_parts','parts_ordered'].includes(w.status) && inMonth(w.opened_date || w.created_date, m))
        .map(w => w.vehicle_id)
    );
    const completedDownIds = new Set(
      workOrders
        .filter(w => w.status === 'completed' && inMonth(w.completed_date || w.created_date, m))
        .map(w => w.vehicle_id)
    );
    const effectiveDown = totalVehicles > 0 ? Math.min(downVehicleIds.size, totalVehicles) : 0;
    const uptime = totalVehicles > 0 ? Math.max(0, Math.round(((totalVehicles - effectiveDown) / totalVehicles) * 100)) : 100;
    const repairCost = workOrders
      .filter(w => inMonth(w.opened_date || w.created_date, m))
      .reduce((s, w) => s + (w.total_cost || 0), 0);
    return { month: m.label, Uptime: uptime, Down: effectiveDown, RepairCost: Math.round(repairCost) };
  }), [totalVehicles, workOrders]);

  // ── Repair cost by type ──
  const repairByType = useMemo(() => {
    const map = {};
    workOrders.forEach(w => { if (w.repair_type) map[w.repair_type] = (map[w.repair_type] || 0) + (w.total_cost || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7)
      .map(([name, value]) => ({ name: name.length > 8 ? name.slice(0, 7) + '…' : name, value: Math.round(value) }));
  }, [workOrders]);

  // ── Fleet donut ──
  const fleetDonut = [
    { name: 'Active',   value: activeVehicles,   color: '#eab308' },
    { name: 'In Shop',  value: inShopVehicles,   color: '#f97316' },
    { name: 'Inactive', value: inactiveVehicles, color: '#475569' },
  ].filter(d => d.value > 0);

  // ── Invoice donut ──
  const invoiceDonut = [
    { name: 'Paid',    value: invoices.filter(i => i.status === 'paid').length,    color: '#22c55e' },
    { name: 'Sent',    value: invoices.filter(i => i.status === 'sent').length,    color: '#3b82f6' },
    { name: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: '#ef4444' },
    { name: 'Draft',   value: invoices.filter(i => i.status === 'draft').length,   color: '#475569' },
  ].filter(d => d.value > 0);

  const recentWOs   = [...workOrders].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6);
  const recentLoads = [...loads].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-slate-900 min-h-screen">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Performance Dashboard</h1>
          <p className="text-slate-400 text-xs mt-0.5">Fleet · Financial · Repair · KPIs</p>
        </div>
        <div className="text-slate-500 text-xs">{format(new Date(), 'MMMM d, yyyy')}</div>
      </div>

      {/* ── Compliance Alert Banner ── */}
      <ComplianceAlertBanner />

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        <KPICard label="Vehicle Uptime"   value={`${uptimePct}%`}        sub={`${activeVehicles}/${totalVehicles} active`}  delta={undefined}  icon={Truck}       accent="text-yellow-400" bg="bg-yellow-500/10" />
        <KPICard label="In Shop"          value={inShopVehicles}          sub="vehicles"                                      icon={Wrench}      accent="text-orange-400" bg="bg-orange-500/10" />
        <KPICard label="Active Loads"     value={activeLoads}             sub={`${availableLoads} open`}                      icon={Package}     accent="text-blue-400"   bg="bg-blue-500/10" />
        <KPICard label="Loads Delivered"  value={completedLoads}          sub="all time"                                      icon={CheckCircle2}accent="text-green-400"  bg="bg-green-500/10" />
        <KPICard label="Revenue Collected"value={fmt(totalCollected)}     sub="paid invoices"  delta={revDelta}               icon={DollarSign}  accent="text-green-400"  bg="bg-green-500/10" />
        <KPICard label="Outstanding"      value={fmt(totalOutstanding)}   sub={`${overdueCount} overdue`}                     icon={AlertTriangle}accent="text-red-400"   bg="bg-red-500/10" />
        <KPICard label="Total Repair Cost"value={fmt(totalRepair)}        sub={`avg ${fmt(avgRepairCost)}`} delta={repDelta}  icon={ClipboardList}accent="text-orange-400"bg="bg-orange-500/10" />
        <KPICard label="Fuel Spend"       value={fmt(totalFuelCost)}      sub={`${totalGallons.toFixed(0)} gal`}              icon={Fuel}        accent="text-purple-400" bg="bg-purple-500/10" />
        <KPICard label="Net Saved"        value={fmt(totalSaved)}         sub="revenue minus costs"  delta={undefined}               icon={TrendingUp}  accent={totalSaved >= 0 ? "text-emerald-400" : "text-red-400"} bg={totalSaved >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"} />
      </div>

      {/* ── Revenue vs Repair Trend (full width) ── */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <SectionTitle sub="Last 6 months · collected revenue vs repair costs">Revenue vs Repair Cost Trend</SectionTitle>
        {monthlyTrend.every(m => m.Revenue === 0 && m.Repairs === 0) ? (
          <div className="flex items-center justify-center h-44 text-slate-500 text-sm">No financial data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Revenue" fill="url(#revGrad)" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 3 }} name="Revenue" />
              <Bar dataKey="Repairs" fill="#f97316" radius={[3, 3, 0, 0]} name="Repairs" opacity={0.85} />
              <Bar dataKey="Fuel" fill="#a855f7" radius={[3, 3, 0, 0]} name="Fuel" opacity={0.7} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-5 mt-2 justify-center">
          {[['Revenue','#22c55e'],['Repairs','#f97316'],['Fuel','#a855f7']].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* ── Row: Monthly Fuel Costs + Vehicle Uptime Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Monthly Fuel Cost Chart */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <SectionTitle sub="Last 6 months · cost by fuel type">Monthly Fuel Costs</SectionTitle>
          {fuelByMonth.every(m => m.Diesel === 0 && m.Gasoline === 0 && m.DEF === 0) ? (
            <div className="flex items-center justify-center h-44 text-slate-500 text-sm">No fuel logs yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={fuelByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Diesel" stackId="fuel" fill="#a855f7" radius={[0,0,0,0]} name="Diesel" />
                  <Bar dataKey="Gasoline" stackId="fuel" fill="#7c3aed" radius={[0,0,0,0]} name="Gasoline" />
                  <Bar dataKey="DEF" stackId="fuel" fill="#c084fc" radius={[3,3,0,0]} name="DEF" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-5 mt-2 justify-center">
                {[['Diesel','#a855f7'],['Gasoline','#7c3aed'],['DEF','#c084fc']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    {l}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700">
                {[
                  { label: 'Total Fuel Spend', value: fmt(totalFuelCost), color: 'text-purple-400' },
                  { label: 'Total Gallons', value: `${totalGallons.toFixed(0)} gal`, color: 'text-white' },
                  { label: 'Avg $/Gallon', value: totalGallons > 0 ? `$${(totalFuelCost/totalGallons).toFixed(2)}` : '—', color: 'text-slate-300' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className={`font-black text-sm ${s.color}`}>{s.value}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Vehicle Uptime Trend Chart */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <SectionTitle sub="Last 6 months · % of fleet available vs in-shop">Vehicle Uptime Trend</SectionTitle>
          {totalVehicles === 0 ? (
            <div className="flex items-center justify-center h-44 text-slate-500 text-sm">No vehicles yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={uptimeTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}%`} />
                  <YAxis yAxisId="cost" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                  <Tooltip content={<CustomTooltip prefix="" />} />
                  <Area yAxisId="pct" type="monotone" dataKey="Uptime" stroke="#eab308" strokeWidth={2.5}
                    fill="url(#uptimeGrad)" dot={{ fill: '#eab308', r: 4 }} name="Uptime %" />
                  <Bar yAxisId="cost" dataKey="RepairCost" fill="#f97316" radius={[3,3,0,0]} opacity={0.6} name="Repair Cost $" />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex gap-5 mt-2 justify-center">
                {[['Uptime %','#eab308'],['Repair Cost','#f97316']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    {l}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700">
                {[
                  { label: 'Current Uptime', value: `${uptimePct}%`, color: 'text-yellow-400' },
                  { label: 'Vehicles Down', value: inShopVehicles, color: 'text-orange-400' },
                  { label: 'Active Fleet', value: `${activeVehicles}/${totalVehicles}`, color: 'text-white' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className={`font-black text-sm ${s.color}`}>{s.value}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row: Fleet Uptime + WO Status + Invoice Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Vehicle Uptime */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <SectionTitle sub="Active vs offline vehicles">Vehicle Uptime</SectionTitle>
          {totalVehicles === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No vehicles yet</div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative">
                <PieChart width={170} height={170}>
                  <Pie data={fleetDonut} cx={81} cy={81} innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {fleetDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-3xl font-black text-yellow-400">{uptimePct}%</div>
                  <div className="text-slate-400 text-xs">uptime</div>
                </div>
              </div>
              <div className="flex gap-3 mt-1 flex-wrap justify-center">
                {fleetDonut.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
              {/* mini uptime progress */}
              <div className="w-full mt-4 space-y-2">
                {[
                  { label: 'Active', value: activeVehicles, total: totalVehicles, color: 'bg-yellow-400' },
                  { label: 'In Shop', value: inShopVehicles, total: totalVehicles, color: 'bg-orange-400' },
                  { label: 'Inactive', value: inactiveVehicles, total: totalVehicles, color: 'bg-slate-600' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{r.label}</span>
                      <span>{r.value} ({totalVehicles > 0 ? Math.round((r.value / totalVehicles) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${r.color} rounded-full`} style={{ width: `${totalVehicles > 0 ? (r.value / totalVehicles) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Work Order Status */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <SectionTitle sub="Current repair pipeline">Work Order Pipeline</SectionTitle>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: 'Open',        value: openWOs,       color: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-900/40' },
              { label: 'In Progress', value: inProgressWOs, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-900/40' },
              { label: 'Completed',   value: completedWOs,  color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-900/40' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-slate-400 text-xs mt-0.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-slate-700 pt-4">
            {[
              { label: 'Total Repair Cost',  value: fmt(totalRepair),       color: 'text-orange-400' },
              { label: 'Avg Cost / WO',      value: fmt(avgRepairCost),     color: 'text-white' },
              { label: 'Open + In Progress', value: openWOs + inProgressWOs,color: 'text-yellow-400' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs">
                <span className="text-slate-400">{r.label}</span>
                <span className={`font-bold ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>
          {/* WO Loads delivered per month mini bar */}
          <div className="mt-4 border-t border-slate-700 pt-4">
            <div className="text-slate-500 text-xs mb-2">Completed WOs / month</div>
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={monthlyTrend} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <Bar dataKey="Loads" fill="#eab308" radius={[2, 2, 0, 0]} />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip prefix="" />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice Breakdown */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <SectionTitle sub="Collection status">Invoice Breakdown</SectionTitle>
          {invoiceDonut.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No invoices yet</div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative">
                <PieChart width={160} height={160}>
                  <Pie data={invoiceDonut} cx={75} cy={75} innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {invoiceDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-lg font-black text-white">{invoices.length}</div>
                  <div className="text-slate-400 text-xs">total</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 w-full">
                {invoiceDonut.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
              <div className="w-full mt-4 space-y-1.5 border-t border-slate-700 pt-3">
                {[
                  { label: 'Collected',   value: fmt(totalCollected),   color: 'text-green-400' },
                  { label: 'Outstanding', value: fmt(totalOutstanding), color: 'text-yellow-400' },
                  { label: 'Overdue',     value: fmt(overdueAmt),       color: 'text-red-400' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-slate-400">{r.label}</span>
                    <span className={`font-bold ${r.color}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row: Repair Cost by Type + Load Revenue trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Repair Cost by Type */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <SectionTitle sub="Total cost per repair category">Repair Cost by Type</SectionTitle>
          {repairByType.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-slate-500 text-sm">No work orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={repairByType} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Cost">
                  {repairByType.map((_, i) => (
                    <Cell key={i} fill={['#f97316','#eab308','#3b82f6','#a855f7','#22c55e','#ef4444','#06b6d4'][i % 7]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Load Revenue Trend */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <SectionTitle sub="Monthly delivered load revenue">Load Revenue Trend</SectionTitle>
          {monthlyTrend.every(m => m.Revenue === 0) ? (
            <div className="flex items-center justify-center h-44 text-slate-500 text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revFill)" dot={{ fill: '#22c55e', r: 4 }} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700">
            {[
              { label: 'Total Revenue',    value: fmt(totalRevenue),    color: 'text-green-400' },
              { label: 'Loads Delivered',  value: completedLoads,       color: 'text-blue-400' },
              { label: 'Avg per Load',     value: completedLoads > 0 ? fmt(totalRevenue / completedLoads) : '$0', color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`font-black text-sm ${s.color}`}>{s.value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Today's Activity Feed ── */}
      <TodayActivityFeed />

      {/* ── Row: Recent WOs + Recent Loads ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <SectionTitle>Recent Work Orders</SectionTitle>
          {recentWOs.length === 0 && <div className="text-slate-500 text-sm text-center py-8">No work orders yet</div>}
          <div className="space-y-1">
            {recentWOs.map(w => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-slate-700/60 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm text-white font-semibold truncate">#{w.wo_number} — {w.title}</div>
                  <div className="text-xs text-slate-500">{w.repair_type}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-xs text-yellow-400 font-bold mb-0.5">{w.total_cost ? fmt(w.total_cost) : '—'}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    w.status === 'completed'   ? 'bg-green-900/40 text-green-400' :
                    w.status === 'in_progress' ? 'bg-yellow-900/40 text-yellow-400' :
                    w.status === 'open'        ? 'bg-red-900/40 text-red-400' :
                                                 'bg-slate-700 text-slate-400'
                  }`}>{w.status?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <SectionTitle>Recent Loads</SectionTitle>
          {recentLoads.length === 0 && <div className="text-slate-500 text-sm text-center py-8">No loads yet</div>}
          <div className="space-y-1">
            {recentLoads.map(l => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-slate-700/60 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm text-white font-semibold">#{l.load_number}</div>
                  <div className="text-xs text-slate-500 truncate">{l.origin} → {l.destination}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  {l.rate && <div className="text-xs text-green-400 font-bold mb-0.5">{fmt(l.rate)}</div>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    l.status === 'delivered'  ? 'bg-green-900/40 text-green-400' :
                    l.status === 'in_transit' ? 'bg-blue-900/40 text-blue-400' :
                    l.status === 'assigned'   ? 'bg-yellow-900/40 text-yellow-400' :
                                                'bg-slate-700 text-slate-400'
                  }`}>{l.status?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
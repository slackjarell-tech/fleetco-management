import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { DollarSign, Download, Users, CheckCircle2, MapPin, Route, TrendingUp, Search, Calendar, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

const PAY_RATE_DEFAULTS = { per_stop: 1.75, per_route: 25 };

function formatCurrency(n) {
  return `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function downloadExcel(rows, filename, sheetName) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const colWidths = rows[0]?.map((_, ci) =>
    Math.min(50, Math.max(10, ...rows.map(row => String(row[ci] ?? '').length)))
  ) ?? [];
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export default function DriverPayrollSummary() {
  const [user, setUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [ratePerStop, setRatePerStop] = useState(PAY_RATE_DEFAULTS.per_stop);
  const [ratePerRoute, setRatePerRoute] = useState(PAY_RATE_DEFAULTS.per_route);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0,10));

  const PRESETS = useMemo(() => {
    const now = new Date();
    return [
      { label: 'This Month', from: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, to: now.toISOString().slice(0,10) },
      { label: 'Last 30 Days', from: new Date(now-30*86400000).toISOString().slice(0,10), to: now.toISOString().slice(0,10) },
      { label: 'Last 90 Days', from: new Date(now-90*86400000).toISOString().slice(0,10), to: now.toISOString().slice(0,10) },
      { label: 'This Year', from: `${now.getFullYear()}-01-01`, to: now.toISOString().slice(0,10) },
    ];
  }, []);

  useEffect(() => {
    api.auth.me().then(async u => {
      setUser(u);
      const [usrs, rts, sts] = await Promise.all([
        api.entities.User.list(),
        api.entities.DeliveryRoute.list('-route_date', 1000),
        api.entities.DeliveryStop.list('-created_date', 5000),
      ]);
      setDrivers(usrs.filter(u => u.role === 'driver'));
      setRoutes(rts);
      setStops(sts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Build per-driver summaries
  const summaries = useMemo(() => {
    const filteredRoutes = routes.filter(r => {
      if (!r.route_date) return true;
      return r.route_date >= dateFrom && r.route_date <= dateTo;
    });

    const stopsByRoute = {};
    stops.forEach(s => {
      if (!stopsByRoute[s.route_id]) stopsByRoute[s.route_id] = [];
      stopsByRoute[s.route_id].push(s);
    });

    return drivers.map(driver => {
      const driverRoutes = filteredRoutes.filter(r => r.driver_id === driver.id);
      const completedRoutes = driverRoutes.filter(r => r.status === 'completed');
      const inProgressRoutes = driverRoutes.filter(r => r.status === 'in_progress');

      let totalStopsDelivered = 0;
      let totalStopsAttempted = 0;
      const routeDetails = driverRoutes.map(r => {
        const routeStops = stopsByRoute[r.route_id] || stopsByRoute[r.id] || [];
        const delivered = routeStops.filter(s => s.status === 'delivered').length;
        const attempted = routeStops.filter(s => s.status !== 'pending').length;
        totalStopsDelivered += delivered;
        totalStopsAttempted += attempted;
        return {
          route: r,
          totalStops: routeStops.length,
          delivered,
          attempted,
          stopPay: delivered * ratePerStop,
          routePay: r.status === 'completed' ? ratePerRoute : 0,
        };
      });

      const stopPay = totalStopsDelivered * ratePerStop;
      const routePay = completedRoutes.length * ratePerRoute;
      const grossPay = stopPay + routePay;

      return {
        driver,
        totalRoutes: driverRoutes.length,
        completedRoutes: completedRoutes.length,
        inProgressRoutes: inProgressRoutes.length,
        totalStopsDelivered,
        totalStopsAttempted,
        stopPay,
        routePay,
        grossPay,
        routeDetails,
      };
    }).filter(s => s.totalRoutes > 0 || search).sort((a, b) => b.grossPay - a.grossPay);
  }, [drivers, routes, stops, dateFrom, dateTo, ratePerStop, ratePerRoute, search]);

  const filtered = useMemo(() =>
    summaries.filter(s =>
      !search || s.driver.full_name?.toLowerCase().includes(search.toLowerCase())
    ), [summaries, search]);

  const totals = useMemo(() => ({
    routes: filtered.reduce((s, d) => s + d.completedRoutes, 0),
    stops: filtered.reduce((s, d) => s + d.totalStopsDelivered, 0),
    gross: filtered.reduce((s, d) => s + d.grossPay, 0),
  }), [filtered]);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleExport = () => {
    const header = ['Driver', 'Total Routes', 'Completed Routes', 'Stops Delivered', 'Route Pay', 'Stop Pay', 'Gross Pay', 'Period'];
    const rows = [header];
    filtered.forEach(s => {
      rows.push([
        s.driver.full_name,
        s.totalRoutes,
        s.completedRoutes,
        s.totalStopsDelivered,
        s.routePay.toFixed(2),
        s.stopPay.toFixed(2),
        s.grossPay.toFixed(2),
        `${dateFrom} to ${dateTo}`,
      ]);
    });
    rows.push(['', '', '', 'TOTALS', totals.routes, totals.stops, totals.gross.toFixed(2), '']);

    // Route detail sheet
    const detailHeader = ['Driver', 'Route Name', 'Date', 'Status', 'Total Stops', 'Delivered', 'Route Pay', 'Stop Pay', 'Total Pay'];
    const detailRows = [detailHeader];
    filtered.forEach(s => {
      s.routeDetails.forEach(rd => {
        detailRows.push([
          s.driver.full_name,
          rd.route.route_name,
          rd.route.route_date,
          rd.route.status,
          rd.totalStops,
          rd.delivered,
          rd.routePay.toFixed(2),
          rd.stopPay.toFixed(2),
          (rd.routePay + rd.stopPay).toFixed(2),
        ]);
      });
    });

    const ws1 = XLSX.utils.aoa_to_sheet(rows);
    const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
    ws1['!cols'] = header.map(() => ({ wch: 18 }));
    ws2['!cols'] = detailHeader.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Payroll Summary');
    XLSX.utils.book_append_sheet(wb, ws2, 'Route Detail');
    XLSX.writeFile(wb, `Driver_Payroll_${dateFrom}_to_${dateTo}.xlsx`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" /> Driver Route Payroll
            </h1>
            <p className="text-slate-300 text-xs mt-1">Auto-calculated from completed delivery routes and stop counts</p>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-4 py-2.5 rounded-xl text-sm transition-all">
            <Download className="w-4 h-4" /> Export to Excel
          </button>
        </div>

        {/* Date Range */}
        <div className="mt-4 flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => { setDateFrom(p.from); setDateTo(p.to); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  dateFrom === p.from && dateTo === p.to
                    ? 'bg-amber-500 text-slate-900 border-amber-500'
                    : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-amber-400'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pay Rate Config */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <span className="text-xs text-slate-400">Rate / Completed Route:</span>
            <span className="text-amber-400 text-xs font-bold">$</span>
            <input type="number" min="0" step="0.25" value={ratePerRoute}
              onChange={e => setRatePerRoute(parseFloat(e.target.value) || 0)}
              className="bg-transparent text-white text-sm w-16 focus:outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <span className="text-xs text-slate-400">Rate / Delivered Stop:</span>
            <span className="text-amber-400 text-xs font-bold">$</span>
            <input type="number" min="0" step="0.25" value={ratePerStop}
              onChange={e => setRatePerStop(parseFloat(e.target.value) || 0)}
              className="bg-transparent text-white text-sm w-16 focus:outline-none" />
          </div>
        </div>
      </div>

      {/* KPI Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Drivers with Routes', value: filtered.length, icon: Users, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'Completed Routes', value: totals.routes, icon: Route, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Stops Delivered', value: totals.stops.toLocaleString(), icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Gross Pay', value: formatCurrency(totals.gross), icon: TrendingUp, color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search driver..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>

      {/* Driver Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Route className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No driver route data found for this period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.driver.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Driver Row */}
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(s.driver.id)}>
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-black text-sm">{s.driver.full_name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-slate-900">{s.driver.full_name}</div>
                  <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Route className="w-3 h-3" /> {s.completedRoutes} completed / {s.totalRoutes} total routes</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.totalStopsDelivered} stops delivered</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400">Route Pay</div>
                    <div className="text-sm font-black text-blue-600">{formatCurrency(s.routePay)}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400">Stop Pay</div>
                    <div className="text-sm font-black text-emerald-600">{formatCurrency(s.stopPay)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Gross Pay</div>
                    <div className="text-xl font-black text-amber-600">{formatCurrency(s.grossPay)}</div>
                  </div>
                  {expanded[s.driver.id] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Route Detail */}
              {expanded[s.driver.id] && (
                <div className="border-t border-slate-100">
                  <div className="px-5 py-2 bg-slate-50 grid grid-cols-7 gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                    <div className="col-span-2">Route</div>
                    <div>Date</div>
                    <div>Status</div>
                    <div className="text-right">Stops</div>
                    <div className="text-right">Delivered</div>
                    <div className="text-right">Pay</div>
                  </div>
                  {s.routeDetails.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-slate-400 text-center">No routes in this period</div>
                  ) : (
                    s.routeDetails.map(rd => (
                      <div key={rd.route.id} className="px-5 py-3 grid grid-cols-7 gap-2 text-sm border-t border-slate-50 hover:bg-slate-50">
                        <div className="col-span-2 font-semibold text-slate-800 truncate">{rd.route.route_name}</div>
                        <div className="text-slate-500">{rd.route.route_date}</div>
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                            rd.route.status === 'completed' ? 'bg-green-100 text-green-700' :
                            rd.route.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                            rd.route.status === 'cancelled' ? 'bg-red-100 text-red-500' :
                            'bg-slate-100 text-slate-500'
                          }`}>{rd.route.status?.replace('_', ' ')}</span>
                        </div>
                        <div className="text-right text-slate-600">{rd.totalStops}</div>
                        <div className="text-right text-emerald-700 font-bold">{rd.delivered}</div>
                        <div className="text-right font-black text-amber-600">
                          {formatCurrency(rd.routePay + rd.stopPay)}
                        </div>
                      </div>
                    ))
                  )}
                  {/* Driver subtotals */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-6 text-sm">
                    <span className="text-slate-500">Route Bonus: <strong className="text-blue-700">{formatCurrency(s.routePay)}</strong></span>
                    <span className="text-slate-500">Stop Pay: <strong className="text-emerald-700">{formatCurrency(s.stopPay)}</strong></span>
                    <span className="text-slate-700 font-black">Total: <span className="text-amber-600">{formatCurrency(s.grossPay)}</span></span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
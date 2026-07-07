import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Calendar, Truck, Search, Clock } from 'lucide-react';

const DOC_TYPES_TRACKED = [
  'Insurance', 'Registration', 'DOT Inspection Sticker', 'Annual Inspection Report',
  'IFTA Permit', 'IRP Registration', 'Oversize Permit', 'Hazmat Permit'
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function statusBadge(days) {
  if (days === null) return { label: 'No Date', color: 'bg-slate-100 text-slate-500', icon: null };
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, color: 'bg-red-100 text-red-700', icon: XCircle };
  if (days <= 14) return { label: `${days}d left`, color: 'bg-red-100 text-red-700', icon: AlertTriangle };
  if (days <= 30) return { label: `${days}d left`, color: 'bg-amber-100 text-amber-700', icon: AlertTriangle };
  if (days <= 90) return { label: `${days}d left`, color: 'bg-yellow-100 text-yellow-700', icon: Clock };
  return { label: `${days}d left`, color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
}

export default function ComplianceTracker() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, critical, warning, ok

  useEffect(() => {
    api.auth.me().then(async u => {
      setUser(u);
      const [vs, ds] = await Promise.all([
        api.entities.Vehicle.list(),
        api.entities.VehicleDocument.list(),
      ]);
      let filteredVehicles = vs;
      if (u?.customer_id) filteredVehicles = vs.filter(v => v.assigned_customer_id === u.customer_id);
      setVehicles(filteredVehicles);
      setDocs(ds);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(v => [v.id, v])), [vehicles]);

  // Build flat list of compliance items
  const items = useMemo(() => {
    return docs
      .filter(d => DOC_TYPES_TRACKED.includes(d.doc_type))
      .map(d => {
        const days = daysUntil(d.expiration_date);
        const badge = statusBadge(days);
        const vehicle = vehicleMap[d.vehicle_id];
        return { ...d, days, badge, vehicle };
      })
      .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
  }, [docs, vehicleMap]);

  const counts = useMemo(() => ({
    expired: items.filter(i => i.days !== null && i.days < 0).length,
    critical: items.filter(i => i.days !== null && i.days >= 0 && i.days <= 14).length,
    warning: items.filter(i => i.days !== null && i.days > 14 && i.days <= 30).length,
    upcoming: items.filter(i => i.days !== null && i.days > 30 && i.days <= 90).length,
  }), [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchSearch = !search ||
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.vehicle?.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
        i.doc_type?.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'all' ? true :
        filter === 'critical' ? (i.days !== null && i.days <= 14) :
        filter === 'warning' ? (i.days !== null && i.days > 14 && i.days <= 30) :
        filter === 'upcoming' ? (i.days !== null && i.days > 30 && i.days <= 90) :
        filter === 'ok' ? (i.days !== null && i.days > 90) : true;
      return matchSearch && matchFilter;
    });
  }, [items, search, filter]);

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
          <ShieldCheck className="w-5 h-5 text-amber-400" /> Compliance Expiration Tracker
        </h1>
        <p className="text-slate-300 text-xs mt-1">Monitor vehicle documents, permits, and registrations expiring soon</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Expired', value: counts.expired, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', f: 'critical' },
          { label: 'Critical (≤14d)', value: counts.critical, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', f: 'critical' },
          { label: 'Warning (≤30d)', value: counts.warning, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', f: 'warning' },
          { label: 'Upcoming (≤90d)', value: counts.upcoming, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', f: 'upcoming' },
        ].map(c => (
          <div key={c.label} onClick={() => setFilter(f => f === c.f ? 'all' : c.f)}
            className={`${c.bg} border ${c.border} rounded-xl p-4 cursor-pointer hover:opacity-80 transition-all ${filter === c.f ? 'ring-2 ring-offset-1 ring-amber-400' : ''}`}>
            <div className={`text-3xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-xs text-slate-600 mt-0.5 font-semibold">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicle, doc type..."
            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-64" />
        </div>
        {['all', 'critical', 'warning', 'upcoming', 'ok'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${
              filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}>{f === 'all' ? `All (${items.length})` : f}
          </button>
        ))}
      </div>

      {/* Document List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No compliance documents match this filter</p>
          <p className="text-xs mt-1">Upload vehicle documents with expiration dates in the Fleet section</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
            <div className="col-span-2">Vehicle</div>
            <div className="col-span-3">Document</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Expires</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Notes</div>
          </div>
          {filtered.map(item => {
            const BadgeIcon = item.badge.icon;
            return (
              <div key={item.id} className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-50 hover:bg-slate-50 items-center text-sm">
                <div className="col-span-2 flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-bold text-slate-800">
                    {item.vehicle ? `Unit ${item.vehicle.unit_number}` : '—'}
                  </span>
                </div>
                <div className="col-span-3 font-semibold text-slate-800 truncate">{item.name}</div>
                <div className="col-span-2 text-slate-500 text-xs">{item.doc_type}</div>
                <div className="col-span-2 text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {item.expiration_date || '—'}
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${item.badge.color}`}>
                    {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                    {item.badge.label}
                  </span>
                </div>
                <div className="col-span-1 text-xs text-slate-400 truncate">{item.notes || '—'}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, Cpu, AlertTriangle, CheckCircle2, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DiagnosticModal from '@/components/diagnostics/DiagnosticModal';

const SEVERITY_STYLES = {
  critical: { bg: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: AlertTriangle },
  warning: { bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: AlertTriangle },
  info: { bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: Info },
};

const STATUS_STYLES = {
  active: 'bg-red-100 text-red-600',
  monitoring: 'bg-amber-100 text-amber-600',
  resolved: 'bg-green-100 text-green-700',
};

export default function Diagnostics() {
  const [user, setUser] = useState(null);
  const [codes, setCodes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editCode, setEditCode] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const loadData = async () => {
    const u = await api.auth.me();
    setUser(u);
    const [c, v] = await Promise.all([
      api.entities.DiagnosticCode.list('-scan_date'),
      api.entities.Vehicle.list(),
    ]);
    let filteredCodes = c;
    if (u?.customer_id) {
      const customerVehicleIds = v.filter(veh => veh.assigned_customer_id === u.customer_id).map(veh => veh.id);
      filteredCodes = c.filter(code => customerVehicleIds.includes(code.vehicle_id));
    }
    setCodes(filteredCodes);
    setVehicles(v);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (data) => {
    if (editCode) {
      const updated = await api.entities.DiagnosticCode.update(editCode.id, data);
      setCodes(prev => prev.map(c => c.id === editCode.id ? updated : c));
    } else {
      const created = await api.entities.DiagnosticCode.create(data);
      setCodes(prev => [created, ...prev]);
    }
    setShowModal(false);
    setEditCode(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this diagnostic code?')) return;
    await api.entities.DiagnosticCode.delete(id);
    setCodes(prev => prev.filter(c => c.id !== id));
  };

  const getVehicle = (id) => vehicles.find(v => v.id === id);
  const isAdmin = user?.role === 'admin' || user?.role === 'tech' || user?.role === 'executive';

  const filtered = codes.filter(c => {
    const v = getVehicle(c.vehicle_id);
    const matchSearch = !search ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      v?.unit_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    active: codes.filter(c => c.status === 'active').length,
    monitoring: codes.filter(c => c.status === 'monitoring').length,
    resolved: codes.filter(c => c.status === 'resolved').length,
    critical: codes.filter(c => c.severity === 'critical' && c.status === 'active').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-500" /> Vehicle Diagnostics
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">DTC code lookup & tracking — OBD-II · J1939 (9-pin) · Manual</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditCode(null); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
            <Plus className="w-4 h-4 mr-2" /> Log Code
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Codes', value: counts.active, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Critical', value: counts.critical, color: 'text-red-700', bg: 'bg-red-100' },
          { label: 'Monitoring', value: counts.monitoring, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Resolved', value: counts.resolved, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-200`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Connector info banner */}
      <div className="bg-slate-900 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
        <Cpu className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-semibold">Supported Diagnostic Connectors</div>
          <div className="text-slate-400 text-xs mt-0.5">Connect your scan tool to the vehicle, read the codes, then log them below.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['OBD-II (16-pin) — Gas/Light Duty', 'J1939 (9-pin) — Heavy Duty Trucks', 'J1708 — Older Commercial', 'Manual Entry'].map(t => (
            <span key={t} className="bg-slate-800 text-amber-400 text-xs px-2.5 py-1 rounded-full font-medium">{t}</span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by code, description, unit #..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'monitoring', 'resolved'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filterStatus === s ? 'bg-amber-500 text-slate-900' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Code list */}
      <div className="space-y-3">
        {filtered.map(c => {
          const v = getVehicle(c.vehicle_id);
          const sev = SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.warning;
          const SevIcon = sev.icon;
          const isExpanded = expanded === c.id;

          return (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : c.id)}>
                <div className={`w-2 h-10 rounded-full flex-shrink-0 ${sev.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900 text-lg font-mono">{c.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sev.bg}`}>
                      <SevIcon className="w-3 h-3 inline mr-1" />{c.severity}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                    {c.system && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.system}</span>}
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5 truncate">{c.description || <span className="text-slate-400 italic">No description</span>}</div>
                  <div className="flex gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                    {v && <span>Unit #{v.unit_number} — {[v.year, v.make, v.model].filter(Boolean).join(' ')}</span>}
                    {c.scan_date && <span>{c.scan_date}</span>}
                    {c.connector_type && <span>{c.connector_type}</span>}
                    {c.scanned_by && <span>by {c.scanned_by}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAdmin && (
                    <>
                      <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setEditCode(c); setShowModal(true); }}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); handleDelete(c.id); }}>
                        <X className="w-4 h-4 text-red-400" />
                      </Button>
                    </>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 pb-4 pt-0 border-t border-slate-100 bg-slate-50 space-y-2 text-sm">
                  {c.odometer && <div><span className="text-slate-400">Odometer:</span> <span className="text-slate-700">{c.odometer.toLocaleString()} mi</span></div>}
                  {c.work_order_id && <div><span className="text-slate-400">Work Order:</span> <span className="text-slate-700">{c.work_order_id}</span></div>}
                  {c.resolution_notes && <div><span className="text-slate-400">Resolution Notes:</span> <p className="text-slate-700 mt-0.5">{c.resolution_notes}</p></div>}
                  {!c.resolution_notes && !c.odometer && !c.work_order_id && (
                    <p className="text-slate-400 italic">No additional details logged.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No diagnostic codes found</p>
            {isAdmin && <p className="text-sm mt-1">Click "Log Code" to add a DTC from your scan tool</p>}
          </div>
        )}
      </div>

      {showModal && (
        <DiagnosticModal
          code={editCode}
          vehicles={vehicles}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditCode(null); }}
        />
      )}
    </div>
  );
}
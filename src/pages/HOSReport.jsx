import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, AlertTriangle, CheckCircle2, Clock, FileText, ChevronDown, ChevronUp, Shield, ClipboardCheck, ShieldCheck } from 'lucide-react';
import HOSLogForm from '@/components/hos/HOSLogForm';
import HOSGrid from '@/components/hos/HOSGrid';
import HOSViolations from '@/components/hos/HOSViolations';
import DVIRModal from '@/components/hos/DVIRModal';
import DVIRSignoffModal from '@/components/hos/DVIRSignoffModal';
import { isExecutiveView } from '@/lib/roles';

const STATUS_STYLES = {
  draft:     'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-100 text-blue-700',
  reviewed:  'bg-emerald-100 text-emerald-700',
};

const STATUS_ICONS = {
  draft: Clock,
  submitted: FileText,
  reviewed: CheckCircle2,
};

export default function HOSReport() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [dvirLog, setDvirLog] = useState(null); // log to attach DVIR to
  const [dvirSignoff, setDvirSignoff] = useState(null); // DVIR inspection awaiting signoff
  const [inspections, setInspections] = useState([]);

  const load = async () => {
    const [u, allUsers, vehs, allLogs, allInspections] = await Promise.all([
      api.auth.me().catch(() => null),
      api.entities.User.list(),
      api.entities.Vehicle.list(),
      api.entities.HOSLog.list('-log_date', 500),
      api.entities.Inspection.list('-created_date', 500),
    ]);
    setUser(u);
    setUsers(allUsers);
    setVehicles(vehs);
    setInspections(allInspections);
    // Drivers see only their own logs; customer roles see their drivers' logs
    let filtered = allLogs;
    if (u?.role === 'driver') {
      filtered = filtered.filter(l => l.driver_id === u.id);
    } else if (u?.customer_id) {
      const customerDriverIds = allUsers.filter(d => d.customer_id === u.customer_id).map(d => d.id);
      filtered = filtered.filter(l => customerDriverIds.includes(l.driver_id));
    }
    setLogs(filtered);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const userMap = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users]);
  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(v => [v.id, v])), [vehicles]);
  const drivers = users.filter(u => u.role === 'driver');

  const handleSave = async (data) => {
    if (editing) {
      await api.entities.HOSLog.update(editing.id, data);
    } else {
      await api.entities.HOSLog.create(data);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleStatusChange = async (log, newStatus) => {
    await api.entities.HOSLog.update(log.id, { status: newStatus });
    load();
  };

  const handleDVIRSave = async (data) => {
    // Check if there's already a DVIR for this log + type
    const existing = inspections.find(i => i.hos_log_id === dvirLog?.id && i.inspection_type === data.inspection_type);
    if (existing) {
      await api.entities.Inspection.update(existing.id, data);
    } else {
      await api.entities.Inspection.create(data);
    }
    setDvirLog(null);
    load();
  };

  const handleManagerSignoff = async (inspectionId, signoffData) => {
    await api.entities.Inspection.update(inspectionId, signoffData);
    setDvirSignoff(null);
    load();
  };

  // Map inspections by hos_log_id for quick lookup
  const dvirByLogId = useMemo(() => {
    const map = {};
    inspections.forEach(i => {
      if (i.hos_log_id) {
        if (!map[i.hos_log_id]) map[i.hos_log_id] = [];
        map[i.hos_log_id].push(i);
      }
    });
    return map;
  }, [inspections]);

  const pendingSignoffs = useMemo(() =>
    inspections.filter(i => i.status === 'awaiting_signoff'),
  [inspections]);

  const filtered = useMemo(() => logs.filter(l => {
    const driver = userMap[l.driver_id];
    const matchSearch = !search || (driver?.full_name || '').toLowerCase().includes(search.toLowerCase()) || l.log_date?.includes(search);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchDriver = driverFilter === 'all' || l.driver_id === driverFilter;
    return matchSearch && matchStatus && matchDriver;
  }), [logs, search, statusFilter, driverFilter, userMap]);

  const totals = useMemo(() => ({
    submitted: logs.filter(l => l.status === 'submitted').length,
    violations: logs.filter(l => l.violations?.length > 0).length,
    reviewed: logs.filter(l => l.status === 'reviewed').length,
  }), [logs]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">HOS / ELD Logs</h1>
          <p className="text-slate-500 text-sm mt-0.5">FMCSA Hours of Service — Driver Daily Records</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2.5 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> New Log Entry
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: totals.submitted, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Violations', value: totals.violations, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Reviewed', value: totals.reviewed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'DVIRs Awaiting Sign-Off', value: pendingSignoffs.length, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`${s.bg} p-2.5 rounded-lg hidden sm:flex`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending DVIR sign-off banner for managers */}
      {(isExecutiveView(user?.role)) && pendingSignoffs.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-800 font-black text-sm mb-2">
            <AlertTriangle className="w-4 h-4" /> {pendingSignoffs.length} DVIR(s) Awaiting Your Sign-Off
          </div>
          <div className="space-y-2">
            {pendingSignoffs.map(dvir => (
              <div key={dvir.id} className="flex items-center justify-between bg-white rounded-lg border border-amber-200 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-bold text-slate-800">{dvir.inspection_type}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-600">{dvir.inspector_name}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-500">{dvir.inspection_date}</span>
                  {dvir.defects_found && (
                    <span className="ml-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">⚠ Defects</span>
                  )}
                </div>
                <button
                  onClick={() => setDvirSignoff(dvir)}
                  className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Sign Off
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Search by driver or date..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        {(isExecutiveView(user?.role)) && (
          <select value={driverFilter} onChange={e => setDriverFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="all">All Drivers</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
          </select>
        )}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      {/* Log List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-14 text-slate-400 bg-white rounded-xl border border-slate-200">
            No HOS logs found. Create a new log entry to get started.
          </div>
        )}

        {filtered.map(log => {
          const driver = userMap[log.driver_id];
          const vehicle = vehicleMap[log.vehicle_id];
          const isExpanded = expanded === log.id;
          const StatusIcon = STATUS_ICONS[log.status] || Clock;
          const hasViolations = log.violations?.length > 0;

          return (
            <div key={log.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${hasViolations ? 'border-red-200' : 'border-slate-200'}`}>
              {/* Row header */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50"
                onClick={() => setExpanded(isExpanded ? null : log.id)}
              >
                {/* Driver avatar */}
                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-black text-sm">{driver?.full_name?.charAt(0) || '?'}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{driver?.full_name || 'Unknown Driver'}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm text-slate-600">{log.log_date}</span>
                    {vehicle && <span className="text-xs text-slate-400">Unit {vehicle.unit_number}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-500">
                    <span className="text-emerald-600 font-semibold">{log.hours_driving?.toFixed(1) || '0.0'} hrs driving</span>
                    <span>{log.hours_on_duty?.toFixed(1) || '0.0'} on duty</span>
                    {log.total_miles > 0 && <span>{log.total_miles} mi</span>}
                    {log.starting_location && log.ending_location && (
                      <span className="hidden sm:inline truncate">{log.starting_location} → {log.ending_location}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasViolations && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> {log.violations.length}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[log.status]}`}>
                    <StatusIcon className="w-3 h-3" />
                    {log.status}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-5 space-y-5">
                  {/* Hours summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Off Duty', val: log.hours_off_duty, color: 'text-slate-500' },
                      { label: 'Sleeper', val: log.hours_sleeper, color: 'text-blue-600' },
                      { label: 'Driving', val: log.hours_driving, color: 'text-emerald-600' },
                      { label: 'On Duty', val: log.hours_on_duty, color: 'text-amber-600' },
                    ].map(h => (
                      <div key={h.label} className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className={`text-xl font-black ${h.color}`}>{(h.val || 0).toFixed(1)}</div>
                        <div className="text-xs text-slate-400">{h.label} hrs</div>
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  {log.duty_segments?.length > 0 && (
                    <div>
                      <div className="text-xs font-black text-slate-400 uppercase mb-2">24-Hour Grid</div>
                      <HOSGrid segments={log.duty_segments} />
                    </div>
                  )}

                  {/* Violations */}
                  <div>
                    <div className="text-xs font-black text-slate-400 uppercase mb-2">FMCSA Compliance</div>
                    <HOSViolations violations={log.violations || []} />
                  </div>

                  {/* Remarks */}
                  {log.remarks && (
                    <div className="text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3">
                      <span className="font-bold text-slate-700">Remarks: </span>{log.remarks}
                    </div>
                  )}

                  {/* Certification */}
                  {log.signature_confirmed && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Driver certified — 49 CFR 395.8(j)
                    </div>
                  )}

                  {/* DVIR Section */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5" /> Driver Vehicle Inspection Reports (DVIR)
                    </div>
                    {(dvirByLogId[log.id] || []).length === 0 ? (
                      <div className="text-xs text-slate-400 italic mb-3">No DVIR filed for this log yet.</div>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {(dvirByLogId[log.id] || []).map(dvir => (
                          <div key={dvir.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                            dvir.status === 'awaiting_signoff' ? 'bg-amber-50 border-amber-200' :
                            dvir.status === 'passed' ? 'bg-emerald-50 border-emerald-200' :
                            'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700">{dvir.inspection_type}</span>
                              {dvir.defects_found && <span className="text-red-600 font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">⚠ {(dvir.items_checked || []).filter(i => i.result === 'defect').length} defect(s)</span>}
                              {dvir.status === 'passed' && <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cleared</span>}
                              {dvir.status === 'awaiting_signoff' && <span className="text-amber-700 font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> Awaiting Sign-Off</span>}
                              {dvir.manager_name && <span className="text-slate-400">· Mgr: {dvir.manager_name}</span>}
                            </div>
                            {(isExecutiveView(user?.role)) && dvir.status === 'awaiting_signoff' && (
                              <button
                                onClick={() => setDvirSignoff(dvir)}
                                className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-2.5 py-1 rounded-lg flex items-center gap-1"
                              >
                                <ShieldCheck className="w-3 h-3" /> Sign Off
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDvirLog({ ...log, _dvirType: 'Pre-Trip' })}
                        className="text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-500" /> Pre-Trip DVIR
                      </button>
                      <button
                        onClick={() => setDvirLog({ ...log, _dvirType: 'Post-Trip' })}
                        className="text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-blue-500" /> Post-Trip DVIR
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <button
                      onClick={() => { setEditing(log); setShowForm(true); }}
                      className="text-xs border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                    >Edit Log</button>
                    {(isExecutiveView(user?.role)) && log.status === 'submitted' && (
                      <button
                        onClick={() => handleStatusChange(log, 'reviewed')}
                        className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-3 py-1.5 rounded-lg"
                      >Mark Reviewed</button>
                    )}
                    {(isExecutiveView(user?.role)) && log.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(log, 'submitted')}
                        className="text-xs bg-blue-500 hover:bg-blue-400 text-white font-bold px-3 py-1.5 rounded-lg"
                      >Submit</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <HOSLogForm
          vehicles={vehicles}
          users={users}
          currentUser={user}
          initialData={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {dvirLog && (
        <DVIRModal
          hosLog={dvirLog}
          vehicle={vehicleMap[dvirLog.vehicle_id]}
          currentUser={user}
          existingDvir={
            (dvirByLogId[dvirLog.id] || []).find(d => d.inspection_type === dvirLog._dvirType) || null
          }
          onSave={handleDVIRSave}
          onClose={() => setDvirLog(null)}
        />
      )}

      {dvirSignoff && (
        <DVIRSignoffModal
          dvir={dvirSignoff}
          currentUser={user}
          onSignoff={handleManagerSignoff}
          onClose={() => setDvirSignoff(null)}
        />
      )}
    </div>
  );
}
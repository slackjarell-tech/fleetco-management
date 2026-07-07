import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/apiClient';
import {
  Clock, Moon, Truck, HardHat, ClipboardCheck, FileText,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight, ArrowLeft,
  User, Calendar, ShieldAlert, MapPin
} from 'lucide-react';

// ── Duty Status ──
const DUTY_OPTIONS = [
  { value: 'off_duty', label: 'Off Duty', icon: Moon, color: 'bg-slate-700 hover:bg-slate-600', active: 'bg-slate-600 ring-2 ring-slate-400' },
  { value: 'sleeper_berth', label: 'Sleeper', icon: Moon, color: 'bg-indigo-700 hover:bg-indigo-600', active: 'bg-indigo-600 ring-2 ring-indigo-400' },
  { value: 'driving', label: 'Driving', icon: Truck, color: 'bg-emerald-700 hover:bg-emerald-600', active: 'bg-emerald-600 ring-2 ring-emerald-400' },
  { value: 'on_duty_not_driving', label: 'On Duty', icon: HardHat, color: 'bg-amber-600 hover:bg-amber-500', active: 'bg-amber-500 ring-2 ring-amber-300' },
];

// ── Checklists ──
const PRE_TRIP_ITEMS = [
  { section: 'Lights & Signals', items: ['Headlights', 'Tail lights', 'Brake lights', 'Turn signals', 'Hazard flashers', 'Clearance lights'] },
  { section: 'Tires & Wheels', items: ['Tire pressure', 'Tread depth', 'No cuts/bulges', 'Lug nuts tight', 'Spare secured'] },
  { section: 'Brakes', items: ['Air pressure', 'Parking brake', 'Brake pedal feel', 'No fluid leaks'] },
  { section: 'Engine & Fluids', items: ['Oil level', 'Coolant', 'Washer fluid', 'No leaks', 'Battery secure'] },
  { section: 'Cab & Interior', items: ['Mirrors adjusted', 'Windshield clear', 'Wipers work', 'Seatbelt works', 'Horn works', 'Dash lights clear'] },
  { section: 'Safety', items: ['Fire extinguisher', 'Triangles/flares', 'First aid kit', 'Cargo secured'] },
];

const POST_TRIP_ITEMS = [
  { section: 'Vehicle Condition', items: ['Any new damage', 'Tire condition', 'Brake performance', 'Suspension issues', 'Steering concerns'] },
  { section: 'Fluids & Leaks', items: ['Oil leaks', 'Coolant leaks', 'Fuel leaks', 'DEF level', 'Washer fluid'] },
  { section: 'Lights & Electrical', items: ['All lights working', 'Dashboard warnings', 'Battery charge'] },
  { section: 'Cargo', items: ['Cargo intact', 'Seals intact', 'Load secure'] },
  { section: 'Documentation', items: ['BOL/POD submitted', 'Miles recorded', 'Fuel receipts', 'Scale tickets'] },
];

const RESULT_BTN = [
  { value: 'ok', label: 'OK', cls: 'bg-emerald-600 text-white' },
  { value: 'defect', label: 'Defect', cls: 'bg-red-600 text-white' },
  { value: 'na', label: 'N/A', cls: 'bg-slate-500 text-white' },
];

// ── Main Page ──
export default function EldPortal() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('duty');

  // Duty status
  const [currentDuty, setCurrentDuty] = useState('off_duty');
  const [dutyLogs, setDutyLogs] = useState([]);
  const [savingDuty, setSavingDuty] = useState(false);

  // DVIR state
  const [dvirType, setDvirType] = useState('Pre-Trip');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [odometer, setOdometer] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [dvirNotes, setDvirNotes] = useState('');
  const [dvirDone, setDvirDone] = useState(false);
  const [dvirDefects, setDvirDefects] = useState(0);

  // Build checklist
  const buildItems = (type) => (type === 'Pre-Trip' ? PRE_TRIP_ITEMS : POST_TRIP_ITEMS);
  const flattenItems = (type) => {
    const sections = type === 'Pre-Trip' ? PRE_TRIP_ITEMS : POST_TRIP_ITEMS;
    return sections.flatMap(s => s.items.map(item => ({ item, result: '', notes: '' })));
  };
  const [checklist, setChecklist] = useState(flattenItems('Pre-Trip'));
  const [submitting, setSubmitting] = useState(false);

  // My logs
  const [hosLogs, setHosLogs] = useState([]);
  const [inspections, setInspections] = useState([]);

  useEffect(() => {
    api.auth.me().then(async (u) => {
      setUser(u);
      const [vehs, logs, insps] = await Promise.all([
        api.entities.Vehicle.filter({ status: 'active' }),
        api.entities.HOSLog.filter({ driver_id: u.id }, '-log_date', 30),
        api.entities.Inspection.filter({ driver_id: u.id }, '-inspection_date', 20),
      ]);
      setVehicles(vehs);
      setHosLogs(logs);
      setInspections(insps);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Switch DVIR type
  const switchDvirType = (type) => {
    setDvirType(type);
    setChecklist(flattenItems(type));
    setDvirDone(false);
    setDvirDefects(0);
    setOdometer('');
    setTrailerNumber('');
    setDvirNotes('');
  };

  const setItemResult = (idx, result) => {
    setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, result } : c));
  };
  const setItemNotes = (idx, notes) => {
    setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, notes } : c));
  };

  const defects = checklist.filter(c => c.result === 'defect');
  const answered = checklist.filter(c => c.result).length;
  const overallStatus = defects.length > 0 ? 'failed' : answered === checklist.length ? 'passed' : 'needs_attention';
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const handleDvirSubmit = async () => {
    setSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    const inspection = await api.entities.Inspection.create({
      vehicle_id: selectedVehicleId,
      inspection_type: dvirType,
      inspection_date: today,
      inspector_name: user?.full_name || 'Driver',
      driver_id: user?.id,
      odometer: odometer ? Number(odometer) : undefined,
      trailer_number: trailerNumber || undefined,
      status: overallStatus,
      items_checked: checklist.map(c => ({ item: c.item, result: c.result || 'na', notes: c.notes })),
      notes: dvirNotes,
      defects_found: defects.length > 0,
      defects_corrected: defects.length === 0,
      vehicle_condition_satisfactory: defects.length === 0,
      driver_signature_confirmed: true,
      driver_signed_at: new Date().toISOString(),
      manager_signoff_required: defects.length > 0,
    });

    if (defects.length > 0) {
      const woNum = `DV-${Date.now()}`;
      const complaint = defects.map(d => `• ${d.item}${d.notes ? `: ${d.notes}` : ''}`).join('\n');
      await api.entities.WorkOrder.create({
        wo_number: woNum,
        title: `${dvirType} DVIR Defects — Unit ${selectedVehicle?.unit_number || ''}`,
        repair_type: 'Other',
        status: 'open',
        priority: 'high',
        vehicle_id: selectedVehicleId,
        opened_date: today,
        complaint: `${dvirType} DVIR defects reported by ${user?.full_name}:\n${complaint}`,
      });
    }

    setSubmitting(false);
    setDvirDone(true);
    setDvirDefects(defects.length);
    // Refresh inspections
    const freshInsps = await api.entities.Inspection.filter({ driver_id: user?.id }, '-inspection_date', 20);
    setInspections(freshInsps);
  };

  const changeDutyStatus = async (status) => {
    setSavingDuty(true);
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const segment = { status, start_time: now.toISOString(), end_time: '' };

    // If there's already a log for today, append segment; otherwise create new log
    const todayLog = hosLogs.find(l => l.log_date === today);
    if (todayLog) {
      const updatedSegments = [...(todayLog.duty_segments || []), segment];
      await api.entities.HOSLog.update(todayLog.id, {
        duty_segments: updatedSegments,
        hours_off_duty: calcHours(updatedSegments, 'off_duty'),
        hours_sleeper: calcHours(updatedSegments, 'sleeper_berth'),
        hours_driving: calcHours(updatedSegments, 'driving'),
        hours_on_duty: calcHours(updatedSegments, 'on_duty_not_driving'),
      });
    } else {
      await api.entities.HOSLog.create({
        driver_id: user.id,
        log_date: today,
        vehicle_id: selectedVehicleId || undefined,
        duty_segments: [segment],
        status: 'draft',
      });
    }

    setCurrentDuty(status);
    setSavingDuty(false);
    // Refresh logs
    const freshLogs = await api.entities.HOSLog.filter({ driver_id: user.id }, '-log_date', 30);
    setHosLogs(freshLogs);
  };

  function calcHours(segments, status) {
    return segments.filter(s => s.status === status).reduce((sum, s) => {
      if (!s.end_time) return sum;
      return sum + (new Date(s.end_time) - new Date(s.start_time)) / 3600000;
    }, 0);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 bg-slate-900">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const TAB_BTN = ({ id, label, icon: Icon }) => (
    <button onClick={() => setTab(id)}
      className={`flex-1 py-2.5 text-xs font-bold flex flex-col items-center gap-1 rounded-xl transition-all ${
        tab === id ? 'bg-amber-500 text-slate-900 shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
      }`}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-black text-sm">ELD Log</div>
            <div className="text-slate-400 text-xs">{user?.full_name}</div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            currentDuty === 'driving' ? 'bg-emerald-500/20 text-emerald-400' :
            currentDuty === 'on_duty_not_driving' ? 'bg-amber-500/20 text-amber-400' :
            currentDuty === 'sleeper_berth' ? 'bg-indigo-500/20 text-indigo-400' :
            'bg-slate-600 text-slate-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {DUTY_OPTIONS.find(d => d.value === currentDuty)?.label || 'Off Duty'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 py-3 flex gap-1.5">
        <TAB_BTN id="duty" label="Duty" icon={Clock} />
        <TAB_BTN id="pretrip" label="Pre-Trip" icon={AlertTriangle} />
        <TAB_BTN id="posttrip" label="Post-Trip" icon={ClipboardCheck} />
        <TAB_BTN id="logs" label="Logs" icon={FileText} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">

        {/* ── DUTY STATUS TAB ── */}
        {tab === 'duty' && (
          <div className="space-y-4 pt-2">
            <p className="text-slate-400 text-xs text-center">Tap to change your duty status</p>
            <div className="grid grid-cols-2 gap-3">
              {DUTY_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isActive = currentDuty === opt.value;
                return (
                  <button key={opt.value} disabled={savingDuty}
                    onClick={() => changeDutyStatus(opt.value)}
                    className={`flex flex-col items-center gap-2 py-6 rounded-2xl font-bold text-sm transition-all ${
                      isActive ? opt.active + ' scale-105' : opt.color + ' text-white'
                    }`}
                  >
                    <Icon className="w-7 h-7" />
                    {opt.label}
                    {isActive && <span className="text-xs opacity-70">● Active</span>}
                  </button>
                );
              })}
            </div>

            {/* Quick vehicle select for logs */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <label className="text-xs text-slate-400 font-bold mb-1.5 block">Assigned Vehicle</label>
              <select value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">No vehicle selected</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>Unit {v.unit_number} — {v.make} {v.model}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Duty changes are logged for HOS compliance. Accurate status reporting is required by FMCSA.
            </div>
          </div>
        )}

        {/* ── PRE/POST TRIP TABS ── */}
        {(tab === 'pretrip' || tab === 'posttrip') && (
          <div className="space-y-4 pt-2">
            {/* Type switcher */}
            <div className="flex bg-slate-800 rounded-xl p-1">
              <button onClick={() => switchDvirType('Pre-Trip')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  dvirType === 'Pre-Trip' ? 'bg-amber-500 text-slate-900' : 'text-slate-400'
                }`}>
                Pre-Trip Inspection
              </button>
              <button onClick={() => switchDvirType('Post-Trip')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  dvirType === 'Post-Trip' ? 'bg-amber-500 text-slate-900' : 'text-slate-400'
                }`}>
                Post-Trip Inspection
              </button>
            </div>

            {dvirDone ? (
              <div className="text-center py-10">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  dvirDefects === 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}>
                  {dvirDefects === 0
                    ? <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    : <XCircle className="w-10 h-10 text-red-400" />}
                </div>
                <h2 className="text-white font-black text-lg mb-1">
                  {dvirDefects === 0 ? 'All Clear!' : `${dvirDefects} Defect${dvirDefects !== 1 ? 's' : ''} Reported`}
                </h2>
                <p className="text-slate-400 text-sm mb-1">
                  {dvirType} DVIR for Unit {selectedVehicle?.unit_number}
                </p>
                {dvirDefects > 0 && (
                  <p className="text-amber-400 text-xs">A work order has been created and your manager will review.</p>
                )}
                <button onClick={() => switchDvirType(dvirType)}
                  className="mt-6 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-3 px-6 rounded-xl text-sm">
                  New {dvirType}
                </button>
              </div>
            ) : (
              <>
                {/* Vehicle select */}
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 font-bold mb-1.5 block">Vehicle *</label>
                    <select value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                      <option value="">Select vehicle...</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>Unit {v.unit_number} — {v.make} {v.model}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 font-bold mb-1.5 block">Odometer</label>
                      <input type="number" value={odometer} onChange={e => setOdometer(e.target.value)}
                        placeholder="e.g. 145230"
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-bold mb-1.5 block">Trailer #</label>
                      <input value={trailerNumber} onChange={e => setTrailerNumber(e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500" />
                    </div>
                  </div>
                </div>

                {!selectedVehicleId ? (
                  <p className="text-slate-500 text-center text-xs">Select a vehicle above to begin the {dvirType.toLowerCase()} inspection</p>
                ) : (
                  <>
                    {/* Progress */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(answered / checklist.length) * 100}%` }} />
                      </div>
                      <span>{answered}/{checklist.length}</span>
                    </div>

                    {/* Checklist sections */}
                    {buildItems(dvirType).map((section, si) => {
                      let idx = buildItems(dvirType).slice(0, si).reduce((s, sec) => s + sec.items.length, 0);
                      return (
                        <div key={section.section} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                          <div className="bg-slate-700 px-4 py-2.5">
                            <h3 className="text-sm font-black text-white">{section.section}</h3>
                          </div>
                          <div className="divide-y divide-slate-700">
                            {section.items.map((item, ii) => {
                              const entry = checklist[idx + ii];
                              return (
                                <div key={item} className={`p-3 ${entry.result === 'defect' ? 'bg-red-900/20' : ''}`}>
                                  <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <span className="text-sm text-slate-200 font-medium leading-snug">{item}</span>
                                    <div className="flex gap-1 flex-shrink-0">
                                      {RESULT_BTN.map(opt => (
                                        <button key={opt.value}
                                          onClick={() => setItemResult(idx + ii, opt.value)}
                                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                            entry.result === opt.value ? opt.cls + ' scale-105' : 'bg-slate-600 text-slate-400'
                                          }`}>
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  {entry.result === 'defect' && (
                                    <input
                                      placeholder="Describe the defect..."
                                      value={entry.notes}
                                      onChange={e => setItemNotes(idx + ii, e.target.value)}
                                      className="w-full bg-slate-700 border border-red-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-red-400/50"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Notes */}
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                      <label className="text-xs text-slate-400 font-bold mb-1.5 block">Additional Notes</label>
                      <textarea rows={2} value={dvirNotes} onChange={e => setDvirNotes(e.target.value)}
                        placeholder="Any other observations..."
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none placeholder:text-slate-500" />
                    </div>

                    {/* Submit */}
                    <button onClick={handleDvirSubmit} disabled={submitting || answered === 0}
                      className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                      {submitting ? 'Submitting...' : defects.length > 0
                        ? `Submit ${dvirType} — ${defects.length} Defect${defects.length !== 1 ? 's' : ''}`
                        : `Submit ${dvirType} DVIR`}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {tab === 'logs' && (
          <div className="space-y-4 pt-2">
            {/* HOS Logs */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-700 px-4 py-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="font-black text-white text-sm">HOS Logs</span>
                <span className="text-xs text-slate-400 ml-auto">{hosLogs.length} entries</span>
              </div>
              {hosLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No HOS logs yet. Use the Duty tab to start logging.</div>
              ) : (
                <div className="divide-y divide-slate-700 max-h-72 overflow-y-auto">
                  {hosLogs.slice(0, 15).map(log => (
                    <div key={log.id} className="px-4 py-3 hover:bg-slate-750">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">{log.log_date}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.status === 'draft' ? 'bg-slate-600 text-slate-300' : 'bg-emerald-600 text-white'}`}>{log.status}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-slate-400">
                        <span>🚛 Driving: {log.hours_driving?.toFixed(1)}h</span>
                        <span>📋 On Duty: {log.hours_on_duty?.toFixed(1)}h</span>
                        <span>🛏 Sleeper: {log.hours_sleeper?.toFixed(1)}h</span>
                      </div>
                      {log.duty_segments?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {log.duty_segments.map((seg, i) => (
                            <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${
                              seg.status === 'driving' ? 'bg-emerald-500/20 text-emerald-400' :
                              seg.status === 'on_duty_not_driving' ? 'bg-amber-500/20 text-amber-400' :
                              seg.status === 'sleeper_berth' ? 'bg-indigo-500/20 text-indigo-400' :
                              'bg-slate-600 text-slate-400'
                            }`}>
                              {seg.status === 'off_duty' ? 'Off' : seg.status === 'sleeper_berth' ? 'Sleeper' : seg.status === 'driving' ? 'Driving' : 'On Duty'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent DVIRs */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-700 px-4 py-3 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-400" />
                <span className="font-black text-white text-sm">Recent DVIRs</span>
              </div>
              {inspections.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No inspections recorded yet</div>
              ) : (
                <div className="divide-y divide-slate-700 max-h-72 overflow-y-auto">
                  {inspections.slice(0, 10).map(insp => {
                    const v = vehicles.find(v => v.id === insp.vehicle_id);
                    return (
                      <div key={insp.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{insp.inspection_type}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            insp.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' :
                            insp.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>{insp.status}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {insp.inspection_date} · Unit {v?.unit_number || '—'}
                          {insp.defects_found && <span className="text-red-400 ml-2">● Defects found</span>}
                        </div>
                        {insp.manager_signoff_required && (
                          <div className="text-xs text-amber-400 mt-0.5">Awaiting manager review</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
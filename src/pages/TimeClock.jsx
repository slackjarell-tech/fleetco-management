import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/apiClient';
import { Clock, LogIn, LogOut, Wrench, Play, Square, Timer, Calendar, User, ChevronDown, MapPin, Navigation, Camera } from 'lucide-react';
import useDriverLocation from '@/hooks/useDriverLocation';
import CameraCapture from '@/components/driver/CameraCapture';

function formatDuration(minutes) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function elapsedMinutes(clockIn) {
  return (Date.now() - new Date(clockIn).getTime()) / 60000;
}

export default function TimeClock() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [allEntries, setAllEntries] = useState([]); // admin view
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [selectedWO, setSelectedWO] = useState('');
  const [notes, setNotes] = useState('');
  const [savingShift, setSavingShift] = useState(false);
  const [savingWO, setSavingWO] = useState(false);
  const [tab, setTab] = useState('clock'); // clock | history | admin
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationRequested, setLocationRequested] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedTrailerId, setSelectedTrailerId] = useState('');
  const [vehicleConflict, setVehicleConflict] = useState(null);

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const loadData = useCallback(async () => {
    const u = await api.auth.me();
    setUser(u);
    const isAdmin = ['admin', 'executive'].includes(u?.role);

    const [ents, wos, vehs, users] = await Promise.all([
      api.entities.TimeClockEntry.filter({ user_id: u.id }, '-clock_in', 200),
      api.entities.WorkOrder.filter({ assigned_tech_id: u.id }, '-created_date', 100),
      api.entities.Vehicle.list(),
      isAdmin ? api.entities.User.list() : Promise.resolve([]),
    ]);

    setEntries(ents);
    setWorkOrders(wos);
    setVehicles(vehs);
    setAllUsers(users);

    if (isAdmin) {
      const all = await api.entities.TimeClockEntry.list('-clock_in', 500);
      setAllEntries(all);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeShift = entries.find(e => e.entry_type === 'shift' && !e.clock_out);
  const activeWOEntry = entries.find(e => e.entry_type === 'work_order' && !e.clock_out);

  // Location tracking while clocked in (pass vehicle info)
  const vehicleInfo = activeShift ? {
    vehicle_id: activeShift.vehicle_id,
    vehicle_unit_number: activeShift.vehicle_unit_number,
    trailer_id: activeShift.trailer_id,
    trailer_unit_number: activeShift.trailer_unit_number,
  } : null;
  useDriverLocation(user, activeShift?.id, !!activeShift && locationGranted, vehicleInfo);

  // Request location permission on mount
  useEffect(() => {
    if (!locationRequested && 'geolocation' in navigator) {
      setLocationRequested(true);
    }
  }, [locationRequested]);

  const requestLocationPermission = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      () => setLocationGranted(true),
      () => setLocationGranted(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clockInShift = async () => {
    setVehicleConflict(null);

    // Check for vehicle conflicts — no two drivers on the same unit
    if (selectedVehicleId && selectedVehicleId !== 'pov') {
      const allActive = await api.entities.TimeClockEntry.filter({}, '-clock_in', 500);
      const conflicting = (allActive || []).find(e =>
        e.vehicle_id === selectedVehicleId && !e.clock_out && e.user_id !== user.id
      );
      if (conflicting) {
        setVehicleConflict(`Unit #${conflicting.vehicle_unit_number} is currently assigned to ${conflicting.user_name}. Select another vehicle.`);
        return;
      }
    }

    setSavingShift(true);
    const today = new Date().toISOString().slice(0, 10);
    const veh = vehicles.find(v => v.id === selectedVehicleId);
    const trailer = vehicles.find(v => v.id === selectedTrailerId);
    await api.entities.TimeClockEntry.create({
      user_id: user.id,
      user_name: user.full_name,
      entry_type: 'shift',
      clock_in: new Date().toISOString(),
      date: today,
      notes,
      vehicle_id: selectedVehicleId || null,
      vehicle_unit_number: selectedVehicleId === 'pov' ? 'POV' : (veh?.unit_number || null),
      trailer_id: selectedTrailerId || null,
      trailer_unit_number: trailer?.unit_number || null,
    });
    setNotes('');
    setSelectedVehicleId('');
    setSelectedTrailerId('');
    await loadData();
    setSavingShift(false);
  };

  const clockOutShift = async () => {
    setSavingShift(true);
    const clockOut = new Date().toISOString();
    const mins = elapsedMinutes(activeShift.clock_in);
    await api.entities.TimeClockEntry.update(activeShift.id, {
      clock_out: clockOut,
      duration_minutes: Math.round(mins),
    });
    await loadData();
    setSavingShift(false);
  };

  const clockInWO = async () => {
    if (!selectedWO) return;
    const wo = workOrders.find(w => w.id === selectedWO);
    setSavingWO(true);
    const today = new Date().toISOString().slice(0, 10);
    await api.entities.TimeClockEntry.create({
      user_id: user.id,
      user_name: user.full_name,
      entry_type: 'work_order',
      work_order_id: selectedWO,
      work_order_number: wo?.wo_number || '',
      clock_in: new Date().toISOString(),
      date: today,
      notes,
    });
    setSelectedWO('');
    setNotes('');
    await loadData();
    setSavingWO(false);
  };

  const clockOutWO = async () => {
    setSavingWO(true);
    const clockOut = new Date().toISOString();
    const mins = elapsedMinutes(activeWOEntry.clock_in);
    await api.entities.TimeClockEntry.update(activeWOEntry.id, {
      clock_out: clockOut,
      duration_minutes: Math.round(mins),
    });
    await loadData();
    setSavingWO(false);
  };

  const getVehicleLabel = (woId) => {
    const wo = workOrders.find(w => w.id === woId) || allEntries.find(e => e.work_order_id === woId);
    if (!wo?.vehicle_id) return '';
    const v = vehicles.find(v => v.id === wo.vehicle_id);
    return v ? ` — Unit #${v.unit_number}` : '';
  };

  // Today's entries
  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter(e => e.date === today);
  const todayShiftMins = todayEntries.filter(e => e.entry_type === 'shift' && e.duration_minutes).reduce((s, e) => s + e.duration_minutes, 0)
    + (activeShift ? Math.round(elapsedMinutes(activeShift.clock_in)) : 0);
  const todayWOMins = todayEntries.filter(e => e.entry_type === 'work_order' && e.duration_minutes).reduce((s, e) => s + e.duration_minutes, 0)
    + (activeWOEntry ? Math.round(elapsedMinutes(activeWOEntry.clock_in)) : 0);

  const isAdmin = ['admin', 'executive'].includes(user?.role);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" /> Time Clock
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Track shift and work order time — {user?.full_name}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-slate-900 tabular-nums">
            {new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-slate-400">{new Date(now).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {[['clock', 'Time Clock'], ['history', 'My History'], ...(isAdmin ? [['admin', 'Admin View']] : [])].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CLOCK TAB ── */}
      {tab === 'clock' && (
        <div className="space-y-4">
          {/* Location Permission Banner */}
          {!locationGranted && locationRequested && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-black text-amber-800 text-sm">Enable Live Location</div>
                  <p className="text-amber-700 text-xs mt-0.5">Share your location while clocked in so fleet managers can see you on the map and coordinate in real time.</p>
                  <button onClick={requestLocationPermission}
                    className="mt-2 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                    <MapPin className="w-3.5 h-3.5" /> Share My Location
                  </button>
                </div>
              </div>
            </div>
          )}

          {locationGranted && activeShift && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Live location active</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse ml-auto" />
            </div>
          )}

          {/* Today Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Shift Time Today</div>
              <div className="text-2xl font-black text-amber-600">{formatDuration(todayShiftMins)}</div>
              {activeShift && <div className="text-xs text-emerald-600 font-bold mt-1 animate-pulse">● Clocked In</div>}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">WO Time Today</div>
              <div className="text-2xl font-black text-blue-600">{formatDuration(todayWOMins)}</div>
              {activeWOEntry && <div className="text-xs text-emerald-600 font-bold mt-1 animate-pulse">● On WO #{activeWOEntry.work_order_number}</div>}
            </div>
          </div>

          {/* Shift Clock */}
          <div className={`rounded-2xl border-2 p-5 ${activeShift ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeShift ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <User className={`w-5 h-5 ${activeShift ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div>
                <div className="font-black text-slate-900">Shift Clock</div>
                {activeShift
                  ? <div className="text-sm text-emerald-700 font-semibold">
                      Clocked in at {new Date(activeShift.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {activeShift.vehicle_unit_number && <span> · {activeShift.vehicle_unit_number === 'POV' ? '🚗 POV' : `🚛 Unit #${activeShift.vehicle_unit_number}`}</span>}
                      {activeShift.trailer_unit_number && <span> + 📦 Trailer #{activeShift.trailer_unit_number}</span>}
                      <br />{formatDuration(Math.round(elapsedMinutes(activeShift.clock_in)))} elapsed
                    </div>
                  : <div className="text-sm text-slate-500">Not clocked in</div>
                }
              </div>
            </div>
            {!activeShift && (
              <div className="space-y-3 mb-3">
                {/* Vehicle / POV Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1 uppercase tracking-wider">Select Vehicle *</label>
                  <select value={selectedVehicleId} onChange={e => { setSelectedVehicleId(e.target.value); setVehicleConflict(null); }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                    <option value="">— Select truck or POV —</option>
                    <option value="pov">🚗 Personal Vehicle (POV)</option>
                    {vehicles.filter(v => v.unit_type === 'truck' && v.status === 'active').map(v => (
                      <option key={v.id} value={v.id}>🚛 Unit #{v.unit_number} — {v.make} {v.model}</option>
                    ))}
                  </select>
                </div>

                {/* Optional Trailer */}
                {selectedVehicleId && selectedVehicleId !== 'pov' && (
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1 uppercase tracking-wider">Trailer (optional)</label>
                    <select value={selectedTrailerId} onChange={e => setSelectedTrailerId(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                      <option value="">— No trailer —</option>
                      {vehicles.filter(v => v.unit_type === 'trailer' && v.status === 'active').map(v => (
                        <option key={v.id} value={v.id}>📦 Trailer #{v.unit_number} — {v.trailer_type || v.make}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Conflict Warning */}
                {vehicleConflict && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs font-bold text-red-700">
                    ⚠️ {vehicleConflict}
                  </div>
                )}

                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..."
                  rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
            )}
            {activeShift ? (
              <button onClick={clockOutShift} disabled={savingShift}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 text-white font-black py-3 rounded-xl text-sm disabled:opacity-60 transition-all">
                <LogOut className="w-4 h-4" /> {savingShift ? 'Saving...' : 'Clock Out of Shift'}
              </button>
            ) : (
              <button onClick={clockInShift} disabled={savingShift}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-sm disabled:opacity-60 transition-all">
                <LogIn className="w-4 h-4" /> {savingShift ? 'Saving...' : 'Clock In to Shift'}
              </button>
            )}
          </div>

          {/* Work Order Clock */}
          <div className={`rounded-2xl border-2 p-5 ${activeWOEntry ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeWOEntry ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <Wrench className={`w-5 h-5 ${activeWOEntry ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div>
                <div className="font-black text-slate-900">Work Order Clock</div>
                {activeWOEntry
                  ? <div className="text-sm text-blue-700 font-semibold">On WO #{activeWOEntry.work_order_number} — {formatDuration(Math.round(elapsedMinutes(activeWOEntry.clock_in)))} elapsed</div>
                  : <div className="text-sm text-slate-500">Not clocked into any work order</div>
                }
              </div>
            </div>

            {activeWOEntry ? (
              <button onClick={clockOutWO} disabled={savingWO}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 text-white font-black py-3 rounded-xl text-sm disabled:opacity-60 transition-all">
                <Square className="w-4 h-4" /> {savingWO ? 'Saving...' : `Clock Out of WO #${activeWOEntry.work_order_number}`}
              </button>
            ) : (
              <div className="space-y-3">
                <select value={selectedWO} onChange={e => setSelectedWO(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                  <option value="">— Select Work Order —</option>
                  {workOrders.filter(w => ['open','in_progress','parts_ordered','awaiting_parts'].includes(w.status)).map(wo => (
                    <option key={wo.id} value={wo.id}>
                      WO #{wo.wo_number} — {wo.title} ({wo.status.replace('_',' ')})
                    </option>
                  ))}
                </select>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..."
                  rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                <button onClick={clockInWO} disabled={!selectedWO || savingWO}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-sm disabled:opacity-40 transition-all">
                  <Play className="w-4 h-4" /> {savingWO ? 'Saving...' : 'Start Work Order Timer'}
                </button>
              </div>
            )}
          </div>

          {/* Quick Photo Upload */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-black text-slate-900 text-sm">Quick Photo Capture</div>
                <div className="text-xs text-slate-500">Receipts, damage, documents — snap and save</div>
              </div>
            </div>
            <CameraCapture
              onCapture={(url) => setPhotoUrl(url)}
              buttonLabel="Open Camera"
            />
            {photoUrl && (
              <div className="mt-3 text-xs text-slate-400 break-all">
                ✅ Uploaded: <span className="text-slate-600 font-mono">{photoUrl.split('/').pop()?.slice(0, 30)}...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 font-black text-slate-900">My Time Entries ({entries.length})</div>
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {entries.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No entries yet</div>}
            {entries.map(e => (
              <div key={e.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${e.entry_type === 'shift' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                  {e.entry_type === 'shift' ? <User className="w-4 h-4 text-emerald-600" /> : <Wrench className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900">
                    {e.entry_type === 'shift' ? 'Shift' : `WO #${e.work_order_number}`}
                  </div>
                  <div className="text-xs text-slate-500">
                    {e.date} · In: {new Date(e.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {e.clock_out ? ` · Out: ${new Date(e.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ' · Still active'}
                  </div>
                  {e.notes && <div className="text-xs text-slate-400 italic mt-0.5">{e.notes}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  {e.clock_out
                    ? <div className="text-sm font-black text-slate-700">{formatDuration(e.duration_minutes)}</div>
                    : <div className="text-sm font-black text-emerald-600 animate-pulse">{formatDuration(Math.round(elapsedMinutes(e.clock_in)))}</div>
                  }
                  {!e.clock_out && <div className="text-xs text-emerald-500">● Active</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADMIN TAB ── */}
      {tab === 'admin' && isAdmin && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 font-black text-slate-900">All Time Entries — Today</div>
            <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">
              {allEntries.filter(e => e.date === today).length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">No entries today</div>
              )}
              {allEntries.filter(e => e.date === today).map(e => (
                <div key={e.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${e.entry_type === 'shift' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                    {e.entry_type === 'shift' ? <User className="w-4 h-4 text-emerald-600" /> : <Wrench className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900">{e.user_name}</div>
                    <div className="text-xs text-slate-500">
                      {e.entry_type === 'shift' ? 'Shift' : `WO #${e.work_order_number}`} · In: {new Date(e.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {e.clock_out ? ` · Out: ${new Date(e.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ' · Still active'}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {e.clock_out
                      ? <div className="text-sm font-black text-slate-700">{formatDuration(e.duration_minutes)}</div>
                      : <div className="text-sm font-black text-emerald-600 animate-pulse">{formatDuration(Math.round(elapsedMinutes(e.clock_in)))}</div>
                    }
                    {!e.clock_out && <div className="text-xs text-emerald-500">● Active</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary by user */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 font-black text-slate-900">Today's Summary by Mechanic</div>
            <div className="divide-y divide-slate-100">
              {(() => {
                const byUser = {};
                allEntries.filter(e => e.date === today).forEach(e => {
                  if (!byUser[e.user_id]) byUser[e.user_id] = { name: e.user_name, shiftMins: 0, woMins: 0, clocked: false };
                  const mins = e.clock_out ? e.duration_minutes : Math.round(elapsedMinutes(e.clock_in));
                  if (e.entry_type === 'shift') byUser[e.user_id].shiftMins += mins || 0;
                  else byUser[e.user_id].woMins += mins || 0;
                  if (!e.clock_out) byUser[e.user_id].clocked = true;
                });
                const rows = Object.values(byUser);
                if (rows.length === 0) return <div className="text-center py-8 text-slate-400 text-sm">No data</div>;
                return rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                      {r.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">{r.name}</div>
                      {r.clocked && <div className="text-xs text-emerald-600 font-bold">● Currently clocked in</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Shift: <span className="font-bold text-slate-800">{formatDuration(r.shiftMins)}</span></div>
                      <div className="text-xs text-slate-500">WO: <span className="font-bold text-slate-800">{formatDuration(r.woMins)}</span></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
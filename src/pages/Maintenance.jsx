import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Wrench, AlertTriangle, CheckCircle2, Clock, Search, Trash2, Calendar } from 'lucide-react';
import MaintenanceModal from '@/components/maintenance/MaintenanceModal';
import { isPlatformAdmin } from '@/lib/roles';

const STATUS_STYLES = {
  scheduled: 'bg-blue-100 text-blue-700',
  overdue: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  upcoming: 'bg-amber-100 text-amber-700',
};

export default function Maintenance() {
  const [schedules, setSchedules] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [u, sched, vehs] = await Promise.all([
      api.auth.me().catch(() => null),
      api.entities.MaintenanceSchedule.list('-created_date', 200),
      api.entities.Vehicle.list('-created_date', 200),
    ]);
    setUser(u);
    let filteredSched = sched;
    if (u?.customer_id) {
      const customerVehicleIds = vehs.filter(v => v.assigned_customer_id === u.customer_id).map(v => v.id);
      filteredSched = sched.filter(s => customerVehicleIds.includes(s.vehicle_id));
    }
    setSchedules(filteredSched);
    setVehicles(vehs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editing) {
      await api.entities.MaintenanceSchedule.update(editing.id, data);
    } else {
      await api.entities.MaintenanceSchedule.create(data);
    }
    setShowModal(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this maintenance schedule?')) return;
    await api.entities.MaintenanceSchedule.delete(id);
    load();
  };

  const handleComplete = async (item) => {
    await api.entities.MaintenanceSchedule.update(item.id, { status: 'completed', completed_date: new Date().toISOString().split('T')[0] });
    load();
  };

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

  const filtered = schedules.filter(s => {
    const veh = vehicleMap[s.vehicle_id];
    const matchSearch = !search || (veh?.unit_number || '').toLowerCase().includes(search.toLowerCase()) || (s.service_type || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    overdue: schedules.filter(s => s.status === 'overdue').length,
    upcoming: schedules.filter(s => s.status === 'upcoming').length,
    scheduled: schedules.filter(s => s.status === 'scheduled').length,
    completed: schedules.filter(s => s.status === 'completed').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Preventive Maintenance</h1>
          <p className="text-slate-500 text-sm mt-0.5">Schedule and track maintenance to avoid costly breakdowns</p>
        </div>
        {isPlatformAdmin(user?.role) && (
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2.5 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" /> Schedule PM
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { key: 'upcoming', label: 'Due Soon', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { key: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-black text-slate-900">{counts[key]}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Search by vehicle or service type..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Due Soon</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Cards */}
      <div className="grid gap-4">
        {filtered.map(item => {
          const veh = vehicleMap[item.vehicle_id];
          return (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{item.service_type}</div>
                    <div className="text-xs text-slate-500">Unit {veh?.unit_number || '—'} · {veh?.make} {veh?.model}</div>
                  </div>
                </div>
                <div className="ml-12 flex flex-wrap gap-3 text-xs text-slate-500">
                  {item.due_date && <span>Due: <strong className="text-slate-700">{item.due_date}</strong></span>}
                  {item.due_mileage && <span>Due at: <strong className="text-slate-700">{item.due_mileage?.toLocaleString()} mi</strong></span>}
                  {item.interval_miles && <span>Interval: <strong className="text-slate-700">{item.interval_miles?.toLocaleString()} mi</strong></span>}
                  {item.notes && <span className="text-slate-400">{item.notes}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[item.status] || 'bg-slate-100 text-slate-500'}`}>
                  {item.status?.replace('_', ' ') || 'scheduled'}
                </span>
                {isPlatformAdmin(user?.role) && (
                  <div className="flex gap-2">
                    {item.status !== 'completed' && (
                      <button onClick={() => handleComplete(item)} className="text-xs text-green-600 hover:text-green-700 font-medium border border-green-200 px-2 py-1 rounded">
                        Mark Done
                      </button>
                    )}
                    <button onClick={() => { setEditing(item); setShowModal(true); }} className="text-xs text-slate-500 hover:text-amber-500 font-medium">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 text-center py-14 text-slate-400 text-sm">
            No maintenance schedules found
          </div>
        )}
      </div>

      {showModal && (
        <MaintenanceModal
          schedule={editing}
          vehicles={vehicles}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
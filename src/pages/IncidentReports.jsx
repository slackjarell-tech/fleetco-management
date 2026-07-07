import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { AlertTriangle, Plus, Search, X, Car, User, MapPin, ShieldAlert, DollarSign, FileText } from 'lucide-react';
import { isPlatformAdmin } from '@/lib/roles';

const SEVERITY_COLORS = {
  minor: 'bg-yellow-100 text-yellow-700',
  moderate: 'bg-orange-100 text-orange-700',
  serious: 'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-900 font-black',
};

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  closed: 'bg-green-100 text-green-700',
};

const INCIDENT_TYPES = ['Accident', 'Near Miss', 'Roadside Inspection', 'CSA Violation', 'Cargo Damage', 'Theft', 'Weather Event', 'Other'];

const EMPTY_FORM = {
  incident_type: 'Accident', severity: 'minor', incident_date: '', incident_time: '',
  driver_id: '', driver_name: '', vehicle_id: '', location: '',
  description: '', police_report_number: '', dot_recordable: false,
  injuries: false, injury_description: '', tow_required: false,
  citations_issued: [], csa_points: 0, insurance_claim_number: '',
  estimated_damage_cost: '', status: 'open', corrective_action: '', notes: '',
};

export default function IncidentReports() {
  const [user, setUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    api.auth.me().then(async u => {
      setUser(u);
      const [inc, vs, us] = await Promise.all([
        api.entities.Incident.list('-incident_date', 500),
        api.entities.Vehicle.list(),
        api.entities.User.list(),
      ]);
      let filteredInc = inc;
      if (u?.customer_id) {
        const customerVehicleIds = vs.filter(v => v.assigned_customer_id === u.customer_id).map(v => v.id);
        filteredInc = inc.filter(i => customerVehicleIds.includes(i.vehicle_id));
      }
      setIncidents(filteredInc);
      setVehicles(vs);
      setUsers(us);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(v => [v.id, v])), [vehicles]);
  const drivers = useMemo(() => users.filter(u => u.role === 'driver'), [users]);

  const filtered = useMemo(() => incidents.filter(i => {
    const matchSearch = !search ||
      i.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.incident_type?.toLowerCase().includes(search.toLowerCase()) ||
      i.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchSearch && matchStatus;
  }), [incidents, search, filterStatus]);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (inc) => { setEditing(inc); setForm({ ...EMPTY_FORM, ...inc }); setShowModal(true); };

  const handleSave = async () => {
    const data = { ...form };
    if (editing) {
      await api.entities.Incident.update(editing.id, data);
      setIncidents(prev => prev.map(i => i.id === editing.id ? { ...i, ...data } : i));
    } else {
      const created = await api.entities.Incident.create(data);
      setIncidents(prev => [created, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this incident report?')) return;
    await api.entities.Incident.delete(id);
    setIncidents(prev => prev.filter(i => i.id !== id));
  };

  const counts = useMemo(() => ({
    open: incidents.filter(i => i.status === 'open').length,
    dot: incidents.filter(i => i.dot_recordable).length,
    csaPoints: incidents.reduce((s, i) => s + (i.csa_points || 0), 0),
    damage: incidents.reduce((s, i) => s + (i.estimated_damage_cost || 0), 0),
  }), [incidents]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const canEdit = isPlatformAdmin(user?.role);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Incident & Accident Reports
            </h1>
            <p className="text-slate-300 text-xs mt-1">Log accidents, near-misses, roadside inspections, and CSA violations</p>
          </div>
          {canEdit && (
            <button onClick={openNew}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-4 py-2.5 rounded-xl text-sm">
              <Plus className="w-4 h-4" /> New Incident
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Incidents', value: counts.open, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'DOT Recordable', value: counts.dot, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Total CSA Points', value: counts.csaPoints, color: 'text-orange-700', bg: 'bg-orange-50' },
          { label: 'Est. Damage Cost', value: `$${counts.damage.toLocaleString()}`, color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl border border-slate-100 p-4`}>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search driver, type, location..."
            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-64" />
        </div>
        {['all', 'open', 'under_review', 'closed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border capitalize transition-all ${
              filterStatus === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}>{s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Incident List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No incidents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inc => {
            const vehicle = vehicleMap[inc.vehicle_id];
            return (
              <div key={inc.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900">{inc.incident_type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${SEVERITY_COLORS[inc.severity]}`}>{inc.severity}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[inc.status]}`}>{inc.status?.replace('_', ' ')}</span>
                        {inc.dot_recordable && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-200 text-red-800">DOT Recordable</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {inc.driver_name || '—'}</span>
                        <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {vehicle ? `Unit ${vehicle.unit_number}` : '—'}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {inc.location || '—'}</span>
                        <span>{inc.incident_date}</span>
                        {inc.csa_points > 0 && <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-orange-500" /> {inc.csa_points} CSA pts</span>}
                        {inc.estimated_damage_cost > 0 && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-red-400" /> ${inc.estimated_damage_cost?.toLocaleString()}</span>}
                      </div>
                      {inc.description && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{inc.description}</p>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(inc)} className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">Edit</button>
                      <button onClick={() => handleDelete(inc.id)} className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-black text-slate-900">{editing ? 'Edit Incident' : 'New Incident Report'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Incident Type *</label>
                  <select value={form.incident_type} onChange={e => setForm(p => ({ ...p, incident_type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400">
                    {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Severity *</label>
                  <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400">
                    {['minor', 'moderate', 'serious', 'critical'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Date *</label>
                  <input type="date" value={form.incident_date} onChange={e => setForm(p => ({ ...p, incident_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Time</label>
                  <input type="time" value={form.incident_time} onChange={e => setForm(p => ({ ...p, incident_time: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Driver *</label>
                  <select value={form.driver_id} onChange={e => {
                    const d = drivers.find(u => u.id === e.target.value);
                    setForm(p => ({ ...p, driver_id: e.target.value, driver_name: d?.full_name || '' }));
                  }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400">
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Vehicle *</label>
                  <select value={form.vehicle_id} onChange={e => setForm(p => ({ ...p, vehicle_id: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400">
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>Unit {v.unit_number} — {v.year} {v.make}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, State or highway"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Police Report #</label>
                  <input value={form.police_report_number} onChange={e => setForm(p => ({ ...p, police_report_number: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Insurance Claim #</label>
                  <input value={form.insurance_claim_number} onChange={e => setForm(p => ({ ...p, insurance_claim_number: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">CSA Points</label>
                  <input type="number" min="0" value={form.csa_points} onChange={e => setForm(p => ({ ...p, csa_points: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Est. Damage Cost ($)</label>
                  <input type="number" min="0" value={form.estimated_damage_cost} onChange={e => setForm(p => ({ ...p, estimated_damage_cost: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400">
                    <option value="open">Open</option>
                    <option value="under_review">Under Review</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="col-span-2 flex gap-6">
                  {[['dot_recordable', 'DOT Recordable'], ['injuries', 'Injuries Involved'], ['tow_required', 'Tow Required']].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={!!form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                        className="w-4 h-4 accent-amber-500" />
                      {label}
                    </label>
                  ))}
                </div>
                {form.injuries && (
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-600 block mb-1">Injury Description</label>
                    <textarea value={form.injury_description} onChange={e => setForm(p => ({ ...p, injury_description: e.target.value }))} rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none" />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">Corrective Action</label>
                  <textarea value={form.corrective_action} onChange={e => setForm(p => ({ ...p, corrective_action: e.target.value }))} rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} className="flex-[2] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm">
                {editing ? 'Save Changes' : 'Create Incident Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
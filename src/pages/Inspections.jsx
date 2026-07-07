import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Plus, ClipboardCheck, AlertTriangle, CheckCircle2, Clock, Search, Trash2, FileDown } from 'lucide-react';
import InspectionModal from '@/components/inspections/InspectionModal';
import { exportDVIRPdf } from '@/components/inspections/ExportDVIRPdf';
import { isFleetCoAdmin } from '@/lib/roles';

const STATUS_STYLES = {
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  needs_attention: 'bg-amber-100 text-amber-700',
  pending: 'bg-slate-100 text-slate-600',
};

const STATUS_ICONS = {
  passed: CheckCircle2,
  failed: AlertTriangle,
  needs_attention: Clock,
  pending: Clock,
};

export default function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [u, ins, vehs] = await Promise.all([
      api.auth.me().catch(() => null),
      api.entities.Inspection.list('-created_date', 200),
      api.entities.Vehicle.list('-created_date', 200),
    ]);
    setUser(u);
    let filteredIns = ins;
    if (u?.customer_id) {
      const customerVehicleIds = vehs.filter(v => v.assigned_customer_id === u.customer_id).map(v => v.id);
      filteredIns = ins.filter(i => customerVehicleIds.includes(i.vehicle_id));
    }
    setInspections(filteredIns);
    setVehicles(vehs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editing) {
      await api.entities.Inspection.update(editing.id, data);
    } else {
      await api.entities.Inspection.create(data);
    }
    setShowModal(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this inspection?')) return;
    await api.entities.Inspection.delete(id);
    load();
  };

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

  const filtered = inspections.filter(i => {
    const veh = vehicleMap[i.vehicle_id];
    const matchSearch = !search || (veh?.unit_number || '').toLowerCase().includes(search.toLowerCase()) || (i.inspection_type || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    passed: inspections.filter(i => i.status === 'passed').length,
    failed: inspections.filter(i => i.status === 'failed').length,
    needs_attention: inspections.filter(i => i.status === 'needs_attention').length,
    pending: inspections.filter(i => i.status === 'pending').length,
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
          <h1 className="text-2xl font-black text-slate-900">Vehicle Inspections</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track and manage fleet inspection records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDVIRPdf(inspections, vehicleMap)}
            className="flex items-center gap-2 border border-slate-300 hover:border-amber-400 text-slate-700 hover:text-amber-600 font-bold px-4 py-2.5 rounded-lg text-sm bg-white transition-colors"
          >
            <FileDown className="w-4 h-4" /> Export PDF
          </button>
          {(isExecutiveView(user?.role) || user?.role === 'user') && (
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2.5 rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" /> New Inspection
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'passed', label: 'Passed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { key: 'failed', label: 'Failed', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { key: 'needs_attention', label: 'Needs Attention', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { key: 'pending', label: 'Pending', icon: ClipboardCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
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
            placeholder="Search by vehicle or type..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="needs_attention">Needs Attention</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Vehicle', 'Type', 'Date', 'Inspector', 'Status', 'Notes', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(ins => {
                const veh = vehicleMap[ins.vehicle_id];
                const StatusIcon = STATUS_ICONS[ins.status] || Clock;
                return (
                  <tr key={ins.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 text-sm">{veh?.unit_number || '—'}</div>
                      <div className="text-xs text-slate-400">{veh?.make} {veh?.model}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{ins.inspection_type || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ins.inspection_date || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ins.inspector_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[ins.status] || 'bg-slate-100 text-slate-500'}`}>
                        <StatusIcon className="w-3 h-3" />
                        {(ins.status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{ins.notes || '—'}</td>
                    <td className="px-4 py-3">
                      {(isExecutiveView(user?.role)) && (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditing(ins); setShowModal(true); }} className="text-slate-400 hover:text-amber-500 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(ins.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">No inspections found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <InspectionModal
          inspection={editing}
          vehicles={vehicles}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, Wrench, AlertTriangle, Clock, CheckCircle, Package, DollarSign, Filter } from 'lucide-react';
import WorkOrderModal from '@/components/workorders/WorkOrderModal';
import WorkOrderDetail from '@/components/workorders/WorkOrderDetail';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  parts_ordered: 'bg-purple-100 text-purple-700 border-purple-200',
  awaiting_parts: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const PRIORITY_DOT = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const REPAIR_TYPES = ["All","Engine","Transmission","Brakes","Tires","Electrical","HVAC","Suspension","Fuel System","Exhaust","Preventive Maintenance","Body & Frame","Other"];

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingWO, setEditingWO] = useState(null);
  const [viewingWO, setViewingWO] = useState(null);

  const [user, setUser] = useState(null);

  const loadData = async () => {
    const [u, wos, vehs, usrs] = await Promise.all([
      api.auth.me().catch(() => null),
      api.entities.WorkOrder.list('-created_date'),
      api.entities.Vehicle.list(),
      api.entities.User.list(),
    ]);
    setUser(u);
    let filteredWOs = wos;
    if (u?.customer_id) {
      const customerVehicleIds = vehs.filter(v => v.assigned_customer_id === u.customer_id).map(v => v.id);
      filteredWOs = wos.filter(wo => customerVehicleIds.includes(wo.vehicle_id));
    }
    setWorkOrders(filteredWOs);
    setVehicles(vehs);
    setUsers(usrs);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (data) => {
    if (editingWO) {
      await api.entities.WorkOrder.update(editingWO.id, data);
    } else {
      await api.entities.WorkOrder.create(data);
    }
    setShowModal(false);
    setEditingWO(null);
    loadData();
  };

  const handleEdit = (wo) => {
    setViewingWO(null);
    setEditingWO(wo);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this work order?')) return;
    await api.entities.WorkOrder.delete(id);
    loadData();
  };

  const filtered = workOrders.filter(wo => {
    const q = search.toLowerCase();
    const matchSearch = !q || wo.wo_number?.toLowerCase().includes(q) || wo.title?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || wo.status === statusFilter;
    const matchType = typeFilter === 'All' || wo.repair_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Stats
  const open = workOrders.filter(w => w.status === 'open').length;
  const inProgress = workOrders.filter(w => w.status === 'in_progress').length;
  const awaitingParts = workOrders.filter(w => w.status === 'awaiting_parts' || w.status === 'parts_ordered').length;
  const completed = workOrders.filter(w => w.status === 'completed').length;
  const totalCost = workOrders.filter(w => w.status === 'completed').reduce((s, w) => s + (w.total_cost || 0), 0);

  const getVehicleLabel = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `#${v.unit_number} ${v.make}` : '—';
  };
  const getTechLabel = (id) => {
    const u = users.find(u => u.id === id);
    return u ? u.full_name : 'Unassigned';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Work Orders</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage repairs, parts, labor, and technician assignments</p>
        </div>
        <button
          onClick={() => { setEditingWO(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2.5 rounded-lg text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> New Work Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Open', value: open, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'In Progress', value: inProgress, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Awaiting Parts', value: awaitingParts, icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Total Repair Cost', value: `$${totalCost.toLocaleString()}`, icon: DollarSign, color: 'text-slate-700', bg: 'bg-slate-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-xl font-black text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search WO number or title..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="parts_ordered">Parts Ordered</option>
          <option value="awaiting_parts">Awaiting Parts</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          {REPAIR_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Work Orders List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading work orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No work orders found</p>
          <p className="text-sm mt-1">Create your first work order to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(wo => {
            const vehicle = vehicles.find(v => v.id === wo.vehicle_id);
            const tech = users.find(u => u.id === wo.assigned_tech_id);
            return (
              <div key={wo.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setViewingWO(wo)}>
                <div className="flex items-start justify-between p-4 gap-4">
                  {/* Left */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[wo.priority] || 'bg-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">{wo.wo_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[wo.status]}`}>
                          {wo.status?.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{wo.repair_type}</span>
                      </div>
                      <p className="text-slate-700 text-sm mt-0.5 font-medium truncate">{wo.title}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                        {vehicle && <span>🚛 #{vehicle.unit_number} {vehicle.make}</span>}
                        <span>👤 {tech ? tech.full_name : 'Unassigned'}</span>
                        {wo.opened_date && <span>📅 {wo.opened_date}</span>}
                        {wo.due_date && <span>⏰ Due: {wo.due_date}</span>}
                        {wo.parts?.length > 0 && <span>🔩 {wo.parts.length} part(s)</span>}
                      </div>
                    </div>
                  </div>
                  {/* Right */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-black text-amber-600">${(wo.total_cost || 0).toLocaleString()}</div>
                      <div className="text-xs text-slate-400">total cost</div>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleEdit(wo)}
                        className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(wo.id)}
                        className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 font-semibold">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <WorkOrderModal
          wo={editingWO}
          vehicles={vehicles}
          techs={users.filter(u => u.role === 'tech' || u.role === 'executive')}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingWO(null); }}
        />
      )}
      {viewingWO && (
        <WorkOrderDetail
          wo={viewingWO}
          vehicles={vehicles}
          users={users}
          onClose={() => setViewingWO(null)}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
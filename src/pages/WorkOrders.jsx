import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, Wrench, Clock, CheckCircle, Package, DollarSign, ClipboardList, ShieldCheck } from 'lucide-react';
import WorkOrderModal from '@/components/workorders/WorkOrderModal';
import WorkOrderIntakeModal from '@/components/workorders/WorkOrderIntakeModal';
import MechanicWorkOrderModal from '@/components/workorders/MechanicWorkOrderModal';
import WorkOrderDetail from '@/components/workorders/WorkOrderDetail';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  canApproveWorkOrder,
  canCreateWorkOrder,
  canCustomerEditWorkOrder,
  getWorkOrderEditorKind,
  mechanicQueueFilter,
  isMechanicUser,
  isCustomerPortalWorkOrderUser,
  isInternalWorkOrderStaff,
  filterVehiclesForWorkOrderUser,
  workOrderVisibleToPortalUser,
  canViewWorkOrders,
  canAddWorkOrderComment,
  isWorkOrderCommentOnlyUser,
} from '@/lib/workOrderWorkflow';

const PRIORITY_DOT = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const REPAIR_TYPES = ['All', 'Engine', 'Transmission', 'Brakes', 'Tires', 'Electrical', 'HVAC', 'Suspension', 'Fuel System', 'Exhaust', 'Preventive Maintenance', 'Body & Frame', 'Other'];

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showIntake, setShowIntake] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showMechanicModal, setShowMechanicModal] = useState(false);
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
      const fleetVehIds = new Set(filterVehiclesForWorkOrderUser(u, vehs).map((v) => v.id));
      filteredWOs = wos.filter(
        (wo) => wo.customer_id === u.customer_id || fleetVehIds.has(wo.vehicle_id),
      );
    }
    if (isMechanicUser(u)) {
      filteredWOs = filteredWOs.filter((wo) => mechanicQueueFilter(wo, u));
    } else if (u?.customer_id) {
      filteredWOs = filteredWOs.filter((wo) => workOrderVisibleToPortalUser(wo, u, vehs));
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
    setShowMechanicModal(false);
    setShowIntake(false);
    setEditingWO(null);
    loadData();
  };

  const handleAddComment = async (wo, text) => {
    const updated = await api.workOrders.addComment(wo.id, text);
    setViewingWO(updated);
    loadData();
  };

  const handleEdit = (wo) => {
    const kind = getWorkOrderEditorKind(user, wo);
    if (kind === 'view' || kind === 'comment') {
      setViewingWO(wo);
      return;
    }
    setViewingWO(null);
    setEditingWO(wo);
    setShowMechanicModal(kind === 'mechanic');
    setShowModal(kind === 'manager');
    setShowIntake(kind === 'customer');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this work order?')) return;
    await api.entities.WorkOrder.delete(id);
    loadData();
  };

  const handleApproveFromDetail = async (wo) => {
    const nextStatus = wo.require_customer_authorization !== false
      ? 'awaiting_authorization'
      : 'open';
    await api.entities.WorkOrder.update(wo.id, {
      ...wo,
      status: nextStatus,
      approved_at: new Date().toISOString(),
      approved_by: user?.email || '',
      rejection_notes: '',
    });
    setViewingWO(null);
    loadData();
  };

  const handleCustomerAuthorization = async (wo, payload) => {
    await api.entities.WorkOrder.update(wo.id, {
      ...wo,
      ...payload,
      status: 'open',
      authorized_at: new Date().toISOString(),
    });
    setViewingWO(null);
    loadData();
  };

  const handleRejectFromDetail = async (wo) => {
    const notes = window.prompt('What should the mechanic revise? (optional)');
    await api.entities.WorkOrder.update(wo.id, {
      ...wo,
      status: 'awaiting_estimate',
      rejection_notes: notes || '',
    });
    setViewingWO(null);
    loadData();
  };

  const filtered = workOrders.filter((wo) => {
    const q = search.toLowerCase();
    const matchSearch = !q || wo.wo_number?.toLowerCase().includes(q)
      || wo.title?.toLowerCase().includes(q)
      || wo.complaint?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || wo.status === statusFilter;
    const matchType = typeFilter === 'All' || wo.repair_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const pendingApproval = workOrders.filter((w) => w.status === 'awaiting_approval');
  const awaitingEstimate = workOrders.filter((w) => w.status === 'awaiting_estimate');
  const open = workOrders.filter((w) => w.status === 'open').length;
  const inProgress = workOrders.filter((w) => w.status === 'in_progress').length;
  const awaitingParts = workOrders.filter((w) => w.status === 'awaiting_parts' || w.status === 'parts_ordered').length;
  const completed = workOrders.filter((w) => w.status === 'completed').length;
  const totalCost = workOrders.filter((w) => w.status === 'completed').reduce((s, w) => s + (w.total_cost || 0), 0);

  const fleetVehicles = useMemo(
    () => filterVehiclesForWorkOrderUser(user, vehicles),
    [user, vehicles],
  );
  const techs = users.filter((u) => u.role === 'tech' || u.role === 'executive' || u.role === 'fleet_manager');
  const isApprover = canApproveWorkOrder(user);
  const canCreate = canCreateWorkOrder(user);
  const mechanicView = isMechanicUser(user);
  const customerPortal = isCustomerPortalWorkOrderUser(user);
  const commentOnly = isWorkOrderCommentOnlyUser(user);
  const canDelete = isInternalWorkOrderStaff(user);

  if (user && !canViewWorkOrders(user)) {
    return (
      <div className="p-6 text-center text-slate-500">
        Your role does not have access to work orders.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {mechanicView ? 'Shop queue' : commentOnly ? 'Repair status' : customerPortal ? 'Fleet repairs' : 'Work Orders'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {mechanicView
              ? 'Add diagnosis, notes, and parts — send estimates to fleet manager for approval'
              : commentOnly
                ? 'View repair orders for your fleet — add comments for the mechanic and fleet manager'
                : customerPortal
                  ? 'Create and update repair orders for your units — approve estimates before work begins'
                  : 'Intake → estimate → authorization → repair → invoice'}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setEditingWO(null);
              setShowIntake(true);
              setShowModal(false);
              setShowMechanicModal(false);
            }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2.5 rounded-lg text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> {customerPortal ? 'New repair order' : 'New Work Order'}
          </button>
        )}
      </div>

      {isApprover && pendingApproval.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center gap-2 text-violet-900 font-bold text-sm mb-2">
            <ShieldCheck className="w-4 h-4" />
            {pendingApproval.length} estimate{pendingApproval.length !== 1 ? 's' : ''} waiting for your approval
          </div>
          <ul className="space-y-2">
            {pendingApproval.slice(0, 5).map((wo) => (
              <li key={wo.id} className="flex flex-wrap items-center justify-between gap-2 text-sm bg-white rounded-lg border border-violet-100 px-3 py-2">
                <span className="font-semibold text-slate-900">{wo.wo_number} — {wo.title}</span>
                <span className="text-amber-700 font-bold">${(wo.total_cost || 0).toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => setViewingWO(wo)}
                  className="text-xs font-semibold text-violet-700 hover:underline"
                >
                  Review
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
        {[
          { label: 'Need estimate', value: awaitingEstimate.length, icon: ClipboardList, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { label: 'Pending approval', value: pendingApproval.length, icon: ShieldCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Open', value: open, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'In Progress', value: inProgress, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Awaiting Parts', value: awaitingParts, icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
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

      <div className="text-xs text-slate-500">
        Completed repair spend: <strong className="text-slate-800">${totalCost.toLocaleString()}</strong>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search WO number, title, or complaint..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="all">All Statuses</option>
          <option value="awaiting_estimate">Awaiting estimate</option>
          <option value="awaiting_approval">Internal review</option>
          <option value="awaiting_authorization">Awaiting customer OK</option>
          <option value="open">Authorized — ready</option>
          <option value="in_progress">In Progress</option>
          <option value="parts_ordered">Parts Ordered</option>
          <option value="awaiting_parts">Awaiting Parts</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {REPAIR_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading work orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No work orders found</p>
          <p className="text-sm mt-1">Click New Work Order and enter the customer complaint</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((wo) => {
            const vehicle = vehicles.find((v) => v.id === wo.vehicle_id);
            const tech = users.find((u) => u.id === wo.assigned_tech_id);
            const statusClass = STATUS_COLORS[wo.status] || 'bg-slate-100 text-slate-600 border-slate-200';
            return (
              <div
                key={wo.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setViewingWO(wo)}
              >
                <div className="flex items-start justify-between p-4 gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[wo.priority] || 'bg-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">{wo.wo_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusClass}`}>
                          {STATUS_LABELS[wo.status] || wo.status?.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{wo.repair_type}</span>
                      </div>
                      <p className="text-slate-700 text-sm mt-0.5 font-medium truncate">{wo.title}</p>
                      {wo.complaint && (
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{wo.complaint}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                        {vehicle && <span>🚛 #{vehicle.unit_number} {vehicle.make}</span>}
                        <span>👤 {tech ? tech.full_name : 'Unassigned'}</span>
                        {wo.opened_date && <span>📅 {wo.opened_date}</span>}
                        {wo.parts?.length > 0 && <span>🔩 {wo.parts.length} part(s)</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-black text-amber-600">${(wo.total_cost || 0).toLocaleString()}</div>
                      <div className="text-xs text-slate-400">estimate / total</div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleEdit(wo)}
                        className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                      >
                        {commentOnly
                          ? 'View & comment'
                          : getWorkOrderEditorKind(user, wo) === 'customer'
                            ? 'Edit'
                            : mechanicView || wo.status === 'awaiting_estimate'
                              ? 'Work order'
                              : wo.status === 'awaiting_approval' && isApprover
                                ? 'Review'
                                : getWorkOrderEditorKind(user, wo) === 'view'
                                  ? 'View'
                                  : 'Manage'}
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(wo.id)}
                          className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 font-semibold"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showIntake && (
        <WorkOrderIntakeModal
          wo={editingWO?.id ? editingWO : null}
          vehicles={fleetVehicles}
          techs={techs}
          currentUser={user}
          isCustomerPortal={customerPortal}
          onSave={handleSave}
          onClose={() => { setShowIntake(false); setEditingWO(null); }}
        />
      )}
      {showMechanicModal && editingWO && (
        <MechanicWorkOrderModal
          wo={editingWO}
          vehicles={fleetVehicles}
          currentUser={user}
          onSave={handleSave}
          onClose={() => { setShowMechanicModal(false); setEditingWO(null); }}
        />
      )}
      {showModal && (
        <WorkOrderModal
          wo={editingWO}
          vehicles={fleetVehicles}
          techs={techs}
          currentUser={user}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingWO(null); }}
        />
      )}
      {viewingWO && (
        <WorkOrderDetail
          wo={viewingWO}
          vehicles={vehicles}
          users={users}
          currentUser={user}
          onClose={() => setViewingWO(null)}
          onEdit={handleEdit}
          onApprove={isApprover && viewingWO.status === 'awaiting_approval' ? handleApproveFromDetail : undefined}
          onReject={isApprover && viewingWO.status === 'awaiting_approval' ? handleRejectFromDetail : undefined}
          onCustomerAuthorize={
            viewingWO.status === 'awaiting_authorization'
            && (customerPortal || canCreate)
              ? handleCustomerAuthorization
              : undefined
          }
          showEditButton={!commentOnly && getWorkOrderEditorKind(user, viewingWO) !== 'view'}
          canAddComment={canAddWorkOrderComment(user)}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  );
}

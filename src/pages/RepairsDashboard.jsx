import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { Wrench, AlertTriangle, Clock, DollarSign, TrendingUp, Package, ChevronRight, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  parts_ordered: 'bg-purple-100 text-purple-700 border-purple-200',
  awaiting_parts: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const PRIORITY_COLORS = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const ACTIVE_STATUSES = ['open', 'in_progress', 'parts_ordered', 'awaiting_parts'];

function DowntimeCostBar({ vehicle, workOrders }) {
  const vehWOs = workOrders.filter(w => w.vehicle_id === vehicle.id);
  const activeCost = vehWOs.filter(w => ACTIVE_STATUSES.includes(w.status)).reduce((s, w) => s + (w.total_cost || 0), 0);
  const totalCost = vehWOs.reduce((s, w) => s + (w.total_cost || 0), 0);
  const activeCount = vehWOs.filter(w => ACTIVE_STATUSES.includes(w.status)).length;
  const isDown = vehicle.status === 'in_shop' || activeCount > 0;

  return (
    <div className={`p-4 rounded-xl border ${isDown ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isDown ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="font-bold text-slate-900 text-sm">Unit {vehicle.unit_number}</span>
          <span className="text-slate-400 text-xs">{vehicle.make} {vehicle.model}</span>
        </div>
        <div className="text-right">
          <div className={`text-sm font-black ${activeCost > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            ${activeCost.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">active cost</div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>{activeCount} active WO{activeCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>${totalCost.toLocaleString()} lifetime repairs</span>
        {isDown && <span className="ml-auto text-red-500 font-bold">⚠ In Shop / Down</span>}
      </div>
      {totalCost > 0 && (
        <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isDown ? 'bg-red-400' : 'bg-green-400'}`}
            style={{ width: `${Math.min(100, (activeCost / Math.max(totalCost, 1)) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function RepairsDashboard() {
  const [workOrders, setWorkOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      api.entities.WorkOrder.list('-created_date', 200),
      api.entities.Vehicle.list('-created_date', 200),
      api.entities.User.list(),
    ]).then(([wos, vehs, usrs]) => {
      setWorkOrders(wos);
      setVehicles(vehs);
      setUsers(usrs);
      setLoading(false);
    });
  }, []);

  const activeWOs = useMemo(() =>
    workOrders.filter(w => ACTIVE_STATUSES.includes(w.status)), [workOrders]);

  const filteredActive = useMemo(() =>
    priorityFilter === 'all' ? activeWOs : activeWOs.filter(w => w.priority === priorityFilter),
    [activeWOs, priorityFilter]);

  const totalActiveCost = activeWOs.reduce((s, w) => s + (w.total_cost || 0), 0);
  const vehiclesDown = vehicles.filter(v => v.status === 'in_shop' || activeWOs.some(w => w.vehicle_id === v.id)).length;
  const criticalCount = activeWOs.filter(w => w.priority === 'critical').length;
  const awaitingParts = activeWOs.filter(w => w.status === 'awaiting_parts' || w.status === 'parts_ordered').length;

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  // Vehicles with at least one work order — sorted by active cost desc
  const vehiclesWithWOs = vehicles
    .filter(v => workOrders.some(w => w.vehicle_id === v.id))
    .sort((a, b) => {
      const costA = workOrders.filter(w => w.vehicle_id === a.id && ACTIVE_STATUSES.includes(w.status)).reduce((s, w) => s + (w.total_cost || 0), 0);
      const costB = workOrders.filter(w => w.vehicle_id === b.id && ACTIVE_STATUSES.includes(w.status)).reduce((s, w) => s + (w.total_cost || 0), 0);
      return costB - costA;
    });

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
          <h1 className="text-2xl font-black text-slate-900">Repairs Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Active work orders & vehicle downtime cost tracking</p>
        </div>
        <Link
          to="/portal/workorders"
          className="flex items-center gap-2 text-sm text-amber-600 font-semibold hover:text-amber-700"
        >
          Manage All Work Orders <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Work Orders', value: activeWOs.length, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Vehicles Down / In Shop', value: vehiclesDown, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Active Repair Cost', value: `$${totalActiveCost.toLocaleString()}`, icon: DollarSign, color: 'text-slate-700', bg: 'bg-slate-100' },
          { label: 'Awaiting Parts', value: awaitingParts, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Work Orders List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-900">Active Work Orders</h2>
            <div className="flex gap-2">
              {['all', 'critical', 'high', 'medium', 'low'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold capitalize transition-colors ${priorityFilter === p ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {p === 'all' ? 'All' : p}
                  {p !== 'all' && criticalCount > 0 && p === 'critical' && (
                    <span className="ml-1 bg-red-500 text-white rounded-full px-1 text-xs">{criticalCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {filteredActive.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 text-center py-14 text-slate-400 text-sm">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No active work orders
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActive.map(wo => {
                const vehicle = vehicleMap[wo.vehicle_id];
                const tech = userMap[wo.assigned_tech_id];
                const daysOpen = wo.opened_date
                  ? Math.floor((new Date() - new Date(wo.opened_date)) / 86400000)
                  : null;
                return (
                  <div key={wo.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_COLORS[wo.priority] || 'bg-slate-400'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm">{wo.wo_number}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[wo.status]}`}>
                              {wo.status?.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400">{wo.repair_type}</span>
                          </div>
                          <p className="text-slate-700 text-sm mt-0.5 font-medium">{wo.title}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                            {vehicle && (
                              <span className="flex items-center gap-1">
                                <Wrench className="w-3 h-3" /> Unit {vehicle.unit_number}
                              </span>
                            )}
                            {tech && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {tech.full_name}
                              </span>
                            )}
                            {daysOpen !== null && (
                              <span className={`flex items-center gap-1 ${daysOpen > 7 ? 'text-red-500 font-semibold' : ''}`}>
                                <Clock className="w-3 h-3" /> {daysOpen}d open
                              </span>
                            )}
                            {wo.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Due {wo.due_date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-black text-amber-600">${(wo.total_cost || 0).toLocaleString()}</div>
                        <div className="text-xs text-slate-400">cost</div>
                      </div>
                    </div>
                    {wo.complaint && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <span className="font-semibold text-slate-600">Complaint: </span>{wo.complaint}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vehicle Downtime Cost Panel */}
        <div className="space-y-4">
          <h2 className="font-black text-slate-900">Vehicle Downtime Costs</h2>
          {vehiclesWithWOs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 text-center py-10 text-slate-400 text-sm">
              No vehicle repair history
            </div>
          ) : (
            <div className="space-y-3">
              {vehiclesWithWOs.map(v => (
                <DowntimeCostBar key={v.id} vehicle={v} workOrders={workOrders} />
              ))}
            </div>
          )}

          {/* Cost summary */}
          {vehiclesWithWOs.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">Cost Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Active repair costs</span>
                  <span className="font-black text-red-400">${totalActiveCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total lifetime repairs</span>
                  <span className="font-black text-white">${workOrders.reduce((s, w) => s + (w.total_cost || 0), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed WOs</span>
                  <span className="font-black text-green-400">{workOrders.filter(w => w.status === 'completed').length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
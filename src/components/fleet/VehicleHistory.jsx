import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { X, Wrench, ClipboardCheck, Settings, Package, DollarSign, Clock, Calendar, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import VehicleValuation from '@/components/fleet/VehicleValuation';

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-700',
  passed: 'bg-green-100 text-green-700',
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  parts_ordered: 'bg-purple-100 text-purple-700',
  awaiting_parts: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-slate-100 text-slate-500',
  failed: 'bg-red-100 text-red-600',
  needs_attention: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-slate-100 text-slate-500',
};

function WorkOrderRow({ wo, users }) {
  const [expanded, setExpanded] = useState(false);
  const tech = users.find(u => u.id === wo.assigned_tech_id);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-start gap-3 p-4 hover:bg-slate-50 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
          <Wrench className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{wo.wo_number}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[wo.status] || 'bg-slate-100 text-slate-500'}`}>
              {wo.status?.replace(/_/g, ' ')}
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{wo.repair_type}</span>
          </div>
          <p className="text-sm text-slate-700 font-medium mt-0.5 truncate">{wo.title}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
            {wo.opened_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{wo.opened_date}</span>}
            {wo.completed_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Completed: {wo.completed_date}</span>}
            {tech && <span>Tech: {tech.full_name}</span>}
            {wo.odometer && <span>{wo.odometer?.toLocaleString()} mi</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {wo.total_cost > 0 && (
            <span className="text-sm font-black text-amber-600">${(wo.total_cost || 0).toLocaleString()}</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
          {wo.complaint && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Driver Complaint</div>
              <p className="text-sm text-slate-700">{wo.complaint}</p>
            </div>
          )}
          {wo.diagnosis && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Diagnosis</div>
              <p className="text-sm text-slate-700">{wo.diagnosis}</p>
            </div>
          )}
          {wo.repair_notes && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Work Performed</div>
              <p className="text-sm text-slate-700">{wo.repair_notes}</p>
            </div>
          )}
          {wo.parts?.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase mb-2">Parts Replaced</div>
              <div className="space-y-1">
                {wo.parts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-slate-200">
                    <div>
                      <span className="font-medium text-slate-800">{p.description}</span>
                      {p.part_number && <span className="text-slate-400 text-xs ml-2">#{p.part_number}</span>}
                      <span className="text-slate-500 text-xs ml-2">×{p.quantity}</span>
                    </div>
                    <span className="font-semibold text-slate-700">${(p.total_cost || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-6 text-sm pt-1">
            {wo.labor_hours > 0 && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{wo.labor_hours}h labor @ ${wo.labor_rate}/hr = <strong>${(wo.labor_cost || 0).toFixed(2)}</strong></span>
              </div>
            )}
            {wo.parts_total > 0 && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span>Parts: <strong>${(wo.parts_total || 0).toFixed(2)}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InspectionRow({ ins }) {
  return (
    <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl">
      <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
        <ClipboardCheck className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 text-sm">{ins.inspection_type}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[ins.status] || 'bg-slate-100 text-slate-500'}`}>
            {ins.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
          {ins.inspection_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ins.inspection_date}</span>}
          {ins.inspector_name && <span>Inspector: {ins.inspector_name}</span>}
          {ins.odometer && <span>{ins.odometer?.toLocaleString()} mi</span>}
        </div>
        {ins.notes && <p className="text-xs text-slate-500 mt-1">{ins.notes}</p>}
        {ins.items_checked?.some(i => i.result === 'defect') && (
          <div className="mt-2 flex flex-wrap gap-1">
            {ins.items_checked.filter(i => i.result === 'defect').map((item, idx) => (
              <span key={idx} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⚠ {item.item}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MaintenanceRow({ ms }) {
  return (
    <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl">
      <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
        <Settings className="w-4 h-4 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 text-sm">{ms.service_type}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[ms.status] || 'bg-slate-100 text-slate-500'}`}>
            {ms.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
          {ms.completed_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Completed: {ms.completed_date}</span>}
          {ms.last_service_date && <span>Last Service: {ms.last_service_date}</span>}
          {ms.last_service_mileage && <span>{ms.last_service_mileage?.toLocaleString()} mi</span>}
          {ms.assigned_tech && <span>Tech: {ms.assigned_tech}</span>}
          {ms.estimated_cost > 0 && <span className="text-amber-600 font-semibold">${ms.estimated_cost?.toLocaleString()}</span>}
        </div>
        {ms.notes && <p className="text-xs text-slate-500 mt-1">{ms.notes}</p>}
      </div>
    </div>
  );
}

export default function VehicleHistory({ vehicle, onClose }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    Promise.all([
      api.entities.WorkOrder.filter({ vehicle_id: vehicle.id }, '-opened_date', 200),
      api.entities.Inspection.filter({ vehicle_id: vehicle.id }, '-inspection_date', 200),
      api.entities.MaintenanceSchedule.filter({ vehicle_id: vehicle.id }, '-completed_date', 200),
      api.entities.User.list(),
    ]).then(([wos, insp, maint, usrs]) => {
      setWorkOrders(wos);
      setInspections(insp);
      setMaintenance(maint.filter(m => m.status === 'completed'));
      setUsers(usrs);
      setLoading(false);
    });
  }, [vehicle.id]);

  const totalRepairCost = useMemo(() =>
    workOrders.filter(w => w.status === 'completed').reduce((s, w) => s + (w.total_cost || 0), 0),
    [workOrders]
  );
  const totalParts = useMemo(() =>
    workOrders.reduce((s, w) => s + (w.parts?.length || 0), 0),
    [workOrders]
  );

  const tabs = [
    { key: 'all', label: 'All Events', count: workOrders.length + inspections.length + maintenance.length },
    { key: 'repairs', label: 'Repairs', count: workOrders.length },
    { key: 'inspections', label: 'Inspections', count: inspections.length },
    { key: 'maintenance', label: 'Maintenance', count: maintenance.length },
    { key: 'financials', label: 'Financials', count: null },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 bg-slate-900 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-amber-500 p-2 rounded-lg">
                <Truck className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h2 className="text-white font-black text-lg">Unit #{vehicle.unit_number} — {vehicle.unit_type === 'trailer' ? 'Trailer' : 'Service'} History</h2>
                <p className="text-slate-400 text-xs">{[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')} {vehicle.vin ? `· VIN: ${vehicle.vin}` : ''}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-0 border-b border-slate-200">
          {[
            { label: 'Total Repair Cost', value: `$${totalRepairCost.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600' },
            { label: 'Work Orders', value: workOrders.length, icon: Wrench, color: 'text-blue-600' },
            { label: 'Parts Replaced', value: totalParts, icon: Package, color: 'text-purple-600' },
          ].map((s, i) => (
            <div key={s.label} className={`p-4 text-center ${i < 2 ? 'border-r border-slate-200' : ''}`}>
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4 pt-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === t.key ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              {t.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === t.key ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {(activeTab === 'all' || activeTab === 'repairs') && workOrders.length > 0 && (
                <div>
                  {activeTab === 'all' && <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Wrench className="w-3.5 h-3.5" /> Work Orders & Repairs</div>}
                  <div className="space-y-2">
                    {workOrders.map(wo => <WorkOrderRow key={wo.id} wo={wo} users={users} />)}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'inspections') && inspections.length > 0 && (
                <div className={activeTab === 'all' ? 'mt-4' : ''}>
                  {activeTab === 'all' && <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><ClipboardCheck className="w-3.5 h-3.5" /> Inspections</div>}
                  <div className="space-y-2">
                    {inspections.map(ins => <InspectionRow key={ins.id} ins={ins} />)}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'maintenance') && maintenance.length > 0 && (
                <div className={activeTab === 'all' ? 'mt-4' : ''}>
                  {activeTab === 'all' && <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> Preventive Maintenance</div>}
                  <div className="space-y-2">
                    {maintenance.map(ms => <MaintenanceRow key={ms.id} ms={ms} />)}
                  </div>
                </div>
              )}

              {!loading && workOrders.length === 0 && inspections.length === 0 && maintenance.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No service history yet</p>
                  <p className="text-sm mt-1">Work orders, inspections, and maintenance records will appear here</p>
                </div>
              )}

              {!loading && (activeTab === 'repairs') && workOrders.length === 0 && (
                <div className="text-center py-16 text-slate-400 text-sm">No work orders found for this vehicle</div>
              )}
              {!loading && (activeTab === 'inspections') && inspections.length === 0 && (
                <div className="text-center py-16 text-slate-400 text-sm">No inspections found for this vehicle</div>
              )}
              {!loading && (activeTab === 'maintenance') && maintenance.length === 0 && (
                <div className="text-center py-16 text-slate-400 text-sm">No completed maintenance records found</div>
              )}

              {activeTab === 'financials' && (
                <VehicleValuation vehicle={vehicle} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
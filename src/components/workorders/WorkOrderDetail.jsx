import React from 'react';
import { X, Printer, Wrench, Truck, User, Calendar, Package } from 'lucide-react';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  parts_ordered: 'bg-purple-100 text-purple-700',
  awaiting_parts: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600',
};

export default function WorkOrderDetail({ wo, vehicles, users, onClose, onEdit }) {
  const vehicle = vehicles.find(v => v.id === wo.vehicle_id);
  const tech = users.find(u => u.id === wo.assigned_tech_id);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl print:rounded-none print:bg-white print:border-slate-300">
          <div>
            <h2 className="text-white print:text-slate-900 font-black text-xl">{wo.wo_number}</h2>
            <p className="text-slate-400 print:text-slate-600 text-sm mt-0.5">{wo.title}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={handlePrint} className="flex items-center gap-1 text-slate-300 hover:text-white text-sm px-3 py-1.5 border border-slate-600 rounded-lg">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => onEdit(wo)} className="flex items-center gap-1 text-slate-900 bg-amber-500 hover:bg-amber-400 text-sm px-3 py-1.5 rounded-lg font-semibold">
              Edit
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white ml-2"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status row */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[wo.status]}`}>
              {wo.status?.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${PRIORITY_COLORS[wo.priority]}`}>
              {wo.priority} priority
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{wo.repair_type}</span>
            {wo.warranty_repair && <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Warranty</span>}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {vehicle && (
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Vehicle</div>
                  <div className="text-sm font-semibold text-slate-900">#{vehicle.unit_number}</div>
                  <div className="text-xs text-slate-500">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                </div>
              </div>
            )}
            {tech && (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Assigned Tech</div>
                  <div className="text-sm font-semibold text-slate-900">{tech.full_name}</div>
                </div>
              </div>
            )}
            {wo.odometer && (
              <div className="flex items-start gap-2">
                <Wrench className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Odometer</div>
                  <div className="text-sm font-semibold text-slate-900">{wo.odometer?.toLocaleString()} mi</div>
                </div>
              </div>
            )}
            {wo.opened_date && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Opened</div>
                  <div className="text-sm font-semibold text-slate-900">{wo.opened_date}</div>
                </div>
              </div>
            )}
            {wo.due_date && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Due Date</div>
                  <div className="text-sm font-semibold text-slate-900">{wo.due_date}</div>
                </div>
              </div>
            )}
          </div>

          {/* C/D/R */}
          {(wo.complaint || wo.diagnosis || wo.repair_notes) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {wo.complaint && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="text-xs font-bold text-red-600 uppercase mb-1">Complaint</div>
                  <p className="text-sm text-slate-700">{wo.complaint}</p>
                </div>
              )}
              {wo.diagnosis && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="text-xs font-bold text-amber-600 uppercase mb-1">Diagnosis</div>
                  <p className="text-sm text-slate-700">{wo.diagnosis}</p>
                </div>
              )}
              {wo.repair_notes && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="text-xs font-bold text-green-600 uppercase mb-1">Work Performed</div>
                  <p className="text-sm text-slate-700">{wo.repair_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Parts Table */}
          {wo.parts?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-amber-500" />
                <h3 className="font-black text-slate-900">Parts Used</h3>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">Part #</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">Description</th>
                      <th className="text-center px-4 py-2 text-xs font-semibold text-slate-600">Qty</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600">Unit</th>
                      <th className="text-center px-4 py-2 text-xs font-semibold text-slate-600">Source</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wo.parts.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-xs text-slate-600">{p.part_number}</td>
                        <td className="px-4 py-2 text-slate-700">{p.description}</td>
                        <td className="px-4 py-2 text-center">{p.quantity}</td>
                        <td className="px-4 py-2 text-right">${(p.unit_cost || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            p.source === 'warranty' ? 'bg-green-100 text-green-600' :
                            p.source === 'ordered' ? 'bg-purple-100 text-purple-600' :
                            'bg-slate-100 text-slate-600'}`}>
                            {p.source?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">${(p.total_cost || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cost Summary */}
          <div className="bg-slate-900 rounded-xl p-5 text-white">
            <h3 className="font-black mb-4 text-amber-400">Cost Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Parts</span><span>${(wo.parts_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Labor ({wo.labor_hours}h @ ${wo.labor_rate}/hr)</span>
                <span>${(wo.labor_cost || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between font-black text-lg">
                <span>Total</span><span className="text-amber-400">${(wo.total_cost || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
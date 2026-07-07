import React from 'react';
import { Mail, Truck, TrendingUp, Fuel, Wrench, ChevronRight } from 'lucide-react';

export default function DriverCard({ driver, assignedVehicles, stats, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-amber-700 font-black text-lg">
            {driver.full_name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-900 truncate">{driver.full_name || '—'}</div>
          <div className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Driver</div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{driver.email}</span>
      </div>

      <div className="border-t border-slate-100 pt-3 mb-3">
        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Assigned Vehicle</div>
        {assignedVehicles.length === 0 ? (
          <div className="text-xs text-slate-400 italic">No vehicle assigned</div>
        ) : (
          assignedVehicles.map(v => (
            <div key={v.id} className="flex items-center gap-1.5 text-xs text-slate-700">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold">Unit {v.unit_number}</span>
              <span className="text-slate-400">{v.year} {v.make} {v.model}</span>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-blue-600 mb-0.5">
            <TrendingUp className="w-3 h-3" />
          </div>
          <div className="text-sm font-black text-slate-800">{stats.loads}</div>
          <div className="text-xs text-slate-400">Loads</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-red-500 mb-0.5">
            <Fuel className="w-3 h-3" />
          </div>
          <div className="text-sm font-black text-slate-800">${stats.fuelSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-slate-400">Fuel</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
            <Wrench className="w-3 h-3" />
          </div>
          <div className="text-sm font-black text-slate-800">{stats.workOrders}</div>
          <div className="text-xs text-slate-400">Work Orders</div>
        </div>
      </div>
    </div>
  );
}
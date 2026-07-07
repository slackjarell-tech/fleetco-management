import React from 'react';
import { Truck, User, MapPin, CheckCircle2, Clock, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_STYLES = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function RouteCard({ route, stops, driver, vehicle, onView, onEdit, onDelete }) {
  const delivered = stops.filter(s => s.status === 'delivered').length;
  const failed = stops.filter(s => s.status === 'failed').length;
  const total = stops.length;
  const progress = total > 0 ? Math.round(((delivered + failed) / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-black text-slate-900 text-base">{route.route_name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{route.route_date}</div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[route.status] || STATUS_STYLES.pending}`}>
          {route.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-1.5 text-sm mb-4">
        <div className="flex items-center gap-2 text-slate-600">
          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{driver?.full_name || <span className="text-slate-300">No driver assigned</span>}</span>
        </div>
        {vehicle && (
          <div className="flex items-center gap-2 text-slate-600">
            <Truck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Unit #{vehicle.unit_number} — {vehicle.make} {vehicle.model}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>{total} stops</span>
          {delivered > 0 && <span className="text-green-600 font-semibold">· {delivered} ✓</span>}
          {failed > 0 && <span className="text-red-500 font-semibold">· {failed} ✗</span>}
        </div>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progress</span>
            <span className="font-bold text-slate-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${route.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {route.notes && (
        <p className="text-xs text-slate-400 mb-3 truncate">{route.notes}</p>
      )}

      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <Button size="sm" variant="outline" className="flex-1" onClick={onView}>
          <Eye className="w-3.5 h-3.5 mr-1" /> View Stops
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </Button>
      </div>
    </div>
  );
}
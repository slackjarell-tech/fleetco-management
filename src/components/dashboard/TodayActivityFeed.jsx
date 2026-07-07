import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Clock, Truck, ClipboardCheck, Wrench, AlertTriangle, Package, Activity } from 'lucide-react';

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = (new Date() - new Date(isoStr)) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

export default function TodayActivityFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      api.entities.HOSLog.filter({ log_date: today }, '-created_date', 10),
      api.entities.Inspection.filter({ inspection_date: today }, '-created_date', 10),
      api.entities.WorkOrder.filter({ opened_date: today }, '-created_date', 10),
      api.entities.Load.filter({ pickup_date: today }, '-created_date', 10),
      api.entities.Incident.list('-created_date', 5),
    ]).then(([hos, ins, wo, loads, incidents]) => {
      const feed = [
        ...hos.map(h => ({ type: 'HOS Log', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', text: `HOS log submitted`, sub: h.log_date, time: h.created_date })),
        ...ins.map(i => ({ type: 'Inspection', icon: ClipboardCheck, color: 'text-green-500', bg: 'bg-green-50', text: `${i.inspection_type} inspection — ${i.status}`, sub: i.inspector_name, time: i.created_date })),
        ...wo.map(w => ({ type: 'Work Order', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50', text: `WO #${w.wo_number}: ${w.title}`, sub: w.repair_type, time: w.created_date })),
        ...loads.map(l => ({ type: 'Load', icon: Package, color: 'text-purple-500', bg: 'bg-purple-50', text: `Load #${l.load_number}: ${l.origin} → ${l.destination}`, sub: l.status, time: l.created_date })),
        ...incidents.filter(i => i.created_date?.slice(0,10) === today).map(i => ({ type: 'Incident', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', text: `${i.incident_type} reported`, sub: i.location, time: i.created_date })),
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 12);
      setItems(feed);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-amber-500" />
        <h3 className="font-black text-slate-800 text-sm">Today's Activity</h3>
        <span className="text-xs text-slate-400 ml-auto">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">No activity recorded today yet</div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-7 h-7 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">{item.text}</div>
                  {item.sub && <div className="text-xs text-slate-400 capitalize">{item.sub}</div>}
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0">{timeAgo(item.time)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
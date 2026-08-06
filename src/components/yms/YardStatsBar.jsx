import React from 'react';
import { Activity, Container, DoorOpen, ParkingSquare, Percent } from 'lucide-react';

export default function YardStatsBar({ stats }) {
  if (!stats) return null;
  const cards = [
    {
      label: 'Utilization',
      value: `${stats.utilizationPct}%`,
      sub: `${stats.occupiedCount} of ${stats.assignableTotal} spots`,
      icon: Percent,
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Available',
      value: stats.emptyCount,
      sub: 'open assignable spots',
      icon: ParkingSquare,
      accent: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      label: 'Dock doors',
      value: `${stats.dockFilled}/${stats.dockTotal || 0}`,
      sub: 'doors in use',
      icon: DoorOpen,
      accent: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Reserved',
      value: stats.reservedCount,
      sub: 'held for incoming',
      icon: Container,
      accent: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, sub, icon: Icon, accent, bg }) => (
        <div key={label} className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 flex gap-3">
          <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${accent}`} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
            <div className="text-xl font-black text-white leading-tight">{value}</div>
            <div className="text-[10px] text-slate-400 truncate">{sub}</div>
          </div>
        </div>
      ))}
      {stats.utilizationPct >= 85 && (
        <div className="col-span-2 lg:col-span-4 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <Activity className="w-4 h-4 flex-shrink-0" />
          Yard is nearing capacity — consider outbound queue or overflow spots.
        </div>
      )}
    </div>
  );
}

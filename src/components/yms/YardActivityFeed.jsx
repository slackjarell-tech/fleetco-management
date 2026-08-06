import React from 'react';
import { ArrowRightLeft, LogIn, LogOut } from 'lucide-react';
import { formatDwellTime } from '@/lib/ymsConstants';

export default function YardActivityFeed({ events = [] }) {
  if (!events.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-xs text-slate-500 text-center">
        Activity will appear here as units check in and out.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Recent Activity
      </div>
      <ul className="max-h-40 overflow-y-auto divide-y divide-slate-800">
        {events.slice(0, 12).map((ev) => (
          <li key={ev.id} className="px-3 py-2 text-xs flex items-start gap-2">
            {ev.type === 'check_in' && <LogIn className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />}
            {ev.type === 'check_out' && <LogOut className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />}
            {ev.type === 'move' && <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />}
            <div className="min-w-0">
              <div className="text-slate-200">
                {ev.type === 'check_in' && <><strong>{ev.unit}</strong> → {ev.spot}</>}
                {ev.type === 'check_out' && <><strong>{ev.unit}</strong> left {ev.spot}</>}
                {ev.type === 'move' && <><strong>{ev.unit}</strong> moved to {ev.spot}</>}
              </div>
              <div className="text-slate-500 text-[10px]">
                {new Date(ev.at).toLocaleString()}
                {ev.dwell && ` · dwell ${ev.dwell}`}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

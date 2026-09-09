import React from 'react';
import { Circle, MapPin } from 'lucide-react';

/** Active local recording — no live feed until driver stops and uploads. */
export default function RecordingSessionCard({ session }) {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div>
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <span className="flex items-center gap-1 text-red-400 text-xs font-black uppercase">
              <Circle className="w-3 h-3 fill-current animate-pulse" /> Recording
            </span>
            {session.driver_name}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            On-device dashcam — video appears in library when they stop
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Since {session.started_at ? new Date(session.started_at).toLocaleTimeString() : '—'}
        </div>
      </div>
      <div className="p-6 text-center text-slate-400 text-sm">
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
        Driver is recording locally. Live office viewing requires LiveKit — saved video will be available shortly after they tap Stop.
      </div>
    </div>
  );
}

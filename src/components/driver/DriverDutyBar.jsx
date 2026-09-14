import React, { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { DRIVER_DUTY_OPTIONS, getDriverDuty, setDriverDuty, subscribeDriverDuty } from '@/lib/driverDuty';

/** FMCSA-style duty status — drives auto road cam when Driving. */
export default function DriverDutyBar({ compact = false }) {
  const [duty, setDuty] = useState(getDriverDuty);

  useEffect(() => subscribeDriverDuty(setDuty), []);

  return (
    <div className={`bg-slate-900 rounded-xl ${compact ? 'p-2' : 'p-3'} space-y-2`}>
      {!compact && (
        <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wide">
          <Truck className="w-3.5 h-3.5 text-amber-400" /> Duty status
        </div>
      )}
      <div className="grid grid-cols-4 gap-1">
        {DRIVER_DUTY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDriverDuty(opt.value)}
            className={`py-2 px-1 rounded-lg text-[10px] sm:text-xs font-black transition-colors ${
              duty === opt.value
                ? opt.value === 'driving'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {compact ? opt.short : opt.label}
          </button>
        ))}
      </div>
      {duty === 'driving' && (
        <p className="text-[10px] text-emerald-400/90">Road cam auto-starts when clocked in (if enabled).</p>
      )}
    </div>
  );
}

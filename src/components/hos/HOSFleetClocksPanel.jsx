import React, { useMemo } from 'react';
import { computeDriverHosClocks } from '@/lib/hosFmcsa';
import HOSDriverClockCard from '@/components/hos/HOSDriverClockCard';

export default function HOSFleetClocksPanel({ drivers, hosLogs, dutyByDriverId = {} }) {
  const rows = useMemo(() => {
    return (drivers || []).map((d) => {
      const logs = (hosLogs || []).filter((l) => l.driver_id === d.id);
      const clocks = logs[0]?.hos_clocks
        || computeDriverHosClocks(logs, { currentDuty: dutyByDriverId[d.id] || 'off_duty' });
      return { driver: d, clocks };
    });
  }, [drivers, hosLogs, dutyByDriverId]);

  if (!rows.length) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Driver HOS clocks</h2>
        <p className="text-xs text-slate-500 mt-0.5">Live countdowns from duty logs and vehicle movement events</p>
      </div>
      <div className="space-y-4">
        {rows.map(({ driver, clocks }) => (
          <div key={driver.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <HOSDriverClockCard driverName={driver.full_name} clocks={clocks} />
          </div>
        ))}
      </div>
    </div>
  );
}

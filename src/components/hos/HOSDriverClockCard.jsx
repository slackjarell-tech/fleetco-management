import React from 'react';
import { AlertTriangle, Clock, Coffee, Moon, RotateCcw, Truck } from 'lucide-react';
import { formatClockHours } from '@/lib/hosFmcsa';

function ClockTile({ label, value, sub, warn, icon: Icon, accent = 'text-emerald-600', light }) {
  const box = warn
    ? 'bg-red-50 border-red-200'
    : light
      ? 'bg-slate-50 border-slate-200'
      : 'bg-slate-800/60 border-slate-600';
  const valueCls = warn ? 'text-red-700' : light ? 'text-slate-900' : 'text-white';
  return (
    <div className={`rounded-lg border p-3 ${box}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
        {Icon && <Icon className={`w-3 h-3 ${warn ? 'text-red-500' : accent}`} />}
        {label}
      </div>
      <div className={`text-lg font-black tabular-nums ${valueCls}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function HOSDriverClockCard({ driverName, clocks, compact = false, light = true }) {
  if (!clocks) {
    return (
      <div className="text-xs text-slate-400 italic">No HOS clock data yet — log duty or clock into a vehicle.</div>
    );
  }

  const warnDrive = clocks.driveRemaining <= 1;
  const warnWindow = clocks.windowRemaining <= 1;
  const warnCycle = clocks.cycleRemaining <= 5;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!compact && driverName && (
        <div className="text-sm font-black text-slate-900">{driverName}</div>
      )}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
        <ClockTile light={light} label="Drive left" value={formatClockHours(clocks.driveRemaining)} sub={`${clocks.driveUsedToday}h used / 11h`} warn={warnDrive} icon={Truck} />
        <ClockTile light={light} label="14-hr window" value={formatClockHours(clocks.windowRemaining)} sub={`${clocks.onDutyUsedToday}h on duty`} warn={warnWindow} icon={Clock} accent="text-amber-600" />
        <ClockTile light={light} label="Break" value={clocks.breakRequired ? 'Due now' : formatClockHours(clocks.breakRemainingMinutes / 60)} sub={clocks.breakRequired ? '30 min off before drive' : 'Until 8h drive'} warn={clocks.breakRequired} icon={Coffee} accent="text-orange-600" />
        <ClockTile light={light} label="70-hr / 8-day" value={formatClockHours(clocks.cycleRemaining)} sub={`${clocks.cycleUsed8Day}h used`} warn={warnCycle} icon={Clock} accent="text-violet-600" />
        <ClockTile light={light} label="10-hr reset" value={clocks.tenHourResetReady ? 'Ready' : formatClockHours(clocks.consecutiveOffHours)} sub={clocks.tenHourResetReady ? 'Full reset available' : 'Off / sleeper streak'} icon={Moon} accent="text-blue-600" />
        <ClockTile light={light} label="34-hr restart" value={clocks.thirtyFourHourResetReady ? 'Ready' : formatClockHours(clocks.thirtyFourHourResetProgress)} sub={clocks.thirtyFourHourResetReady ? 'Cycle restart' : `Need ${Math.max(0, Math.round((34 - clocks.thirtyFourHourResetProgress) * 10) / 10)}h more off`} icon={RotateCcw} accent="text-cyan-600" />
      </div>
      {clocks.violations?.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{clocks.violations.join(' · ')}</span>
        </div>
      )}
    </div>
  );
}

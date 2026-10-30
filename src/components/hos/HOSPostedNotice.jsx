import React from 'react';
import { Megaphone, AlertTriangle } from 'lucide-react';
import { HOS_LIMITS, formatClockHours } from '@/lib/hosFmcsa';

const ALLOWANCE_ROWS = [
  {
    label: 'Driving allowed',
    value: `${HOS_LIMITS.maxDriveHours} hours max`,
    detail: 'After a 10-hour off-duty reset',
  },
  {
    label: 'On-duty window',
    value: `${HOS_LIMITS.maxWindowHours} hours total`,
    detail: 'Driving + on-duty (not driving) — then no more driving',
  },
  {
    label: 'Break required',
    value: `${HOS_LIMITS.breakMinutes} minutes off duty`,
    detail: `Before ${HOS_LIMITS.breakAfterDriveHours} hours of driving (since last break or 10-hour off)`,
  },
  {
    label: 'Off-duty reset',
    value: `${HOS_LIMITS.minOffDutyResetHours} hours consecutive`,
    detail: 'Off duty or sleeper — resets 11-hr drive & 14-hr window',
  },
  {
    label: 'Weekly on-duty limit',
    value: `${HOS_LIMITS.cycle70Hours} hours / ${HOS_LIMITS.cycleDays} days`,
    detail: 'Rolling total on-duty time',
  },
  {
    label: '34-hour restart',
    value: `${HOS_LIMITS.restart34Hours} hours off duty`,
    detail: 'Restarts the 70-hour / 8-day cycle',
  },
];

function StatusLine({ label, value, warn }) {
  return (
    <div className={`flex justify-between gap-3 text-sm py-1.5 border-b border-amber-200/60 last:border-0 ${warn ? 'text-red-800 font-bold' : 'text-slate-800'}`}>
      <span className="text-slate-600 font-medium">{label}</span>
      <span className="tabular-nums text-right">{value}</span>
    </div>
  );
}

/**
 * Bulletin-style posted notice: FMCSA allowances + this driver's live time left.
 */
export default function HOSPostedNotice({ driverName, clocks, subtitle }) {
  const warnDrive = clocks && clocks.driveRemaining <= 1;
  const warnWindow = clocks && clocks.windowRemaining <= 1;
  const warnBreak = clocks?.breakRequired;
  const warnCycle = clocks && clocks.cycleRemaining <= 5;

  return (
    <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100/80 shadow-md overflow-hidden">
      <div className="bg-amber-500 px-4 py-2 flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-slate-900 flex-shrink-0" />
        <div>
          <div className="text-slate-900 font-black text-sm uppercase tracking-wide">Posted — Driver time & break notice</div>
          <div className="text-slate-900/80 text-[11px] font-semibold">FMCSA property-carrying CMV (interstate) · FleetCo tracking — not a certified ELD</div>
        </div>
      </div>

      <div className="p-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="text-xs font-black text-amber-900 uppercase mb-2">Legal allowances (maximums)</div>
          <ul className="space-y-2">
            {ALLOWANCE_ROWS.map((row) => (
              <li key={row.label} className="bg-white/70 rounded-lg px-3 py-2 border border-amber-200/80">
                <div className="flex justify-between gap-2 text-sm font-bold text-slate-900">
                  <span>{row.label}</span>
                  <span className="text-amber-800 whitespace-nowrap">{row.value}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{row.detail}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-amber-300 p-4 shadow-inner">
          <div className="text-xs font-black text-slate-900 uppercase mb-1">
            {driverName ? `Live status — ${driverName}` : 'Live driver status'}
          </div>
          {subtitle && <p className="text-[11px] text-slate-500 mb-3">{subtitle}</p>}

          {!clocks ? (
            <p className="text-sm text-slate-500 italic">
              Clock in on Time Clock, change duty on ELD Portal, or save a log entry to see time remaining here.
            </p>
          ) : (
            <div className="space-y-0.5">
              <StatusLine
                label="Driving time left today"
                value={`${formatClockHours(clocks.driveRemaining)} of ${HOS_LIMITS.maxDriveHours}h`}
                warn={warnDrive}
              />
              <StatusLine
                label="14-hour window left"
                value={`${formatClockHours(clocks.windowRemaining)} (${clocks.onDutyUsedToday}h used)`}
                warn={warnWindow}
              />
              <StatusLine
                label="30-minute break"
                value={
                  clocks.breakRequired
                    ? 'Required now — stop driving'
                    : `${formatClockHours(clocks.breakRemainingMinutes / 60)} until break rule`
                }
                warn={warnBreak}
              />
              <StatusLine
                label="70-hour / 8-day cycle left"
                value={`${formatClockHours(clocks.cycleRemaining)} (${clocks.cycleUsed8Day}h used)`}
                warn={warnCycle}
              />
              <StatusLine
                label="10-hour off-duty reset"
                value={clocks.tenHourResetReady ? 'Complete — full reset' : `${formatClockHours(clocks.consecutiveOffHours)} off streak`}
              />
              <StatusLine
                label="34-hour restart"
                value={
                  clocks.thirtyFourHourResetReady
                    ? 'Complete — cycle restarted'
                    : `${formatClockHours(clocks.thirtyFourHourResetProgress)} / ${HOS_LIMITS.restart34Hours}h`
                }
              />
            </div>
          )}

          {clocks?.violations?.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{clocks.violations.join(' · ')}</span>
            </div>
          )}

          <p className="text-[10px] text-slate-500 mt-3 leading-snug">
            Updated from duty logs and vehicle movement events. Drivers must comply with FMCSA limits regardless of this display.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Compact row for fleet roster under the main notice */
export function HOSPostedDriverRow({ driverName, clocks }) {
  if (!clocks) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-lg border border-amber-200 px-3 py-2 text-xs">
      <span className="font-bold text-slate-800">{driverName}</span>
      <span className="text-slate-600">
        Drive left: <strong className={clocks.driveRemaining <= 1 ? 'text-red-600' : 'text-emerald-700'}>{formatClockHours(clocks.driveRemaining)}</strong>
        {' · '}
        Window: <strong>{formatClockHours(clocks.windowRemaining)}</strong>
        {' · '}
        Break: <strong className={clocks.breakRequired ? 'text-red-600' : ''}>{clocks.breakRequired ? 'DUE' : formatClockHours(clocks.breakRemainingMinutes / 60)}</strong>
        {' · '}
        70/8: <strong>{formatClockHours(clocks.cycleRemaining)}</strong>
      </span>
    </div>
  );
}

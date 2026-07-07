import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Detects FMCSA HOS violations (Property-carrying / 11/14/70-hour rules).
 * Returns array of violation strings.
 */
export function detectViolations(log) {
  const v = [];
  const driving = log.hours_driving || 0;
  const onDuty = (log.hours_driving || 0) + (log.hours_on_duty || 0);
  const offAndSleeper = (log.hours_off_duty || 0) + (log.hours_sleeper || 0);

  if (driving > 11) v.push(`11-Hour Driving Limit exceeded (${driving.toFixed(1)} hrs driven)`);
  if (onDuty > 14) v.push(`14-Hour On-Duty Window exceeded (${onDuty.toFixed(1)} hrs on-duty)`);
  if (offAndSleeper < 10 && driving > 0) v.push(`10-Hour Off-Duty reset may be insufficient (${offAndSleeper.toFixed(1)} hrs off/sleeper)`);

  return v;
}

export default function HOSViolations({ violations = [] }) {
  if (violations.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
        <CheckCircle2 className="w-4 h-4" /> No violations detected
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {violations.map((v, i) => (
        <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700 font-medium">{v}</span>
        </div>
      ))}
    </div>
  );
}
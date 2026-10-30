import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { detectViolationsFromDailyLog } from '@/lib/hosFmcsa';

/** Daily log totals vs FMCSA limits (11 / 14 / 10-hour reset). */
export function detectViolations(log) {
  return detectViolationsFromDailyLog(log);
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
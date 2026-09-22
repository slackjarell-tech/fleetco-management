import React from 'react';
import { getRepairOrderPhase } from '@/lib/workOrderWorkflow';

const STEPS = [
  { id: 'check_in', label: 'Check-in' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'authorization', label: 'Authorization' },
  { id: 'repair', label: 'Repair & QC' },
  { id: 'checkout', label: 'Checkout' },
];

export default function RepairOrderPhaseBar({ wo }) {
  const current = getRepairOrderPhase(wo);
  const idx = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="flex flex-wrap gap-1 sm:gap-0 sm:justify-between mb-4">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step.id} className="flex items-center flex-1 min-w-[4.5rem]">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-amber-500 text-slate-900' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center font-semibold ${active ? 'text-amber-700' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`hidden sm:block h-0.5 flex-1 mx-1 mb-4 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

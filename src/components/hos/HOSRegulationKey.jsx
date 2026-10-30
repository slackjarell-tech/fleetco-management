import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { FMCSA_HOS_KEY } from '@/lib/hosFmcsa';

export default function HOSRegulationKey({ defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-800/80 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-black">
          <BookOpen className="w-4 h-4 text-amber-400" />
          FMCSA HOS quick reference
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700">
          <p className="text-xs text-slate-400 pt-3 leading-relaxed">
            Property-carrying CMVs (interstate). FleetCo tracks clocks from duty logs and vehicle movement — not a certified ELD.
          </p>
          <ul className="space-y-2">
            {FMCSA_HOS_KEY.map((item) => (
              <li key={item.id} className="text-sm">
                <div className="font-bold text-amber-300">{item.title}</div>
                <div className="text-slate-300 text-xs mt-0.5 leading-snug">{item.simple}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.rule}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

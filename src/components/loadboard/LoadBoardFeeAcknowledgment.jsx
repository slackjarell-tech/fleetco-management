import React from 'react';
import { CreditCard, Percent, AlertCircle } from 'lucide-react';
import { LOAD_BOARD_FEE_DISCLOSURE } from '@/lib/loadBoardFeeDisclosure';

/**
 * Required acknowledgment before customer or broker signup / load board access.
 */
export default function LoadBoardFeeAcknowledgment({
  checked,
  onChange,
  variant = 'light',
  showCheckbox = true,
  id = 'load-board-fee-ack',
}) {
  const isDark = variant === 'dark';
  const box = isDark
    ? 'bg-slate-800/80 border-amber-500/30 text-slate-200'
    : 'bg-amber-50 border-amber-200 text-slate-800';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';
  const icon = isDark ? 'text-amber-400' : 'text-amber-700';

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${box}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${icon}`} />
        <div>
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {LOAD_BOARD_FEE_DISCLOSURE.title}
          </p>
          <p className={`text-sm mt-1 leading-relaxed ${muted}`}>
            {LOAD_BOARD_FEE_DISCLOSURE.summary}
          </p>
        </div>
      </div>
      <div className={`flex items-start gap-2 text-sm ${muted}`}>
        <Percent className={`w-4 h-4 shrink-0 mt-0.5 ${icon}`} />
        <span>Posting loads is free — the fee applies only when freight moves on the load board.</span>
      </div>
      <div className={`flex items-start gap-2 text-sm ${muted}`}>
        <CreditCard className={`w-4 h-4 shrink-0 mt-0.5 ${icon}`} />
        <span>{LOAD_BOARD_FEE_DISCLOSURE.cardOnFile}</span>
      </div>
      {showCheckbox && (
        <label htmlFor={id} className={`flex items-start gap-3 cursor-pointer pt-1 border-t ${isDark ? 'border-slate-700' : 'border-amber-200/80'}`}>
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-400 text-amber-500 focus:ring-amber-500"
          />
          <span className={`text-sm leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {LOAD_BOARD_FEE_DISCLOSURE.checkboxLabel}
          </span>
        </label>
      )}
    </div>
  );
}

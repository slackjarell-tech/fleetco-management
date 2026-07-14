import React from 'react';
import { Building2, CheckSquare, Square } from 'lucide-react';

export default function CustomerReportPicker({
  customers,
  selectedIds,
  onChange,
  allSelected,
  onToggleAll,
}) {
  if (!customers?.length) {
    return (
      <p className="text-xs text-slate-400">No customers loaded.</p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggleAll}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-sm font-bold transition-all ${
          allSelected
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
        }`}
      >
        {allSelected ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0" />}
        <Building2 className="w-4 h-4 flex-shrink-0 opacity-60" />
        All customers ({customers.length})
      </button>
      <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-100 rounded-lg p-2 bg-slate-50">
        {customers.map((c) => {
          const checked = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (allSelected) {
                  onChange([c.id]);
                  return;
                }
                if (checked) {
                  onChange(selectedIds.filter((id) => id !== c.id));
                } else {
                  onChange([...selectedIds, c.id]);
                }
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs font-semibold ${
                checked && !allSelected ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-white/80'
              }`}
            >
              {checked && !allSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              ) : (
                <Square className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span className="truncate">{c.company_name || c.contact_name || c.id}</span>
            </button>
          );
        })}
      </div>
      {!allSelected && selectedIds.length === 0 && (
        <p className="text-[10px] text-amber-700 font-semibold">Select at least one customer, or choose All customers.</p>
      )}
    </div>
  );
}

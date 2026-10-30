import React from 'react';
import {
  MAINTENANCE_STRATEGIES,
  MAINTENANCE_STRATEGY_META,
  repairTypesForStrategy,
} from '@/lib/workOrderTypes';

/**
 * Maintenance strategy + repair type pickers (grouped taxonomy).
 */
export default function WorkOrderTypeFields({
  maintenanceStrategy,
  repairType,
  onMaintenanceStrategyChange,
  onRepairTypeChange,
  showDescriptions = false,
  className = '',
}) {
  const types = repairTypesForStrategy(maintenanceStrategy);

  const handleStrategy = (e) => {
    const next = e.target.value;
    onMaintenanceStrategyChange(next);
    const first = repairTypesForStrategy(next)[0]?.value;
    if (first) onRepairTypeChange(first);
  };

  const meta = MAINTENANCE_STRATEGY_META[maintenanceStrategy];

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Maintenance strategy</label>
        <select
          value={maintenanceStrategy}
          onChange={handleStrategy}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {MAINTENANCE_STRATEGIES.map((id) => (
            <option key={id} value={id}>
              {MAINTENANCE_STRATEGY_META[id].label}
            </option>
          ))}
        </select>
        {showDescriptions && meta?.description && (
          <p className="text-xs text-slate-500 mt-1 leading-snug">{meta.description}</p>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Repair type</label>
        <select
          value={repairType}
          onChange={(e) => onRepairTypeChange(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.value}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

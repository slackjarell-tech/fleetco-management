import React, { useEffect, useMemo, useState } from 'react';
import { Search, Truck, Clock, LogOut, Bookmark, Wrench, Ban, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  YMS_ELEMENT_TYPES,
  YMS_PLACEMENT_STATUS,
  formatDwellTime,
  vehicleMatchesSpot,
  placementDisplayStatus,
} from '@/lib/ymsConstants';

export default function YardAssignPanel({
  element,
  placement,
  vehicles,
  onAssign,
  onClose,
  onSetStatus,
  onUpdateNotes,
}) {
  const [search, setSearch] = useState('');
  const [notesDraft, setNotesDraft] = useState(placement?.notes || '');

  useEffect(() => {
    setNotesDraft(placement?.notes || '');
  }, [placement?.id, placement?.notes]);

  useEffect(() => {
    if (!element || !placement || notesDraft === (placement.notes || '')) return undefined;
    const t = setTimeout(() => onUpdateNotes(element.id, notesDraft), 500);
    return () => clearTimeout(t);
  }, [notesDraft, element, placement, onUpdateNotes]);
  const def = element ? YMS_ELEMENT_TYPES[element.type] : null;

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (element && !vehicleMatchesSpot(v, element.type)) return false;
      if (!q) return true;
      const hay = `${v.unit_number} ${v.make} ${v.model} ${v.vin || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [vehicles, search, element]);

  if (!element || !def) return null;

  const currentVehicle = placement?.vehicle_id
    ? vehicles.find((v) => v.id === placement.vehicle_id)
    : null;
  const status = placementDisplayStatus(placement);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-700 bg-slate-800/80">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400">{def.label}</div>
          <div className="text-lg font-black text-white">{element.label}</div>
          {def.description && <p className="text-xs text-slate-400 mt-1">{def.description}</p>}
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {currentVehicle ? (
          <div className="rounded-xl bg-emerald-950/50 border border-emerald-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/30 flex items-center justify-center">
                <Truck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-black text-white text-lg">{currentVehicle.unit_number}</div>
                <div className="text-xs text-slate-400">
                  {[currentVehicle.year, currentVehicle.make, currentVehicle.model].filter(Boolean).join(' ')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-emerald-300/90">
              <Clock className="w-3.5 h-3.5" />
              On site {formatDwellTime(placement?.checked_in_at)}
            </div>
            {placement?.notes && (
              <p className="text-xs text-slate-400 mt-2 border-t border-emerald-900/50 pt-2">{placement.notes}</p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full border-red-800 text-red-300 hover:bg-red-950"
              onClick={() => onAssign(element.id, null)}
            >
              <LogOut className="w-4 h-4 mr-1" /> Check Out Unit
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search unit #, make, model, VIN…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredVehicles.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No matching units available for this spot type.</p>
              ) : (
                filteredVehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onAssign(element.id, v.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors"
                  >
                    <span className="font-bold text-white text-sm">{v.unit_number}</span>
                    <span className="text-xs text-slate-400 truncate">{v.make} {v.model}</span>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        <div className="border-t border-slate-700 pt-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Spot status (no unit)</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'reserved', icon: Bookmark, label: 'Reserve' },
              { key: 'maintenance', icon: Wrench, label: 'Maintenance' },
              { key: 'blocked', icon: Ban, label: 'Block' },
            ].map(({ key, icon: Icon, label }) => (
              <Button
                key={key}
                size="sm"
                variant={status === key ? 'default' : 'outline'}
                className={`text-xs h-9 ${status === key ? 'bg-amber-500 text-slate-900' : 'border-slate-600 text-slate-300'}`}
                onClick={() => onSetStatus(element.id, status === key ? 'clear' : key)}
                disabled={!!currentVehicle}
              >
                <Icon className="w-3.5 h-3.5 mr-1" /> {label}
              </Button>
            ))}
          </div>
          {!currentVehicle && placement && (
            <label className="block mt-3 text-[10px] text-slate-500">
              Spot notes
              <Input
                className="mt-1 bg-slate-800 border-slate-600 text-white text-xs h-9"
                placeholder="Load #, appointment, driver name…"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
              />
            </label>
          )}
          {!currentVehicle && !placement && (
            <p className="text-[10px] text-slate-500 mt-2">Set a spot status above to add notes.</p>
          )}
        </div>

        {status && !currentVehicle && (
          <p className="text-[10px] text-slate-500">
            Status: <span className="text-amber-400 font-semibold">{YMS_PLACEMENT_STATUS[status]?.label}</span>
          </p>
        )}
      </div>
    </div>
  );
}

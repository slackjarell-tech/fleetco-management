import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAP_COLOR_HEX, MAP_COLOR_LABELS } from '@/lib/vehicleMapColors';

export default function MapColorSelect({
  value,
  onChange,
  label = 'Fleet Map Color',
  showHint = true,
  disabled = false,
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Select map color" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(MAP_COLOR_LABELS).map(([key, labelText]) => (
            <SelectItem key={key} value={key}>
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: MAP_COLOR_HEX[key] }}
                />
                {labelText}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showHint && (
        <p className="text-[10px] text-slate-400 mt-1">
          Green = driveable · Red = support needed · Blue = in shop
        </p>
      )}
    </div>
  );
}

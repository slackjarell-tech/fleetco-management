import React from 'react';
import { Building2, ParkingSquare } from 'lucide-react';
import { YMS_CELL_PX, YMS_ELEMENT_TYPES, yardGridDimensions, isBuildingType, isParkingType } from '@/lib/ymsConstants';

export default function YardCanvas({
  yard,
  elements = [],
  placements = {},
  vehiclesById = {},
  selectedId,
  paintTool,
  onCellClick,
  onElementClick,
  mode = 'design',
}) {
  const { cols, rows, widthFt, lengthFt, cellSizeFt } = yardGridDimensions(yard);
  const canvasW = cols * YMS_CELL_PX;
  const canvasH = rows * YMS_CELL_PX;

  return (
    <div className="overflow-auto rounded-xl border border-slate-300 bg-slate-200/80 p-4">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
        <span>{yard.name || 'Yard'} · {widthFt}×{lengthFt} ft ({cols}×{rows} cells @ {cellSizeFt} ft)</span>
        <span className="font-mono">N ↑</span>
      </div>
      <div
        className="relative mx-auto shadow-inner"
        style={{
          width: canvasW,
          height: canvasH,
          backgroundImage: `
            linear-gradient(to right, rgba(148,163,184,0.35) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148,163,184,0.35) 1px, transparent 1px)
          `,
          backgroundSize: `${YMS_CELL_PX}px ${YMS_CELL_PX}px`,
          backgroundColor: '#e2e8f0',
        }}
      >
        {mode === 'design' && (
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${cols}, ${YMS_CELL_PX}px)`, gridTemplateRows: `repeat(${rows}, ${YMS_CELL_PX}px)` }}
          >
            {Array.from({ length: cols * rows }).map((_, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              return (
                <button
                  key={`cell-${col}-${row}`}
                  type="button"
                  className={`border-0 p-0 transition-colors ${paintTool ? 'hover:bg-amber-200/50 cursor-crosshair' : 'cursor-default'}`}
                  style={{ width: YMS_CELL_PX, height: YMS_CELL_PX }}
                  onClick={() => onCellClick?.(col, row)}
                  aria-label={`Cell ${col}, ${row}`}
                />
              );
            })}
          </div>
        )}

        {elements.map((el) => {
          const def = YMS_ELEMENT_TYPES[el.type] || YMS_ELEMENT_TYPES.parking;
          const placement = placements[el.id];
          const vehicle = placement?.vehicle_id ? vehiclesById[placement.vehicle_id] : null;
          const isSelected = selectedId === el.id;
          const occupied = !!vehicle;
          const isBuilding = isBuildingType(el.type);
          const isParking = isParkingType(el.type);

          let bg = occupied ? '#166534' : (el.color || def.color);
          let borderStyle = 'solid';
          let extraClass = '';

          if (mode === 'design' && isBuilding) {
            bg = el.color || def.color;
            extraClass = 'shadow-md';
          }
          if (mode === 'design' && isParking && !occupied) {
            borderStyle = 'dashed';
            extraClass = 'opacity-95';
          }

          return (
            <button
              key={el.id}
              type="button"
              className={`absolute flex flex-col items-center justify-center text-center rounded-md border-2 text-[10px] font-bold leading-tight px-0.5 transition-all z-10 ${extraClass} ${
                isSelected ? 'ring-2 ring-amber-400 ring-offset-1 z-20' : ''
              } ${mode === 'live' && def.assignable ? 'cursor-pointer hover:brightness-110' : ''}`}
              style={{
                left: el.col * YMS_CELL_PX + 2,
                top: el.row * YMS_CELL_PX + 2,
                width: el.cols * YMS_CELL_PX - 4,
                height: el.rows * YMS_CELL_PX - 4,
                backgroundColor: bg,
                borderColor: isSelected ? '#f59e0b' : (isBuilding ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)'),
                borderStyle,
                color: '#fff',
                backgroundImage: isBuilding && mode === 'design'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.12) 75%, transparent 75%)'
                  : undefined,
                backgroundSize: isBuilding ? '12px 12px' : undefined,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onElementClick?.(el);
              }}
            >
              {isBuilding && mode === 'design' && (
                <Building2 className="w-4 h-4 mb-0.5 opacity-80 flex-shrink-0" />
              )}
              {isParking && mode === 'design' && !occupied && (
                <ParkingSquare className="w-3.5 h-3.5 mb-0.5 opacity-80 flex-shrink-0" />
              )}
              <span className="truncate w-full px-0.5">{el.label || def.label}</span>
              {mode === 'design' && (isBuilding || isParking) && (
                <span className="text-[8px] font-normal opacity-75">
                  {el.cols * cellSizeFt}×{el.rows * cellSizeFt} ft
                </span>
              )}
              {mode === 'live' && vehicle && (
                <span className="text-[9px] font-normal opacity-90 truncate w-full">{vehicle.unit_number}</span>
              )}
              {mode === 'live' && def.assignable && !vehicle && (
                <span className="text-[9px] font-normal opacity-75">Empty</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React, { useCallback, useRef, useState } from 'react';
import { Building2, Compass, ZoomIn, ZoomOut } from 'lucide-react';
import {
  YMS_CELL_PX,
  YMS_ELEMENT_TYPES,
  YMS_PLACEMENT_STATUS,
  yardGridDimensions,
  isBuildingType,
  isParkingType,
  isAssignableType,
  liveElementStyle,
  formatDwellTime,
  placementDisplayStatus,
} from '@/lib/ymsConstants';

export default function YardCanvas({
  yard,
  elements = [],
  placements = {},
  vehiclesById = {},
  selectedId,
  paintTool,
  onCellClick,
  onElementClick,
  onElementMove,
  mode = 'design',
  zoom = 1,
  onZoomChange,
}) {
  const { cols, rows, widthFt, lengthFt, cellSizeFt } = yardGridDimensions(yard);
  const cellPx = YMS_CELL_PX * zoom;
  const canvasW = cols * cellPx;
  const canvasH = rows * cellPx;
  const dragRef = useRef(null);
  const [dragPreview, setDragPreview] = useState(null);

  const snapCell = useCallback((clientX, clientY, rect) => {
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
      col: Math.max(0, Math.min(cols - 1, Math.floor(x / cellPx))),
      row: Math.max(0, Math.min(rows - 1, Math.floor(y / cellPx))),
    };
  }, [cellPx, cols, rows]);

  const handlePointerDown = (e, el) => {
    if (mode !== 'design') return;
    e.preventDefault();
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    dragRef.current = {
      id: el.id,
      cols: el.cols,
      rows: el.rows,
      startCol: el.col,
      startRow: el.row,
      rect,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const { col, row } = snapCell(e.clientX, e.clientY, d.rect);
    if (col !== d.startCol || row !== d.startRow) d.moved = true;
    setDragPreview({ id: d.id, col, row, cols: d.cols, rows: d.rows });
  };

  const handlePointerUp = (e) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDragPreview(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (d.moved) {
      const { col, row } = snapCell(e.clientX, e.clientY, d.rect);
      onElementMove?.(d.id, col, row);
    } else {
      const el = elements.find((x) => x.id === d.id);
      if (el) onElementClick?.(el);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-700/80 bg-slate-900/90">
        <div>
          <div className="text-sm font-black text-white">{yard.name || 'Yard'}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {widthFt}×{lengthFt} ft · {cols}×{rows} grid · {cellSizeFt} ft/cell
            {(yard.city || yard.state) && (
              <span> · {[yard.city, yard.state].filter(Boolean).join(', ')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 mr-2">
            <Compass className="w-3.5 h-3.5 text-amber-400" /> N ↑
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-600"
            onClick={() => onZoomChange?.(Math.max(0.75, zoom - 0.25))}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-600"
            onClick={() => onZoomChange?.(Math.min(1.5, zoom + 0.25))}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend (live) */}
      {mode === 'live' && (
        <div className="flex flex-wrap gap-3 px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 text-[10px]">
          {Object.entries(YMS_PLACEMENT_STATUS).map(([key, s]) => (
            <span key={key} className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-slate-500 bg-slate-700" />
            Empty
          </span>
        </div>
      )}

      <div className="overflow-auto p-4 max-h-[min(70vh,720px)]">
        <div
          className="relative mx-auto ring-1 ring-slate-600/50"
          style={{
            width: canvasW,
            height: canvasH,
            backgroundImage: `
              linear-gradient(to right, rgba(51,65,85,0.6) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51,65,85,0.6) 1px, transparent 1px)
            `,
            backgroundSize: `${cellPx}px ${cellPx}px`,
            backgroundColor: '#1e293b',
          }}
        >
          {/* Scale bar */}
          <div className="absolute bottom-2 left-2 z-30 flex items-center gap-2 text-[9px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded">
            <div className="h-0.5 bg-amber-400" style={{ width: cellPx * 2 }} />
            <span>{cellSizeFt * 2} ft</span>
          </div>

          {mode === 'design' && (
            <div
              className="absolute inset-0 grid z-0"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
                gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
              }}
            >
              {Array.from({ length: cols * rows }).map((_, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                return (
                  <button
                    key={`cell-${col}-${row}`}
                    type="button"
                    className={`border-0 p-0 transition-colors ${paintTool ? 'hover:bg-amber-500/20 cursor-crosshair' : 'cursor-default'}`}
                    style={{ width: cellPx, height: cellPx }}
                    onClick={() => onCellClick?.(col, row)}
                    aria-label={`Cell ${col}, ${row}`}
                  />
                );
              })}
            </div>
          )}

          {dragPreview && (
            <div
              className="absolute rounded-lg border-2 border-dashed border-amber-400 bg-amber-400/20 z-20 pointer-events-none"
              style={{
                left: dragPreview.col * cellPx + 2,
                top: dragPreview.row * cellPx + 2,
                width: dragPreview.cols * cellPx - 4,
                height: dragPreview.rows * cellPx - 4,
              }}
            />
          )}

          {elements.map((el) => {
            const def = YMS_ELEMENT_TYPES[el.type] || YMS_ELEMENT_TYPES.parking;
            const placement = placements[el.id];
            const vehicle = placement?.vehicle_id ? vehiclesById[placement.vehicle_id] : null;
            const isSelected = selectedId === el.id;
            const isBuilding = isBuildingType(el.type);
            const isParking = isParkingType(el.type);
            const isDragging = dragPreview?.id === el.id;
            const style = liveElementStyle(el, def, placement, mode);
            const status = placementDisplayStatus(placement);
            const statusMeta = status ? YMS_PLACEMENT_STATUS[status] : null;

            return (
              <div
                key={el.id}
                role="button"
                tabIndex={0}
                className={`absolute flex flex-col items-center justify-center text-center rounded-lg border-2 text-[10px] font-bold leading-tight px-1 transition-shadow z-10 select-none ${
                  isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-800 z-20 shadow-lg' : 'shadow-md'
                } ${mode === 'design' ? 'cursor-grab active:cursor-grabbing' : ''} ${
                  mode === 'live' && def.assignable ? 'cursor-pointer hover:brightness-110' : ''
                } ${isDragging ? 'opacity-40' : ''}`}
                style={{
                  left: el.col * cellPx + 2,
                  top: el.row * cellPx + 2,
                  width: el.cols * cellPx - 4,
                  height: el.rows * cellPx - 4,
                  backgroundColor: style.bg,
                  borderColor: isSelected ? '#fbbf24' : style.border,
                  borderStyle: style.borderStyle,
                  color: '#fff',
                  backgroundImage: isBuilding && mode === 'design'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 75%, transparent 75%)'
                    : undefined,
                  backgroundSize: isBuilding ? '14px 14px' : undefined,
                }}
                onPointerDown={(e) => handlePointerDown(e, el)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={(e) => {
                  if (mode === 'live' && def.assignable) {
                    e.stopPropagation();
                    onElementClick?.(el);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onElementClick?.(el);
                }}
              >
                {isBuilding && mode === 'design' && (
                  <Building2 className="w-4 h-4 mb-0.5 opacity-90 flex-shrink-0" />
                )}
                <span className="truncate w-full px-0.5 drop-shadow-sm">{el.label || def.label}</span>
                {mode === 'design' && (isBuilding || isParking) && (
                  <span className="text-[8px] font-normal opacity-80">
                    {el.cols * cellSizeFt}×{el.rows * cellSizeFt} ft
                  </span>
                )}
                {mode === 'live' && vehicle && (
                  <>
                    <span className="text-[11px] font-black truncate w-full mt-0.5">{vehicle.unit_number}</span>
                    <span className="text-[8px] font-normal opacity-90 truncate w-full">
                      {formatDwellTime(placement.checked_in_at)}
                    </span>
                  </>
                )}
                {mode === 'live' && !vehicle && statusMeta && (
                  <span className="text-[9px] font-semibold mt-0.5" style={{ color: statusMeta.bg }}>
                    {statusMeta.label}
                  </span>
                )}
                {mode === 'live' && def.assignable && !vehicle && !status && (
                  <span className="text-[9px] font-normal opacity-60 mt-0.5">Available</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {mode === 'design' && (
        <div className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-700/50 bg-slate-900/50">
          Tip: drag elements to reposition · select a tool and click empty cells to add · arrow keys nudge selected item
        </div>
      )}
    </div>
  );
}

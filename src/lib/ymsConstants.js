import {
  Warehouse, DoorOpen, ParkingSquare, LogIn, LogOut, Building2,
  Fuel, Scale, Layers, ArrowDownToLine, ArrowUpFromLine, Minus,
  Home, Truck, Container,
} from 'lucide-react';

export const YMS_CELL_PX = 32;

export const YMS_PLACEMENT_STATUS = {
  occupied: { label: 'Occupied', color: '#15803d', bg: '#dcfce7', text: '#166534' },
  reserved: { label: 'Reserved', color: '#2563eb', bg: '#dbeafe', text: '#1e40af' },
  maintenance: { label: 'Maintenance', color: '#d97706', bg: '#fef3c7', text: '#92400e' },
  blocked: { label: 'Blocked', color: '#64748b', bg: '#f1f5f9', text: '#475569' },
};

export const YMS_ELEMENT_TYPES = {
  building: {
    label: 'Building',
    icon: Building2,
    color: '#78716c',
    defaultCols: 4,
    defaultRows: 3,
    assignable: false,
    category: 'buildings',
    description: 'Office, terminal, or main structure',
  },
  building_warehouse: {
    label: 'Warehouse',
    icon: Warehouse,
    color: '#57534e',
    defaultCols: 6,
    defaultRows: 4,
    assignable: false,
    category: 'buildings',
    description: 'Large storage or cross-dock building',
  },
  building_shop: {
    label: 'Shop / Bay',
    icon: Home,
    color: '#64748b',
    defaultCols: 4,
    defaultRows: 2,
    assignable: false,
    category: 'buildings',
    description: 'Maintenance shop or service bays',
  },
  office: {
    label: 'Office',
    icon: Building2,
    color: '#64748b',
    defaultCols: 3,
    defaultRows: 2,
    assignable: false,
    category: 'buildings',
    description: 'Dispatch office or driver lounge',
  },
  parking: {
    label: 'Parking Spot',
    icon: ParkingSquare,
    color: '#22c55e',
    defaultCols: 2,
    defaultRows: 2,
    assignable: true,
    category: 'parking',
    vehicleTypes: ['truck', 'trailer', 'other'],
    description: 'Standard truck or trailer spot',
  },
  parking_trailer: {
    label: 'Trailer Spot',
    icon: Container,
    color: '#16a34a',
    defaultCols: 2,
    defaultRows: 3,
    assignable: true,
    category: 'parking',
    vehicleTypes: ['trailer'],
    description: 'Dedicated trailer parking slot',
  },
  parking_tractor: {
    label: 'Tractor Spot',
    icon: Truck,
    color: '#15803d',
    defaultCols: 2,
    defaultRows: 1,
    assignable: true,
    category: 'parking',
    vehicleTypes: ['tractor', 'truck'],
    description: 'Power unit / bobtail parking',
  },
  parking_row: {
    label: 'Parking Row',
    icon: ParkingSquare,
    color: '#4ade80',
    defaultCols: 6,
    defaultRows: 2,
    assignable: true,
    category: 'parking',
    vehicleTypes: ['truck', 'trailer', 'tractor'],
    description: 'Row of multiple spots (label e.g. Row A)',
  },
  dock: {
    label: 'Dock Door',
    icon: DoorOpen,
    color: '#3b82f6',
    defaultCols: 2,
    defaultRows: 1,
    assignable: true,
    category: 'traffic',
    vehicleTypes: ['truck', 'trailer'],
    description: 'Loading dock door',
  },
  gate_in: {
    label: 'Gate In',
    icon: LogIn,
    color: '#14b8a6',
    defaultCols: 1,
    defaultRows: 1,
    assignable: false,
    category: 'traffic',
  },
  gate_out: {
    label: 'Gate Out',
    icon: LogOut,
    color: '#f97316',
    defaultCols: 1,
    defaultRows: 1,
    assignable: false,
    category: 'traffic',
  },
  fuel: {
    label: 'Fuel Island',
    icon: Fuel,
    color: '#eab308',
    defaultCols: 2,
    defaultRows: 1,
    assignable: false,
    category: 'operations',
  },
  scale: {
    label: 'Scale',
    icon: Scale,
    color: '#8b5cf6',
    defaultCols: 2,
    defaultRows: 1,
    assignable: false,
    category: 'operations',
  },
  storage: {
    label: 'Storage Lane',
    icon: Layers,
    color: '#6366f1',
    defaultCols: 4,
    defaultRows: 1,
    assignable: true,
    category: 'operations',
    vehicleTypes: ['trailer', 'truck'],
    description: 'Long-term storage lane',
  },
  inbound: {
    label: 'Inbound Queue',
    icon: ArrowDownToLine,
    color: '#0ea5e9',
    defaultCols: 3,
    defaultRows: 1,
    assignable: true,
    category: 'operations',
    vehicleTypes: ['truck', 'trailer', 'tractor'],
  },
  outbound: {
    label: 'Outbound Queue',
    icon: ArrowUpFromLine,
    color: '#ec4899',
    defaultCols: 3,
    defaultRows: 1,
    assignable: true,
    category: 'operations',
    vehicleTypes: ['truck', 'trailer', 'tractor'],
  },
  wall: {
    label: 'Wall / Fence',
    icon: Minus,
    color: '#475569',
    defaultCols: 1,
    defaultRows: 1,
    assignable: false,
    category: 'operations',
  },
};

export const YMS_PALETTE_GROUPS = [
  {
    id: 'buildings',
    label: 'Buildings',
    hint: 'Place structures first — drag to reposition',
    tools: ['building', 'building_warehouse', 'building_shop', 'office'],
  },
  {
    id: 'parking',
    label: 'Parking Spots',
    hint: 'Assign units in Live mode',
    tools: ['parking', 'parking_trailer', 'parking_tractor', 'parking_row'],
  },
  {
    id: 'traffic',
    label: 'Docks & Gates',
    tools: ['dock', 'gate_in', 'gate_out'],
  },
  {
    id: 'operations',
    label: 'Operations',
    tools: ['fuel', 'scale', 'storage', 'inbound', 'outbound', 'wall'],
  },
];

export function isBuildingType(type) {
  return YMS_ELEMENT_TYPES[type]?.category === 'buildings';
}

export function isParkingType(type) {
  return YMS_ELEMENT_TYPES[type]?.category === 'parking';
}

export function isAssignableType(type) {
  return !!YMS_ELEMENT_TYPES[type]?.assignable;
}

export function inferVehicleCategory(vehicle) {
  const hay = `${vehicle?.unit_number || ''} ${vehicle?.vehicle_type || ''} ${vehicle?.make || ''} ${vehicle?.model || ''}`.toLowerCase();
  if (hay.includes('trail')) return 'trailer';
  if (hay.includes('tractor') || hay.includes('bobtail') || hay.includes('power')) return 'tractor';
  return 'truck';
}

export function vehicleMatchesSpot(vehicle, elementType) {
  const def = YMS_ELEMENT_TYPES[elementType];
  if (!def?.vehicleTypes) return true;
  const cat = inferVehicleCategory(vehicle);
  return def.vehicleTypes.includes(cat);
}

export function yardGridDimensions(yard) {
  const cell = Number(yard?.cell_size_ft) || 25;
  const width = Math.max(50, Number(yard?.width_ft) || 400);
  const length = Math.max(50, Number(yard?.length_ft) || 300);
  return {
    cols: Math.max(4, Math.ceil(width / cell)),
    rows: Math.max(4, Math.ceil(length / cell)),
    cellSizeFt: cell,
    widthFt: width,
    lengthFt: length,
  };
}

export function newYardElement(type, col, row, id) {
  const def = YMS_ELEMENT_TYPES[type] || YMS_ELEMENT_TYPES.parking;
  return {
    id: id || `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    label: def.label,
    col,
    row,
    cols: def.defaultCols,
    rows: def.defaultRows,
    color: def.color,
  };
}

export function elementFitsGrid(el, cols, rows) {
  return el.col >= 0 && el.row >= 0 && el.col + el.cols <= cols && el.row + el.rows <= rows;
}

export function cellsOccupied(elements, ignoreId) {
  const set = new Set();
  elements.forEach((el) => {
    if (el.id === ignoreId) return;
    for (let r = el.row; r < el.row + el.rows; r += 1) {
      for (let c = el.col; c < el.col + el.cols; c += 1) {
        set.add(`${c},${r}`);
      }
    }
  });
  return set;
}

export function canPlaceElement(el, elements, gridCols, gridRows, ignoreId) {
  if (!elementFitsGrid(el, gridCols, gridRows)) return false;
  const occupied = cellsOccupied(elements, ignoreId);
  for (let r = el.row; r < el.row + el.rows; r += 1) {
    for (let c = el.col; c < el.col + el.cols; c += 1) {
      if (occupied.has(`${c},${r}`)) return false;
    }
  }
  return true;
}

export function elementSizeFt(el, cellSizeFt = 25) {
  return {
    widthFt: el.cols * cellSizeFt,
    lengthFt: el.rows * cellSizeFt,
  };
}

export function clampElementsToGrid(elements, gridCols, gridRows) {
  return elements.filter((el) => elementFitsGrid(el, gridCols, gridRows));
}

export function formatDwellTime(isoStart) {
  if (!isoStart) return '—';
  const ms = Date.now() - new Date(isoStart).getTime();
  if (ms < 0) return '—';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

export function computeYardStats(elements, placementsByElement) {
  const assignable = elements.filter((e) => isAssignableType(e.type));
  const filled = assignable.filter((e) => {
    const p = placementsByElement[e.id];
    return p && (p.vehicle_id || p.status === 'reserved' || p.status === 'maintenance' || p.status === 'blocked');
  });
  const occupied = assignable.filter((e) => placementsByElement[e.id]?.vehicle_id);
  const reserved = assignable.filter((e) => placementsByElement[e.id]?.status === 'reserved');
  const byType = {};
  assignable.forEach((e) => {
    const cat = YMS_ELEMENT_TYPES[e.type]?.category || 'other';
    byType[cat] = byType[cat] || { total: 0, filled: 0 };
    byType[cat].total += 1;
    if (placementsByElement[e.id]?.vehicle_id) byType[cat].filled += 1;
  });
  const pct = assignable.length ? Math.round((occupied.length / assignable.length) * 100) : 0;
  return {
    assignableTotal: assignable.length,
    filledCount: filled.length,
    occupiedCount: occupied.length,
    reservedCount: reserved.length,
    emptyCount: assignable.length - filled.length,
    utilizationPct: pct,
    byType,
    dockTotal: assignable.filter((e) => e.type === 'dock').length,
    dockFilled: assignable.filter((e) => e.type === 'dock' && placementsByElement[e.id]?.vehicle_id).length,
  };
}

export function placementDisplayStatus(placement) {
  if (!placement) return null;
  if (placement.status && placement.status !== 'occupied') return placement.status;
  if (placement.vehicle_id) return 'occupied';
  return null;
}

export function liveElementStyle(el, def, placement, mode) {
  const status = placementDisplayStatus(placement);
  if (mode !== 'live' || !def.assignable) {
    return {
      bg: el.color || def.color,
      border: isBuildingType(el.type) ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.35)',
      borderStyle: 'solid',
    };
  }
  if (status && YMS_PLACEMENT_STATUS[status]) {
    const s = YMS_PLACEMENT_STATUS[status];
    return { bg: s.color, border: s.color, borderStyle: 'solid' };
  }
  return {
    bg: 'rgba(30, 41, 59, 0.85)',
    border: 'rgba(148, 163, 184, 0.5)',
    borderStyle: 'dashed',
  };
}

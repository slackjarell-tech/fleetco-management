import {
  Warehouse, DoorOpen, ParkingSquare, LogIn, LogOut, Building2,
  Fuel, Scale, Layers, ArrowDownToLine, ArrowUpFromLine, Minus,
  Home, Truck, Container,
} from 'lucide-react';

export const YMS_CELL_PX = 28;

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
  },
  inbound: {
    label: 'Inbound Queue',
    icon: ArrowDownToLine,
    color: '#0ea5e9',
    defaultCols: 3,
    defaultRows: 1,
    assignable: true,
    category: 'operations',
  },
  outbound: {
    label: 'Outbound Queue',
    icon: ArrowUpFromLine,
    color: '#ec4899',
    defaultCols: 3,
    defaultRows: 1,
    assignable: true,
    category: 'operations',
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
    hint: 'Place structures first — resize after placing',
    tools: ['building', 'building_warehouse', 'building_shop', 'office'],
  },
  {
    id: 'parking',
    label: 'Parking Spots',
    hint: 'Assign trucks & trailers in Live mode',
    tools: ['parking', 'parking_trailer', 'parking_tractor', 'parking_row'],
  },
  {
    id: 'traffic',
    label: 'Docks & Gates',
    tools: ['dock', 'gate_in', 'gate_out'],
  },
  {
    id: 'operations',
    label: 'Other',
    tools: ['fuel', 'scale', 'storage', 'inbound', 'outbound', 'wall'],
  },
];

export function isBuildingType(type) {
  return YMS_ELEMENT_TYPES[type]?.category === 'buildings';
}

export function isParkingType(type) {
  return YMS_ELEMENT_TYPES[type]?.category === 'parking';
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

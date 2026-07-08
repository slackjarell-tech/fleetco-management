import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/apiClient';
import {
  Plus, Warehouse, Pencil, Eye, Save, Trash2, Copy, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import YardCanvas from '@/components/yms/YardCanvas';
import {
  YMS_ELEMENT_TYPES,
  YMS_PALETTE_GROUPS,
  yardGridDimensions,
  newYardElement,
  canPlaceElement,
  elementSizeFt,
  isBuildingType,
  isParkingType,
} from '@/lib/ymsConstants';
import { filterByCustomerId, filterVehiclesForUser } from '@/lib/roles';

function placementsMap(list) {
  const map = {};
  list.forEach((p) => { map[p.element_id] = p; });
  return map;
}

export default function YardManagement() {
  const [user, setUser] = useState(null);
  const [yards, setYards] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeYardId, setActiveYardId] = useState(null);
  const [mode, setMode] = useState('design');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draftElements, setDraftElements] = useState([]);
  const [selectedTool, setSelectedTool] = useState('building');
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [assignElementId, setAssignElementId] = useState(null);

  const [showNewYard, setShowNewYard] = useState(false);
  const [newYardForm, setNewYardForm] = useState({
    name: 'Main Yard',
    width_ft: 400,
    length_ft: 300,
    cell_size_ft: 25,
    address: '',
    city: '',
    state: '',
  });

  const activeYard = yards.find((y) => y.id === activeYardId) || null;
  const yardPlacements = placements.filter((p) => p.yard_id === activeYardId);
  const placementByElement = useMemo(() => placementsMap(yardPlacements), [yardPlacements]);
  const vehiclesById = useMemo(() => {
    const m = {};
    vehicles.forEach((v) => { m[v.id] = v; });
    return m;
  }, [vehicles]);

  const elements = mode === 'design' ? draftElements : (activeYard?.elements || []);
  const selectedElement = elements.find((e) => e.id === selectedElementId);

  const loadAll = async (u) => {
    setLoading(true);
    const [yardsRaw, plRaw, vehRaw] = await Promise.all([
      api.entities.Yard.list('-updated_date'),
      api.entities.YardPlacement.list('-checked_in_at', 500),
      api.entities.Vehicle.list(),
    ]);
    const scopedYards = filterByCustomerId(yardsRaw, u);
    const scopedPlacements = filterByCustomerId(plRaw, u);
    setYards(scopedYards);
    setPlacements(scopedPlacements);
    setVehicles(filterVehiclesForUser(vehRaw, u));
    if (!activeYardId && scopedYards[0]) setActiveYardId(scopedYards[0].id);
    setLoading(false);
  };

  useEffect(() => {
    api.auth.me().then((u) => {
      setUser(u);
      loadAll(u);
    });
  }, []);

  useEffect(() => {
    if (activeYard) {
      setDraftElements(activeYard.elements || []);
      setSelectedElementId(null);
      setAssignElementId(null);
    }
  }, [activeYardId, activeYard?.updated_date]);

  const handleCreateYard = async () => {
    setSaving(true);
    try {
      const payload = {
        ...newYardForm,
        width_ft: Number(newYardForm.width_ft),
        length_ft: Number(newYardForm.length_ft),
        cell_size_ft: Number(newYardForm.cell_size_ft) || 25,
        elements: [],
        customer_id: user?.customer_id || undefined,
      };
      const created = await api.entities.Yard.create(payload);
      setYards((prev) => [created, ...prev]);
      setActiveYardId(created.id);
      setShowNewYard(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLayout = async () => {
    if (!activeYard) return;
    setSaving(true);
    try {
      const updated = await api.entities.Yard.update(activeYard.id, {
        elements: draftElements,
        width_ft: activeYard.width_ft,
        length_ft: activeYard.length_ft,
        cell_size_ft: activeYard.cell_size_ft,
      });
      setYards((prev) => prev.map((y) => (y.id === updated.id ? updated : y)));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDimensions = async (field, value) => {
    if (!activeYard) return;
    const num = Number(value);
    if (!Number.isFinite(num) || num < 50) return;
    const patch = { [field]: num };
    const updated = await api.entities.Yard.update(activeYard.id, patch);
    setYards((prev) => prev.map((y) => (y.id === updated.id ? updated : y)));
  };

  const handleCellClick = (col, row) => {
    if (mode !== 'design' || !activeYard) return;
    const { cols, rows } = yardGridDimensions(activeYard);
    const el = newYardElement(selectedTool, col, row);
    if (!canPlaceElement(el, draftElements, cols, rows)) return;
    setDraftElements((prev) => [...prev, el]);
    setSelectedElementId(el.id);
  };

  const handleDeleteElement = () => {
    if (!selectedElementId) return;
    setDraftElements((prev) => prev.filter((e) => e.id !== selectedElementId));
    setSelectedElementId(null);
  };

  const handleDuplicateElement = () => {
    if (!selectedElement || !activeYard) return;
    const { cols, rows } = yardGridDimensions(activeYard);
    const copy = {
      ...selectedElement,
      id: `el-${Date.now()}`,
      col: Math.min(selectedElement.col + 1, cols - selectedElement.cols),
      row: Math.min(selectedElement.row + 1, rows - selectedElement.rows),
      label: `${selectedElement.label} (copy)`,
    };
    if (!canPlaceElement(copy, draftElements, cols, rows)) return;
    setDraftElements((prev) => [...prev, copy]);
    setSelectedElementId(copy.id);
  };

  const updateSelectedElement = (patch) => {
    if (!selectedElementId || !activeYard) return;
    setDraftElements((prev) => {
      const { cols, rows } = yardGridDimensions(activeYard);
      return prev.map((el) => {
        if (el.id !== selectedElementId) return el;
        const next = { ...el, ...patch };
        if (patch.cols != null) next.cols = Math.max(1, Number(patch.cols) || 1);
        if (patch.rows != null) next.rows = Math.max(1, Number(patch.rows) || 1);
        if (!canPlaceElement(next, prev, cols, rows, selectedElementId)) return el;
        return next;
      });
    });
  };

  const handleAssignVehicle = async (elementId, vehicleId) => {
    if (!activeYard) return;
    const existing = yardPlacements.find((p) => p.element_id === elementId);
    if (!vehicleId) {
      if (existing) {
        await api.entities.YardPlacement.delete(existing.id);
        setPlacements((prev) => prev.filter((p) => p.id !== existing.id));
      }
      setAssignElementId(null);
      return;
    }
    const payload = {
      yard_id: activeYard.id,
      element_id: elementId,
      vehicle_id: vehicleId,
      status: 'occupied',
      checked_in_at: new Date().toISOString(),
      customer_id: user?.customer_id || activeYard.customer_id,
    };
    if (existing) {
      const updated = await api.entities.YardPlacement.update(existing.id, payload);
      setPlacements((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const created = await api.entities.YardPlacement.create(payload);
      setPlacements((prev) => [...prev, created]);
    }
    setAssignElementId(null);
  };

  const assignedVehicleIds = new Set(yardPlacements.map((p) => p.vehicle_id).filter(Boolean));
  const availableVehicles = vehicles.filter((v) => !assignedVehicleIds.has(v.id) || placementByElement[assignElementId]?.vehicle_id === v.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Warehouse className="w-7 h-7 text-amber-500" /> Yard Management (YMS)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Design your yard — place buildings and parking spots, set custom sizes, then track units live.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNewYard(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Yard
          </Button>
          {activeYard && mode === 'design' && (
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={handleSaveLayout} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Layout
            </Button>
          )}
        </div>
      </div>

      {yards.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
          <Warehouse className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Create your first yard</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Set your yard dimensions, add buildings and parking spots on the grid, and resize each piece to match your real layout.
          </p>
          <Button className="mt-6 bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={() => setShowNewYard(true)}>
            <Plus className="w-4 h-4 mr-1" /> Build Yard
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-4">
          <aside className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Your Yards</div>
              <div className="space-y-1">
                {yards.map((y) => (
                  <button
                    key={y.id}
                    type="button"
                    onClick={() => setActiveYardId(y.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      y.id === activeYardId ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {y.name}
                    <div className="text-[10px] text-slate-400 font-normal">{y.width_ft}×{y.length_ft} ft</div>
                  </button>
                ))}
              </div>
            </div>

            {activeYard && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-3 flex gap-1">
                  <Button size="sm" variant={mode === 'design' ? 'default' : 'outline'} className="flex-1 text-xs" onClick={() => setMode('design')}>
                    <Pencil className="w-3 h-3 mr-1" /> Design
                  </Button>
                  <Button size="sm" variant={mode === 'live' ? 'default' : 'outline'} className="flex-1 text-xs" onClick={() => setMode('live')}>
                    <Eye className="w-3 h-3 mr-1" /> Live
                  </Button>
                </div>

                {mode === 'design' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Yard Size (ft)</div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <label className="text-[10px] text-slate-500">Width
                        <Input type="number" min={50} className="h-8 text-xs mt-0.5" value={activeYard.width_ft}
                          onChange={(e) => handleUpdateDimensions('width_ft', e.target.value)} />
                      </label>
                      <label className="text-[10px] text-slate-500">Length
                        <Input type="number" min={50} className="h-8 text-xs mt-0.5" value={activeYard.length_ft}
                          onChange={(e) => handleUpdateDimensions('length_ft', e.target.value)} />
                      </label>
                    </div>
                    <label className="text-[10px] text-slate-500 block">Cell size (ft)
                      <Input type="number" min={10} max={50} className="h-8 text-xs mt-0.5" value={activeYard.cell_size_ft || 25}
                        onChange={(e) => handleUpdateDimensions('cell_size_ft', e.target.value)} />
                    </label>

                    <div className="text-xs font-black text-slate-400 uppercase tracking-wider mt-4 mb-2">Add to layout</div>
                    {YMS_PALETTE_GROUPS.map((group) => (
                      <div key={group.id} className="mb-3">
                        <div className="text-[10px] font-bold text-slate-600 mb-1">{group.label}</div>
                        {group.hint && (
                          <p className="text-[9px] text-slate-400 mb-1.5">{group.hint}</p>
                        )}
                        <div className="grid grid-cols-2 gap-1">
                          {group.tools.map((key) => {
                            const def = YMS_ELEMENT_TYPES[key];
                            if (!def) return null;
                            const Icon = def.icon;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedTool(key)}
                                title={def.description || def.label}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                                  selectedTool === key ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <Icon className="w-3 h-3 flex-shrink-0" style={{ color: def.color }} />
                                <span className="truncate">{def.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-400 mt-1">
                      Select a tool, then click the grid. Buildings and parking can be resized after placing.
                    </p>

                    {selectedElement && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        <div className="text-xs font-bold text-slate-700">
                          Selected {isBuildingType(selectedElement.type) ? 'Building' : isParkingType(selectedElement.type) ? 'Parking' : 'Item'}
                        </div>
                        <Input
                          className="h-8 text-xs"
                          value={selectedElement.label}
                          onChange={(e) => updateSelectedElement({ label: e.target.value })}
                        />
                        {(isBuildingType(selectedElement.type) || isParkingType(selectedElement.type)) && activeYard && (
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-[10px] text-slate-500">Width (cells)
                              <Input
                                type="number"
                                min={1}
                                className="h-8 text-xs mt-0.5"
                                value={selectedElement.cols}
                                onChange={(e) => updateSelectedElement({ cols: e.target.value })}
                              />
                            </label>
                            <label className="text-[10px] text-slate-500">Depth (cells)
                              <Input
                                type="number"
                                min={1}
                                className="h-8 text-xs mt-0.5"
                                value={selectedElement.rows}
                                onChange={(e) => updateSelectedElement({ rows: e.target.value })}
                              />
                            </label>
                          </div>
                        )}
                        {selectedElement && activeYard && (isBuildingType(selectedElement.type) || isParkingType(selectedElement.type)) && (
                          <p className="text-[10px] text-slate-400">
                            ≈ {elementSizeFt(selectedElement, activeYard.cell_size_ft || 25).widthFt}×
                            {elementSizeFt(selectedElement, activeYard.cell_size_ft || 25).lengthFt} ft on the ground
                          </p>
                        )}
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={handleDuplicateElement}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-red-600" onClick={handleDeleteElement}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mode === 'live' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800">Live yard</div>
                    <p>Click a parking spot or dock to assign a unit. Green = occupied.</p>
                    <div className="text-slate-500">
                      {yardPlacements.filter((p) => p.vehicle_id).length} / {elements.filter((e) => YMS_ELEMENT_TYPES[e.type]?.assignable).length} spots filled
                    </div>
                  </div>
                )}
              </>
            )}
          </aside>

          <div className="min-w-0">
            {activeYard && (
              <YardCanvas
                yard={activeYard}
                elements={elements}
                placements={placementByElement}
                vehiclesById={vehiclesById}
                selectedId={selectedElementId}
                paintTool={mode === 'design' ? selectedTool : null}
                mode={mode}
                onCellClick={handleCellClick}
                onElementClick={(el) => {
                  if (mode === 'design') {
                    setSelectedElementId(el.id);
                  } else if (YMS_ELEMENT_TYPES[el.type]?.assignable) {
                    setAssignElementId(el.id);
                  }
                }}
              />
            )}

            {assignElementId && mode === 'live' && (
              <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-bold text-slate-800 mb-2">Assign unit to spot</div>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={placementByElement[assignElementId]?.vehicle_id || ''}
                  onChange={(e) => handleAssignVehicle(assignElementId, e.target.value || null)}
                >
                  <option value="">— Empty spot —</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.unit_number} · {v.make} {v.model}</option>
                  ))}
                </select>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => setAssignElementId(null)}>Close</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {showNewYard && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">New Yard</h2>
            <label className="block text-xs font-medium text-slate-600">Yard name
              <Input className="mt-1" value={newYardForm.name} onChange={(e) => setNewYardForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-slate-600">Width (ft)
                <Input type="number" min={50} className="mt-1" value={newYardForm.width_ft}
                  onChange={(e) => setNewYardForm((f) => ({ ...f, width_ft: e.target.value }))} />
              </label>
              <label className="block text-xs font-medium text-slate-600">Length (ft)
                <Input type="number" min={50} className="mt-1" value={newYardForm.length_ft}
                  onChange={(e) => setNewYardForm((f) => ({ ...f, length_ft: e.target.value }))} />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-600">Grid cell size (ft)
              <Input type="number" min={10} max={50} className="mt-1" value={newYardForm.cell_size_ft}
                onChange={(e) => setNewYardForm((f) => ({ ...f, cell_size_ft: e.target.value }))} />
            </label>
            <p className="text-xs text-slate-400">Example: 400×300 ft with 25 ft cells = 16×12 grid. Adjust anytime in Design mode.</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewYard(false)}>Cancel</Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900" onClick={handleCreateYard} disabled={saving}>
                Create Yard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

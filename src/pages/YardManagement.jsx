import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/api/apiClient';
import {
  Plus, Warehouse, Pencil, Eye, Save, Trash2, Copy, Loader2,
  Settings, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import YardCanvas from '@/components/yms/YardCanvas';
import YardStatsBar from '@/components/yms/YardStatsBar';
import YardAssignPanel from '@/components/yms/YardAssignPanel';
import YardActivityFeed from '@/components/yms/YardActivityFeed';
import {
  YMS_ELEMENT_TYPES,
  YMS_PALETTE_GROUPS,
  yardGridDimensions,
  newYardElement,
  canPlaceElement,
  elementSizeFt,
  isBuildingType,
  isParkingType,
  isAssignableType,
  computeYardStats,
  clampElementsToGrid,
  formatDwellTime,
} from '@/lib/ymsConstants';
import { filterByCustomerId, filterVehiclesForUser } from '@/lib/roles';

function placementsMap(list) {
  const map = {};
  list.forEach((p) => { map[p.element_id] = p; });
  return map;
}

function logEvent(setter, event) {
  setter((prev) => [{ id: `${Date.now()}-${Math.random()}`, ...event }, ...prev].slice(0, 50));
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
  const [zoom, setZoom] = useState(1);
  const [activity, setActivity] = useState([]);
  const [dirtyLayout, setDirtyLayout] = useState(false);

  const [draftElements, setDraftElements] = useState([]);
  const [selectedTool, setSelectedTool] = useState('building');
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [assignElementId, setAssignElementId] = useState(null);

  const [showNewYard, setShowNewYard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newYardForm, setNewYardForm] = useState({
    name: 'Main Yard',
    width_ft: 400,
    length_ft: 300,
    cell_size_ft: 25,
    address: '',
    city: '',
    state: '',
  });
  const [yardSettings, setYardSettings] = useState({ name: '', address: '', city: '', state: '' });

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
  const assignElement = elements.find((e) => e.id === assignElementId);
  const stats = useMemo(
    () => computeYardStats(activeYard?.elements || [], placementByElement),
    [activeYard?.elements, placementByElement],
  );

  const loadAll = useCallback(async (u, yardIdKeep) => {
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
    setActiveYardId((prev) => yardIdKeep || prev || scopedYards[0]?.id || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    api.auth.me().then((u) => {
      setUser(u);
      loadAll(u);
    });
  }, [loadAll]);

  useEffect(() => {
    if (!activeYard) return;
    setDraftElements(activeYard.elements || []);
    setSelectedElementId(null);
    setAssignElementId(null);
    setDirtyLayout(false);
    setYardSettings({
      name: activeYard.name || '',
      address: activeYard.address || '',
      city: activeYard.city || '',
      state: activeYard.state || '',
    });
  }, [activeYardId, activeYard?.updated_date]);

  useEffect(() => {
    if (mode !== 'live') return undefined;
    const t = setInterval(() => {
      if (user) loadAll(user, activeYardId);
    }, 30000);
    return () => clearInterval(t);
  }, [mode, user, activeYardId, loadAll]);

  useEffect(() => {
    const onKey = (e) => {
      if (mode !== 'design' || !selectedElementId || !activeYard) return;
      const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      const delta = map[e.key];
      if (!delta) return;
      e.preventDefault();
      const el = draftElements.find((x) => x.id === selectedElementId);
      if (!el) return;
      handleElementMove(selectedElementId, el.col + delta[0], el.row + delta[1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
      const { cols, rows } = yardGridDimensions(activeYard);
      const cleaned = clampElementsToGrid(draftElements, cols, rows);
      const validIds = new Set(cleaned.map((e) => e.id));
      const updated = await api.entities.Yard.update(activeYard.id, {
        elements: cleaned,
        width_ft: activeYard.width_ft,
        length_ft: activeYard.length_ft,
        cell_size_ft: activeYard.cell_size_ft,
      });
      setYards((prev) => prev.map((y) => (y.id === updated.id ? updated : y)));
      setDraftElements(cleaned);
      setDirtyLayout(false);

      const orphans = yardPlacements.filter((p) => !validIds.has(p.element_id));
      await Promise.all(orphans.map((p) => api.entities.YardPlacement.delete(p.id)));
      if (orphans.length) {
        setPlacements((prev) => prev.filter((p) => !orphans.some((o) => o.id === p.id)));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!activeYard) return;
    setSaving(true);
    try {
      const updated = await api.entities.Yard.update(activeYard.id, yardSettings);
      setYards((prev) => prev.map((y) => (y.id === updated.id ? updated : y)));
      setShowSettings(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteYard = async () => {
    if (!activeYard || !confirm(`Delete "${activeYard.name}" and all spot assignments?`)) return;
    setSaving(true);
    try {
      const toDelete = yardPlacements.map((p) => api.entities.YardPlacement.delete(p.id));
      await Promise.all(toDelete);
      await api.entities.Yard.delete(activeYard.id);
      const nextYards = yards.filter((y) => y.id !== activeYard.id);
      setYards(nextYards);
      setPlacements((prev) => prev.filter((p) => p.yard_id !== activeYard.id));
      setActiveYardId(nextYards[0]?.id || null);
      setShowSettings(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDimensions = async (field, value) => {
    if (!activeYard) return;
    const num = Number(value);
    if (!Number.isFinite(num) || num < 50) return;
    const { cols, rows } = yardGridDimensions({ ...activeYard, [field]: num });
    const clamped = clampElementsToGrid(draftElements, cols, rows);
    setDraftElements(clamped);
    setDirtyLayout(true);
    const updated = await api.entities.Yard.update(activeYard.id, {
      [field]: num,
      elements: mode === 'design' ? clamped : activeYard.elements,
    });
    setYards((prev) => prev.map((y) => (y.id === updated.id ? updated : y)));
  };

  const handleCellClick = (col, row) => {
    if (mode !== 'design' || !activeYard) return;
    const { cols, rows } = yardGridDimensions(activeYard);
    const el = newYardElement(selectedTool, col, row);
    if (!canPlaceElement(el, draftElements, cols, rows)) return;
    setDraftElements((prev) => [...prev, el]);
    setSelectedElementId(el.id);
    setDirtyLayout(true);
  };

  const handleElementMove = (elementId, col, row) => {
    if (!activeYard) return;
    setDraftElements((prev) => {
      const { cols, rows } = yardGridDimensions(activeYard);
      return prev.map((el) => {
        if (el.id !== elementId) return el;
        const next = { ...el, col, row };
        if (!canPlaceElement(next, prev, cols, rows, elementId)) return el;
        return next;
      });
    });
    setSelectedElementId(elementId);
    setDirtyLayout(true);
  };

  const handleDeleteElement = () => {
    if (!selectedElementId) return;
    setDraftElements((prev) => prev.filter((e) => e.id !== selectedElementId));
    setSelectedElementId(null);
    setDirtyLayout(true);
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
    setDirtyLayout(true);
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
    setDirtyLayout(true);
  };

  const handleAssignVehicle = async (elementId, vehicleId) => {
    if (!activeYard) return;
    const existing = yardPlacements.find((p) => p.element_id === elementId);
    const spotLabel = elements.find((e) => e.id === elementId)?.label || 'spot';

    if (!vehicleId) {
      if (existing?.vehicle_id) {
        const unit = vehiclesById[existing.vehicle_id]?.unit_number || 'Unit';
        logEvent(setActivity, {
          type: 'check_out',
          unit,
          spot: spotLabel,
          at: new Date().toISOString(),
          dwell: formatDwellTime(existing.checked_in_at),
        });
      }
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
      notes: existing?.notes || '',
    };
    let saved;
    if (existing) {
      saved = await api.entities.YardPlacement.update(existing.id, payload);
      setPlacements((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    } else {
      saved = await api.entities.YardPlacement.create(payload);
      setPlacements((prev) => [...prev, saved]);
    }
    const unit = vehiclesById[vehicleId]?.unit_number || 'Unit';
    logEvent(setActivity, {
      type: existing?.vehicle_id ? 'move' : 'check_in',
      unit,
      spot: spotLabel,
      at: new Date().toISOString(),
    });
    setAssignElementId(null);
  };

  const handleSetStatus = async (elementId, statusKey) => {
    if (!activeYard) return;
    const existing = yardPlacements.find((p) => p.element_id === elementId);
    if (statusKey === 'clear') {
      if (existing) {
        await api.entities.YardPlacement.delete(existing.id);
        setPlacements((prev) => prev.filter((p) => p.id !== existing.id));
      }
      return;
    }
    const payload = {
      yard_id: activeYard.id,
      element_id: elementId,
      vehicle_id: '',
      status: statusKey,
      checked_in_at: new Date().toISOString(),
      customer_id: user?.customer_id || activeYard.customer_id,
      notes: existing?.notes || '',
    };
    if (existing) {
      const updated = await api.entities.YardPlacement.update(existing.id, payload);
      setPlacements((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const created = await api.entities.YardPlacement.create(payload);
      setPlacements((prev) => [...prev, created]);
    }
  };

  const handleUpdateNotes = async (elementId, notes) => {
    const existing = yardPlacements.find((p) => p.element_id === elementId);
    if (!existing) return;
    const updated = await api.entities.YardPlacement.update(existing.id, { ...existing, notes });
    setPlacements((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const assignedVehicleIds = new Set(yardPlacements.map((p) => p.vehicle_id).filter(Boolean));
  const availableVehicles = vehicles.filter(
    (v) => !assignedVehicleIds.has(v.id) || placementByElement[assignElementId]?.vehicle_id === v.id,
  );

  const switchYard = (id) => {
    if (dirtyLayout && !confirm('You have unsaved layout changes. Switch yards anyway?')) return;
    setActiveYardId(id);
  };

  const switchMode = (next) => {
    if (next === 'live' && dirtyLayout && !confirm('Save layout before switching to Live mode? Unsaved changes may be lost.')) return;
    setMode(next);
    setAssignElementId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-[1680px] mx-auto space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Warehouse className="w-7 h-7 text-amber-400" /> Yard Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Design terminal layouts, track spot occupancy, and manage check-ins in real time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === 'live' && (
            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => loadAll(user, activeYardId)}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          )}
          {activeYard && (
            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-1" /> Settings
            </Button>
          )}
          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => setShowNewYard(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Yard
          </Button>
          {activeYard && mode === 'design' && (
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold" onClick={handleSaveLayout} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Layout
            </Button>
          )}
        </div>
      </div>

      {activeYard && mode === 'live' && <YardStatsBar stats={stats} />}

      {yards.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
          <Warehouse className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <h2 className="text-lg font-bold text-white">Create your first yard</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Model your terminal in feet, place docks and parking rows, then go live to track every unit on site.
          </p>
          <Button className="mt-6 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold" onClick={() => setShowNewYard(true)}>
            <Plus className="w-4 h-4 mr-1" /> Build Yard
          </Button>
        </div>
      ) : (
        <div className="grid xl:grid-cols-[280px_1fr_320px] gap-4">
          <aside className="space-y-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Terminals</div>
              <div className="space-y-1">
                {yards.map((y) => (
                  <button
                    key={y.id}
                    type="button"
                    onClick={() => switchYard(y.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      y.id === activeYardId ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'hover:bg-slate-800 text-slate-300 border border-transparent'
                    }`}
                  >
                    {y.name}
                    <div className="text-[10px] text-slate-500 font-normal">{y.width_ft}×{y.length_ft} ft</div>
                  </button>
                ))}
              </div>
            </div>

            {activeYard && (
              <>
                <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 flex gap-1">
                  <Button
                    size="sm"
                    variant={mode === 'design' ? 'default' : 'ghost'}
                    className={`flex-1 text-xs ${mode === 'design' ? 'bg-amber-500 text-slate-900' : 'text-slate-400'}`}
                    onClick={() => switchMode('design')}
                  >
                    <Pencil className="w-3 h-3 mr-1" /> Design
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === 'live' ? 'default' : 'ghost'}
                    className={`flex-1 text-xs ${mode === 'live' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    onClick={() => switchMode('live')}
                  >
                    <Eye className="w-3 h-3 mr-1" /> Live Ops
                  </Button>
                </div>

                {dirtyLayout && mode === 'design' && (
                  <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Unsaved layout changes
                  </div>
                )}

                {mode === 'design' && (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 space-y-3">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Yard dimensions</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[10px] text-slate-400">Width (ft)
                        <Input type="number" min={50} className="h-8 text-xs mt-0.5 bg-slate-800 border-slate-600" value={activeYard.width_ft}
                          onChange={(e) => handleUpdateDimensions('width_ft', e.target.value)} />
                      </label>
                      <label className="text-[10px] text-slate-400">Length (ft)
                        <Input type="number" min={50} className="h-8 text-xs mt-0.5 bg-slate-800 border-slate-600" value={activeYard.length_ft}
                          onChange={(e) => handleUpdateDimensions('length_ft', e.target.value)} />
                      </label>
                    </div>
                    <label className="text-[10px] text-slate-400 block">Cell size (ft)
                      <Input type="number" min={10} max={50} className="h-8 text-xs mt-0.5 bg-slate-800 border-slate-600" value={activeYard.cell_size_ft || 25}
                        onChange={(e) => handleUpdateDimensions('cell_size_ft', e.target.value)} />
                    </label>

                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider pt-1">Palette</div>
                    {YMS_PALETTE_GROUPS.map((group) => (
                      <div key={group.id}>
                        <div className="text-[10px] font-bold text-slate-400 mb-1">{group.label}</div>
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
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                                  selectedTool === key ? 'border-amber-400 bg-amber-500/10 text-amber-200' : 'border-slate-700 hover:bg-slate-800 text-slate-400'
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

                    {selectedElement && (
                      <div className="pt-3 border-t border-slate-700 space-y-2">
                        <div className="text-xs font-bold text-slate-300">Selected element</div>
                        <Input className="h-8 text-xs bg-slate-800 border-slate-600" value={selectedElement.label}
                          onChange={(e) => updateSelectedElement({ label: e.target.value })} />
                        {(isBuildingType(selectedElement.type) || isParkingType(selectedElement.type)) && (
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-[10px] text-slate-400">W (cells)
                              <Input type="number" min={1} className="h-8 text-xs mt-0.5 bg-slate-800 border-slate-600" value={selectedElement.cols}
                                onChange={(e) => updateSelectedElement({ cols: e.target.value })} />
                            </label>
                            <label className="text-[10px] text-slate-400">D (cells)
                              <Input type="number" min={1} className="h-8 text-xs mt-0.5 bg-slate-800 border-slate-600" value={selectedElement.rows}
                                onChange={(e) => updateSelectedElement({ rows: e.target.value })} />
                            </label>
                          </div>
                        )}
                        {activeYard && (isBuildingType(selectedElement.type) || isParkingType(selectedElement.type)) && (
                          <p className="text-[10px] text-slate-500">
                            ≈ {elementSizeFt(selectedElement, activeYard.cell_size_ft || 25).widthFt}×
                            {elementSizeFt(selectedElement, activeYard.cell_size_ft || 25).lengthFt} ft
                          </p>
                        )}
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="flex-1 h-8 border-slate-600" onClick={handleDuplicateElement}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-8 border-red-900 text-red-400" onClick={handleDeleteElement}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mode === 'live' && <YardActivityFeed events={activity} />}
              </>
            )}
          </aside>

          <div className="min-w-0 space-y-4">
            {activeYard && (
              <YardCanvas
                yard={activeYard}
                elements={elements}
                placements={placementByElement}
                vehiclesById={vehiclesById}
                selectedId={selectedElementId}
                paintTool={mode === 'design' ? selectedTool : null}
                mode={mode}
                zoom={zoom}
                onZoomChange={setZoom}
                onCellClick={handleCellClick}
                onElementMove={handleElementMove}
                onElementClick={(el) => {
                  if (mode === 'design') {
                    setSelectedElementId(el.id);
                  } else if (isAssignableType(el.type)) {
                    setAssignElementId(el.id);
                  }
                }}
              />
            )}
          </div>

          <div className="space-y-3">
            {mode === 'live' && assignElement && (
              <YardAssignPanel
                element={assignElement}
                placement={placementByElement[assignElementId]}
                vehicles={availableVehicles}
                onAssign={handleAssignVehicle}
                onClose={() => setAssignElementId(null)}
                onSetStatus={handleSetStatus}
                onUpdateNotes={handleUpdateNotes}
              />
            )}
            {mode === 'live' && !assignElement && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-500">
                Click a parking spot, dock, or queue lane on the map to assign a unit or set spot status.
              </div>
            )}
          </div>
        </div>
      )}

      {showNewYard && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-black text-white">New Terminal Yard</h2>
            <label className="block text-xs font-medium text-slate-400">Yard name
              <Input className="mt-1 bg-slate-800 border-slate-600" value={newYardForm.name} onChange={(e) => setNewYardForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-slate-400">Width (ft)
                <Input type="number" min={50} className="mt-1 bg-slate-800 border-slate-600" value={newYardForm.width_ft}
                  onChange={(e) => setNewYardForm((f) => ({ ...f, width_ft: e.target.value }))} />
              </label>
              <label className="block text-xs font-medium text-slate-400">Length (ft)
                <Input type="number" min={50} className="mt-1 bg-slate-800 border-slate-600" value={newYardForm.length_ft}
                  onChange={(e) => setNewYardForm((f) => ({ ...f, length_ft: e.target.value }))} />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-400">Grid cell size (ft)
              <Input type="number" min={10} max={50} className="mt-1 bg-slate-800 border-slate-600" value={newYardForm.cell_size_ft}
                onChange={(e) => setNewYardForm((f) => ({ ...f, cell_size_ft: e.target.value }))} />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="block text-xs text-slate-400 col-span-3">Address (optional)
                <Input className="mt-1 bg-slate-800 border-slate-600 text-sm" value={newYardForm.address}
                  onChange={(e) => setNewYardForm((f) => ({ ...f, address: e.target.value }))} />
              </label>
              <Input placeholder="City" className="bg-slate-800 border-slate-600 text-sm" value={newYardForm.city}
                onChange={(e) => setNewYardForm((f) => ({ ...f, city: e.target.value }))} />
              <Input placeholder="ST" className="bg-slate-800 border-slate-600 text-sm" value={newYardForm.state}
                onChange={(e) => setNewYardForm((f) => ({ ...f, state: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 border-slate-600" onClick={() => setShowNewYard(false)}>Cancel</Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold" onClick={handleCreateYard} disabled={saving}>
                Create Yard
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSettings && activeYard && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-black text-white">Yard Settings</h2>
            <label className="block text-xs text-slate-400">Name
              <Input className="mt-1 bg-slate-800 border-slate-600" value={yardSettings.name}
                onChange={(e) => setYardSettings((s) => ({ ...s, name: e.target.value }))} />
            </label>
            <Input placeholder="Address" className="bg-slate-800 border-slate-600" value={yardSettings.address}
              onChange={(e) => setYardSettings((s) => ({ ...s, address: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="City" className="bg-slate-800 border-slate-600" value={yardSettings.city}
                onChange={(e) => setYardSettings((s) => ({ ...s, city: e.target.value }))} />
              <Input placeholder="State" className="bg-slate-800 border-slate-600" value={yardSettings.state}
                onChange={(e) => setYardSettings((s) => ({ ...s, state: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="destructive" size="sm" onClick={handleDeleteYard} disabled={saving}>Delete Yard</Button>
              <div className="flex-1" />
              <Button variant="outline" className="border-slate-600" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button className="bg-amber-500 text-slate-900 font-bold" onClick={handleSaveSettings} disabled={saving}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

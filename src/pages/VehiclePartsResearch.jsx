import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { useCustomerContext } from '@/lib/CustomerContext';
import { filterVehiclesForUser } from '@/lib/roles';
import {
  Search, Loader2, Truck, Package, Wrench, ClipboardList, Shield,
  Plus, Edit2, AlertTriangle, CheckCircle, Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AccessoryModal from '@/components/vehicle/AccessoryModal';

const TABS = [
  { id: 'vin', label: 'VIN Lookup', icon: Search },
  { id: 'serial', label: 'Serial / Warranty', icon: Hash },
];

function warrantyBadge(expiry) {
  if (!expiry) return null;
  const active = new Date(expiry) >= new Date();
  return active
    ? <Badge className="bg-green-100 text-green-800">Warranty active until {expiry}</Badge>
    : <Badge variant="outline" className="text-red-600 border-red-200">Warranty expired {expiry}</Badge>;
}

export default function VehiclePartsResearch() {
  const { effectiveCustomerId } = useCustomerContext();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('vin');

  const [vinInput, setVinInput] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState('');
  const [vinResult, setVinResult] = useState(null);

  const [serialBrand, setSerialBrand] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [serialLoading, setSerialLoading] = useState(false);
  const [serialError, setSerialError] = useState('');
  const [serialResults, setSerialResults] = useState(null);

  const [showAccessoryModal, setShowAccessoryModal] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState(null);

  const loadBase = async () => {
    const [u, vehs] = await Promise.all([
      api.auth.me().catch(() => null),
      api.entities.Vehicle.list('-updated_date', 500),
    ]);
    setUser(u);
    setVehicles(filterVehiclesForUser(vehs, u, effectiveCustomerId));
    setLoading(false);
  };

  useEffect(() => { loadBase(); }, [effectiveCustomerId]);

  const scopedVehicles = useMemo(
    () => filterVehiclesForUser(vehicles, user, effectiveCustomerId),
    [vehicles, user, effectiveCustomerId],
  );

  const handleVinLookup = async (e) => {
    e?.preventDefault();
    setVinError('');
    setVinLoading(true);
    try {
      const payload = selectedVehicleId
        ? { vehicle_id: selectedVehicleId }
        : { vin: vinInput.trim() };
      const res = await api.functions.invoke('vehiclePartsLookup', payload);
      setVinResult(res);
    } catch (err) {
      setVinError(err.message || 'Lookup failed');
      setVinResult(null);
    } finally {
      setVinLoading(false);
    }
  };

  const handleSerialLookup = async (e) => {
    e.preventDefault();
    setSerialError('');
    setSerialLoading(true);
    try {
      const res = await api.functions.invoke('accessorySerialLookup', {
        brand: serialBrand.trim(),
        serial_number: serialNumber.trim(),
      });
      setSerialResults(res);
    } catch (err) {
      setSerialError(err.message || 'Lookup failed');
      setSerialResults(null);
    } finally {
      setSerialLoading(false);
    }
  };

  const handleSaveAccessory = async (data) => {
    if (editingAccessory) {
      await api.entities.VehicleAccessory.update(editingAccessory.id, data);
    } else {
      await api.entities.VehicleAccessory.create(data);
    }
    setShowAccessoryModal(false);
    setEditingAccessory(null);
    if (vinResult) handleVinLookup();
    if (serialResults) handleSerialLookup();
  };

  const handleDeleteAccessory = async () => {
    if (!editingAccessory || !confirm('Delete this accessory record?')) return;
    await api.entities.VehicleAccessory.delete(editingAccessory.id);
    setShowAccessoryModal(false);
    setEditingAccessory(null);
    if (vinResult) handleVinLookup();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const specs = vinResult?.decode?.specs;
  const vehicle = vinResult?.vehicle;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Vehicle Parts Research</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Decode VINs, find compatible parts, service tasks, and track accessory serial numbers for warranty
          </p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
          onClick={() => { setEditingAccessory(null); setShowAccessoryModal(true); }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Accessory
        </Button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
              tab === t.id
                ? 'bg-white text-amber-600 border border-b-0 border-slate-200 -mb-px'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'vin' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-500" /> VIN or Fleet Unit Lookup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVinLookup} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">VIN Number</label>
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-400"
                      value={vinInput}
                      onChange={(e) => { setVinInput(e.target.value); setSelectedVehicleId(''); }}
                      placeholder="17-character VIN"
                      maxLength={17}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Or select fleet unit</label>
                    <select
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      value={selectedVehicleId}
                      onChange={(e) => { setSelectedVehicleId(e.target.value); setVinInput(''); }}
                    >
                      <option value="">— Select from your fleet —</option>
                      {scopedVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.unit_number} · {v.make} {v.model} {v.vin ? `(${v.vin})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button type="submit" disabled={vinLoading || (!vinInput.trim() && !selectedVehicleId)} className="font-bold">
                  {vinLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Research Parts & Service
                </Button>
                {vinError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> {vinError}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {vinResult && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Decoded Vehicle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><span className="text-slate-500">VIN:</span> <span className="font-mono font-semibold">{vinResult.vin}</span></p>
                    {specs && (
                      <>
                        <p><span className="text-slate-500">Make / Model:</span> {specs.make} {specs.model}</p>
                        <p><span className="text-slate-500">Year:</span> {specs.year || '—'}</p>
                        <p><span className="text-slate-500">Engine:</span> {specs.engine || '—'}</p>
                        <p><span className="text-slate-500">Fuel:</span> {specs.fuel_type || '—'}</p>
                        <p><span className="text-slate-500">Body:</span> {specs.body_class || '—'}</p>
                      </>
                    )}
                    {vehicle && (
                      <p className="pt-2 text-amber-700 font-semibold">
                        Fleet unit {vehicle.unit_number} · {vehicle.status}
                      </p>
                    )}
                    {!vehicle && (
                      <p className="pt-2 text-slate-500 text-xs">VIN not linked to a fleet unit in your account — decode and parts still shown.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Accessories on Unit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(vinResult.accessories || []).length === 0 ? (
                      <p className="text-sm text-slate-500">No accessories registered. Add cranes, welders, etc. with serial numbers.</p>
                    ) : (
                      <ul className="space-y-2">
                        {vinResult.accessories.map((a) => (
                          <li key={a.id} className="flex items-start justify-between gap-2 text-sm border-b border-slate-100 pb-2">
                            <div>
                              <span className="font-semibold capitalize">{a.accessory_type}</span>
                              {' · '}{a.brand} {a.model}
                              <div className="font-mono text-xs text-slate-600">SN: {a.serial_number}</div>
                              {warrantyBadge(a.warranty_expiry)}
                            </div>
                            <button
                              type="button"
                              className="text-amber-600 hover:text-amber-800"
                              onClick={() => { setEditingAccessory(a); setShowAccessoryModal(true); }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Section title="Compatible Parts" icon={Package} count={vinResult.compatible_parts?.length}>
                {(vinResult.compatible_parts || []).length === 0 ? (
                  <EmptyHint text="No parts matched make/model. Tag parts in inventory with compatible makes/models." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b">
                          <th className="pb-2 pr-4">Part #</th>
                          <th className="pb-2 pr-4">Description</th>
                          <th className="pb-2 pr-4">Category</th>
                          <th className="pb-2">On Hand</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vinResult.compatible_parts.map((p) => (
                          <tr key={p.id} className="border-b border-slate-50">
                            <td className="py-2 pr-4 font-mono text-xs">{p.part_number}</td>
                            <td className="py-2 pr-4">{p.description}</td>
                            <td className="py-2 pr-4">{p.category}</td>
                            <td className="py-2">{p.quantity_on_hand ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              <Section title="Maintenance Schedules" icon={Wrench} count={vinResult.maintenance_schedules?.length}>
                {(vinResult.maintenance_schedules || []).length === 0 ? (
                  <EmptyHint text="No maintenance schedules for this unit." />
                ) : (
                  <ul className="space-y-2 text-sm">
                    {vinResult.maintenance_schedules.map((m) => (
                      <li key={m.id} className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="font-medium">{m.service_type}</span>
                        <Badge variant="outline">{m.status || 'scheduled'}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Work Orders" icon={ClipboardList} count={vinResult.work_orders?.length}>
                {(vinResult.work_orders || []).length === 0 ? (
                  <EmptyHint text="No open or historical work orders." />
                ) : (
                  <ul className="space-y-2 text-sm">
                    {vinResult.work_orders.map((wo) => (
                      <li key={wo.id} className="py-1 border-b border-slate-50">
                        <span className="font-mono text-xs text-slate-500">{wo.wo_number}</span>
                        {' · '}{wo.title}
                        <Badge variant="outline" className="ml-2">{wo.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Suggested Service Tasks" icon={CheckCircle} count={vinResult.service_templates?.length}>
                {(vinResult.service_templates || []).length === 0 ? (
                  <EmptyHint text="No service templates matched this vehicle type." />
                ) : (
                  <ul className="space-y-3">
                    {vinResult.service_templates.map((t) => (
                      <li key={t.id} className="text-sm">
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-slate-500 text-xs">{t.repair_type} · ~{t.estimated_labor_hours}h labor</p>
                        {(t.tasks || []).length > 0 && (
                          <ol className="mt-1 ml-4 list-decimal text-xs text-slate-600">
                            {t.tasks.map((task, i) => (
                              <li key={i}>{task.description}</li>
                            ))}
                          </ol>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </>
          )}
        </div>
      )}

      {tab === 'serial' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Hash className="w-4 h-4 text-amber-500" /> Accessory Brand & Serial Lookup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSerialLookup} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Brand</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={serialBrand}
                    onChange={(e) => setSerialBrand(e.target.value)}
                    placeholder="e.g. Miller, Auto Crane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Serial Number</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Partial match OK"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={serialLoading || (!serialBrand.trim() && !serialNumber.trim())} className="font-bold">
                    {serialLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                    Find Warranty & Parts
                  </Button>
                  {serialError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> {serialError}
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {serialResults && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">{serialResults.count} accessory record(s) found</p>
              {(serialResults.results || []).map(({ accessory, vehicle: v, warranty_active, maintenance_schedules, work_orders, related_parts }) => (
                <Card key={accessory.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base font-black capitalize">
                        {accessory.accessory_type} — {accessory.brand} {accessory.model}
                      </CardTitle>
                      {warranty_active === true && <Badge className="bg-green-100 text-green-800">Under warranty</Badge>}
                      {warranty_active === false && <Badge variant="outline" className="text-red-600">Out of warranty</Badge>}
                    </div>
                    <p className="font-mono text-sm text-slate-600">Serial: {accessory.serial_number}</p>
                    {v && <p className="text-sm text-amber-700">On unit {v.unit_number} · {v.make} {v.model}</p>}
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {accessory.warranty_expiry && (
                      <p className="text-slate-600">Warranty expiry: {accessory.warranty_expiry}</p>
                    )}
                    {related_parts?.length > 0 && (
                      <div>
                        <p className="font-bold text-xs uppercase text-slate-500 mb-1">Related Parts</p>
                        <ul className="space-y-1">
                          {related_parts.map((p) => (
                            <li key={p.id}>{p.part_number} — {p.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {maintenance_schedules?.length > 0 && (
                      <div>
                        <p className="font-bold text-xs uppercase text-slate-500 mb-1">Maintenance</p>
                        <ul className="space-y-1">
                          {maintenance_schedules.slice(0, 5).map((m) => (
                            <li key={m.id}>{m.service_type} ({m.status})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {work_orders?.length > 0 && (
                      <div>
                        <p className="font-bold text-xs uppercase text-slate-500 mb-1">Work Orders</p>
                        <ul className="space-y-1">
                          {work_orders.slice(0, 5).map((wo) => (
                            <li key={wo.id}>{wo.wo_number} — {wo.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingAccessory(accessory); setShowAccessoryModal(true); }}
                    >
                      <Edit2 className="w-3 h-3 mr-1" /> Edit record
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {showAccessoryModal && (
        <AccessoryModal
          accessory={editingAccessory}
          vehicles={scopedVehicles}
          customerId={effectiveCustomerId || user?.customer_id}
          onSave={handleSaveAccessory}
          onDelete={editingAccessory ? handleDeleteAccessory : null}
          onClose={() => { setShowAccessoryModal(false); setEditingAccessory(null); }}
        />
      )}
    </div>
  );
}

function Section({ title, icon: Icon, count, children }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black flex items-center gap-2">
          <Icon className="w-4 h-4 text-amber-500" />
          {title}
          {count != null && <Badge variant="secondary" className="ml-1">{count}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyHint({ text }) {
  return <p className="text-sm text-slate-500">{text}</p>;
}

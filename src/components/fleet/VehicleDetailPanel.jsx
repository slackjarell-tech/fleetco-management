import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import {
  X, Truck, Loader2, AlertTriangle, ExternalLink, Package, Wrench,
  Shield, ClipboardList, Plus, Edit2, Hash, CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AccessoryModal from '@/components/vehicle/AccessoryModal';
import {
  nhtsaVinDecoderUrl, nhtsaRecallsUrl, rockAutoCatalogUrl, autoZoneRepairGuidesUrl,
  cumminsQuickServeUrl, vehicleSearchLabel,
} from '@/lib/vehicleExternalLinks';
import { VEHICLE_ACCESSORY_TYPES } from '@/lib/vehicleAccessoryTypes';
import { useCustomerContext } from '@/lib/CustomerContext';

const TABS = [
  { id: 'specs', label: 'Specs', icon: Truck },
  { id: 'recalls', label: 'Recalls', icon: AlertTriangle },
  { id: 'parts', label: 'Parts', icon: Package },
  { id: 'service', label: 'Service Tasks', icon: Wrench },
  { id: 'equipment', label: 'Equipment', icon: Hash },
];

function warrantyBadge(expiry) {
  if (!expiry) return null;
  const active = new Date(expiry) >= new Date();
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
      {active ? 'Warranty active' : 'Warranty expired'}
    </span>
  );
}

export default function VehicleDetailPanel({ vehicle, vehicles, user, onClose }) {
  const { viewAsCustomerId } = useCustomerContext();
  const [tab, setTab] = useState('specs');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [showAccessoryModal, setShowAccessoryModal] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState(null);

  const customerId = user?.customer_id || viewAsCustomerId || vehicle?.customer_id || null;

  const load = useCallback(async () => {
    if (!vehicle?.id) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.functions.invoke('vehiclePartsLookup', {
        vehicle_id: vehicle.id,
        customer_id: customerId,
      });
      setData(result);
    } catch (err) {
      setError(err.message || 'Could not load vehicle data');
    } finally {
      setLoading(false);
    }
  }, [vehicle?.id, customerId]);

  useEffect(() => { load(); }, [load]);

  const specs = data?.decode?.specs || {};
  const recalls = data?.recalls || [];

  const accessoriesByCategory = useMemo(() => {
    const grouped = {};
    VEHICLE_ACCESSORY_TYPES.forEach((t) => { grouped[t.id] = []; });
    (data?.accessories || []).forEach((a) => {
      const key = a.accessory_type || 'other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    });
    return grouped;
  }, [data?.accessories]);

  const handleSaveAccessory = async (formData) => {
    if (editingAccessory?.id) {
      await api.entities.VehicleAccessory.update(editingAccessory.id, formData);
    } else {
      await api.entities.VehicleAccessory.create({
        ...formData,
        vehicle_id: vehicle.id,
        customer_id: customerId,
      });
    }
    setShowAccessoryModal(false);
    setEditingAccessory(null);
    await load();
  };

  const handleDeleteAccessory = async () => {
    if (!editingAccessory?.id) return;
    if (!confirm('Remove this equipment record?')) return;
    await api.entities.VehicleAccessory.delete(editingAccessory.id);
    setShowAccessoryModal(false);
    setEditingAccessory(null);
    await load();
  };

  const openAddEquipment = (categoryId) => {
    setEditingAccessory({ accessory_type: categoryId, vehicle_id: vehicle.id });
    setShowAccessoryModal(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Unit #{vehicle.unit_number}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
              {vehicle.vin && <span className="font-mono ml-2 text-xs">{vehicle.vin}</span>}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <a href={nhtsaVinDecoderUrl(data?.vin || vehicle.vin)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
                NHTSA VIN Decoder <ExternalLink className="w-3 h-3" />
              </a>
              <a href={rockAutoCatalogUrl({ make: specs.make || vehicle.make, model: specs.model || vehicle.model, year: specs.year || vehicle.year })}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline">
                RockAuto Parts <ExternalLink className="w-3 h-3" />
              </a>
              <a href={autoZoneRepairGuidesUrl({ year: specs.year || vehicle.year, make: specs.make || vehicle.make, model: specs.model || vehicle.model })}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-green-700 hover:underline">
                Service Guides <ExternalLink className="w-3 h-3" />
              </a>
              <Link to="/portal/vehicle-lookup" className="text-xs font-bold text-amber-700 hover:underline">
                Full Parts Research →
              </Link>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="flex gap-1 px-4 pt-3 overflow-x-auto shrink-0 border-b border-slate-100 pb-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const count = t.id === 'recalls' ? recalls.length
              : t.id === 'parts' ? (data?.compatible_parts?.length || 0)
                : t.id === 'equipment' ? (data?.accessories?.length || 0) : null;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.id ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {count != null && count > 0 && (
                  <span className="bg-amber-100 text-amber-800 px-1.5 rounded-full text-[10px]">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          )}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              {!vehicle.vin && <span className="block mt-1">Add a VIN on this unit to decode specs and check recalls.</span>}
            </div>
          )}
          {!loading && !error && data && (
            <>
              {tab === 'specs' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h3 className="font-black text-slate-900 text-sm mb-3">Fleet record</h3>
                    <dl className="text-sm space-y-2">
                      <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className="font-medium capitalize">{vehicle.status?.replace(/_/g, ' ')}</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Plate</dt><dd>{vehicle.license_plate || '—'}</dd></div>
                      <div className="flex justify-between"><dt className="text-slate-500">Odometer</dt><dd>{vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : '—'}</dd></div>
                      {vehicle.trailer_type && <div className="flex justify-between"><dt className="text-slate-500">Trailer type</dt><dd>{vehicle.trailer_type}</dd></div>}
                    </dl>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h3 className="font-black text-slate-900 text-sm mb-3">NHTSA decoded specs</h3>
                    {!vehicle.vin ? (
                      <p className="text-sm text-slate-500">No VIN on file — edit the unit to add one, then refresh.</p>
                    ) : (
                      <dl className="text-sm space-y-2">
                        <div className="flex justify-between"><dt className="text-slate-500">Make / Model</dt><dd className="font-medium">{specs.make || vehicle.make} {specs.model || vehicle.model}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Year</dt><dd>{specs.year || vehicle.year || '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Engine</dt><dd>{specs.engine || '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Fuel</dt><dd>{specs.fuel_type || '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Body</dt><dd>{specs.body_class || '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Drive</dt><dd>{specs.drive_type || '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Manufacturer</dt><dd>{specs.manufacturer || '—'}</dd></div>
                      </dl>
                    )}
                  </div>
                </div>
              )}

              {tab === 'recalls' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Open recalls from NHTSA for this VIN.</p>
                    <a href={nhtsaRecallsUrl(data.vin)} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-700 flex items-center gap-1 hover:underline">
                      View on NHTSA <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {recalls.length === 0 ? (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> No recalls returned for this VIN.
                    </p>
                  ) : (
                    recalls.map((r, i) => (
                      <div key={i} className="border border-red-100 bg-red-50/50 rounded-xl p-4 text-sm">
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          <span className="font-mono text-xs font-bold text-red-800">{r.nhtsa_campaign}</span>
                          {r.component && <Badge variant="outline">{r.component}</Badge>}
                        </div>
                        <p className="text-slate-800">{r.summary}</p>
                        {r.remedy && <p className="text-xs text-slate-600 mt-2"><strong>Remedy:</strong> {r.remedy}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'parts' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-indigo-900 text-sm">RockAuto parts catalog (free)</p>
                      <p className="text-xs text-indigo-700">Browse aftermarket &amp; OEM parts for {vehicleSearchLabel({ year: specs.year || vehicle.year, make: specs.make || vehicle.make, model: specs.model || vehicle.model })}</p>
                    </div>
                    <a href={rockAutoCatalogUrl({ make: specs.make || vehicle.make, model: specs.model || vehicle.model, year: specs.year || vehicle.year })} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        Open RockAuto <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </a>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-sm mb-2">Your parts inventory (matched)</h3>
                    {(data.compatible_parts || []).length === 0 ? (
                      <p className="text-sm text-slate-500">No inventory parts matched. Tag parts with compatible makes/models in Parts Inventory.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-sm">
                          <thead><tr className="text-xs text-slate-500 bg-slate-50 border-b">
                            <th className="text-left p-3">Part #</th><th className="text-left p-3">Description</th>
                            <th className="text-left p-3">Vendor</th><th className="text-right p-3">On hand</th>
                          </tr></thead>
                          <tbody>
                            {data.compatible_parts.map((p) => (
                              <tr key={p.id} className="border-b border-slate-50">
                                <td className="p-3 font-mono text-xs">{p.part_number}</td>
                                <td className="p-3">{p.description}</td>
                                <td className="p-3 text-slate-600">{p.vendor?.name || p.supplier || '—'}</td>
                                <td className="p-3 text-right font-bold">{p.quantity_on_hand ?? 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {(data.vendor_parts || []).length > 0 && (
                    <div>
                      <h3 className="font-black text-slate-900 text-sm mb-2">By vendor / supplier</h3>
                      <div className="space-y-3">
                        {data.vendor_parts.map((group) => (
                          <div key={group.vendor_name} className="border border-slate-200 rounded-xl p-3">
                            <p className="font-bold text-sm">{group.vendor_name}</p>
                            {group.vendor?.email && <p className="text-xs text-slate-500">{group.vendor.email}</p>}
                            <ul className="mt-2 text-xs text-slate-600 space-y-1">
                              {group.parts.slice(0, 8).map((p) => (
                                <li key={p.id}>{p.part_number} — {p.description}</li>
                              ))}
                              {group.parts.length > 8 && <li className="text-slate-400">+{group.parts.length - 8} more</li>}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'service' && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-green-900 text-sm">AutoZone repair guides (free)</p>
                      <p className="text-xs text-green-800">Step-by-step service procedures for {vehicleSearchLabel({ year: specs.year || vehicle.year, make: specs.make || vehicle.make, model: specs.model || vehicle.model })}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={autoZoneRepairGuidesUrl({ year: specs.year || vehicle.year, make: specs.make || vehicle.make, model: specs.model || vehicle.model })} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-green-700 hover:bg-green-800">
                          Open Service Guides <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </a>
                      <a href={cumminsQuickServeUrl()} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="border-green-300 text-green-800">
                          Cummins QuickServe <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </a>
                    </div>
                  </div>

                  <section>
                    <h3 className="font-black text-slate-900 text-sm mb-2 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-amber-500" /> Maintenance schedules
                    </h3>
                    {(data.maintenance_schedules || []).length === 0 ? (
                      <p className="text-sm text-slate-500">No scheduled maintenance for this unit.</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.maintenance_schedules.map((m) => (
                          <li key={m.id} className="flex justify-between items-center text-sm border border-slate-100 rounded-lg px-3 py-2">
                            <span className="font-medium">{m.service_type}</span>
                            <Badge variant="outline">{m.status || 'scheduled'}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="font-black text-slate-900 text-sm mb-2">Service templates (vendor tasks)</h3>
                    {(data.service_templates || []).length === 0 ? (
                      <p className="text-sm text-slate-500">No matching service templates — add templates in Service Templates.</p>
                    ) : (
                      <ul className="space-y-3">
                        {data.service_templates.map((t) => (
                          <li key={t.id} className="border border-slate-200 rounded-xl p-3 text-sm">
                            <p className="font-bold">{t.name}</p>
                            <p className="text-xs text-slate-500">{t.repair_type} · ~{t.estimated_labor_hours || '?'}h labor</p>
                            {(t.tasks || []).length > 0 && (
                              <ol className="mt-2 ml-4 list-decimal text-xs text-slate-600">
                                {t.tasks.map((task, i) => <li key={i}>{task.description || task}</li>)}
                              </ol>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="font-black text-slate-900 text-sm mb-2">Work orders &amp; tasks</h3>
                    {(data.work_orders || []).length === 0 ? (
                      <p className="text-sm text-slate-500">No work orders on this unit.</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.work_orders.map((wo) => (
                          <li key={wo.id} className="border border-slate-200 rounded-xl p-3 text-sm">
                            <div className="flex justify-between gap-2">
                              <span className="font-mono text-xs text-slate-500">{wo.wo_number}</span>
                              <Badge variant="outline">{wo.status}</Badge>
                            </div>
                            <p className="font-medium mt-1">{wo.title}</p>
                            {wo.shop_name && <p className="text-xs text-slate-500">Shop: {wo.shop_name}</p>}
                            {(wo.service_tasks || []).length > 0 && (
                              <ul className="mt-2 text-xs text-slate-600 list-disc ml-4">
                                {wo.service_tasks.map((st, i) => (
                                  <li key={i}>{st.description || st.task || st}</li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}

              {tab === 'equipment' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Register specialty equipment on this truck — cranes, welders, APUs, etc. — with serial numbers for warranty and parts lookup.
                  </p>
                  {VEHICLE_ACCESSORY_TYPES.map((cat) => {
                    const items = accessoriesByCategory[cat.id] || [];
                    return (
                      <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between bg-slate-50 px-4 py-2 border-b border-slate-200">
                          <h4 className="font-bold text-sm text-slate-800">{cat.label}</h4>
                          <button type="button" onClick={() => openAddEquipment(cat.id)}
                            className="text-xs font-bold text-amber-700 flex items-center gap-1 hover:text-amber-900">
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        </div>
                        {items.length === 0 ? (
                          <p className="text-xs text-slate-400 px-4 py-3">No {cat.label.toLowerCase()} registered.</p>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {items.map((a) => (
                              <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                                <div>
                                  <p className="font-semibold">{a.brand} {a.model}</p>
                                  <p className="font-mono text-xs text-slate-600">SN: {a.serial_number}</p>
                                  {warrantyBadge(a.warranty_expiry)}
                                </div>
                                <button type="button" className="text-amber-600 hover:text-amber-800"
                                  onClick={() => { setEditingAccessory(a); setShowAccessoryModal(true); }}>
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 shrink-0 flex justify-end gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>

      {showAccessoryModal && (
        <AccessoryModal
          accessory={editingAccessory}
          vehicles={vehicles || [vehicle]}
          customerId={customerId}
          onSave={handleSaveAccessory}
          onDelete={editingAccessory?.id ? handleDeleteAccessory : undefined}
          onClose={() => { setShowAccessoryModal(false); setEditingAccessory(null); }}
        />
      )}
    </div>
  );
}

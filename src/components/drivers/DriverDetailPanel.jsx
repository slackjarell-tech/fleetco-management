import React from 'react';
import { X, Mail, Truck, Fuel, TrendingUp, Wrench, ClipboardCheck, AlertTriangle, FileCheck, ShieldCheck, FileText, Phone, CreditCard } from 'lucide-react';

function StatBlock({ icon: Icon, label, value, sub, color = 'text-slate-700' }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function DriverDetailPanel({ driver, assignedVehicles, stats, fuelLogs, loads, workOrders, inspections, onClose, onOpenDocuments }) {
  const recentLoads = loads.slice(0, 5);
  const recentFuel = fuelLogs.slice(0, 5);
  const defectInspections = inspections.filter(i => i.status === 'failed' || i.status === 'needs_attention');
  const dvirInspections = inspections.filter(i => i.hos_log_id && (i.inspection_type === 'Pre-Trip' || i.inspection_type === 'Post-Trip')).slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-amber-700 font-black text-lg">
              {driver.full_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-slate-900">{driver.full_name || '—'}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <Mail className="w-3 h-3" /> {driver.email}
              {driver.employee_number && (
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  {driver.employee_number}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex gap-2">
          {onOpenDocuments && (
            <button
              onClick={onOpenDocuments}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm rounded-lg"
            >
              <FileText className="w-4 h-4" /> Documents (DL, Insurance…)
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Contact & CDL */}
          {(driver.phone || driver.license_number) && (
            <div>
              <div className="text-xs font-black text-slate-400 uppercase mb-2">Driver Info</div>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                {driver.phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400" /> {driver.phone}
                  </div>
                )}
                {driver.license_number && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    CDL {driver.license_number}
                    {driver.license_state && ` (${driver.license_state})`}
                    {driver.license_expiry && (
                      <span className={`text-xs font-bold ml-1 ${new Date(driver.license_expiry) < new Date() ? 'text-red-600' : 'text-slate-500'}`}>
                        · exp {new Date(driver.license_expiry).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assigned Vehicle */}
          <div>
            <div className="text-xs font-black text-slate-400 uppercase mb-2">Assigned Vehicle</div>
            {assignedVehicles.length === 0 ? (
              <div className="text-sm text-slate-400 italic">No vehicle currently assigned</div>
            ) : (
              <div className="space-y-2">
                {assignedVehicles.map(v => (
                  <div key={v.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3">
                    <Truck className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Unit {v.unit_number}</div>
                      <div className="text-xs text-slate-500">{v.year} {v.make} {v.model} · VIN: {v.vin || 'N/A'}</div>
                    </div>
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${v.status === 'active' ? 'bg-emerald-100 text-emerald-700' : v.status === 'in_shop' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                      {v.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance KPIs */}
          <div>
            <div className="text-xs font-black text-slate-400 uppercase mb-3">Performance Overview</div>
            <div className="grid grid-cols-2 gap-3">
              <StatBlock icon={TrendingUp} label="Loads Delivered" value={stats.loads} sub={`$${stats.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} earned`} color="text-blue-600" />
              <StatBlock icon={Fuel} label="Total Fuel Spend" value={`$${stats.fuelSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} sub={`${stats.gallons.toFixed(0)} gal · ${stats.fuelLogs} fill-ups`} color="text-red-500" />
              <StatBlock icon={Wrench} label="Work Orders" value={stats.workOrders} sub="linked to assigned truck" color="text-amber-500" />
              <StatBlock icon={ClipboardCheck} label="Inspections" value={stats.inspections} sub={defectInspections.length > 0 ? `${defectInspections.length} with defects` : 'All clear'} color={defectInspections.length > 0 ? 'text-red-500' : 'text-emerald-600'} />
            </div>
          </div>

          {/* Recent Loads */}
          {recentLoads.length > 0 && (
            <div>
              <div className="text-xs font-black text-slate-400 uppercase mb-2">Recent Loads</div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {recentLoads.map((l, i) => (
                  <div key={l.id} className={`flex items-center gap-3 px-4 py-3 text-sm ${i < recentLoads.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{l.load_number}</div>
                      <div className="text-xs text-slate-400 truncate">{l.origin} → {l.destination}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold text-emerald-600">${(l.rate || 0).toLocaleString()}</div>
                      <div className="text-xs text-slate-400">{l.delivery_date || '—'}</div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      l.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      l.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>{l.status?.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Fuel Logs */}
          {recentFuel.length > 0 && (
            <div>
              <div className="text-xs font-black text-slate-400 uppercase mb-2">Recent Fuel Logs</div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {recentFuel.map((f, i) => (
                  <div key={f.id} className={`flex items-center justify-between px-4 py-3 text-sm ${i < recentFuel.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div>
                      <div className="font-semibold text-slate-900">{f.date}</div>
                      <div className="text-xs text-slate-400">{f.location || 'Unknown location'} · {f.gallons?.toFixed(1)} gal</div>
                    </div>
                    <div className="text-sm font-black text-red-500">${(f.total_cost || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DVIR History */}
          {dvirInspections.length > 0 && (
            <div>
              <div className="text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> DVIR History (Pre/Post-Trip)
              </div>
              <div className="space-y-2">
                {dvirInspections.map(ins => {
                  const needsSignoff = ins.status === 'awaiting_signoff';
                  const hasDefects = ins.defects_found;
                  const managerApproved = ins.manager_signed_at;
                  return (
                    <div key={ins.id} className={`border rounded-lg px-3 py-2.5 ${needsSignoff ? 'bg-amber-50 border-amber-200' : hasDefects ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${ins.inspection_type === 'Pre-Trip' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {ins.inspection_type}
                        </span>
                        <span className="text-xs text-slate-500">{ins.inspection_date}</span>
                        {needsSignoff && (
                          <span className="ml-auto text-xs font-bold text-amber-700 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Awaiting Manager Sign-Off
                          </span>
                        )}
                        {managerApproved && (
                          <span className="ml-auto text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> Approved by {ins.manager_name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="font-bold">Odometer:</span> {ins.odometer?.toLocaleString() || '—'}
                        {hasDefects && <span className="ml-2 text-red-600 font-bold">⚠ {ins.items_checked?.filter(i => i.result === 'defect').length} defect(s)</span>}
                        {!hasDefects && <span className="ml-2 text-emerald-600 font-bold">✓ No defects</span>}
                      </div>
                      {ins.defects_corrected && (
                        <div className="text-xs text-emerald-600 font-bold mt-1">✓ Defects corrected before departure</div>
                      )}
                      {ins.driver_signed_at && (
                        <div className="text-xs text-slate-400 mt-1">Driver signed: {new Date(ins.driver_signed_at).toLocaleString()}</div>
                      )}
                      {ins.manager_signed_at && (
                        <div className="text-xs text-slate-400 mt-1">Manager signed: {new Date(ins.manager_signed_at).toLocaleString()}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inspection Flags */}
          {defectInspections.length > 0 && (
            <div>
              <div className="text-xs font-black text-slate-400 uppercase mb-2">Inspection Flags</div>
              <div className="space-y-2">
                {defectInspections.slice(0, 5).map(ins => (
                  <div key={ins.id} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-800">{ins.inspection_type} — {ins.inspection_date}</div>
                      <div className="text-xs text-amber-700">{ins.notes || `Status: ${ins.status?.replace('_', ' ')}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.loads === 0 && stats.fuelSpend === 0 && stats.workOrders === 0 && (
            <div className="text-center text-slate-400 text-sm py-4">No activity data recorded yet for this driver.</div>
          )}
        </div>
      </div>
    </div>
  );
}
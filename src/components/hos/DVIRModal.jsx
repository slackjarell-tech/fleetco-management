import React, { useState } from 'react';
import { X, Save, CheckCircle2, AlertTriangle, Truck, Shield, Pen } from 'lucide-react';
import SignaturePad from '@/components/ui/SignaturePad';

// Standard FMCSA DVIR checklist categories
const DVIR_CHECKLIST = [
  { category: 'Engine / Under Hood', items: ['Air compressor', 'Belts & hoses', 'Engine oil level', 'Coolant level', 'Power steering fluid', 'Battery'] },
  { category: 'Cab / Controls', items: ['Horn', 'Windshield & wipers', 'Mirrors', 'Seat belts', 'Emergency equipment', 'Heater / defroster', 'Gauges & instruments'] },
  { category: 'Brakes', items: ['Service brakes', 'Parking brake', 'Air lines', 'Brake drums/rotors', 'Brake hoses'] },
  { category: 'Lights', items: ['Headlights', 'Taillights', 'Turn signals', 'Brake lights', 'Clearance lights', 'Reflectors'] },
  { category: 'Tires & Wheels', items: ['Tires (condition/pressure)', 'Lug nuts / wheel seals', 'Rims (cracks/damage)', 'Mud flaps'] },
  { category: 'Steering & Suspension', items: ['Steering wheel (play)', 'Tie rods / drag link', 'Suspension (springs/shocks)', 'Frame'] },
  { category: 'Fuel System', items: ['Fuel tank(s)', 'Fuel lines', 'DEF level'] },
  { category: 'Exhaust / Emissions', items: ['Exhaust system', 'DPF / emissions', 'No visible smoke'] },
  { category: 'Coupling Devices', items: ['Fifth wheel / kingpin', 'Safety chains/cables', 'Glad hands', 'Electrical cord / plug'] },
  { category: 'Trailer / Cargo', items: ['Trailer body (doors/seals)', 'Cargo securement', 'Landing gear', 'Trailer lights', 'Trailer brakes'] },
];

function buildDefaultItems() {
  const items = [];
  DVIR_CHECKLIST.forEach(cat => {
    cat.items.forEach(item => {
      items.push({ item, result: 'ok', notes: '', category: cat.category });
    });
  });
  return items;
}

export default function DVIRModal({ hosLog, vehicle, currentUser, onSave, onClose, existingDvir = null }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    vehicle_id: existingDvir?.vehicle_id || hosLog?.vehicle_id || vehicle?.id || '',
    inspection_type: existingDvir?.inspection_type || 'Pre-Trip',
    inspection_date: existingDvir?.inspection_date || hosLog?.log_date || today,
    driver_id: existingDvir?.driver_id || hosLog?.driver_id || currentUser?.id || '',
    inspector_name: existingDvir?.inspector_name || currentUser?.full_name || '',
    hos_log_id: existingDvir?.hos_log_id || hosLog?.id || '',
    odometer: existingDvir?.odometer || hosLog?.odometer_start || '',
    trailer_number: existingDvir?.trailer_number || '',
    carrier_name: existingDvir?.carrier_name || hosLog?.carrier_name || '',
    items_checked: existingDvir?.items_checked || buildDefaultItems(),
    defects_found: existingDvir?.defects_found || false,
    defects_corrected: existingDvir?.defects_corrected || false,
    vehicle_condition_satisfactory: existingDvir?.vehicle_condition_satisfactory ?? true,
    driver_signature_confirmed: existingDvir?.driver_signature_confirmed || false,
    driver_signed_at: existingDvir?.driver_signed_at || '',
    driver_signature_url: existingDvir?.driver_signature_url || '',
    notes: existingDvir?.notes || '',
    status: existingDvir?.status || 'pending',
  });

  const updateItem = (index, field, value) => {
    setForm(f => {
      const items = [...f.items_checked];
      items[index] = { ...items[index], [field]: value };
      const defects = items.some(i => i.result === 'defect');
      return { ...f, items_checked: items, defects_found: defects };
    });
  };

  const defectItems = form.items_checked.filter(i => i.result === 'defect');
  const defectsFound = defectItems.length > 0;

  const [driverSignature, setDriverSignature] = useState(existingDvir?.driver_signature_url || null);

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const payload = {
      ...form,
      defects_found: defectsFound,
      manager_signoff_required: defectsFound,
      status: defectsFound ? 'awaiting_signoff' : 'passed',
      driver_signed_at: driverSignature ? now : '',
      driver_signature_url: driverSignature || '',
      driver_employee_number: currentUser?.employee_number || '',
    };
    onSave(payload);
  };

  // Group items by category for rendering
  const grouped = {};
  form.items_checked.forEach((item, idx) => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...item, _idx: idx });
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center py-6 px-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" /> Driver Vehicle Inspection Report (DVIR)
              </h2>
              <p className="text-xs text-slate-500">FMCSA 49 CFR §396.11 — Required Pre/Post-Trip Inspection</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 space-y-6">
            {/* Trip type + header fields */}
            <div>
              <div className="flex gap-3 mb-4">
                {['Pre-Trip', 'Post-Trip'].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, inspection_type: t }))}
                    className={`flex-1 py-2.5 rounded-xl font-black text-sm border-2 transition-all ${
                      form.inspection_type === t
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {t} Inspection
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                  <input type="date" value={form.inspection_date}
                    onChange={e => setForm(f => ({ ...f, inspection_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Driver Name</label>
                  <input value={form.inspector_name}
                    onChange={e => setForm(f => ({ ...f, inspector_name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Odometer</label>
                  <input type="number" value={form.odometer}
                    onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Carrier Name</label>
                  <input value={form.carrier_name}
                    onChange={e => setForm(f => ({ ...f, carrier_name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Company name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Trailer #</label>
                  <input value={form.trailer_number}
                    onChange={e => setForm(f => ({ ...f, trailer_number: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Optional" />
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-black text-slate-800">Vehicle Inspection Checklist</div>
                <div className="flex gap-3 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> OK</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Defect</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> N/A</span>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 text-xs font-black text-slate-600 uppercase tracking-wide">
                      {category}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {items.map(item => (
                        <div key={item._idx} className={`flex items-center gap-3 px-4 py-2.5 ${item.result === 'defect' ? 'bg-red-50' : ''}`}>
                          <span className="text-sm text-slate-700 flex-1">{item.item}</span>
                          <div className="flex gap-1 flex-shrink-0">
                            {[
                              { val: 'ok', label: 'OK', cls: 'bg-emerald-500 text-white', inactive: 'bg-white text-emerald-600 border border-emerald-300 hover:bg-emerald-50' },
                              { val: 'defect', label: 'Defect', cls: 'bg-red-500 text-white', inactive: 'bg-white text-red-500 border border-red-200 hover:bg-red-50' },
                              { val: 'na', label: 'N/A', cls: 'bg-slate-400 text-white', inactive: 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50' },
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => updateItem(item._idx, 'result', opt.val)}
                                className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${item.result === opt.val ? opt.cls : opt.inactive}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {item.result === 'defect' && (
                            <input
                              className="text-xs border border-red-200 rounded-lg px-2 py-1 w-44 focus:outline-none focus:ring-1 focus:ring-red-400"
                              placeholder="Describe defect..."
                              value={item.notes}
                              onChange={e => updateItem(item._idx, 'notes', e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Defect summary */}
            {defectsFound && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-700 font-black text-sm">
                  <AlertTriangle className="w-4 h-4" /> {defectItems.length} Defect(s) Found — Manager Sign-Off Required
                </div>
                <ul className="space-y-1">
                  {defectItems.map((item, i) => (
                    <li key={i} className="text-xs text-red-600">
                      <span className="font-bold">{item.item}:</span> {item.notes || 'No description provided'}
                    </li>
                  ))}
                </ul>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.defects_corrected}
                    onChange={e => setForm(f => ({ ...f, defects_corrected: e.target.checked }))}
                    className="accent-amber-500 w-4 h-4" />
                  <span className="text-xs font-bold text-slate-700">Defects have been corrected before departure</span>
                </label>
              </div>
            )}

            {/* No defects banner */}
            {!defectsFound && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" /> No defects found — vehicle in satisfactory condition
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Remarks / Notes</label>
              <textarea rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                placeholder="Additional notes..." />
            </div>

            {/* Driver certification */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-black text-amber-800 uppercase tracking-wide">Driver Certification — 49 CFR §396.11</div>
              <p className="text-xs text-slate-700">
                I certify that I have inspected the above-described vehicle and have reported above all defects or deficiencies of which I am aware which may affect the safe operation of this vehicle or result in its mechanical breakdown.
              </p>
              <SignaturePad
                label="Driver Signature"
                existingSignature={driverSignature}
                onSignatureChange={setDriverSignature}
                required={true}
                signerName={form.inspector_name || currentUser?.full_name}
                employeeNumber={currentUser?.employee_number}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button onClick={onClose}
              className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-lg text-sm">
              Cancel
            </button>
            <button
              disabled={!driverSignature}
              onClick={handleSubmit}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-black px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {defectsFound ? 'Submit DVIR (Awaiting Manager Sign-Off)' : 'Submit DVIR — Vehicle Cleared'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
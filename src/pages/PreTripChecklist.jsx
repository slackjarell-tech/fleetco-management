import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { CheckCircle2, XCircle, AlertTriangle, ChevronRight, Truck, ClipboardCheck, ArrowLeft } from 'lucide-react';

const CHECKLIST_SECTIONS = [
  {
    section: 'Lights & Signals',
    items: ['Headlights (low & high beam)', 'Tail lights', 'Brake lights', 'Turn signals (front & rear)', 'Hazard flashers', 'Clearance lights'],
  },
  {
    section: 'Tires & Wheels',
    items: ['Tire pressure (all tires)', 'Tire tread depth', 'No visible cuts or bulges', 'Lug nuts tight', 'Spare tire secured'],
  },
  {
    section: 'Brakes',
    items: ['Air pressure (if applicable)', 'Parking brake holds', 'Brake pedal feel (no soft/spongy)', 'No brake fluid leaks'],
  },
  {
    section: 'Engine & Fluids',
    items: ['Engine oil level', 'Coolant level', 'Washer fluid', 'No visible leaks under vehicle', 'Battery connections secure'],
  },
  {
    section: 'Cab & Interior',
    items: ['Mirrors adjusted', 'Windshield clear (no cracks)', 'Wipers functional', 'Seatbelt works', 'Horn works', 'Dashboard warning lights clear'],
  },
  {
    section: 'Cargo & Safety',
    items: ['Cargo secured properly', 'Fire extinguisher present', 'Reflective triangles / flares present', 'First aid kit present'],
  },
];

const RESULT_OPTIONS = [
  { value: 'ok', label: 'OK', icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50 border-emerald-300' },
  { value: 'defect', label: 'Defect', icon: XCircle, cls: 'text-red-600 bg-red-50 border-red-300' },
  { value: 'na', label: 'N/A', icon: null, cls: 'text-slate-400 bg-slate-50 border-slate-200' },
];

function buildInitialChecklist() {
  return CHECKLIST_SECTIONS.flatMap(s => s.items.map(item => ({ item, result: '', notes: '' })));
}

export default function PreTripChecklist() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('select'); // 'select' | 'checklist' | 'issues' | 'done'

  // Form state
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [odometer, setOdometer] = useState('');
  const [checklist, setChecklist] = useState(buildInitialChecklist());
  const [generalNotes, setGeneralNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.auth.me().catch(() => null),
      api.entities.Vehicle.filter({ status: 'active' }),
    ]).then(([u, vehs]) => {
      setUser(u);
      setVehicles(vehs);
      setLoading(false);
    });
  }, []);

  const setItemResult = (index, result) => {
    setChecklist(prev => prev.map((c, i) => i === index ? { ...c, result } : c));
  };
  const setItemNotes = (index, notes) => {
    setChecklist(prev => prev.map((c, i) => i === index ? { ...c, notes } : c));
  };

  const defects = checklist.filter(c => c.result === 'defect');
  const unanswered = checklist.filter(c => !c.result).length;
  const overallStatus = defects.length > 0 ? 'failed' : unanswered > 0 ? 'needs_attention' : 'passed';

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const handleSubmit = async () => {
    setSubmitting(true);
    const today = new Date().toISOString().split('T')[0];

    // Save inspection record
    await api.entities.Inspection.create({
      vehicle_id: selectedVehicleId,
      inspection_type: 'Pre-Trip',
      inspection_date: today,
      inspector_name: user?.full_name || 'Driver',
      odometer: odometer ? Number(odometer) : undefined,
      status: overallStatus,
      items_checked: checklist.map(c => ({ item: c.item, result: c.result || 'na', notes: c.notes })),
      notes: generalNotes,
    });

    // Auto-create a work order for each defect
    if (defects.length > 0) {
      const woNumber = `WO-${Date.now()}`;
      const complaint = defects.map(d => `• ${d.item}${d.notes ? `: ${d.notes}` : ''}`).join('\n');
      await api.entities.WorkOrder.create({
        wo_number: woNumber,
        title: `Pre-Trip Defects — Unit ${selectedVehicle?.unit_number || ''}`,
        repair_type: 'Other',
        status: 'open',
        priority: 'high',
        vehicle_id: selectedVehicleId,
        opened_date: today,
        complaint: `Pre-trip inspection defects reported by ${user?.full_name || 'Driver'}:\n${complaint}`,
      });
    }

    setSubmitting(false);
    setStep('done');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── STEP: SELECT VEHICLE ──
  if (step === 'select') return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ClipboardCheck className="w-7 h-7 text-slate-900" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Pre-Trip Inspection</h1>
          <p className="text-slate-500 text-sm mt-1">Select your vehicle to begin the checklist</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Select Vehicle *</label>
            <select
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              <option value="">Choose a vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>Unit {v.unit_number} — {v.year} {v.make} {v.model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Current Odometer (optional)</label>
            <input
              type="number"
              value={odometer}
              onChange={e => setOdometer(e.target.value)}
              placeholder="e.g. 145230"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {user && (
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
              <Truck className="w-4 h-4 text-slate-400" />
              Logged as <strong className="ml-1">{user.full_name}</strong>
            </div>
          )}

          <button
            disabled={!selectedVehicleId}
            onClick={() => setStep('checklist')}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
          >
            Start Inspection <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── STEP: CHECKLIST ──
  if (step === 'checklist') {
    let itemIndex = 0;
    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep('select')} className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="text-sm font-black text-slate-900">Unit {selectedVehicle?.unit_number} — Pre-Trip</div>
            <div className="text-xs text-slate-500">{checklist.filter(c => c.result).length} of {checklist.length} items completed</div>
          </div>
          {/* Progress bar */}
          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${(checklist.filter(c => c.result).length / checklist.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
          {CHECKLIST_SECTIONS.map(section => (
            <div key={section.section} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-800 px-4 py-3">
                <h2 className="text-sm font-black text-white">{section.section}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {section.items.map(item => {
                  const idx = itemIndex++;
                  const entry = checklist[idx];
                  return (
                    <div key={item} className={`p-4 ${entry.result === 'defect' ? 'bg-red-50' : ''}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-sm font-semibold text-slate-800 leading-snug">{item}</span>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {RESULT_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            const selected = entry.result === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => setItemResult(idx, opt.value)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${selected ? opt.cls + ' shadow-sm scale-105' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                              >
                                {Icon && <Icon className="w-3 h-3" />}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {entry.result === 'defect' && (
                        <input
                          placeholder="Describe the defect..."
                          value={entry.notes}
                          onChange={e => setItemNotes(idx, e.target.value)}
                          className="w-full border border-red-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 placeholder-red-300 mt-1"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* General notes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">Additional Notes (optional)</label>
            <textarea
              rows={3}
              value={generalNotes}
              onChange={e => setGeneralNotes(e.target.value)}
              placeholder="Any other observations or comments..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
        </div>

        {/* Sticky footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:left-64">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {defects.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-red-600 font-bold">
                <AlertTriangle className="w-4 h-4" /> {defects.length} defect{defects.length !== 1 ? 's' : ''}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? 'Submitting...' : defects.length > 0 ? `Submit & Create Work Order` : 'Submit Inspection'}
              {!submitting && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: DONE ──
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
          overallStatus === 'passed' ? 'bg-emerald-100' : overallStatus === 'failed' ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          {overallStatus === 'passed'
            ? <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            : overallStatus === 'failed'
            ? <XCircle className="w-10 h-10 text-red-600" />
            : <AlertTriangle className="w-10 h-10 text-amber-600" />}
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {overallStatus === 'passed' ? 'Inspection Passed!' : overallStatus === 'failed' ? 'Defects Reported' : 'Inspection Noted'}
        </h2>
        <p className="text-slate-500 text-sm mb-1">Unit {selectedVehicle?.unit_number} — Pre-Trip Inspection</p>

        {defects.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4 text-left mb-4">
            <div className="text-sm font-black text-red-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Work Order Created
            </div>
            <ul className="space-y-1">
              {defects.map((d, i) => (
                <li key={i} className="text-xs text-red-600">• {d.item}{d.notes ? ` — ${d.notes}` : ''}</li>
              ))}
            </ul>
            <p className="text-xs text-red-400 mt-2">A work order has been submitted to the shop for review.</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={() => { setStep('select'); setChecklist(buildInitialChecklist()); setOdometer(''); setGeneralNotes(''); setSelectedVehicleId(''); }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-3 rounded-xl text-sm transition-colors"
          >
            Start New Inspection
          </button>
        </div>
      </div>
    </div>
  );
}
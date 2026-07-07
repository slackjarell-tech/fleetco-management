import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Pen } from 'lucide-react';
import SignaturePad from '@/components/ui/SignaturePad';

export default function DVIRSignoffModal({ dvir, currentUser, onSignoff, onClose }) {
  const [notes, setNotes] = useState('');
  const [managerSignature, setManagerSignature] = useState(dvir.manager_signature_url || null);
  const [confirming, setConfirming] = useState(false);

  const defectItems = (dvir.items_checked || []).filter(i => i.result === 'defect');

  const handleSignoff = async () => {
    if (!managerSignature) return;
    setConfirming(true);
    await onSignoff(dvir.id, {
      manager_id: currentUser.id,
      manager_name: currentUser.full_name,
      manager_employee_number: currentUser.employee_number || '',
      manager_signed_at: new Date().toISOString(),
      manager_notes: notes,
      manager_signature_url: managerSignature,
      status: 'passed',
    });
    setConfirming(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" /> Fleet Manager DVIR Sign-Off
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{dvir.inspection_type} · {dvir.inspection_date}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Defects Summary */}
          {defectItems.length > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700 font-black text-sm mb-3">
                <AlertTriangle className="w-4 h-4" /> {defectItems.length} Defect(s) Reported
              </div>
              <ul className="space-y-1.5">
                {defectItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <span><span className="font-bold">{item.item}:</span> {item.notes || 'No description'}</span>
                  </li>
                ))}
              </ul>
              {dvir.defects_corrected && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Driver marked defects as corrected
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> No defects reported by driver
            </div>
          )}

          {/* Driver info */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-400">Driver:</span> <span className="font-bold text-slate-700">{dvir.inspector_name || '—'}</span></div>
              <div><span className="text-slate-400">Vehicle:</span> <span className="font-bold text-slate-700">{dvir.vehicle_id || '—'}</span></div>
              <div><span className="text-slate-400">Odometer:</span> <span className="font-bold text-slate-700">{dvir.odometer ? dvir.odometer.toLocaleString() : '—'}</span></div>
              {dvir.driver_signed_at && (
                <div><span className="text-slate-400">Driver Signed:</span> <span className="font-bold text-slate-700">{new Date(dvir.driver_signed_at).toLocaleString()}</span></div>
              )}
            </div>
          </div>

          {/* Manager notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Manager Comments</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              placeholder="Optional notes, corrective actions taken, etc."
            />
          </div>

          {/* Manager signature */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-black text-slate-700 uppercase tracking-wide">Manager Sign-Off — 49 CFR §396.11</div>
            <p className="text-xs text-slate-600">
              By signing below, you certify that you have reviewed this DVIR and all reported defects have been addressed or corrected.
            </p>
            <SignaturePad
              label="Fleet Manager Signature"
              existingSignature={managerSignature}
              onSignatureChange={setManagerSignature}
              required={true}
              signerName={currentUser.full_name}
              employeeNumber={currentUser.employee_number}
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose}
            className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-lg text-sm">
            Cancel
          </button>
          <button
            onClick={handleSignoff}
            disabled={confirming || !managerSignature}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-black px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {confirming ? 'Signing Off...' : 'Approve & Sign Off'}
          </button>
        </div>
      </div>
    </div>
  );
}
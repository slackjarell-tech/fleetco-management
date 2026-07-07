import React, { useState } from 'react';
import { Scale, CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';
import { api } from '@/api/apiClient';

const MAX_WEIGHTS = {
  gross: 80000,
  steer: 12000,
  drive: 34000,
  trailer: 34000,
};

const STATUS_STYLES = {
  not_weighed: 'bg-slate-100 text-slate-600',
  pass: 'bg-green-100 text-green-700',
  overweight: 'bg-red-100 text-red-700',
  reweigh_needed: 'bg-amber-100 text-amber-700',
};

export default function WeightScaleModal({ load, onClose, onSaved }) {
  const [form, setForm] = useState({
    scale_weight_lbs: load.scale_weight_lbs || '',
    scale_location: load.scale_location || '',
    scale_ticket_number: load.scale_ticket_number || '',
    scale_date: load.scale_date || new Date().toISOString().split('T')[0],
    scale_status: load.scale_status || 'not_weighed',
    axle_weights: load.axle_weights || { steer: '', drive: '', trailer: '' },
    scale_notes: load.scale_notes || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setAxle = (axle, value) => setForm(f => ({ ...f, axle_weights: { ...f.axle_weights, [axle]: value } }));

  const gross = Number(form.scale_weight_lbs) || 0;
  const steer = Number(form.axle_weights?.steer) || 0;
  const drive = Number(form.axle_weights?.drive) || 0;
  const trailer = Number(form.axle_weights?.trailer) || 0;

  const violations = [];
  if (gross > MAX_WEIGHTS.gross) violations.push(`Gross weight ${gross.toLocaleString()} lbs exceeds 80,000 lb federal limit`);
  if (steer > MAX_WEIGHTS.steer) violations.push(`Steer axle ${steer.toLocaleString()} lbs exceeds 12,000 lb limit`);
  if (drive > MAX_WEIGHTS.drive) violations.push(`Drive axle ${drive.toLocaleString()} lbs exceeds 34,000 lb limit`);
  if (trailer > MAX_WEIGHTS.trailer) violations.push(`Trailer axle ${trailer.toLocaleString()} lbs exceeds 34,000 lb limit`);

  const autoStatus = gross === 0 ? 'not_weighed' : violations.length > 0 ? 'overweight' : 'pass';

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      scale_weight_lbs: gross || null,
      scale_status: autoStatus,
      axle_weights: {
        steer: steer || null,
        drive: drive || null,
        trailer: trailer || null,
      },
    };
    await api.entities.Load.update(load.id, data);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Scale className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-black text-slate-900">Weight Scale Report</div>
              <div className="text-xs text-slate-500">Load #{load.load_number}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Legal weight limits info */}
          <div className="bg-slate-50 rounded-xl p-3 flex gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>Federal limits: <strong>80,000 lbs</strong> gross · <strong>12,000</strong> steer · <strong>34,000</strong> drive · <strong>34,000</strong> trailer axle</div>
          </div>

          {/* Gross Weight */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Gross Weight (lbs) *</label>
            <input
              type="number"
              value={form.scale_weight_lbs}
              onChange={e => set('scale_weight_lbs', e.target.value)}
              placeholder="e.g. 74500"
              className={`w-full border rounded-lg px-3 py-2.5 text-lg font-black focus:outline-none focus:ring-2 focus:ring-amber-400 ${gross > MAX_WEIGHTS.gross ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {gross > 0 && (
              <div className={`mt-1 text-xs font-semibold flex items-center gap-1 ${gross > MAX_WEIGHTS.gross ? 'text-red-600' : 'text-green-600'}`}>
                {gross > MAX_WEIGHTS.gross ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                {gross > MAX_WEIGHTS.gross ? `${(gross - MAX_WEIGHTS.gross).toLocaleString()} lbs OVER the limit` : `${(MAX_WEIGHTS.gross - gross).toLocaleString()} lbs under limit — OK`}
              </div>
            )}
          </div>

          {/* Axle Weights */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Axle Weights (lbs)</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'steer', label: 'Steer', max: MAX_WEIGHTS.steer },
                { key: 'drive', label: 'Drive', max: MAX_WEIGHTS.drive },
                { key: 'trailer', label: 'Trailer', max: MAX_WEIGHTS.trailer },
              ].map(({ key, label, max }) => {
                const val = Number(form.axle_weights?.[key]) || 0;
                const over = val > max;
                return (
                  <div key={key}>
                    <div className="text-xs text-slate-500 mb-1 font-semibold">{label}</div>
                    <input
                      type="number"
                      value={form.axle_weights?.[key] || ''}
                      onChange={e => setAxle(key, e.target.value)}
                      placeholder="lbs"
                      className={`w-full border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 ${over ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200'}`}
                    />
                    {val > 0 && (
                      <div className={`text-xs mt-0.5 font-medium ${over ? 'text-red-600' : 'text-green-600'}`}>
                        {over ? `+${(val - max).toLocaleString()} over` : '✓ OK'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Violations banner */}
          {violations.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-black text-red-700 text-sm">Weight Violations Detected</span>
              </div>
              <ul className="space-y-1">
                {violations.map((v, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <span className="mt-0.5">•</span>{v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scale Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Scale Date</label>
              <input type="date" value={form.scale_date} onChange={e => set('scale_date', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Ticket #</label>
              <input type="text" value={form.scale_ticket_number} onChange={e => set('scale_ticket_number', e.target.value)}
                placeholder="Scale receipt #"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Scale Location</label>
              <input type="text" value={form.scale_location} onChange={e => set('scale_location', e.target.value)}
                placeholder="Weigh station or truck stop name/address"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Notes</label>
              <textarea value={form.scale_notes} onChange={e => set('scale_notes', e.target.value)}
                rows={2} placeholder="Any additional notes about this weigh-in..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
            </div>
          </div>

          {/* Result badge */}
          {gross > 0 && (
            <div className={`rounded-xl p-3 text-center font-black text-sm ${STATUS_STYLES[autoStatus]}`}>
              {autoStatus === 'pass' && '✓ WEIGHT CHECK PASSED'}
              {autoStatus === 'overweight' && '⚠ OVERWEIGHT — DO NOT PROCEED'}
              {autoStatus === 'not_weighed' && 'Not Weighed Yet'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl text-sm font-black disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Weight Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
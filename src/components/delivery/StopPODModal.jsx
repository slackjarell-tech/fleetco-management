import React, { useState, useRef } from 'react';
import { api } from '@/api/apiClient';
import { X, Camera, CheckCircle2, AlertTriangle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FAILURE_REASONS = [
  { value: 'nobody_home', label: 'Nobody Home' },
  { value: 'wrong_address', label: 'Wrong Address' },
  { value: 'refused', label: 'Refused Delivery' },
  { value: 'damaged', label: 'Package Damaged' },
  { value: 'other', label: 'Other' },
];

export default function StopPODModal({ stop, onSave, onClose }) {
  const [status, setStatus] = useState('delivered');
  const [failureReason, setFailureReason] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      status,
      failure_reason: status === 'failed' ? failureReason : undefined,
      pod_photo_url: photoUrl || undefined,
      pod_notes: notes || undefined,
    });
    setSaving(false);
  };

  const fullAddress = [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ');

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl">
          <div>
            <div className="text-white font-black">Record Proof of Delivery</div>
            <div className="text-slate-400 text-xs mt-0.5 truncate">{stop.recipient_name} — {fullAddress}</div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          {/* Delivery Status */}
          <div>
            <div className="text-xs font-black text-slate-500 uppercase mb-2">Delivery Status *</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStatus('delivered')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  status === 'delivered' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-green-300'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" /> Delivered
              </button>
              <button
                onClick={() => setStatus('failed')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  status === 'failed' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:border-red-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5" /> Failed
              </button>
            </div>
          </div>

          {/* Failure reason */}
          {status === 'failed' && (
            <div>
              <div className="text-xs font-black text-slate-500 uppercase mb-2">Reason</div>
              <div className="grid grid-cols-2 gap-2">
                {FAILURE_REASONS.map(r => (
                  <button key={r.value} onClick={() => setFailureReason(r.value)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                      failureReason === r.value ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:border-red-200'
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <div className="text-xs font-black text-slate-500 uppercase mb-2">Photo Evidence</div>
            <input type="file" accept="image/*" capture="environment" ref={fileRef} className="hidden" onChange={handlePhotoUpload} />
            {photoUrl ? (
              <div className="relative">
                <img src={photoUrl} alt="POD" className="w-full rounded-xl max-h-48 object-cover border border-slate-200" />
                <button onClick={() => setPhotoUrl('')} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                  <X className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center gap-2 text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
              >
                {uploading ? (
                  <div className="w-6 h-6 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-8 h-8" />
                )}
                <span className="text-sm font-semibold">{uploading ? 'Uploading…' : 'Take Photo or Upload'}</span>
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs font-black text-slate-500 uppercase mb-2">Driver Notes</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Left at door, signed by tenant, etc."
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className={`flex-1 font-bold ${status === 'delivered' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
            onClick={handleSave}
            disabled={saving || (status === 'failed' && !failureReason)}
          >
            {saving ? 'Saving…' : status === 'delivered' ? '✓ Confirm Delivery' : '✗ Mark Failed'}
          </Button>
        </div>
      </div>
    </div>
  );
}
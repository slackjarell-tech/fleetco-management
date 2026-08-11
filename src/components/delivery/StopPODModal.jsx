import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { X, Camera, CheckCircle2, AlertTriangle, PenLine, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SignaturePad from '@/components/ui/SignaturePad';
import CameraCapture from '@/components/driver/CameraCapture';

const FAILURE_REASONS = [
  { value: 'nobody_home', label: 'Nobody Home' },
  { value: 'wrong_address', label: 'Wrong Address' },
  { value: 'refused', label: 'Refused Delivery' },
  { value: 'damaged', label: 'Package Damaged' },
  { value: 'business_closed', label: 'Business Closed' },
  { value: 'other', label: 'Other' },
];

const SAFE_PLACE_OPTIONS = [
  { value: 'front_door', label: 'Front door / porch' },
  { value: 'rear_door', label: 'Rear / side door' },
  { value: 'garage', label: 'Garage / carport' },
  { value: 'mailbox', label: 'Mailbox / parcel locker' },
  { value: 'neighbor', label: 'Neighbor / alternate' },
  { value: 'office', label: 'Office / front desk' },
];

const POD_METHODS = [
  { value: 'signature', label: 'Recipient Signature', icon: PenLine },
  { value: 'virtual', label: 'Virtual POD (photo)', icon: ImageIcon },
  { value: 'safe_place', label: 'Safe Place Drop', icon: CheckCircle2 },
];

export default function StopPODModal({ stop, onSave, onClose, deliverySettings = {} }) {
  const requireSignature = !!deliverySettings.require_pod_signature;
  const allowVirtual = deliverySettings.allow_virtual_pod !== false;

  const defaultMethod = requireSignature ? 'signature' : 'virtual';
  const [status, setStatus] = useState('delivered');
  const [podMethod, setPodMethod] = useState(defaultMethod);
  const [failureReason, setFailureReason] = useState('');
  const [safePlace, setSafePlace] = useState('');
  const [recipientName, setRecipientName] = useState(stop.recipient_name || '');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const availableMethods = POD_METHODS.filter((m) => {
    if (m.value === 'virtual' && !allowVirtual) return false;
    return true;
  });

  const handleSave = async () => {
    if (status === 'delivered') {
      if (podMethod === 'signature' && !signatureUrl) return;
      if ((podMethod === 'virtual' || podMethod === 'safe_place') && !photoUrl) return;
      if (podMethod === 'safe_place' && !safePlace) return;
    }

    setSaving(true);
    let sigUpload = signatureUrl;
    if (signatureUrl?.startsWith('data:')) {
      const blob = await (await fetch(signatureUrl)).blob();
      const file = new File([blob], `pod-signature-${Date.now()}.png`, { type: 'image/png' });
      const up = await api.integrations.Core.UploadFile({ file });
      sigUpload = up.file_url;
    }

    await onSave({
      status,
      failure_reason: status === 'failed' ? failureReason : undefined,
      pod_photo_url: photoUrl || undefined,
      pod_signature_url: sigUpload || undefined,
      pod_method: status === 'delivered' ? podMethod : undefined,
      safe_place: podMethod === 'safe_place' ? safePlace : undefined,
      pod_recipient_name: recipientName || stop.recipient_name,
      pod_notes: notes || undefined,
    });
    setSaving(false);
  };

  const fullAddress = [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ');

  const canSubmit = status === 'failed'
    ? !!failureReason
    : podMethod === 'signature'
      ? !!signatureUrl
      : podMethod === 'safe_place'
        ? !!photoUrl && !!safePlace
        : !!photoUrl;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl sticky top-0 z-10">
          <div>
            <div className="text-white font-black">Proof of Delivery</div>
            <div className="text-slate-400 text-xs mt-0.5 truncate">{stop.recipient_name} — {fullAddress}</div>
            {stop.tracking_number && (
              <div className="text-amber-400/80 text-[10px] font-mono mt-0.5">#{stop.tracking_number}</div>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <div className="text-xs font-black text-slate-500 uppercase mb-2">Delivery Status *</div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setStatus('delivered')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm ${status === 'delivered' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'}`}>
                <CheckCircle2 className="w-5 h-5" /> Delivered
              </button>
              <button type="button" onClick={() => setStatus('failed')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm ${status === 'failed' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500'}`}>
                <AlertTriangle className="w-5 h-5" /> Failed
              </button>
            </div>
          </div>

          {status === 'failed' && (
            <div>
              <div className="text-xs font-black text-slate-500 uppercase mb-2">Reason</div>
              <div className="grid grid-cols-2 gap-2">
                {FAILURE_REASONS.map((r) => (
                  <button key={r.value} type="button" onClick={() => setFailureReason(r.value)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold ${failureReason === r.value ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {status === 'delivered' && (
            <>
              <div>
                <div className="text-xs font-black text-slate-500 uppercase mb-2">POD Method</div>
                <div className="grid gap-2">
                  {availableMethods.map((m) => (
                    <button key={m.value} type="button" onClick={() => setPodMethod(m.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold text-left ${podMethod === m.value ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-200 text-slate-600'}`}>
                      <m.icon className="w-4 h-4" /> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-500 uppercase mb-2">Recipient Name</div>
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>

              {podMethod === 'safe_place' && (
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase mb-2">Safe Place</div>
                  <div className="grid grid-cols-2 gap-2">
                    {SAFE_PLACE_OPTIONS.map((o) => (
                      <button key={o.value} type="button" onClick={() => setSafePlace(o.value)}
                        className={`px-2 py-2 rounded-lg border text-xs font-semibold ${safePlace === o.value ? 'border-amber-400 bg-amber-50' : 'border-slate-200 text-slate-500'}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {podMethod === 'signature' && (
                <SignaturePad
                  label="Recipient Signature *"
                  signerName={recipientName}
                  onSignatureChange={setSignatureUrl}
                  required
                />
              )}

              {(podMethod === 'virtual' || podMethod === 'safe_place' || podMethod === 'signature') && (
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase mb-2">
                    {podMethod === 'signature' ? 'Delivery Photo (optional)' : 'Photo Evidence *'}
                  </div>
                  {photoUrl ? (
                    <div className="relative">
                      <img src={photoUrl} alt="POD" className="w-full rounded-xl max-h-48 object-cover border" />
                      <button type="button" onClick={() => setPhotoUrl('')} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <CameraCapture
                      buttonLabel="Capture POD Photo"
                      onCapture={(url) => setPhotoUrl(url)}
                    />
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <div className="text-xs font-black text-slate-500 uppercase mb-2">Driver Notes</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Gate code, handed to resident, etc."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5 sticky bottom-0 bg-white pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className={`flex-1 font-bold ${status === 'delivered' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
            onClick={handleSave}
            disabled={saving || !canSubmit}
          >
            {saving ? 'Saving…' : status === 'delivered' ? '✓ Confirm Delivery' : '✗ Mark Failed'}
          </Button>
        </div>
      </div>
    </div>
  );
}

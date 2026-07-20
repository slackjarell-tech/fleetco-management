import React, { useState } from 'react';
import { X, Truck, Eye, EyeOff, Copy, CheckCircle2, AlertTriangle, Upload, Plus, Trash2 } from 'lucide-react';
import { api, getViewAsCustomerId } from '@/api/apiClient';
import { DRIVER_DOC_TYPES } from '@/components/drivers/DriverDocuments';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function emptyPendingDoc() {
  return { id: crypto.randomUUID(), doc_type: DRIVER_DOC_TYPES[0], name: '', expiration_date: '', file: null };
}

export default function CreateDriverModal({ onClose, onCreated, currentUser }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    license_number: '',
    license_state: '',
    license_expiry: '',
    temp_password: generateTempPassword(),
    status: 'active',
  });
  const [pendingDocs, setPendingDocs] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const regeneratePassword = () => set('temp_password', generateTempPassword());

  const copyCredentials = () => {
    const text = `FleetCo Driver Account\nEmail: ${form.email}\nTemp Password: ${form.temp_password}\nPlease change your password after first login.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addPendingDoc = () => setPendingDocs(d => [...d, emptyPendingDoc()]);

  const updatePendingDoc = (id, patch) => {
    setPendingDocs(d => d.map(row => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removePendingDoc = (id) => {
    setPendingDocs(d => d.filter(row => row.id !== id));
  };

  const uploadPendingDocs = async (driverId) => {
    const withFiles = pendingDocs.filter(d => d.file);
    for (const doc of withFiles) {
      const { file_url } = await api.integrations.Core.UploadFile({ file: doc.file });
      await api.entities.DriverDocument.create({
        driver_id: driverId,
        customer_id: currentUser?.customer_id || undefined,
        doc_type: doc.doc_type,
        name: doc.name || doc.file.name,
        file_url,
        expiration_date: doc.expiration_date || undefined,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.temp_password) {
      setError('Name, email, and temp password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const customerId = currentUser?.customer_id || getViewAsCustomerId() || undefined;
      const payload = {
        email: form.email.trim(),
        tempPassword: form.temp_password,
        role: 'driver',
        fullName: form.full_name.trim(),
        phone: form.phone || undefined,
        license_number: form.license_number || undefined,
        license_state: form.license_state || undefined,
        license_expiry: form.license_expiry || undefined,
        status: form.status,
      };
      if (customerId) payload.customerId = customerId;

      const result = await api.functions.invoke('createUserAccount', payload);
      const driverId = result?.user_id;
      if (!driverId) throw new Error('Account created but user ID was not returned.');

      if (pendingDocs.some(d => d.file)) {
        await uploadPendingDocs(driverId);
      }

      setSuccess({
        email: form.email,
        temp_password: form.temp_password,
        full_name: form.full_name,
        driver_number: result.employee_number || null,
        docsUploaded: pendingDocs.filter(d => d.file).length,
      });
      if (onCreated) onCreated(driverId);
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Failed to create driver account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Add Driver</h2>
              <p className="text-xs text-slate-500">Account, CDL info & document uploads</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        {success ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
              <CheckCircle2 className="w-5 h-5" /> Driver account created successfully!
            </div>
            {success.driver_number && (
              <p className="text-sm text-slate-700">
                System driver number: <span className="font-mono font-bold text-amber-700">{success.driver_number}</span>
              </p>
            )}
            {success.docsUploaded > 0 && (
              <p className="text-sm text-slate-600">{success.docsUploaded} document{success.docsUploaded > 1 ? 's' : ''} uploaded.</p>
            )}
            <div className="bg-slate-900 rounded-xl p-4 space-y-2">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-3">Login Credentials — Share Securely</p>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Email</span>
                <span className="text-amber-400 font-mono text-sm">{success.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Temp Password</span>
                <span className="text-amber-400 font-mono text-sm font-bold">{success.temp_password}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-xs text-slate-500">Driver should change password after first login.</p>
              </div>
            </div>
            <button
              onClick={copyCredentials}
              className="w-full flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg text-sm"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Credentials'}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-2.5 rounded-lg text-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  value={form.full_name} onChange={e => set('full_name', e.target.value)} required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email *</label>
                <input
                  type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="driver@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
              <input
                value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="(555) 000-0000"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">CDL #</label>
                <input
                  value={form.license_number} onChange={e => set('license_number', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="CDL Number"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">State</label>
                <input
                  value={form.license_state} onChange={e => set('license_state', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="TX"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">CDL Expiry</label>
                <input
                  type="date" value={form.license_expiry} onChange={e => set('license_expiry', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Temporary Password *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.temp_password}
                    onChange={e => set('temp_password', e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="button" onClick={regeneratePassword}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-3 py-2 rounded-lg text-xs whitespace-nowrap">
                  Regenerate
                </button>
              </div>
            </div>

            {/* Document uploads */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-700 uppercase">Documents</div>
                  <p className="text-xs text-slate-500 mt-0.5">DL, insurance card, medical card, etc.</p>
                </div>
                <button type="button" onClick={addPendingDoc}
                  className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-600">
                  <Plus className="w-3.5 h-3.5" /> Add file
                </button>
              </div>

              {pendingDocs.length === 0 && (
                <button type="button" onClick={addPendingDoc}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg py-3 text-xs text-slate-500 hover:border-amber-400 hover:text-amber-600">
                  <Upload className="w-4 h-4" /> Upload driver&apos;s license, insurance card…
                </button>
              )}

              {pendingDocs.map(doc => (
                <div key={doc.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={doc.doc_type}
                      onChange={e => updatePendingDoc(doc.id, { doc_type: e.target.value })}
                      className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                    >
                      {DRIVER_DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button type="button" onClick={() => removePendingDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={doc.name}
                      onChange={e => updatePendingDoc(doc.id, { name: e.target.value })}
                      placeholder="Label (optional)"
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                    />
                    <input
                      type="date"
                      value={doc.expiration_date}
                      onChange={e => updatePendingDoc(doc.id, { expiration_date: e.target.value })}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                    />
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updatePendingDoc(doc.id, {
                          file,
                          name: doc.name || file.name.replace(/\.[^.]+$/, ''),
                        });
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-700"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Account Status</label>
              <div className="flex gap-2">
                {['active', 'suspended'].map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => set('status', s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all capitalize ${
                      form.status === s
                        ? s === 'active' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-400 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 border border-slate-300 text-slate-700 font-bold py-2.5 rounded-lg text-sm hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-black py-2.5 rounded-lg text-sm">
                {loading ? 'Creating...' : 'Create Driver'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

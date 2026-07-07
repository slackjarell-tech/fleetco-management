import React, { useState } from 'react';
import { X, Truck, Eye, EyeOff, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '@/api/apiClient';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.temp_password) {
      setError('Name, email, and temp password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Invite the user with driver role
      await api.users.inviteUser(form.email, 'driver');

      // Save driver metadata (name, phone, license, temp_password, status)
      // We update the user record after invitation
      const allUsers = await api.entities.User.list();
      const newUser = allUsers.find(u => u.email === form.email);
      if (newUser) {
        await api.entities.User.update(newUser.id, {
          phone: form.phone,
          license_number: form.license_number,
          license_state: form.license_state,
          license_expiry: form.license_expiry,
          temp_password: form.temp_password,
          status: form.status,
        });
      }

      setSuccess({
        email: form.email,
        temp_password: form.temp_password,
        full_name: form.full_name,
      });
      if (onCreated) onCreated();
    } catch (err) {
      setError(err?.message || 'Failed to create driver account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Create Driver Account</h2>
              <p className="text-xs text-slate-500">Admin-provisioned driver login</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        {success ? (
          /* Success screen */
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
              <CheckCircle2 className="w-5 h-5" /> Driver account created successfully!
            </div>
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
                <p className="text-xs text-slate-500">⚠ Driver should change password after first login.</p>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name & Email */}
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

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
              <input
                value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="(555) 000-0000"
              />
            </div>

            {/* CDL */}
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
                <label className="block text-xs font-bold text-slate-600 mb-1">Expiry</label>
                <input
                  type="date" value={form.license_expiry} onChange={e => set('license_expiry', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Temp Password */}
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
              <p className="text-xs text-slate-400 mt-1">Driver will use this to log in. Remind them to change it.</p>
            </div>

            {/* Status toggle */}
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
                {loading ? 'Creating...' : 'Create Driver Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
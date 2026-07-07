import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

export default function CustomerModal({ customer, fleetManagers, fleetCoordinators, onSave, onClose }) {
  const isEditing = !!customer;
  const [form, setForm] = useState(customer || {
    company_name: '', contact_name: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '',
    mc_number: '', dot_number: '', fleet_size: '',
    status: 'active', assigned_manager_id: '', assigned_coordinator_id: '', notes: ''
  });
  const [createLogin, setCreateLogin] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    const loginData = createLogin ? { tempPassword, loginRole: 'user' } : null;
    await onSave(form, loginData);
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-900 rounded-t-2xl">
          <div>
            <h2 className="text-white font-black text-lg">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
            <p className="text-slate-400 text-xs mt-0.5">Company & contact information</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Company */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Company Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
                <input required value={form.company_name} onChange={e => set('company_name', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MC Number</label>
                <input value={form.mc_number} onChange={e => set('mc_number', e.target.value)}
                  placeholder="MC-000000" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">DOT Number</label>
                <input value={form.dot_number} onChange={e => set('dot_number', e.target.value)}
                  placeholder="0000000" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fleet Size</label>
                <input type="number" value={form.fleet_size} onChange={e => set('fleet_size', e.target.value)}
                  placeholder="# of vehicles" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="prospect">Prospect</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Name *</label>
                <input required value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <input value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="Street address" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <input value={form.city} onChange={e => set('city', e.target.value)}
                  placeholder="City" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <input value={form.state} onChange={e => set('state', e.target.value)}
                  placeholder="State" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <input value={form.zip} onChange={e => set('zip', e.target.value)}
                  placeholder="ZIP" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* Team Assignment */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">FleetCo Team Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fleet Manager</label>
                <select value={form.assigned_manager_id} onChange={e => set('assigned_manager_id', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">— Unassigned —</option>
                  {fleetManagers.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fleet Coordinator</label>
                <select value={form.assigned_coordinator_id} onChange={e => set('assigned_coordinator_id', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">— Unassigned —</option>
                  {fleetCoordinators.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Create Portal Login (new customers only) */}
          {!isEditing && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Portal Access</h3>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input type="checkbox" checked={createLogin} onChange={e => setCreateLogin(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400" />
                <span className="text-sm font-semibold text-slate-700">Create portal login for this customer</span>
              </label>
              {createLogin && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Temp Password *</label>
                    <input type="text" required={createLogin} value={tempPassword} onChange={e => setTempPassword(e.target.value)}
                      placeholder="e.g. Temp123!"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <p className="text-xs text-amber-700">A welcome email with their login details will be sent to the contact email. They'll also receive a separate setup email to set their password. The customer will have portal access as a standard user.</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Internal notes..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={creating}
              className="px-5 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg disabled:opacity-60">
              {creating ? 'Creating...' : customer ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
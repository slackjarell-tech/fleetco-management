import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Mail, Plus, User, Shield, AtSign, KeyRound, Building2, Crown } from 'lucide-react';
import { FLEETCO_EMAIL_DOMAIN, normalizeFleetCoEmail } from '@/lib/domain';

const MAILBOX_TYPES = [
  { value: 'employee', label: 'Employee', desc: 'Staff member with @fleetcomanagement.org address' },
  { value: 'department', label: 'Department', desc: 'Shared inbox (dispatch, billing, etc.)' },
  { value: 'alias', label: 'Alias', desc: 'Forwarder or role-based address' },
];

const PORTAL_ROLES = [
  { value: 'executive', label: 'Executive' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'fleet_coordinator', label: 'Fleet Coordinator' },
];

export default function DomainEmails() {
  const [user, setUser] = useState(null);
  const [mailboxes, setMailboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localPart, setLocalPart] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mailboxType, setMailboxType] = useState('employee');
  const [createPortal, setCreatePortal] = useState(true);
  const [portalRole, setPortalRole] = useState('fleet_coordinator');
  const [tempPassword, setTempPassword] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const previewEmail = normalizeFleetCoEmail(localPart);

  const load = async () => {
    const u = await api.auth.me();
    setUser(u);
    if (u?.role !== 'owner') {
      setLoading(false);
      return;
    }
    const list = await api.entities.DomainEmail.list('-created_date');
    setMailboxes(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');
    setError('');
    try {
      const result = await api.functions.invoke('createDomainEmail', {
        localPart,
        displayName,
        mailboxType,
        createPortalAccess: mailboxType === 'employee' ? createPortal : false,
        portalRole,
        tempPassword: createPortal && mailboxType === 'employee' ? tempPassword : '',
        employeeNumber,
        notes,
      });
      setMessage(result.message || `${previewEmail} created.`);
      setLocalPart('');
      setDisplayName('');
      setTempPassword('');
      setEmployeeNumber('');
      setNotes('');
      load();
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Failed to create email');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'owner') {
    return (
      <div className="flex items-center justify-center h-64 p-6">
        <div className="text-center text-slate-500">
          <Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Owner access required</p>
          <p className="text-sm mt-1">Only JaRell Slack (owner) can manage company email addresses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Mail className="w-7 h-7 text-amber-500" />
          Company Email Addresses
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Create and manage <strong>@{FLEETCO_EMAIL_DOMAIN}</strong> addresses for FleetCo employees and departments.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium">{message}</div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
      )}

      <div className="bg-slate-900 rounded-2xl p-6 text-white">
        <h2 className="font-black text-lg mb-1 flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-400" />
          Create @fleetcomanagement.org Email
        </h2>
        <p className="text-slate-400 text-sm mb-5">
          Registers the address in FleetCo and optionally creates portal login. Set up the actual mailbox in IONOS Email &amp; Office to receive mail.
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Email address *</label>
              <div className="flex rounded-lg overflow-hidden bg-white">
                <input
                  required
                  value={localPart}
                  onChange={(e) => setLocalPart(e.target.value.replace(/@.*/, ''))}
                  placeholder="jane.doe"
                  className="flex-1 px-3 py-2.5 text-slate-900 text-sm focus:outline-none"
                />
                <span className="flex items-center px-3 bg-slate-100 text-slate-600 text-sm font-semibold border-l border-slate-200">
                  @{FLEETCO_EMAIL_DOMAIN}
                </span>
              </div>
              {previewEmail && (
                <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1">
                  <AtSign className="w-3 h-3" /> {previewEmail}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2.5 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Type</label>
              <select
                value={mailboxType}
                onChange={(e) => {
                  setMailboxType(e.target.value);
                  if (e.target.value !== 'employee') setCreatePortal(false);
                }}
                className="w-full px-3 py-2.5 rounded-lg text-slate-900 text-sm font-semibold"
              >
                {MAILBOX_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {mailboxType === 'employee' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Portal role</label>
                  <select
                    value={portalRole}
                    onChange={(e) => setPortalRole(e.target.value)}
                    disabled={!createPortal}
                    className="w-full px-3 py-2.5 rounded-lg text-slate-900 text-sm font-semibold disabled:opacity-50"
                  >
                    {PORTAL_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Employee #</label>
                  <input
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2.5 rounded-lg text-slate-900 text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {mailboxType === 'employee' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createPortal}
                onChange={(e) => setCreatePortal(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500"
              />
              <span className="text-sm text-slate-300">Also create portal login for this employee</span>
            </label>
          )}

          {mailboxType === 'employee' && createPortal && (
            <div className="relative max-w-sm">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required={createPortal}
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Temp portal password"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-slate-900 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Notes (internal)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. IONOS mailbox created 7/7/2026"
              className="w-full px-3 py-2.5 rounded-lg text-slate-900 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={creating || !previewEmail}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-2.5 rounded-lg text-sm disabled:opacity-60"
          >
            <Mail className="w-4 h-4" />
            {creating ? 'Creating…' : 'Create Company Email'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-900">All Company Emails ({mailboxes.length})</h2>
        </div>
        {mailboxes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <AtSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No company emails yet — create your first @fleetcomanagement.org address above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {mailboxes.map((mb) => (
              <div key={mb.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {mb.mailbox_type === 'department' ? (
                    <Building2 className="w-5 h-5 text-amber-600" />
                  ) : (
                    <User className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900">{mb.email}</div>
                  <div className="text-sm text-slate-500">{mb.display_name}</div>
                  {mb.notes && <div className="text-xs text-slate-400 mt-0.5">{mb.notes}</div>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 capitalize">
                    {mb.mailbox_type}
                  </span>
                  {mb.has_portal_access && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {mb.portal_role?.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                    mb.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {mb.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <strong>IONOS setup:</strong> After creating an address here, log in to IONOS → Email &amp; Office → create the matching mailbox so mail actually delivers. Portal login works immediately; email delivery requires IONOS.
      </div>
    </div>
  );
}

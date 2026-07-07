import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Mail, Plus, User, Shield, AtSign, KeyRound, Building2, Users, ChevronRight, Loader2 } from 'lucide-react';
import { FLEETCO_EMAIL_DOMAIN, normalizeFleetCoEmail, isFleetCoDomainEmail } from '@/lib/domain';
import { isSLT } from '@/lib/roles';

const MAILBOX_TYPES = [
  { value: 'employee', label: 'Employee' },
  { value: 'department', label: 'Department' },
  { value: 'alias', label: 'Alias' },
];

const PORTAL_ROLES = [
  { value: 'executive', label: 'Executive' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'fleet_coordinator', label: 'Fleet Coordinator' },
];

const INTERNAL_EMPLOYEE_ROLES = ['executive', 'fleet_manager', 'fleet_coordinator'];

function suggestLocalPart(user) {
  const base = user.full_name || user.email?.split('@')[0] || 'employee';
  return base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.');
}

export default function FleetCoEmailAccessPanel({ variant = 'full', user: userProp }) {
  const [user, setUser] = useState(userProp || null);
  const [mailboxes, setMailboxes] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
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
  const [grantingId, setGrantingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isCompact = variant === 'dashboard';
  const previewEmail = normalizeFleetCoEmail(localPart);

  const load = async () => {
    const u = userProp || (await api.auth.me());
    setUser(u);
    if (!isSLT(u?.role)) {
      setLoading(false);
      return;
    }
    const [list, users] = await Promise.all([
      api.entities.DomainEmail.list('-created_date'),
      api.entities.User.list(),
    ]);
    setMailboxes(list);
    setTeamUsers(users.filter((x) => INTERNAL_EMPLOYEE_ROLES.includes(x.role)));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userProp?.id]);

  const mailboxByEmail = useMemo(() => {
    const map = {};
    mailboxes.forEach((mb) => { map[mb.email.toLowerCase()] = mb; });
    return map;
  }, [mailboxes]);

  const employeesNeedingEmail = useMemo(() => {
    return teamUsers.filter((u) => {
      if (isFleetCoDomainEmail(u.email) && mailboxByEmail[u.email.toLowerCase()]) return false;
      const linked = mailboxes.some((mb) => mb.linked_user_id === u.id);
      return !linked;
    });
  }, [teamUsers, mailboxes, mailboxByEmail]);

  const resetForm = () => {
    setLocalPart('');
    setDisplayName('');
    setTempPassword('');
    setEmployeeNumber('');
    setNotes('');
  };

  const handleCreate = async (e) => {
    e?.preventDefault();
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
      resetForm();
      load();
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Failed to create email');
    } finally {
      setCreating(false);
    }
  };

  const handleQuickGrant = async (member) => {
    const local = suggestLocalPart(member);
    const pwd = `Fleet${Math.random().toString(36).slice(2, 8)}!`;
    const hasPortal = !!member.email && !isFleetCoDomainEmail(member.email);
    setGrantingId(member.id);
    setMessage('');
    setError('');
    try {
      const result = await api.functions.invoke('createDomainEmail', {
        localPart: local,
        displayName: member.full_name,
        mailboxType: 'employee',
        createPortalAccess: !hasPortal,
        linkExistingUserId: hasPortal ? member.id : undefined,
        portalRole: member.role === 'executive' ? 'executive' : member.role,
        tempPassword: hasPortal ? undefined : pwd,
        employeeNumber: member.employee_number || '',
        notes: `Granted by SLT from ${user?.email}`,
      });
      setMessage(hasPortal ? result.message : `${result.message} Temp password: ${pwd}`);
      load();
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Failed to grant email');
    } finally {
      setGrantingId(null);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${isCompact ? 'py-8' : 'h-64'}`}>
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!isSLT(user?.role)) return null;

  return (
    <div className={isCompact ? 'space-y-4' : 'space-y-6'}>
      {!isCompact && (
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Mail className="w-7 h-7 text-amber-500" />
            Company Email Addresses
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            SLT can grant <strong>@{FLEETCO_EMAIL_DOMAIN}</strong> access to all FleetCo employees.
          </p>
        </div>
      )}

      {isCompact && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-400" />
              FleetCo Employee Email Access
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              SLT — grant <span className="text-amber-400 font-semibold">@{FLEETCO_EMAIL_DOMAIN}</span> to your team from the home dashboard.
            </p>
          </div>
          <Link
            to="/portal/domain-emails"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm font-bold"
          >
            Full email admin <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-xl text-sm font-medium ${isCompact ? 'bg-green-900/30 border border-green-800 text-green-400' : 'bg-green-50 border border-green-200 text-green-800'}`}>
          {message}
        </div>
      )}
      {error && (
        <div className={`p-3 rounded-xl text-sm font-medium ${isCompact ? 'bg-red-900/30 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {error}
        </div>
      )}

      {employeesNeedingEmail.length > 0 && (
        <div className={`rounded-xl border ${isCompact ? 'bg-slate-800/80 border-slate-700' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`px-4 py-3 border-b flex items-center gap-2 ${isCompact ? 'border-slate-700' : 'border-amber-200'}`}>
            <Users className={`w-4 h-4 ${isCompact ? 'text-amber-400' : 'text-amber-600'}`} />
            <span className={`font-bold text-sm ${isCompact ? 'text-white' : 'text-amber-900'}`}>
              {employeesNeedingEmail.length} employee{employeesNeedingEmail.length !== 1 ? 's' : ''} without company email
            </span>
          </div>
          <div className="divide-y divide-slate-700/50">
            {employeesNeedingEmail.slice(0, isCompact ? 5 : 20).map((member) => {
              const suggested = normalizeFleetCoEmail(suggestLocalPart(member));
              return (
                <div key={member.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${isCompact ? '' : 'bg-white'}`}>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm ${isCompact ? 'text-white' : 'text-slate-900'}`}>{member.full_name}</div>
                    <div className={`text-xs ${isCompact ? 'text-slate-400' : 'text-slate-500'}`}>
                      {member.email} · {member.role.replace(/_/g, ' ')}
                    </div>
                    <div className={`text-xs mt-0.5 ${isCompact ? 'text-amber-400' : 'text-amber-700'}`}>→ {suggested}</div>
                  </div>
                  <button
                    type="button"
                    disabled={grantingId === member.id}
                    onClick={() => handleQuickGrant(member)}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-3 py-2 rounded-lg text-xs disabled:opacity-60"
                  >
                    {grantingId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    Grant email
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={`rounded-2xl p-5 ${isCompact ? 'bg-slate-800/60 border border-slate-700' : 'bg-slate-900 text-white'}`}>
        <h3 className={`font-black mb-1 flex items-center gap-2 ${isCompact ? 'text-white text-base' : 'text-lg text-white'}`}>
          <Plus className="w-5 h-5 text-amber-400" />
          Create @fleetcomanagement.org Email
        </h3>
        {!isCompact && (
          <p className="text-slate-400 text-sm mb-4">
            Registers the address and optionally creates portal login. Set up IONOS mailbox for mail delivery.
          </p>
        )}

        <form onSubmit={handleCreate} className="space-y-3 mt-3">
          <div className={`grid gap-3 ${isCompact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <div>
              <label className={`block text-xs font-bold uppercase mb-1 ${isCompact ? 'text-slate-400' : 'text-slate-400'}`}>Email *</label>
              <div className="flex rounded-lg overflow-hidden bg-white">
                <input
                  required
                  value={localPart}
                  onChange={(e) => setLocalPart(e.target.value.replace(/@.*/, ''))}
                  placeholder="firstname.lastname"
                  className="flex-1 px-3 py-2 text-slate-900 text-sm focus:outline-none"
                />
                <span className="flex items-center px-2 bg-slate-100 text-slate-600 text-xs font-bold border-l">
                  @{FLEETCO_EMAIL_DOMAIN}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 rounded-lg text-slate-900 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select value={mailboxType} onChange={(e) => setMailboxType(e.target.value)} className="px-3 py-2 rounded-lg text-slate-900 text-sm font-semibold">
              {MAILBOX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {mailboxType === 'employee' && (
              <>
                <select value={portalRole} onChange={(e) => setPortalRole(e.target.value)} disabled={!createPortal} className="px-3 py-2 rounded-lg text-slate-900 text-sm font-semibold disabled:opacity-50">
                  {PORTAL_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {createPortal && (
                  <input
                    required={createPortal}
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Temp portal password"
                    className="px-3 py-2 rounded-lg text-slate-900 text-sm flex-1 min-w-[140px]"
                  />
                )}
              </>
            )}
          </div>

          {mailboxType === 'employee' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={createPortal} onChange={(e) => setCreatePortal(e.target.checked)} className="rounded text-amber-500" />
              <span className={`text-sm ${isCompact ? 'text-slate-300' : 'text-slate-300'}`}>Create portal login</span>
            </label>
          )}

          <button
            type="submit"
            disabled={creating || !previewEmail}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-60"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Create company email
          </button>
        </form>
      </div>

      {!isCompact && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-black text-slate-900">All Company Emails ({mailboxes.length})</h2>
            </div>
            {mailboxes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <AtSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No company emails yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {mailboxes.map((mb) => (
                  <div key={mb.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      {mb.mailbox_type === 'department' ? <Building2 className="w-5 h-5 text-amber-600" /> : <User className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900">{mb.email}</div>
                      <div className="text-sm text-slate-500">{mb.display_name}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 capitalize">{mb.mailbox_type}</span>
                      {mb.has_portal_access && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {mb.portal_role?.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            <strong>IONOS:</strong> Create matching mailboxes in IONOS Email &amp; Office for mail delivery.
          </div>
        </>
      )}

      {isCompact && mailboxes.length > 0 && (
        <p className="text-slate-500 text-xs">
          {mailboxes.length} company email{mailboxes.length !== 1 ? 's' : ''} active ·{' '}
          <Link to="/portal/domain-emails" className="text-amber-400 font-semibold hover:underline">View all</Link>
        </p>
      )}
    </div>
  );
}

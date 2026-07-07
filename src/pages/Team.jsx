import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { UserPlus, Shield, User, Mail, KeyRound, Crown, ToggleLeft, ToggleRight, Building2, Truck, Wrench, Users, UserCheck, ClipboardList } from 'lucide-react';

const ROLE_COLORS = {
  executive: 'bg-yellow-100 text-yellow-800',
  admin: 'bg-red-100 text-red-700',
  customer: 'bg-blue-100 text-blue-700',
  customer_admin: 'bg-indigo-100 text-indigo-700',
  fleet_manager: 'bg-teal-100 text-teal-700',
  operations: 'bg-orange-100 text-orange-700',
  hr: 'bg-purple-100 text-purple-700',
  driver: 'bg-green-100 text-green-700',
  mechanic: 'bg-slate-100 text-slate-700',
};

const ROLE_ICONS = {
  executive: Crown,
  admin: Shield,
  customer: Building2,
  customer_admin: Shield,
  fleet_manager: Truck,
  operations: ClipboardList,
  hr: Users,
  driver: UserCheck,
  mechanic: Wrench,
};

const CUSTOMER_ROLES = ['customer', 'customer_admin', 'fleet_manager', 'operations', 'hr', 'driver', 'mechanic'];

const getAvailableRoles = (userRole) => {
  if (userRole === 'executive') {
    return ['admin', 'customer_admin', 'customer', 'fleet_manager', 'operations', 'hr', 'driver', 'mechanic'];
  }
  if (userRole === 'admin' || userRole === 'customer' || userRole === 'customer_admin' || userRole === 'hr') {
    return ['customer_admin', 'fleet_manager', 'operations', 'hr', 'driver', 'mechanic'];
  }
  if (userRole === 'fleet_manager') {
    return ['driver', 'mechanic'];
  }
  return [];
};

export default function Team() {
  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  const isFleetCoAdmin = user?.role === 'executive';
  const isCustomerCreator = CUSTOMER_ROLES.includes(user?.role);
  const availableRoles = getAvailableRoles(user?.role);


  const loadData = async () => {
    const u = await api.auth.me();
    setUser(u);
    const users = await api.entities.User.list();
    // Customer-scoped users: only show users from the same customer
    if (u?.customer_id) {
      setTeamMembers(users.filter(m => m.customer_id === u.customer_id));
    } else {
      setTeamMembers(users);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteSuccess('');
    setInviteError('');
    try {
      const payload = {
        email: inviteEmail,
        tempPassword,
        role: inviteRole
      };
      // Pass customer_id for customer-scoped creations
      if (user?.customer_id) {
        payload.customerId = user.customer_id;
      }
      const result = await api.functions.invoke('createUserAccount', payload);
      
      setInviteSuccess(result.data.message || `${inviteEmail} invited as ${inviteRole}.`);
      setInviteEmail('');
      setTempPassword('');
      loadData();
    } catch (err) {
      setInviteError(err?.response?.data?.error || err?.message || 'Failed to create account.');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    await api.entities.User.update(memberId, { role: newRole });
    loadData();
  };

  const handleStatusToggle = async (member) => {
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
    await api.entities.User.update(member.id, { status: newStatus });
    loadData();
  };

  const handleResetPassword = async (email) => {
    await api.auth.resetPasswordRequest(email);
    alert(`Password reset link sent to ${email}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Count roles
  const counts = {};
  teamMembers.forEach(m => {
    counts[m.role] = (counts[m.role] || 0) + 1;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Team & Access</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isFleetCoAdmin ? 'Invite users and manage roles' : 'Manage your team accounts and access'}
          </p>
        </div>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(counts).map(([role, count]) => {
          const Icon = ROLE_ICONS[role] || User;
          const colors = ROLE_COLORS[role] || 'bg-slate-100 text-slate-500';
          const [textColor, bgColor] = [colors.split(' ')[1] || 'text-slate-500', colors.split(' ')[0].replace('text-', 'bg-').replace('700','100').replace('800','100').replace('600','50').replace('500','100')];
          return (
            <div key={role} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${bgColor}`}>
                <Icon className={`w-4 h-4 ${textColor}`} />
              </div>
              <div className="text-xl font-black text-slate-900">{count}</div>
              <div className="text-xs text-slate-500 capitalize">{role.replace(/_/g, ' ')}</div>
            </div>
          );
        })}
      </div>

      {/* Invite Panel */}
      {(isFleetCoAdmin || isCustomerCreator) && availableRoles.length > 0 && (
      <div className="bg-slate-900 rounded-2xl p-6">
        <h2 className="text-white font-black text-base mb-1">Create New Account</h2>
        <p className="text-slate-400 text-sm mb-4">
          {isFleetCoAdmin
            ? 'Enter their email, a temp password, and role. They\'ll receive emails to set up their account.'
            : 'Create sub-accounts for your team. Enter email, temp password, and choose a role.'}
        </p>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email" required value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@email.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" required value={tempPassword}
              onChange={e => setTempPassword(e.target.value)}
              placeholder="Temp password"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
            className="bg-white text-slate-700 rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400">
            {availableRoles.map(r => (
              <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
          <button type="submit" disabled={inviting}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-lg text-sm disabled:opacity-60">
            <UserPlus className="w-4 h-4" />
            {inviting ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        {inviteSuccess && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-800/50 rounded-lg">
            <p className="text-green-400 text-sm">✓ {inviteSuccess}</p>
          </div>
        )}
        {inviteError && <p className="text-red-400 text-sm mt-3">✗ {inviteError}</p>}

        {/* Role guide */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
         {availableRoles.map(r => {
           const roleName = r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
           let desc = '';
           if (r === 'executive') desc = 'FleetCo owner — full platform access, manages all customers';
           else if (r === 'admin') desc = 'Customer company admin — manages company settings and team';
           else if (r === 'customer') desc = 'Customer owner — sees all company data, creates sub-accounts';
           else if (r === 'customer_admin') desc = 'Customer admin — manages company settings and users';
           else if (r === 'fleet_manager') desc = 'Manages fleet, can create Driver and Mechanic accounts';
           else if (r === 'operations') desc = 'Operations access — loads, routes, delivery';
           else if (r === 'hr') desc = 'Full company visibility, manages roles and access';
           else if (r === 'driver') desc = 'Driver — HOS logs, inspections, routes, messages';
           else if (r === 'mechanic') desc = 'Mechanic — work orders, time clock, diagnostics';
           return (
             <div key={r} className="bg-amber-900/40 border border-amber-700/50 rounded-lg p-3">
               <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                 {roleName} <span className="text-[10px] bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded-full font-black">ACTIVE</span>
               </div>
               <div className="text-slate-400 text-xs mt-0.5">{desc}</div>
             </div>
           );
         })}
        </div>
      </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-900">All Users ({teamMembers.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {teamMembers.map(m => {
            const RoleIcon = ROLE_ICONS[m.role] || User;
            return (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-slate-600">
                    {m.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{m.full_name || '—'}</span>
                    {m.status === 'suspended' && (
                      <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Suspended</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{m.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${ROLE_COLORS[m.role] || 'bg-slate-100 text-slate-500'}`}>
                    <RoleIcon className="w-3 h-3" />
                    {m.role}
                  </span>
                  {m.id !== user?.id && (isFleetCoAdmin || user?.role === 'admin' || user?.role === 'customer' || user?.role === 'hr') && (
                    <>
                      <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400">
                        {availableRoles.map(r => (
                          <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                        ))}
                      </select>
                      {/* Status visibility toggle */}
                      <button
                        title={m.status === 'suspended' ? 'Account suspended — click to activate' : 'Account active — click to suspend'}
                        onClick={() => handleStatusToggle(m)}
                        className={`p-1.5 rounded-lg transition-colors ${m.status === 'suspended' ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-emerald-500 hover:bg-emerald-50'}`}
                      >
                        {m.status === 'suspended' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                  <button
                    title="Send password reset link"
                    onClick={() => handleResetPassword(m.email)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {teamMembers.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">No users yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
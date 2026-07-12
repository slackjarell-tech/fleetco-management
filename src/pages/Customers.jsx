import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, Building2, Phone, Mail, Edit, Trash2, UserCheck, Users, UserPlus, Shield, User, KeyRound, Crown, ToggleLeft, ToggleRight, Truck, Wrench, ClipboardList, MessageCircle, AtSign, Send, Check, Clock, PauseCircle, PlayCircle, DollarSign } from 'lucide-react';
import CustomerModal from '@/components/admin/CustomerModal';
import CustomerMessagePanel from '@/components/admin/CustomerMessagePanel';
import { FLEETCO_EMAIL_DOMAIN, normalizeFleetCoEmail } from '@/lib/domain';
import { getBillingSnapshot, formatCountdown, formatDueDate, billingStatusColor } from '@/lib/billing';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-500',
  prospect: 'bg-blue-100 text-blue-600',
};

const ROLE_COLORS = {
  owner: 'bg-amber-100 text-amber-800',
  executive: 'bg-yellow-100 text-yellow-800',
  fleet_manager: 'bg-blue-100 text-blue-700',
  fleet_coordinator: 'bg-emerald-100 text-emerald-700',
  user: 'bg-slate-100 text-slate-600',
  driver: 'bg-purple-100 text-purple-700',
};

const ROLE_ICONS = {
  owner: Crown,
  executive: Crown,
  fleet_manager: Shield,
  fleet_coordinator: ClipboardList,
  user: User,
  driver: Truck,
};

const FLEETCO_INTERNAL = ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'];

const getAvailableRoles = (userRole) => {
  if (userRole === 'owner') {
    return ['executive', 'fleet_manager', 'fleet_coordinator'];
  }
  if (userRole === 'user') {
    return ['user', 'driver'];
  }
  return [];
};

const canProvisionCustomers = (role) => ['owner', 'executive', 'fleet_manager'].includes(role);

// ── Customers Tab ──
function CustomersTab({ user, canAddCustomers, fleetManagers, fleetCoordinators, allUsers }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const [messageCustomer, setMessageCustomer] = useState(null);
  const [sendingLoginId, setSendingLoginId] = useState(null);
  const [sendingWelcomeId, setSendingWelcomeId] = useState(null);
  const [copiedLoginId, setCopiedLoginId] = useState(null);
  const [billingActionId, setBillingActionId] = useState(null);

  const loadCustomers = async () => {
    const allCustomers = await api.entities.Customer.list('-created_date');
    if (user?.role === 'fleet_manager') {
      setCustomers(allCustomers.filter(c => c.assigned_manager_id === user.id));
    } else if (user?.role === 'fleet_coordinator') {
      setCustomers(allCustomers.filter(c => c.assigned_coordinator_id === user.id));
    } else {
      setCustomers(allCustomers);
    }
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);

  const handleSave = async (data, loginData, subscriptionData) => {
    let customerId = editingCustomer?.id;
    setMessage('');

    const cleanData = { ...data };
    if (!cleanData.assigned_manager_id) cleanData.assigned_manager_id = '';
    if (!cleanData.assigned_coordinator_id) cleanData.assigned_coordinator_id = '';
    if (cleanData.fleet_size !== undefined && cleanData.fleet_size !== '') {
      cleanData.fleet_size = Number(cleanData.fleet_size);
    } else {
      delete cleanData.fleet_size;
    }

    if (editingCustomer) {
      await api.entities.Customer.update(customerId, cleanData);
      setMessage('Customer updated successfully.');
    } else {
      try {
        const result = await api.functions.invoke('provisionCustomer', {
          customer: cleanData,
          subscription_plan: subscriptionData.subscription_plan,
          subscription_term: subscriptionData.subscription_term,
          payment_collected: subscriptionData.payment_collected,
          createLogin: !!loginData,
          tempPassword: loginData?.tempPassword || '',
          notification_prefs: loginData?.notification_prefs,
        });
        setMessage(result.message || 'Customer activated successfully.');
      } catch (err) {
        setMessage(`Failed: ${err?.data?.error || err?.message || 'Could not activate customer'}`);
        return;
      }
    }

    setShowModal(false);
    setEditingCustomer(null);
    loadCustomers();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    await api.entities.Customer.delete(id);
    loadCustomers();
  };

  const handleResetCustomerPassword = async (customer) => {
    const linkedUser = allUsers.find(u => u.id === customer.user_id);
    const email = customer.email;
    if (!email) {
      alert('No email on file for this customer.');
      return;
    }
    await api.auth.resetPasswordRequest(email);
    alert(`Password reset link sent to ${email}`);
  };

  const handleSendWelcomeEmail = async (customer) => {
    if (!customer.email) {
      alert('Add an email to this customer before sending a welcome email.');
      return;
    }
    setSendingWelcomeId(customer.id);
    setMessage('');
    try {
      const result = await api.admin.sendCustomerWelcomeEmail({ customerId: customer.id });
      setMessage(result.message || `Welcome email sent to ${customer.email}`);
      loadCustomers();
    } catch (err) {
      setMessage(`Failed: ${err?.data?.error || err?.message || 'Could not send welcome email'}`);
    } finally {
      setSendingWelcomeId(null);
    }
  };

  const handleSendTestLogin = async (customer) => {
    if (!customer.email) {
      alert('Add an email to this customer before sending a test login.');
      return;
    }
    setSendingLoginId(customer.id);
    setMessage('');
    try {
      const result = await api.functions.invoke('sendCustomerTestLogin', { customerId: customer.id });
      setMessage(result.message || `Test login created for ${customer.email}`);
      if (result.credentialsText && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.credentialsText);
        setCopiedLoginId(customer.id);
        setTimeout(() => setCopiedLoginId(null), 3000);
      }
      loadCustomers();
    } catch (err) {
      setMessage(`Failed: ${err?.data?.error || err?.message || 'Could not send test login'}`);
    } finally {
      setSendingLoginId(null);
    }
  };

  const isFilteredRole = user?.role === 'fleet_manager' || user?.role === 'fleet_coordinator';

  const handleRecordPayment = async (customer) => {
    if (!confirm(`Record payment received for ${customer.company_name}?`)) return;
    setBillingActionId(customer.id);
    setMessage('');
    try {
      const result = await api.functions.invoke('recordCustomerPayment', { customerId: customer.id });
      setMessage(result.message || 'Payment recorded.');
      loadCustomers();
    } catch (err) {
      setMessage(`Failed: ${err?.data?.error || err?.message || 'Could not record payment'}`);
    } finally {
      setBillingActionId(null);
    }
  };

  const handleTogglePause = async (customer, pause) => {
    const action = pause ? 'pause' : 'resume';
    if (!confirm(`${pause ? 'Pause' : 'Resume'} portal access for ${customer.company_name}?`)) return;
    setBillingActionId(customer.id);
    setMessage('');
    try {
      const result = await api.functions.invoke('setCustomerPause', { customerId: customer.id, paused: pause });
      setMessage(result.message || `Customer ${action}d.`);
      loadCustomers();
    } catch (err) {
      setMessage(`Failed: ${err?.data?.error || err?.message || `Could not ${action} customer`}`);
    } finally {
      setBillingActionId(null);
    }
  };

  const getEmployeeName = (id) => {
    const user = allUsers.find(u => u.id === id);
    return user ? user.full_name : '—';
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.company_name?.toLowerCase().includes(q) ||
      c.contact_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const active = customers.filter(c => c.status === 'active').length;
  const prospects = customers.filter(c => c.status === 'prospect').length;

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: customers.length, icon: Building2, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Active', value: active, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Prospects', value: prospects, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-xl font-black text-slate-900">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-semibold flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-green-400 hover:text-green-600 ml-2">&times;</button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by company, contact, or email..."
              className="w-64 pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
        {canAddCustomers && (
          <button
            onClick={() => { setEditingCustomer(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2.5 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        )}
      </div>

      {/* Customer Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No customers found</p>
          {isFilteredRole && customers.length === 0 ? (
            <p className="text-sm mt-1 max-w-md mx-auto">
              No customers are assigned to you yet. Ask an owner or executive to assign a fleet manager on each customer account.
            </p>
          ) : isFilteredRole ? (
            <p className="text-sm mt-1">Try clearing your search or status filter.</p>
          ) : canAddCustomers ? (
            <p className="text-sm mt-1">Add your first customer to get started</p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => {
            const billing = getBillingSnapshot(c);
            return (
            <div key={c.id} className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-5 ${c.system_paused ? 'border-slate-400 ring-1 ring-slate-300' : billing?.status === 'overdue' ? 'border-red-200' : billing?.status === 'due_soon' ? 'border-amber-200' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-slate-900 text-sm leading-tight">{c.company_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.contact_name}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${STATUS_COLORS[c.status]}`}>
                  {c.status}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {(c.city || c.state) && (
                  <div className="text-slate-400">{[c.city, c.state].filter(Boolean).join(', ')}</div>
                )}
                {(c.mc_number || c.dot_number) && (
                  <div className="flex gap-3">
                    {c.mc_number && <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">MC: {c.mc_number}</span>}
                    {c.dot_number && <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">DOT: {c.dot_number}</span>}
                  </div>
                )}
                {c.fleet_size && (
                  <div className="text-slate-500">Fleet: <strong>{c.fleet_size}</strong> vehicles</div>
                )}
                {c.subscription_plan && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold capitalize">
                      {c.subscription_plan}
                    </span>
                    <span className="text-slate-500 capitalize">
                      {c.subscription_term || 'monthly'} · ${c.subscription_amount?.toLocaleString()}
                      {c.subscription_term === 'yearly' ? '/yr' : '/mo'}
                    </span>
                  </div>
                )}
                {billing?.dueAt && (
                  <div className={`mt-2 rounded-lg px-2.5 py-2 ${billing.isPaused ? 'bg-slate-100' : billing.isOverdue ? 'bg-red-50' : billing.status === 'due_soon' ? 'bg-amber-50' : 'bg-green-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full capitalize ${billingStatusColor(billing.status)}`}>
                        {billing.isPaused ? <PauseCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {billing.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-black ${billing.isOverdue ? 'text-red-700' : billing.status === 'due_soon' ? 'text-amber-800' : 'text-green-700'}`}>
                        {formatCountdown(billing.daysUntilDue)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Due {formatDueDate(billing.dueAt)}</div>
                  </div>
                )}
              </div>
              {canAddCustomers && (c.assigned_manager_id || c.assigned_coordinator_id) && (
                <div className="space-y-1 text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5 mb-3">
                  {c.assigned_manager_id && (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span>Manager: <strong>{getEmployeeName(c.assigned_manager_id)}</strong></span>
                    </div>
                  )}
                  {c.assigned_coordinator_id && (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Coordinator: <strong>{getEmployeeName(c.assigned_coordinator_id)}</strong></span>
                    </div>
                  )}
                </div>
              )}
              {c.notes && (
                <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-2 mb-3 line-clamp-2">{c.notes}</p>
              )}
              {canAddCustomers && billing && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {(billing.isOverdue || billing.status === 'due_soon') && !billing.isPaused && (
                    <button
                      type="button"
                      disabled={billingActionId === c.id}
                      onClick={() => handleTogglePause(c, true)}
                      className="flex items-center gap-1 text-xs font-bold border border-red-200 text-red-700 bg-red-50 rounded-lg px-3 py-1.5 hover:bg-red-100 disabled:opacity-50"
                    >
                      <PauseCircle className="w-3.5 h-3.5" /> Pause portal
                    </button>
                  )}
                  {billing.isPaused && (
                    <button
                      type="button"
                      disabled={billingActionId === c.id}
                      onClick={() => handleTogglePause(c, false)}
                      className="flex items-center gap-1 text-xs font-bold border border-green-200 text-green-700 bg-green-50 rounded-lg px-3 py-1.5 hover:bg-green-100 disabled:opacity-50"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Resume portal
                    </button>
                  )}
                  {(billing.isOverdue || billing.status === 'due_soon' || billing.isPaused) && (
                    <button
                      type="button"
                      disabled={billingActionId === c.id}
                      onClick={() => handleRecordPayment(c)}
                      className="flex items-center gap-1 text-xs font-bold border border-emerald-200 text-emerald-800 bg-emerald-50 rounded-lg px-3 py-1.5 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Payment received
                    </button>
                  )}
                </div>
              )}
              {canAddCustomers && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => { setEditingCustomer(c); setShowModal(true); }}
                    className="flex-1 min-w-[72px] flex items-center justify-center gap-1 text-xs font-semibold border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleSendWelcomeEmail(c)}
                    disabled={sendingWelcomeId === c.id || !c.email}
                    title="Send welcome email with portal login and temporary password"
                    className="flex-1 min-w-[96px] flex items-center justify-center gap-1 text-xs font-semibold border border-blue-100 text-blue-700 rounded-lg py-1.5 hover:bg-blue-50 disabled:opacity-50"
                  >
                    {sendingWelcomeId === c.id ? (
                      <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Mail className="w-3 h-3" />
                    )}
                    Welcome email
                  </button>
                  <button
                    onClick={() => handleSendTestLogin(c)}
                    disabled={sendingLoginId === c.id || !c.email}
                    title="Create portal login and copy credentials for this prospect"
                    className="flex-1 min-w-[96px] flex items-center justify-center gap-1 text-xs font-semibold border border-emerald-100 text-emerald-700 rounded-lg py-1.5 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {sendingLoginId === c.id ? (
                      <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : copiedLoginId === c.id ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    {copiedLoginId === c.id ? 'Copied' : 'Test login'}
                  </button>
                  <button onClick={() => setMessageCustomer(c)}
                    title="Message customer"
                    className="flex items-center justify-center gap-1 text-xs font-semibold border border-blue-100 text-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-50">
                    <MessageCircle className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleResetCustomerPassword(c)}
                    title="Send password reset link"
                    className="flex items-center justify-center gap-1 text-xs font-semibold border border-amber-100 text-amber-600 rounded-lg px-3 py-1.5 hover:bg-amber-50">
                    <KeyRound className="w-3 h-3" />
                  </button>
                  {(user?.role === 'owner' || user?.role === 'executive') && (
                    <button onClick={() => handleDelete(c.id)}
                      className="flex items-center justify-center gap-1 text-xs font-semibold border border-red-100 text-red-500 rounded-lg px-3 py-1.5 hover:bg-red-50">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );})}
        </div>
      )}

      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          fleetManagers={fleetManagers}
          fleetCoordinators={fleetCoordinators}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingCustomer(null); }}
        />
      )}
      {messageCustomer && (
        <CustomerMessagePanel
          customer={messageCustomer}
          currentUser={user}
          onClose={() => setMessageCustomer(null)}
        />
      )}
    </div>
  );
}

// ── Team Tab ──
function TeamTab({ user, isOwner, isCustomerAdmin, canManageTeam, availableRoles }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLocalPart, setInviteLocalPart] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [inviteRole, setInviteRole] = useState(availableRoles[0] || 'user');
  const [inviteEmployeeNumber, setInviteEmployeeNumber] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  const loadTeam = async () => {
    const users = await api.entities.User.list();
    if (isOwner) {
      setTeamMembers(users.filter(m => FLEETCO_INTERNAL.includes(m.role)));
    } else if (user?.role === 'user') {
      setTeamMembers(users.filter(m => m.customer_id === user.customer_id));
    } else {
      setTeamMembers([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadTeam(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteSuccess('');
    setInviteError('');
    try {
      const email = isOwner ? normalizeFleetCoEmail(inviteLocalPart) : inviteEmail;
      if (!email) throw new Error(`Enter a valid @${FLEETCO_EMAIL_DOMAIN} address`);
      const payload = { email, tempPassword, role: inviteRole };
      if (user?.customer_id) payload.customerId = user.customer_id;
      if (inviteEmployeeNumber) payload.employeeNumber = inviteEmployeeNumber;
      const result = await api.functions.invoke('createUserAccount', payload);
      setInviteSuccess(result.message || `${email} invited as ${inviteRole}.`);
      setInviteEmail('');
      setInviteLocalPart('');
      setTempPassword('');
      setInviteEmployeeNumber('');
      loadTeam();
    } catch (err) {
      setInviteError(err?.data?.error || err?.message || 'Failed to create account.');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    await api.entities.User.update(memberId, { role: newRole });
    loadTeam();
  };

  const handleStatusToggle = async (member) => {
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
    await api.entities.User.update(member.id, { status: newStatus });
    loadTeam();
  };

  const handleResetPassword = async (email) => {
    await api.auth.resetPasswordRequest(email);
    alert(`Password reset link sent to ${email}`);
  };

  const handleDeleteUser = async (member) => {
    if (!confirm(`Permanently delete user "${member.full_name || member.email}"? This cannot be undone.`)) return;
    try {
      const pending = await api.entities.PendingAccount.filter({ user_id: member.id });
      for (const p of pending) {
        await api.entities.PendingAccount.delete(p.id);
      }
    } catch {}
    await api.entities.User.delete(member.id);
    loadTeam();
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  // Count roles
  const counts = {};
  teamMembers.forEach(m => {
    counts[m.role] = (counts[m.role] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(counts).map(([role, count]) => {
          const Icon = ROLE_ICONS[role] || User;
          const colors = ROLE_COLORS[role] || 'bg-slate-100 text-slate-500';
          const [textColor] = [colors.split(' ')[1] || 'text-slate-500'];
          const bgColor = colors.split(' ')[0].replace('text-', 'bg-').replace('700','100').replace('800','100').replace('600','50').replace('500','100');
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
      {canManageTeam && availableRoles.length > 0 && (
      <div className="bg-slate-900 rounded-2xl p-6">
        <h2 className="text-white font-black text-base mb-1">
          {isOwner ? 'Create FleetCo Employee' : 'Add Team Member'}
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          {isOwner
            ? `Create FleetCo employees with @${FLEETCO_EMAIL_DOMAIN} addresses and portal access.`
            : 'Add drivers and team members to your organization. They can sign in with the temp password you set.'}
        </p>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {isOwner ? (
            <div className="relative flex-1 min-w-[240px] flex rounded-lg overflow-hidden bg-white">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <input
                type="text"
                required
                value={inviteLocalPart}
                onChange={e => setInviteLocalPart(e.target.value.replace(/@.*/, ''))}
                placeholder="firstname.lastname"
                className="flex-1 pl-9 pr-3 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
              />
              <span className="flex items-center px-3 bg-slate-100 text-slate-600 text-xs font-bold border-l border-slate-200">
                @{FLEETCO_EMAIL_DOMAIN}
              </span>
            </div>
          ) : (
          <div className="relative flex-1 min-w-[200px]">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@email.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          )}
          <div className="relative flex-1 min-w-[140px]">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" required value={tempPassword} onChange={e => setTempPassword(e.target.value)}
              placeholder="Temp password"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
            className="bg-white text-slate-700 rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400">
            {availableRoles.map(r => (
              <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
          <input type="text" value={inviteEmployeeNumber} onChange={e => setInviteEmployeeNumber(e.target.value)}
            placeholder="Employee # (optional)"
            className="bg-white text-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-40" />
          <button type="submit" disabled={inviting}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-lg text-sm disabled:opacity-60">
            <UserPlus className="w-4 h-4" />
            {inviting ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        {inviteSuccess && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-800/50 rounded-lg">
            <p className="text-green-400 text-sm">{inviteSuccess}</p>
          </div>
        )}
        {inviteError && <p className="text-red-400 text-sm mt-3">{inviteError}</p>}

        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {isOwner ? (
              <>
                <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-lg p-3">
                  <div className="text-yellow-400 font-bold text-xs">Executive</div>
                  <div className="text-slate-400 text-xs mt-0.5">Full platform access</div>
                </div>
                <div className="bg-blue-900/40 border border-blue-700/50 rounded-lg p-3">
                  <div className="text-blue-400 font-bold text-xs">Fleet Manager</div>
                  <div className="text-slate-400 text-xs mt-0.5">Manage customers &amp; operations</div>
                </div>
                <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-lg p-3">
                  <div className="text-emerald-400 font-bold text-xs">Fleet Coordinator</div>
                  <div className="text-slate-400 text-xs mt-0.5">Support assigned customers</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-amber-900/40 border border-amber-700/50 rounded-lg p-3">
                  <div className="text-amber-400 font-bold text-xs">Portal User</div>
                  <div className="text-slate-400 text-xs mt-0.5">Full portal access for your fleet</div>
                </div>
                <div className="bg-purple-900/40 border border-purple-700/50 rounded-lg p-3">
                  <div className="text-purple-400 font-bold text-xs">Driver</div>
                  <div className="text-slate-400 text-xs mt-0.5">Driver app &amp; route access</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-900">
            {isOwner ? 'FleetCo Team' : 'Your Team'} ({teamMembers.length})
          </h2>
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
                  {m.id !== user?.id && canManageTeam && (
                    <>
                      <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400">
                        {availableRoles.map(r => (
                          <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                        ))}
                      </select>
                      <button
                        title={m.status === 'suspended' ? 'Account suspended — click to activate' : 'Account active — click to suspend'}
                        onClick={() => handleStatusToggle(m)}
                        className={`p-1.5 rounded-lg transition-colors ${m.status === 'suspended' ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-emerald-500 hover:bg-emerald-50'}`}
                      >
                        {m.status === 'suspended' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                  <button title="Send password reset link" onClick={() => handleResetPassword(m.email)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  {canManageTeam && m.id !== user?.id && m.role !== 'owner' && (
                    <button title="Delete user" onClick={() => handleDeleteUser(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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

// ── Main Combined Page ──
export default function Customers() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('customers');

  useEffect(() => {
    api.auth.me().then(async u => {
      setUser(u);
      const allUsers = await api.entities.User.list();
      setAllUsers(allUsers);
      setEmployees(allUsers.filter(u => u.role === 'fleet_manager' || u.role === 'fleet_coordinator'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isInternal = FLEETCO_INTERNAL.includes(user?.role);
  const isOwner = user?.role === 'owner';
  const canAddCustomers = canProvisionCustomers(user?.role);
  const showTeamTab = isOwner || user?.role === 'user';
  const availableRoles = getAvailableRoles(user?.role);
  const fleetManagers = allUsers.filter(u => u.role === 'fleet_manager');
  const fleetCoordinators = allUsers.filter(u => u.role === 'fleet_coordinator');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Customers & Team</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isOwner
              ? 'Add customers after payment · create FleetCo employees here'
              : user?.role === 'user'
                ? 'Manage your drivers and team members'
                : 'Manage customer accounts and access'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(isInternal || canAddCustomers) && (
          <button onClick={() => setTab('customers')}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'customers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Building2 className="w-4 h-4 inline mr-1.5" />
            Customers
          </button>
        )}
        {showTeamTab && (
          <button onClick={() => setTab('team')}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'team' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Users className="w-4 h-4 inline mr-1.5" />
            {isOwner ? 'FleetCo Team' : 'My Team'}
          </button>
        )}
      </div>

      {/* Tab Content */}
      {tab === 'customers' && (isInternal || canAddCustomers) ? (
        <CustomersTab user={user} canAddCustomers={canAddCustomers} fleetManagers={fleetManagers} fleetCoordinators={fleetCoordinators} allUsers={allUsers} />
      ) : showTeamTab ? (
        <TeamTab
          user={user}
          isOwner={isOwner}
          isCustomerAdmin={user?.role === 'user'}
          canManageTeam={isOwner || user?.role === 'user'}
          availableRoles={availableRoles}
        />
      ) : null}
    </div>
  );
}
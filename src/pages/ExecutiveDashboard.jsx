import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Users, DollarSign, TrendingUp, FileText, Fuel, Wrench, BarChart2, Crown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import ValuationTracker from '@/components/executive/ValuationTracker';
import { isExecutiveView } from '@/lib/roles';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, sub, color = 'amber' }) {
  const colors = {
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-slate-400 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    users: [], invoices: [], fuelLogs: [], workOrders: [], loads: [], customers: [], payrollRecords: [],
  });

  useEffect(() => {
    const load = async () => {
      const u = await api.auth.me();
      setUser(u);
      if (!isExecutiveView(u?.role)) { setLoading(false); return; }
      const [users, invoices, fuelLogs, workOrders, loads, customers, payrollRecords] = await Promise.all([
        api.entities.User.list(),
        api.entities.Invoice.list(),
        api.entities.FuelLog.list(),
        api.entities.WorkOrder.list(),
        api.entities.Load.list(),
        api.entities.Customer.list(),
        api.entities.PayrollRecord.list('-created_date', 300),
      ]);
      setData({ users, invoices, fuelLogs, workOrders, loads, customers, payrollRecords });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 bg-slate-950">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isExecutiveView(user?.role)) return (
    <div className="flex items-center justify-center h-64 bg-slate-950">
      <div className="text-center text-slate-400">
        <Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>Executive access required</p>
      </div>
    </div>
  );

  const { users, invoices, fuelLogs, workOrders, loads, customers, payrollRecords } = data;

  const fleetcoPayroll = payrollRecords.filter((r) => r.payee_type === 'fleetco_employee' || r.employee_user_id);
  const fleetcoPayrollNet = fleetcoPayroll.reduce((s, r) => s + (r.net_pay || 0), 0);
  const customerPayrollNet = payrollRecords
    .filter((r) => r.payee_type !== 'fleetco_employee' && !r.employee_user_id)
    .reduce((s, r) => s + (r.net_pay || 0), 0);

  // Subscriber / customer counts
  const totalSubscribers = customers.filter(c => c.status === 'active').length;
  const totalCustomers = customers.length;

  // Revenue calculations
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalRevenue = paidInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const pendingRevenue = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.total || 0), 0);

  // Monthly revenue (last 6 months)
  const now = new Date();
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const total = paidInvoices
      .filter(inv => {
        const id = new Date(inv.issue_date);
        return id.getFullYear() === d.getFullYear() && id.getMonth() === d.getMonth();
      })
      .reduce((s, inv) => s + (inv.total || 0), 0);
    return { month: label, revenue: total };
  });

  // Monthly subscribers (new customers per month)
  const monthlySubscribers = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const count = customers.filter(c => {
      const cd = new Date(c.created_date);
      return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
    }).length;
    return { month: label, subscribers: count };
  });

  // Invoice status breakdown
  const invoiceStatus = ['draft', 'sent', 'paid', 'overdue'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: invoices.filter(i => i.status === s).length
  })).filter(x => x.value > 0);

  // Total fuel spend
  const totalFuelSpend = fuelLogs.reduce((s, f) => s + (f.total_cost || 0), 0);

  // Total maintenance cost
  const totalMaintCost = workOrders.filter(w => w.status === 'completed').reduce((s, w) => s + (w.total_cost || 0), 0);

  // Load revenue
  const loadRevenue = loads.filter(l => l.status === 'delivered').reduce((s, l) => s + (l.rate || 0), 0);

  // Role breakdown
  const roleCounts = ['admin', 'employee', 'tech', 'driver', 'customer'].map(r => ({
    name: r.charAt(0).toUpperCase() + r.slice(1),
    value: users.filter(u => u.role === r).length
  })).filter(x => x.value > 0);

  const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div className="min-h-screen bg-slate-950 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Crown className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Executive Dashboard</h1>
          <p className="text-slate-400 text-sm">Company-wide financial & operational overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Subscribers" value={totalSubscribers} sub={`${totalCustomers} total customers`} color="blue" />
        <StatCard icon={DollarSign} label="Total Revenue (Paid)" value={fmt(totalRevenue)} sub={`${fmt(pendingRevenue)} pending`} color="green" />
        <StatCard icon={TrendingUp} label="Load Revenue" value={fmt(loadRevenue)} sub={`${loads.filter(l => l.status === 'delivered').length} loads delivered`} color="amber" />
        <StatCard icon={Wrench} label="Maintenance Cost" value={fmt(totalMaintCost)} sub={`${fmt(totalFuelSpend)} fuel spend`} color="red" />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Payroll overview
          </h2>
          <Link
            to="/portal/fleetco-payroll"
            className="text-xs font-bold text-amber-400 hover:text-amber-300"
          >
            Manage FleetCo employee payroll →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-slate-500 text-xs uppercase">FleetCo staff records</div>
            <div className="text-xl font-black text-white">{fleetcoPayroll.length}</div>
            <div className="text-emerald-400 text-xs mt-1">${fleetcoPayrollNet.toLocaleString()} net</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase">Customer driver payroll</div>
            <div className="text-xl font-black text-white">{payrollRecords.length - fleetcoPayroll.length}</div>
            <div className="text-blue-400 text-xs mt-1">${customerPayrollNet.toLocaleString()} net</div>
          </div>
          <div className="col-span-2 text-slate-400 text-xs leading-relaxed">
            Customer portals bulk-upload driver payroll on <span className="text-slate-200">Payroll</span> (CSV).
            FleetCo staff payroll uses <span className="text-slate-200">employee_email</span> in bulk upload.
            Direct deposit: company + employee bank profiles, then ACH CSV export from customer Payroll page.
          </div>
        </div>
      </div>

      {/* Valuation & Profit Tracker */}
      <ValuationTracker
        customers={customers}
        totalRevenue={totalRevenue}
        loadRevenue={loadRevenue}
        fuelSpend={totalFuelSpend}
        maintCost={totalMaintCost}
        pendingRevenue={pendingRevenue}
      />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" /> Monthly Revenue (6 months)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly New Subscribers */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> New Subscribers (6 months)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlySubscribers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
              <Line type="monotone" dataKey="subscribers" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Invoice Status Breakdown */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-400" /> Invoice Status Breakdown
          </h2>
          {invoiceStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={invoiceStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {invoiceStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-16">No invoice data yet</p>}
        </div>

        {/* Team Breakdown */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" /> Team by Role
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={roleCounts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Summary Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-500" /> Financial Summary
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 pr-6">Category</th>
                <th className="text-right py-2 pr-6">Amount</th>
                <th className="text-right py-2">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              <tr className="text-slate-200">
                <td className="py-3 pr-6">Paid Invoices</td>
                <td className="text-right pr-6 text-green-400 font-bold">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="text-right text-slate-400">{paidInvoices.length}</td>
              </tr>
              <tr className="text-slate-200">
                <td className="py-3 pr-6">Pending / Overdue Invoices</td>
                <td className="text-right pr-6 text-amber-400 font-bold">${pendingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="text-right text-slate-400">{invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length}</td>
              </tr>
              <tr className="text-slate-200">
                <td className="py-3 pr-6">Load Revenue (Delivered)</td>
                <td className="text-right pr-6 text-blue-400 font-bold">${loadRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="text-right text-slate-400">{loads.filter(l => l.status === 'delivered').length}</td>
              </tr>
              <tr className="text-slate-200">
                <td className="py-3 pr-6">Fuel Expenditure</td>
                <td className="text-right pr-6 text-red-400 font-bold">-${totalFuelSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="text-right text-slate-400">{fuelLogs.length}</td>
              </tr>
              <tr className="text-slate-200">
                <td className="py-3 pr-6">Maintenance Cost (Completed WOs)</td>
                <td className="text-right pr-6 text-red-400 font-bold">-${totalMaintCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="text-right text-slate-400">{workOrders.filter(w => w.status === 'completed').length}</td>
              </tr>
              <tr className="border-t-2 border-slate-600 text-white font-black">
                <td className="py-3 pr-6">Net (Revenue - Fuel - Maintenance)</td>
                <td className={`text-right pr-6 font-black ${(totalRevenue + loadRevenue - totalFuelSpend - totalMaintCost) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${(totalRevenue + loadRevenue - totalFuelSpend - totalMaintCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right text-slate-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
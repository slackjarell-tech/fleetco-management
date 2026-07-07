import React from 'react';
import { Building2, Users, FileText, Truck } from 'lucide-react';

export default function EmployeeDashboard({ user, data }) {
  const { customers, invoices, vehicles } = data;

  const myCustomers = customers.filter(c => c.assigned_employee_id === user?.id);
  const myCustomerIds = myCustomers.map(c => c.id);
  const myInvoices = invoices.filter(i => myCustomerIds.includes(i.customer_id));
  const outstanding = myInvoices.filter(i => ['sent', 'overdue'].includes(i.status))
    .reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-white">Welcome, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-slate-400 text-sm">Employee Dashboard</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'My Accounts', value: myCustomers.length, icon: Building2, color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
          { label: 'Active Customers', value: myCustomers.filter(c => c.status === 'active').length, icon: Users, color: 'text-green-400', bg: 'bg-green-900/30' },
          { label: 'Open Invoices', value: myInvoices.filter(i => ['sent', 'overdue'].includes(i.status)).length, icon: FileText, color: 'text-red-400', bg: 'bg-red-900/30' },
          { label: 'Outstanding', value: `$${outstanding.toFixed(0)}`, icon: Truck, color: 'text-blue-400', bg: 'bg-blue-900/30' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3">My Assigned Customers</div>
        {myCustomers.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">No customers assigned yet</div>
        ) : myCustomers.map(c => (
          <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0">
            <div>
              <div className="text-white font-semibold text-sm">{c.company_name}</div>
              <div className="text-slate-400 text-xs">{c.contact_name} • {c.email}</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
              c.status === 'active' ? 'bg-green-900/40 text-green-400' :
              c.status === 'prospect' ? 'bg-blue-900/40 text-blue-400' :
              'bg-slate-700 text-slate-400'
            }`}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
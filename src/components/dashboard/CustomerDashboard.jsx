import React from 'react';
import { FileText, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import GettingStartedChecklist from '@/components/dashboard/GettingStartedChecklist';

export default function CustomerDashboard({ user, data }) {
  const customerId = user?.customer_id;
  const { invoices, vehicles, loads } = data;

  const myInvoices = invoices.filter(i => i.customer_id === customerId);
  const myVehicles = vehicles.filter(v => v.customer_id === customerId || v.assigned_customer_id === customerId);
  const myLoads = (loads || []).filter(l => l.customer_id === customerId);
  const unpaid = myInvoices.filter(i => ['sent', 'overdue'].includes(i.status));
  const paid = myInvoices.filter(i => i.status === 'paid');
  const totalOwed = unpaid.reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid = paid.reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-white">Welcome, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-slate-400 text-sm">Customer Portal</p>
      </div>

      <GettingStartedChecklist user={user} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'My Vehicles', value: myVehicles.length, icon: Truck, color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
          { label: 'Active Loads', value: myLoads.filter(l => l.status !== 'delivered').length, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-900/30' },
          { label: 'Amount Owed', value: `$${totalOwed.toFixed(0)}`, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/30' },
          { label: 'Total Paid', value: `$${totalPaid.toFixed(0)}`, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/30' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3">Outstanding Invoices</div>
          {unpaid.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-8">No outstanding invoices</div>
          ) : unpaid.map(i => (
            <div key={i.id} className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0">
              <div>
                <div className="text-white font-semibold text-sm">#{i.invoice_number}</div>
                <div className="text-slate-400 text-xs">Due: {i.due_date || '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-red-400 font-black text-sm">${(i.total || 0).toFixed(2)}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === 'overdue' ? 'bg-red-900/40 text-red-400' : 'bg-blue-900/40 text-blue-400'}`}>{i.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3">My Fleet</div>
          {myVehicles.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-8">No vehicles yet — add your first unit under Fleet Units</div>
          ) : myVehicles.map(v => (
            <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0">
              <div>
                <div className="text-white font-semibold text-sm">Unit #{v.unit_number}</div>
                <div className="text-slate-400 text-xs">{[v.year, v.make, v.model].filter(Boolean).join(' ')}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                v.status === 'active' ? 'bg-green-900/40 text-green-400' :
                v.status === 'in_shop' ? 'bg-orange-900/40 text-orange-400' :
                'bg-slate-700 text-slate-400'
              }`}>{v.status?.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { DollarSign, Plus, Users, CheckCircle2, Clock, FileText, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PayrollRunModal from '@/components/payroll/PayrollRunModal';
import PayrollRecordRow from '@/components/payroll/PayrollRecordRow';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
};

const PAY_TYPE_COLORS = {
  W2: 'bg-purple-100 text-purple-700',
  '1099': 'bg-orange-100 text-orange-700',
  'Per Mile': 'bg-cyan-100 text-cyan-700',
  'Per Stop': 'bg-amber-100 text-amber-700',
  Salary: 'bg-blue-100 text-blue-700',
  Hourly: 'bg-green-100 text-green-700',
};

export default function Payroll() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [hosLogs, setHosLogs] = useState([]);
  const [deliveryStops, setDeliveryStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('');

  const load = async () => {
    const u = await api.auth.me().catch(() => null);
    setUser(u);
    const [rs, us, hs, ds] = await Promise.all([
      api.entities.PayrollRecord.list('-created_date', 200),
      api.entities.User.list(),
      api.entities.HOSLog.list('-log_date', 500),
      api.entities.DeliveryStop.filter({ status: 'delivered' }),
    ]);
    let driverList = us.filter(u => u.role === 'driver');
    if (u?.customer_id) driverList = driverList.filter(d => d.customer_id === u.customer_id);
    setDrivers(driverList);
    let filteredRecords = rs;
    if (u?.customer_id) {
      const customerDriverIds = driverList.map(d => d.id);
      filteredRecords = rs.filter(r => customerDriverIds.includes(r.driver_id));
    }
    setRecords(filteredRecords);
    setHosLogs(hs);
    setDeliveryStops(ds);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editRecord) {
      const updated = await api.entities.PayrollRecord.update(editRecord.id, data);
      setRecords(prev => prev.map(r => r.id === editRecord.id ? updated : r));
    } else {
      const created = await api.entities.PayrollRecord.create(data);
      setRecords(prev => [created, ...prev]);
    }
    setShowModal(false);
    setEditRecord(null);
  };

  const handleStatusChange = async (id, status) => {
    const updated = await api.entities.PayrollRecord.update(id, { status });
    setRecords(prev => prev.map(r => r.id === id ? updated : r));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payroll record?')) return;
    await api.entities.PayrollRecord.delete(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const isAdmin = ['admin', 'executive'].includes(user?.role);

  const filtered = records.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterPeriod && r.pay_period_start && !r.pay_period_start.startsWith(filterPeriod)) return false;
    return true;
  });

  const totalGross = filtered.reduce((s, r) => s + (r.gross_pay || 0), 0);
  const totalNet = filtered.reduce((s, r) => s + (r.net_pay || 0), 0);
  const paidCount = filtered.filter(r => r.status === 'paid').length;
  const pendingCount = filtered.filter(r => r.status === 'draft' || r.status === 'approved').length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-500" /> Payroll
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage driver compensation — W2, 1099, per mile, per stop, salary & hourly</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
          <Plus className="w-4 h-4 mr-1" /> Run Payroll
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Gross', value: `$${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-slate-700' },
          { label: 'Total Net', value: `$${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-green-600' },
          { label: 'Paid', value: paidCount, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
            </div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pay Type Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PAY_TYPE_COLORS).map(([type, cls]) => (
          <span key={type} className={`text-xs px-2.5 py-1 rounded-full font-bold ${cls}`}>{type}</span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
        </select>
        <input
          type="month"
          value={filterPeriod}
          onChange={e => setFilterPeriod(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Filter by month"
        />
        {filterPeriod && <button onClick={() => setFilterPeriod('')} className="text-xs text-slate-400 hover:text-slate-600">✕ Clear</button>}
      </div>

      {/* Records Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No payroll records yet</p>
          <p className="text-sm mt-1">Click "Run Payroll" to create the first entry</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Driver</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Pay Type</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Period</th>
                  <th className="text-right px-4 py-3 text-xs font-black text-slate-400 uppercase">Gross</th>
                  <th className="text-right px-4 py-3 text-xs font-black text-slate-400 uppercase">Deductions</th>
                  <th className="text-right px-4 py-3 text-xs font-black text-slate-400 uppercase">Net Pay</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Method</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(record => (
                  <PayrollRecordRow
                    key={record.id}
                    record={record}
                    payTypeColors={PAY_TYPE_COLORS}
                    statusColors={STATUS_COLORS}
                    onEdit={() => { setEditRecord(record); setShowModal(true); }}
                    onDelete={() => handleDelete(record.id)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <PayrollRunModal
          record={editRecord}
          drivers={drivers}
          hosLogs={hosLogs}
          deliveryStops={deliveryStops}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditRecord(null); }}
        />
      )}
    </div>
  );
}
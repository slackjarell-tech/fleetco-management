import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { DollarSign, Crown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import BulkCsvImport from '@/components/shared/BulkCsvImport';
import { BULK_IMPORT_BY_ROUTE } from '@/lib/bulkImportConfigs';
import { isExecutiveView } from '@/lib/roles';

export default function FleetCoPayroll() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBulk, setShowBulk] = useState(false);

  const load = async () => {
    const u = await api.auth.me().catch(() => null);
    setUser(u);
    const rs = await api.entities.PayrollRecord.list('-created_date', 300);
    const fleetco = rs.filter((r) => r.payee_type === 'fleetco_employee' || r.employee_user_id);
    setRecords(fleetco);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-950">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isExecutiveView(user?.role)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <Crown className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Executive access required for FleetCo employee payroll.</p>
        </div>
      </div>
    );
  }

  const bulkConfig = BULK_IMPORT_BY_ROUTE['/portal/fleetco-payroll'];
  const totalNet = records.reduce((s, r) => s + (r.net_pay || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-500" />
            FleetCo employee payroll
          </h1>
          <p className="text-slate-400 text-sm mt-1">Internal staff — owner, executive, fleet manager, coordinators</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600 text-slate-200" onClick={() => setShowBulk(true)}>
            <Upload className="w-4 h-4 mr-2" /> Bulk upload CSV
          </Button>
          <Link to="/portal/executive">
            <Button variant="ghost" className="text-slate-400">← Executive view</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase font-bold">Records</div>
          <div className="text-2xl font-black text-white">{records.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase font-bold">Total net (all)</div>
          <div className="text-2xl font-black text-emerald-400">${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-500 uppercase font-bold">Pending approval</div>
          <div className="text-2xl font-black text-amber-400">{records.filter((r) => r.status === 'draft').length}</div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border border-slate-800 rounded-xl">
          No FleetCo employee payroll yet. Use bulk upload with employee_email column.
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700 text-xs uppercase">
                <th className="text-left p-3">Employee</th>
                <th className="text-left p-3">Period</th>
                <th className="text-right p-3">Net</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-200">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="p-3 font-medium">{record.driver_name}</td>
                  <td className="p-3 text-slate-400">{record.pay_period_start} → {record.pay_period_end}</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">${Number(record.net_pay || 0).toFixed(2)}</td>
                  <td className="p-3">
                    <select
                      value={record.status}
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs"
                      onChange={async (e) => {
                        const updated = await api.entities.PayrollRecord.update(record.id, { status: e.target.value });
                        setRecords((prev) => prev.map((r) => (r.id === record.id ? updated : r)));
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showBulk && bulkConfig && (
        <BulkCsvImport
          config={bulkConfig}
          onClose={() => setShowBulk(false)}
          onSuccess={() => load()}
        />
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Building2, User, Download, Send, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { canManageCustomerTeam } from '@/lib/customerRoles';
import { isFleetCoAdmin } from '@/lib/roles';

export default function DirectDepositPanel({ user, payrollRecords, onDisbursed }) {
  const [banking, setBanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disbursing, setDisbursing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [companyForm, setCompanyForm] = useState({
    account_holder: '',
    bank_name: '',
    account_type: 'checking',
    routing_number: '',
    account_number: '',
  });
  const [payeeForm, setPayeeForm] = useState({
    user_id: '',
    account_holder: '',
    bank_name: '',
    account_type: 'checking',
    routing_number: '',
    account_number: '',
  });

  const canManage = canManageCustomerTeam(user?.role) || isFleetCoAdmin(user?.role);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.payroll.getBanking();
      setBanking(data);
    } catch (err) {
      setError(err.message || 'Could not load banking info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && canManage) load();
  }, [user?.id]);

  const saveCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.payroll.saveFunding(companyForm);
      setMessage('Company funding account saved (numbers encrypted on server).');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePayee = async (e) => {
    e.preventDefault();
    if (!payeeForm.user_id) {
      setError('Select an employee/driver for direct deposit.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.payroll.savePayeeBank(payeeForm);
      setMessage('Employee bank account saved.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRecord = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runDisbursement = async () => {
    if (!selectedIds.length) return;
    setDisbursing(true);
    setError('');
    try {
      const result = await api.payroll.disburse({ payroll_record_ids: selectedIds });
      setMessage(result.message || 'Direct deposit batch created.');
      if (result.ach_export_csv) {
        const blob = new Blob([result.ach_export_csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fleetco-ach-${result.batch_id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setSelectedIds([]);
      onDisbursed?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setDisbursing(false);
    }
  };

  if (!canManage) return null;

  const approvedForDeposit = (payrollRecords || []).filter(
    (r) => r.status === 'approved' && (r.net_pay || 0) > 0 && r.payment_method === 'Direct Deposit',
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
        <div>
          <h2 className="text-lg font-black text-slate-900">Direct deposit</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Store company and employee bank details securely, then generate an ACH file for your bank.
            Live money movement requires uploading the file to your bank or connecting a processor (Stripe Treasury, etc.).
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {message && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{message}</p>}

      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={saveCompany} className="space-y-3 border border-slate-100 rounded-xl p-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-amber-500" /> Company funding account
              </h3>
              {banking?.funding && (
                <p className="text-xs text-slate-500">
                  On file: {banking.funding.account_holder} · ****{banking.funding.account_last4} ({banking.funding.bank_name || 'Bank'})
                </p>
              )}
              <Input placeholder="Account holder (legal name)" value={companyForm.account_holder} onChange={(e) => setCompanyForm({ ...companyForm, account_holder: e.target.value })} />
              <Input placeholder="Bank name" value={companyForm.bank_name} onChange={(e) => setCompanyForm({ ...companyForm, bank_name: e.target.value })} />
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={companyForm.account_type} onChange={(e) => setCompanyForm({ ...companyForm, account_type: e.target.value })}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
              <Input placeholder="Routing number" inputMode="numeric" value={companyForm.routing_number} onChange={(e) => setCompanyForm({ ...companyForm, routing_number: e.target.value })} />
              <Input placeholder="Account number" inputMode="numeric" value={companyForm.account_number} onChange={(e) => setCompanyForm({ ...companyForm, account_number: e.target.value })} />
              <Button type="submit" disabled={saving} className="w-full bg-slate-900 hover:bg-slate-800">Save company bank</Button>
            </form>

            <form onSubmit={savePayee} className="space-y-3 border border-slate-100 rounded-xl p-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-amber-500" /> Employee / driver deposit account
              </h3>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={payeeForm.user_id}
                onChange={(e) => setPayeeForm({ ...payeeForm, user_id: e.target.value })}
              >
                <option value="">Select payee…</option>
                {(banking?.drivers || []).map((d) => (
                  <option key={d.id} value={d.id}>{d.name} · {d.email}</option>
                ))}
              </select>
              <Input placeholder="Account holder name" value={payeeForm.account_holder} onChange={(e) => setPayeeForm({ ...payeeForm, account_holder: e.target.value })} />
              <Input placeholder="Bank name" value={payeeForm.bank_name} onChange={(e) => setPayeeForm({ ...payeeForm, bank_name: e.target.value })} />
              <Input placeholder="Routing number" value={payeeForm.routing_number} onChange={(e) => setPayeeForm({ ...payeeForm, routing_number: e.target.value })} />
              <Input placeholder="Account number" value={payeeForm.account_number} onChange={(e) => setPayeeForm({ ...payeeForm, account_number: e.target.value })} />
              <Button type="submit" disabled={saving} variant="outline" className="w-full">Save employee bank</Button>
            </form>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
              <Send className="w-4 h-4" /> Send direct deposit (approved rows)
            </h3>
            {approvedForDeposit.length === 0 ? (
              <p className="text-sm text-slate-400">Approve payroll with payment method &quot;Direct Deposit&quot; to disburse.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {approvedForDeposit.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleRecord(r.id)} />
                    {r.driver_name} · ${Number(r.net_pay || 0).toFixed(2)} · {r.pay_period_start} – {r.pay_period_end}
                  </label>
                ))}
              </div>
            )}
            <Button
              onClick={runDisbursement}
              disabled={disbursing || !selectedIds.length}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {disbursing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Create batch & download ACH CSV
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

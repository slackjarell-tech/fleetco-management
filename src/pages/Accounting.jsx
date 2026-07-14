import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import {
  Calculator, FileText, Package, Users, CheckCircle2, XCircle,
  Send, Truck, DollarSign, Plus, RefreshCw, AlertTriangle, BookOpen, Clock, Mail, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PurchaseOrderModal from '@/components/accounting/PurchaseOrderModal';
import {
  canAccessAccounting, canSubmitPurchaseOrder, canApprovePurchaseOrder,
  canIssuePurchaseOrder, canReceivePurchaseOrder, canRunPayroll, canApprovePayroll,
  PO_STATUS_LABELS, PAYROLL_RUN_STATUS_LABELS,
} from '@/lib/accounting/accountingRoles';
import { calculatePayrollTaxes, summarizeBusinessTaxes } from '@/lib/accounting/taxEngine';
import { buildPurchaseOrderPdfBase64, downloadPurchaseOrderPdf } from '@/lib/accounting/poPdf';
import { hoursByUser, buildPayrollDraftFromTimeClock } from '@/lib/accounting/timeclockPayroll';
import { ensureDefaultChart, suggestJournalForPO, suggestJournalForPayrollRun } from '@/lib/accounting/chartOfAccounts';
import { build1099Summary, download1099Csv } from '@/lib/accounting/form1099';
import { useCustomerContext } from '@/lib/CustomerContext';

const PO_STATUS_STYLE = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-700',
  declined: 'bg-red-100 text-red-700',
  issued: 'bg-indigo-100 text-indigo-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-400',
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: Calculator },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: Package },
  { id: 'payroll-runs', label: 'Payroll Runs', icon: Users },
  { id: 'general-ledger', label: 'General Ledger', icon: BookOpen },
  { id: 'taxes', label: 'Tax Center', icon: FileText },
];

function nextPoNumber(existing) {
  const year = new Date().getFullYear();
  const n = existing.filter(p => (p.po_number || '').includes(String(year))).length + 1;
  return `PO-${year}-${String(n).padStart(4, '0')}`;
}

export default function Accounting() {
  const { viewAsCustomerId } = useCustomerContext();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [parts, setParts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showPOModal, setShowPOModal] = useState(false);
  const [editPO, setEditPO] = useState(null);
  const [declinePO, setDeclinePO] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [selectedPayrollIds, setSelectedPayrollIds] = useState([]);
  const [customerState, setCustomerState] = useState('TX');
  const [timeClockEntries, setTimeClockEntries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [chartAccounts, setChartAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [tcFrom, setTcFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [tcTo, setTcTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [tcHourlyRate, setTcHourlyRate] = useState(22);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [poEmailMsg, setPoEmailMsg] = useState('');

  const load = async () => {
    setLoading(true);
    const u = await api.auth.me().catch(() => null);
    setUser(u);
    const cid = u?.customer_id || viewAsCustomerId || null;
    const [poList, runs, records, p, v, inv, fuel, cust, tc, users, coa, journals] = await Promise.all([
      api.entities.PurchaseOrder.list('-created_date', 500),
      api.entities.PayrollRun.list('-created_date', 200),
      api.entities.PayrollRecord.list('-created_date', 500),
      api.entities.PartInventory.list(),
      api.entities.Vendor.list(),
      api.entities.Invoice.list('-issue_date', 500),
      api.entities.FuelLog.list('-date', 500),
      api.entities.Customer.list(),
      api.entities.TimeClockEntry.list('-clock_in', 2000),
      api.entities.User.list(),
      api.entities.ChartOfAccount.list(),
      api.entities.JournalEntry.list('-created_date', 300),
    ]);
    setPos(poList);
    setPayrollRuns(runs);
    setPayrollRecords(records);
    setParts(p);
    setVendors(v);
    setInvoices(inv);
    setFuelLogs(fuel);
    setCustomers(cust);
    setTimeClockEntries(tc);
    setAllUsers(users);
    const driverList = users.filter(x => x.role === 'driver' && (!cid || x.customer_id === cid));
    setDrivers(driverList);
    setJournalEntries(journals);

    let accounts = coa;
    if (canAccessAccounting(u) && accounts.length < 5) {
      accounts = await ensureDefaultChart(api, cid);
    }
    setChartAccounts(accounts);

    if (cid) {
      const c = cust.find(x => x.id === cid);
      if (c?.state) setCustomerState(c.state);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [viewAsCustomerId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t && TABS.some(x => x.id === t)) setTab(t);
  }, []);

  const scopedRecords = useMemo(() => {
    if (!user?.customer_id) return payrollRecords;
    const driverIds = new Set(
      payrollRecords.map(r => r.driver_id).filter(Boolean),
    );
    return payrollRecords.filter(r => !r.customer_id || r.customer_id === user.customer_id);
  }, [payrollRecords, user]);

  const taxSummary = useMemo(
    () => summarizeBusinessTaxes({
      invoices,
      payrollRecords: scopedRecords.filter(r => r.status === 'paid' || r.status === 'approved'),
      fuelLogs,
      state: customerState,
    }),
    [invoices, scopedRecords, fuelLogs, customerState],
  );

  const draftPayroll = scopedRecords.filter(r => r.status === 'draft');

  const tcHours = useMemo(() => {
    const driverIds = drivers.map(d => d.id);
    return hoursByUser(timeClockEntries, { dateFrom: tcFrom, dateTo: tcTo, customerUserIds: driverIds });
  }, [timeClockEntries, tcFrom, tcTo, drivers]);

  const form1099 = useMemo(
    () => build1099Summary(scopedRecords.filter(r => r.status === 'paid'), allUsers, taxYear),
    [scopedRecords, allUsers, taxYear],
  );

  const handleSavePO = async (data) => {
    if (editPO) {
      const updated = await api.entities.PurchaseOrder.update(editPO.id, data);
      setPos(prev => prev.map(p => p.id === editPO.id ? updated : p));
    } else {
      const created = await api.entities.PurchaseOrder.create({
        ...data,
        po_number: nextPoNumber(pos),
        customer_id: user?.customer_id || viewAsCustomerId || null,
      });
      setPos(prev => [created, ...prev]);
    }
    setShowPOModal(false);
    setEditPO(null);
  };

  const updatePO = async (po, patch) => {
    const updated = await api.entities.PurchaseOrder.update(po.id, patch);
    setPos(prev => prev.map(p => p.id === po.id ? updated : p));
  };

  const approvePO = async (po) => {
    await updatePO(po, {
      status: 'approved',
      reviewed_by_id: user.id,
      reviewed_by_name: user.full_name,
      reviewed_at: new Date().toISOString(),
    });
  };

  const declinePOAction = async () => {
    if (!declinePO) return;
    await updatePO(declinePO, {
      status: 'declined',
      decline_reason: declineReason,
      reviewed_by_id: user.id,
      reviewed_by_name: user.full_name,
      reviewed_at: new Date().toISOString(),
    });
    setDeclinePO(null);
    setDeclineReason('');
  };

  const issuePO = async (po) => {
    const vendor = vendors.find(v => v.id === po.vendor_id);
    const pdfBase64 = buildPurchaseOrderPdfBase64(po, vendor);
    let emailResult = { success: false };
    try {
      emailResult = await api.accounting.emailPurchaseOrder(po.id, { pdfBase64 });
    } catch (err) {
      emailResult = { success: false, error: err.message, hint: err.hint };
    }

    const updated = await api.entities.PurchaseOrder.update(po.id, {
      status: 'issued',
      issued_at: new Date().toISOString(),
      issued_by_name: user.full_name,
      emailed_to: emailResult.sentTo || null,
      email_sent: !!emailResult.success,
    });
    setPos(prev => prev.map(p => p.id === po.id ? updated : p));

    const journal = suggestJournalForPO(updated);
    const entry = await api.entities.JournalEntry.create({
      ...journal,
      customer_id: user?.customer_id || viewAsCustomerId || null,
      entry_number: `JE-PO-${updated.po_number}`,
      entry_date: new Date().toISOString().slice(0, 10),
      status: 'posted',
      source_type: 'purchase_order',
      source_id: updated.id,
    });
    setJournalEntries(prev => [entry, ...prev]);

    if (emailResult.success) {
      setPoEmailMsg(`PO ${updated.po_number} emailed to ${emailResult.sentTo}`);
    } else {
      setPoEmailMsg(emailResult.error
        ? `PO issued — email failed: ${emailResult.error}${emailResult.hint ? ` (${emailResult.hint})` : ''}`
        : 'PO issued — configure RESEND_API_KEY to email vendors');
    }
    setTimeout(() => setPoEmailMsg(''), 8000);
  };

  const importTimeClockPayroll = async () => {
    if (!tcHours.length) return;
    const created = [];
    for (const row of tcHours) {
      const driver = drivers.find(d => d.id === row.user_id);
      if (!driver || row.hours <= 0) continue;
      const draft = buildPayrollDraftFromTimeClock({
        driver,
        hours: row.hours,
        periodStart: tcFrom,
        periodEnd: tcTo,
        hourlyRate: tcHourlyRate,
      });
      const tax = calculatePayrollTaxes({ ...draft, pay_type: 'Hourly' }, customerState);
      draft.deductions = tax.totalEmployeeWithholding || 0;
      draft.net_pay = tax.netPay ?? draft.gross_pay;
      const rec = await api.entities.PayrollRecord.create({
        ...draft,
        customer_id: user?.customer_id || viewAsCustomerId || null,
      });
      created.push(rec);
    }
    setPayrollRecords(prev => [...created, ...prev]);
  };

  const receivePO = async (po) => {
    for (const line of po.line_items || []) {
      if (!line.part_id) continue;
      const part = parts.find(p => p.id === line.part_id);
      if (part) {
        await api.entities.PartInventory.update(part.id, {
          quantity_on_hand: (part.quantity_on_hand || 0) + (Number(line.quantity) || 0),
        });
      }
    }
    await updatePO(po, { status: 'received', received_at: new Date().toISOString() });
    const p = await api.entities.PartInventory.list();
    setParts(p);
  };

  const createPayrollRun = async () => {
    if (!selectedPayrollIds.length) return;
    const selected = scopedRecords.filter(r => selectedPayrollIds.includes(r.id));
    let totalGross = 0;
    let totalTax = 0;
    let totalNet = 0;
    selected.forEach(r => {
      const t = calculatePayrollTaxes(r, customerState);
      totalGross += Number(r.gross_pay) || 0;
      totalTax += (Number(r.gross_pay) || 0) - (t.netPay ?? r.net_pay ?? 0);
      totalNet += t.netPay ?? r.net_pay ?? 0;
    });
    const year = new Date().getFullYear();
    const run = await api.entities.PayrollRun.create({
      run_number: `PR-${year}-${String(payrollRuns.length + 1).padStart(4, '0')}`,
      customer_id: user?.customer_id || viewAsCustomerId || null,
      pay_period_start: selected[0]?.pay_period_start,
      pay_period_end: selected[0]?.pay_period_end,
      status: 'submitted',
      record_ids: selectedPayrollIds,
      total_gross: round2(totalGross),
      total_taxes: round2(totalTax),
      total_net: round2(totalNet),
      created_by: user.full_name,
      submitted_at: new Date().toISOString(),
    });
    setPayrollRuns(prev => [run, ...prev]);
    setSelectedPayrollIds([]);
  };

  const updatePayrollRun = async (run, patch) => {
    const updated = await api.entities.PayrollRun.update(run.id, patch);
    setPayrollRuns(prev => prev.map(r => r.id === run.id ? updated : r));
    if (patch.status === 'posted' || patch.status === 'paid') {
      for (const id of run.record_ids || []) {
        await api.entities.PayrollRecord.update(id, { status: patch.status === 'paid' ? 'paid' : 'approved' });
      }
      if (patch.status === 'posted') {
        const journal = suggestJournalForPayrollRun(updated);
        const entry = await api.entities.JournalEntry.create({
          ...journal,
          customer_id: user?.customer_id || viewAsCustomerId || null,
          entry_number: `JE-${updated.run_number}`,
          entry_date: new Date().toISOString().slice(0, 10),
          status: 'posted',
          source_type: 'payroll_run',
          source_id: updated.id,
        });
        setJournalEntries(prev => [entry, ...prev]);
      }
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canAccessAccounting(user)) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="font-semibold">Accounting access required</p>
        <p className="text-sm mt-1">Contact your fleet owner or HR for access.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" /> Accounting Center
            </h1>
            <p className="text-slate-300 text-xs mt-1">
              Payroll tax runs · Purchase order approvals · Business tax estimates
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-800" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                tab === t.id ? 'bg-amber-500 text-slate-900 border-amber-500' : 'border-slate-600 text-slate-300 hover:border-amber-400'
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {poEmailMsg && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <Mail className="w-4 h-4 flex-shrink-0" /> {poEmailMsg}
        </div>
      )}

      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Open PO requests', value: pos.filter(p => p.status === 'submitted').length, icon: Package, color: 'text-amber-500' },
            { label: 'POs awaiting receipt', value: pos.filter(p => p.status === 'issued').length, icon: Truck, color: 'text-indigo-500' },
            { label: 'Draft payroll entries', value: draftPayroll.length, icon: Users, color: 'text-blue-500' },
            { label: 'Est. payroll withholding', value: `$${taxSummary.payrollWithholding.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <div className="text-2xl font-black text-slate-900">{value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            <strong>Workflow:</strong> Parts managers submit PO requests from{' '}
            <Link to="/portal/parts" className="underline font-bold">Parts Inventory</Link> or here.
            Fleet managers / HR / owners approve, accounting issues the PO, then receive parts into inventory.
            Payroll runs batch draft entries with automatic W-2 tax withholding estimates.
          </div>
        </div>
      )}

      {tab === 'purchase-orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-black text-slate-900">Purchase Orders</h2>
            {canSubmitPurchaseOrder(user) && (
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                onClick={() => { setEditPO(null); setShowPOModal(true); }}>
                <Plus className="w-4 h-4 mr-1" /> New parts request
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {pos.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-8">No purchase orders yet.</p>
            )}
            {pos.map(po => (
              <div key={po.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900">{po.po_number || 'Draft PO'}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PO_STATUS_STYLE[po.status] || PO_STATUS_STYLE.draft}`}>
                        {PO_STATUS_LABELS[po.status] || po.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{po.vendor_name || 'No vendor'} · ${Number(po.total || 0).toFixed(2)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Requested by {po.requested_by_name || '—'}
                      {po.reviewed_by_name && ` · Reviewed by ${po.reviewed_by_name}`}
                    </p>
                    {po.decline_reason && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {po.decline_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {po.status === 'draft' && canSubmitPurchaseOrder(user) && (
                      <Button size="sm" onClick={() => updatePO(po, { status: 'submitted', requested_at: new Date().toISOString() })}>
                        <Send className="w-3.5 h-3.5 mr-1" /> Submit
                      </Button>
                    )}
                    {po.status === 'submitted' && canApprovePurchaseOrder(user) && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approvePO(po)}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => setDeclinePO(po)}>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
                        </Button>
                      </>
                    )}
                    {po.status === 'approved' && canIssuePurchaseOrder(user) && (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => issuePO(po)}>
                        <Mail className="w-3.5 h-3.5 mr-1" /> Issue PO &amp; email vendor
                      </Button>
                    )}
                    {(po.status === 'issued' || po.status === 'received') && (
                      <Button size="sm" variant="outline" onClick={() => downloadPurchaseOrderPdf(po, vendors.find(v => v.id === po.vendor_id))}>
                        <Download className="w-3.5 h-3.5 mr-1" /> PDF
                      </Button>
                    )}
                    {po.status === 'issued' && canReceivePurchaseOrder(user) && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => receivePO(po)}>
                        <Package className="w-3.5 h-3.5 mr-1" /> Mark received
                      </Button>
                    )}
                    {po.status === 'draft' && (
                      <Button size="sm" variant="outline" onClick={() => { setEditPO(po); setShowPOModal(true); }}>Edit</Button>
                    )}
                  </div>
                </div>
                {(po.line_items || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="text-slate-400 uppercase">
                        <th className="text-left pb-1">Part</th><th className="text-right pb-1">Qty</th><th className="text-right pb-1">Unit</th><th className="text-right pb-1">Total</th>
                      </tr></thead>
                      <tbody>
                        {po.line_items.map((l, i) => (
                          <tr key={i} className="border-t border-slate-50">
                            <td className="py-1">{l.part_number || l.description}</td>
                            <td className="text-right py-1">{l.quantity}</td>
                            <td className="text-right py-1">${Number(l.unit_cost || 0).toFixed(2)}</td>
                            <td className="text-right py-1 font-bold">${Number(l.total || l.quantity * l.unit_cost || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'payroll-runs' && (
        <div className="space-y-6">
          {canRunPayroll(user) && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Import hours from Time Clock
              </h3>
              <div className="flex flex-wrap gap-3 items-end mb-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">From</label>
                  <input type="date" value={tcFrom} onChange={e => setTcFrom(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">To</label>
                  <input type="date" value={tcTo} onChange={e => setTcTo(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Hourly rate ($)</label>
                  <input type="number" min="0" step="0.01" value={tcHourlyRate} onChange={e => setTcHourlyRate(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm w-24" />
                </div>
                <Button className="bg-slate-900 text-white font-bold" onClick={importTimeClockPayroll} disabled={!tcHours.length}>
                  Create {tcHours.length} draft payroll entries
                </Button>
              </div>
              {tcHours.length > 0 ? (
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {tcHours.map(row => (
                    <div key={row.user_id} className="flex justify-between text-slate-600">
                      <span>{row.user_name}</span>
                      <span className="font-bold">{row.hours} hrs · ${(row.hours * tcHourlyRate).toFixed(2)} gross</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No shift entries in this date range — drivers clock in via <Link to="/portal/timeclock" className="underline">Time Clock</Link>.</p>
              )}
            </div>
          )}

          {canRunPayroll(user) && draftPayroll.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="font-black text-slate-900 mb-3">Create payroll run from draft entries</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {draftPayroll.map(r => (
                  <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={selectedPayrollIds.includes(r.id)}
                      onChange={e => setSelectedPayrollIds(prev => e.target.checked ? [...prev, r.id] : prev.filter(x => x !== r.id))} />
                    <span className="font-medium">{r.driver_name}</span>
                    <span className="text-slate-400">{r.pay_period_start} → {r.pay_period_end}</span>
                    <span className="font-bold ml-auto">${Number(r.gross_pay || 0).toFixed(2)}</span>
                  </label>
                ))}
              </div>
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" disabled={!selectedPayrollIds.length} onClick={createPayrollRun}>
                Submit payroll run ({selectedPayrollIds.length} selected)
              </Button>
              <p className="text-xs text-slate-400 mt-2">
                Or add entries in <Link to="/portal/payroll" className="underline">Driver Payroll</Link> first.
              </p>
            </div>
          )}

          <div>
            <h3 className="font-black text-slate-900 mb-3">Payroll runs</h3>
            {payrollRuns.length === 0 && <p className="text-slate-400 text-sm">No payroll runs yet.</p>}
            {payrollRuns.map(run => (
              <div key={run.id} className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <div className="font-black">{run.run_number}</div>
                    <div className="text-sm text-slate-500">{run.pay_period_start} → {run.pay_period_end}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Gross ${run.total_gross} · Taxes ${run.total_taxes} · Net ${run.total_net}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100">{PAYROLL_RUN_STATUS_LABELS[run.status]}</span>
                    {run.status === 'submitted' && canApprovePayroll(user) && (
                      <Button size="sm" onClick={() => updatePayrollRun(run, { status: 'approved', approved_by: user.full_name, approved_at: new Date().toISOString() })}>Approve</Button>
                    )}
                    {run.status === 'approved' && canApprovePayroll(user) && (
                      <Button size="sm" className="bg-indigo-600" onClick={() => updatePayrollRun(run, { status: 'posted', posted_at: new Date().toISOString() })}>Post</Button>
                    )}
                    {run.status === 'posted' && canRunPayroll(user) && (
                      <Button size="sm" className="bg-green-600" onClick={() => updatePayrollRun(run, { status: 'paid', paid_at: new Date().toISOString() })}>Mark paid</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'general-ledger' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-black text-slate-900 mb-3">Chart of accounts</h3>
            <div className="max-h-80 overflow-y-auto text-sm">
              <table className="w-full">
                <thead><tr className="text-xs text-slate-400 uppercase border-b">
                  <th className="text-left pb-2">Code</th><th className="text-left pb-2">Account</th><th className="text-left pb-2">Type</th>
                </tr></thead>
                <tbody>
                  {chartAccounts.map(a => (
                    <tr key={a.id || a.code} className="border-b border-slate-50">
                      <td className="py-1.5 font-mono text-xs">{a.code}</td>
                      <td className="py-1.5">{a.name}</td>
                      <td className="py-1.5 text-slate-500">{a.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-black text-slate-900 mb-3">Journal entries</h3>
            {journalEntries.length === 0 && <p className="text-sm text-slate-400">Entries auto-post when POs are issued or payroll runs are posted.</p>}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {journalEntries.map(je => (
                <div key={je.id} className="border border-slate-100 rounded-lg p-3 text-xs">
                  <div className="font-bold text-slate-900">{je.entry_number || je.description}</div>
                  <div className="text-slate-500">{je.entry_date} · {je.status}</div>
                  {(je.line_items || []).map((l, i) => (
                    <div key={i} className="flex justify-between text-slate-600 mt-1">
                      <span>{l.account_code} {l.account_name}</span>
                      <span>{l.debit ? `Dr $${l.debit}` : `Cr $${l.credit}`}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'taxes' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="font-black text-slate-900">Business tax summary ({customerState})</h3>
            {[
              ['Revenue (paid invoices)', taxSummary.revenue],
              ['Payroll gross', taxSummary.payrollGross],
              ['Payroll withholding', taxSummary.payrollWithholding],
              ['Employer payroll taxes (est.)', taxSummary.employerPayrollTaxes],
              ['Fuel spend', taxSummary.fuelSpend],
              ['Sales tax collected', taxSummary.salesTaxCollected],
              ['Est. taxable income', taxSummary.estimatedTaxableIncome],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                <span className="text-slate-600">{label}</span>
                <span className="font-bold">${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 pt-2">
              Estimates for planning — consult a CPA for filing. IFTA fuel tax details in{' '}
              <Link to="/portal/ifta" className="underline">IFTA Dashboard</Link>.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-black text-slate-900 mb-3">W-2 withholding preview (sample)</h3>
            {draftPayroll.slice(0, 3).map(r => {
              const t = calculatePayrollTaxes(r, customerState);
              return (
                <div key={r.id} className="mb-4 pb-4 border-b border-slate-100 last:border-0">
                  <div className="font-bold text-sm">{r.driver_name} · {r.pay_type}</div>
                  <div className="text-xs text-slate-500">Gross ${r.gross_pay} → Net ${t.netPay ?? r.net_pay}</div>
                  {(t.breakdown || []).map(b => (
                    <div key={b.label} className="flex justify-between text-xs text-slate-600 mt-1">
                      <span>{b.label}</span><span>${b.amount}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            {!draftPayroll.length && <p className="text-sm text-slate-400">No draft payroll to preview.</p>}
          </div>
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="font-black text-slate-900">1099-NEC contractor summary (≥ $600)</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Tax year</label>
                <input type="number" value={taxYear} onChange={e => setTaxYear(Number(e.target.value))} className="border rounded px-2 py-1 text-sm w-24" />
                <Button size="sm" variant="outline" disabled={!form1099.length} onClick={() => download1099Csv(form1099, { taxYear, name: 'FleetCo Management LLC' })}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
                </Button>
              </div>
            </div>
            {form1099.length === 0 ? (
              <p className="text-sm text-slate-400">No paid 1099 contractors at $600+ for {taxYear}. Mark payroll as paid with pay type 1099.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-slate-400 uppercase border-b">
                    <th className="text-left pb-2">Contractor</th><th className="text-left pb-2">Email</th><th className="text-right pb-2">Box 1 payments</th><th className="text-right pb-2"># Payments</th>
                  </tr></thead>
                  <tbody>
                    {form1099.map(c => (
                      <tr key={c.contractor_id || c.legal_name} className="border-b border-slate-50">
                        <td className="py-2 font-medium">{c.legal_name}</td>
                        <td className="py-2 text-slate-500">{c.email || '—'}</td>
                        <td className="py-2 text-right font-bold">${c.payments.toFixed(2)}</td>
                        <td className="py-2 text-right">{c.payment_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-3">Export and file via your CPA or IRS FIRE system — not a substitute for official 1099 forms.</p>
          </div>
        </div>
      )}

      {showPOModal && (
        <PurchaseOrderModal
          po={editPO}
          parts={parts}
          vendors={vendors}
          user={user}
          customerState={customerState}
          onSave={handleSavePO}
          onClose={() => { setShowPOModal(false); setEditPO(null); }}
        />
      )}

      {declinePO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-black">Decline PO {declinePO.po_number}</h3>
            <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Reason for decline..." />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeclinePO(null)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={declinePOAction}>Decline</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

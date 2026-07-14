import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet, Download, Loader2, CheckCircle2,
  DollarSign, Fuel, Package, Truck, Wrench, Users, BarChart2,
  ClipboardList, Globe, TrendingUp, AlertTriangle, Calendar,
  ShieldCheck, MapPin, Clock, CreditCard, BoxSelect
} from 'lucide-react';
import ReportConfigModal, { getColumnsForReport, getDefaultColumnKeys } from '@/components/reports/ReportConfigModal';
import CustomerReportPicker from '@/components/reports/CustomerReportPicker';
import { isInternalRole, isCustomerPortalUser } from '@/lib/roles';
import { filterReportData, customerFilterLabel } from '@/lib/reportCustomerFilter';
import { useCustomerContext } from '@/lib/CustomerContext';
import {
  filterRowsByColumns,
  downloadReportRows,
} from '@/lib/reportExport';
import { buildReport, MASTER_EXPORT_SHEETS } from '@/lib/reportBuilders';

// ─── Report Definitions ───────────────────────────────────────────────────────
const REPORT_CATALOG = [
  {
    id: 'revenue_summary',
    category: 'Financial',
    title: 'Revenue Summary',
    description: 'All paid invoices with totals, customer, and date',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    id: 'invoice_aging',
    category: 'Financial',
    title: 'Invoice Aging Report',
    description: 'Outstanding invoices by status and days overdue',
    icon: CreditCard,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  {
    id: 'fuel_cost',
    category: 'Financial',
    title: 'Fuel Cost Report',
    description: 'All fuel purchases by vehicle, date, gallons, and cost',
    icon: Fuel,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    id: 'fuel_per_vehicle',
    category: 'Financial',
    title: 'Fuel Cost Per Vehicle',
    description: 'Monthly fuel spend totals ranked by vehicle',
    icon: Truck,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    id: 'payroll_summary',
    category: 'Financial',
    title: 'Payroll Summary',
    description: 'Driver payroll records with gross, deductions, and net pay',
    icon: CreditCard,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    id: 'load_summary',
    category: 'Operations',
    title: 'Load Summary Report',
    description: 'All loads with origin, destination, status, rate, and miles',
    icon: Package,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 'load_revenue',
    category: 'Operations',
    title: 'Load Revenue by Driver',
    description: 'Revenue generated per assigned driver across all loads',
    icon: TrendingUp,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  {
    id: 'driver_performance',
    category: 'Operations',
    title: 'Driver Performance Report',
    description: 'Loads completed, miles driven, and revenue per driver',
    icon: Users,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  {
    id: 'fleet_status',
    category: 'Fleet',
    title: 'Fleet Status Report',
    description: 'All vehicles with status, type, odometer, and assignment',
    icon: Truck,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  {
    id: 'vehicle_downtime',
    category: 'Fleet',
    title: 'Vehicle Downtime Report',
    description: 'Days each vehicle spent in shop from work order dates',
    icon: Clock,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  {
    id: 'maintenance_schedule',
    category: 'Fleet',
    title: 'Maintenance Schedule Report',
    description: 'Upcoming, overdue, and completed maintenance tasks',
    icon: Calendar,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  {
    id: 'work_orders',
    category: 'Fleet',
    title: 'Work Orders Report',
    description: 'All work orders with status, priority, costs, and labor hours',
    icon: Wrench,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  {
    id: 'parts_inventory',
    category: 'Fleet',
    title: 'Parts Inventory Report',
    description: 'All parts with quantity on hand, reorder point, and unit cost',
    icon: BoxSelect,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    id: 'inspections',
    category: 'Compliance',
    title: 'Inspection & DVIR Report',
    description: 'All vehicle inspections with status, defects, and sign-offs',
    icon: ShieldCheck,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    id: 'hos_logs',
    category: 'Compliance',
    title: 'HOS / ELD Logs Report',
    description: 'Driver hours of service logs with driving, on-duty, and off-duty time',
    icon: ClipboardList,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 'ifta_fuel',
    category: 'Compliance',
    title: 'IFTA Fuel Tax Report',
    description: 'Fuel purchases by state for quarterly IFTA tax filing',
    icon: Globe,
    color: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
  },
  {
    id: 'customer_list',
    category: 'CRM',
    title: 'Customer List',
    description: 'All customers with contact info, status, and fleet size',
    icon: Users,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
  {
    id: 'vendor_list',
    category: 'CRM',
    title: 'Vendor & Contracts Report',
    description: 'All vendors with type, contact, contract dates, and rates',
    icon: MapPin,
    color: 'text-lime-600',
    bg: 'bg-lime-50',
    border: 'border-lime-200',
  },
  {
    id: 'screening_records',
    category: 'Compliance',
    title: 'Driver Screening Records',
    description: 'Background checks, MVR, and drug test results per driver',
    icon: ShieldCheck,
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
  {
    id: 'fleetco_master_export',
    category: 'CRM',
    title: 'FleetCo Master Data Export',
    description: 'All data types in one workbook — 19 sheets including executive summary, P&L, compliance, and parts detail',
    icon: FileSpreadsheet,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
  },
  {
    id: 'fleet_pnl',
    category: 'Financial',
    title: 'Fleet P&L Summary',
    description: 'Revenue vs fuel + repair costs per vehicle with margin %',
    icon: BarChart2,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
  },
  {
    id: 'executive_summary',
    category: 'Analytics',
    title: 'Executive Summary',
    description: 'KPI dashboard — loads, revenue, costs, fleet, compliance totals',
    icon: BarChart2,
    color: 'text-slate-800',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
  },
  {
    id: 'customer_profitability',
    category: 'Analytics',
    title: 'Customer Profitability',
    description: 'Revenue, fuel, repairs, and payroll rolled up per customer account',
    icon: TrendingUp,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
  },
  {
    id: 'load_profitability',
    category: 'Analytics',
    title: 'Load Profitability',
    description: 'Rate per mile and lane analysis for every load in range',
    icon: Package,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
  },
  {
    id: 'fuel_efficiency',
    category: 'Analytics',
    title: 'Fuel Efficiency (MPG)',
    description: 'Miles per gallon and cost-per-mile by vehicle from fuel logs',
    icon: Fuel,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
  },
  {
    id: 'work_order_parts',
    category: 'Fleet',
    title: 'Work Order Parts Detail',
    description: 'Line-item parts used on each work order with costs',
    icon: BoxSelect,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-300',
  },
  {
    id: 'incident_report',
    category: 'Compliance',
    title: 'Incident & Safety Report',
    description: 'Accidents, violations, CSA points, and corrective actions',
    icon: AlertTriangle,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
  },
  {
    id: 'compliance_scorecard',
    category: 'Compliance',
    title: 'Compliance Scorecard',
    description: 'Inspection pass rates, HOS violations, screening expirations',
    icon: ShieldCheck,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-300',
  },
  {
    id: 'team_roster',
    category: 'CRM',
    title: 'Team Roster',
    description: 'Portal users with roles, customer assignment, and contact info',
    icon: Users,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
  },
];

const CATEGORIES = ['All', 'Analytics', 'Financial', 'Operations', 'Fleet', 'Compliance', 'CRM'];

// ─── Excel Export Builder ─────────────────────────────────────────────────────
function downloadMasterWorkbook(data, userMap, dateFrom, dateTo, customerLabel, sheetIds = MASTER_EXPORT_SHEETS) {
  const wb = XLSX.utils.book_new();
  for (const id of sheetIds) {
    const result = buildReport(id, data, userMap, dateFrom, dateTo);
    if (result?.rows?.length) {
      const ws = XLSX.utils.aoa_to_sheet(result.rows);
      const safeName = (result.sheet || id).slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeName);
    }
  }
  const label = customerLabel.replace(/[^\w-]+/g, '_').slice(0, 40);
  XLSX.writeFile(wb, `FleetCo_Master_Export_${label}.xlsx`);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reports() {
  const { viewAsCustomerId } = useCustomerContext();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    loads: [], invoices: [], fuel: [], vehicles: [], workOrders: [],
    maintenance: [], inspections: [], hosLogs: [], customers: [],
    vendors: [], payroll: [], parts: [], screenings: [], users: [],
    incidents: [],
  });
  const [generating, setGenerating] = useState(null);
  const [done, setDone] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [configReport, setConfigReport] = useState(null);
  const [allCustomersSelected, setAllCustomersSelected] = useState(true);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  // Date range
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);

  const PRESETS = [
    { label: 'This Month', from: firstOfMonth, to: today },
    { label: 'Last 30 Days', from: new Date(now - 30 * 86400000).toISOString().slice(0, 10), to: today },
    { label: 'Last 90 Days', from: new Date(now - 90 * 86400000).toISOString().slice(0, 10), to: today },
    { label: 'This Year', from: `${now.getFullYear()}-01-01`, to: today },
    { label: 'All Time', from: '2000-01-01', to: '2099-12-31' },
  ];

  useEffect(() => {
    api.auth.me().then(async u => {
      setUser(u);
      const internal = isInternalRole(u?.role);
      const listEntity = (name, sort, limit) => (
        internal
          ? api.reports.listEntity(name, sort, limit)
          : api.entities[name].list(sort, limit)
      );

      const [loads, invoices, fuel, vehicles, workOrders, maintenance,
        inspections, hosLogs, customers, vendors, payroll, parts, screenings, users, incidents] =
        await Promise.all([
          listEntity('Load', '-pickup_date', 2000),
          listEntity('Invoice', '-issue_date', 2000),
          listEntity('FuelLog', '-date', 2000),
          listEntity('Vehicle'),
          listEntity('WorkOrder', '-opened_date', 2000),
          listEntity('MaintenanceSchedule'),
          listEntity('Inspection', '-inspection_date', 2000),
          listEntity('HOSLog', '-log_date', 2000),
          listEntity('Customer'),
          listEntity('Vendor'),
          listEntity('PayrollRecord', '-pay_period_end', 2000),
          listEntity('PartInventory'),
          listEntity('ScreeningRecord'),
          listEntity('User'),
          listEntity('Incident', '-incident_date', 2000),
        ]);
      setData({ loads, invoices, fuel, vehicles, workOrders, maintenance,
        inspections, hosLogs, customers, vendors, payroll, parts, screenings, users, incidents });
      if (internal && viewAsCustomerId) {
        setAllCustomersSelected(false);
        setSelectedCustomerIds([viewAsCustomerId]);
      } else if (!internal && u?.customer_id) {
        setAllCustomersSelected(false);
        setSelectedCustomerIds([u.customer_id]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [viewAsCustomerId]);

  const effectiveCustomerIds = useMemo(() => {
    if (allCustomersSelected) return null;
    return selectedCustomerIds;
  }, [allCustomersSelected, selectedCustomerIds]);

  const filteredData = useMemo(
    () => filterReportData(data, effectiveCustomerIds),
    [data, effectiveCustomerIds],
  );

  const customerFilterText = useMemo(
    () => customerFilterLabel(effectiveCustomerIds, data.customers),
    [effectiveCustomerIds, data.customers],
  );

  const userMap = useMemo(() =>
    Object.fromEntries(data.users.map(u => [u.id, u])),
    [data.users]
  );

  const handleGenerate = async (reportId, selectedKeys, fromDate, toDate, format = 'xlsx') => {
    const effectiveFrom = fromDate || dateFrom;
    const effectiveTo = toDate || dateTo;
    if (!allCustomersSelected && selectedCustomerIds.length === 0) return;

    setGenerating(reportId);
    setDone(null);
    await new Promise(r => setTimeout(r, 400));

    if (reportId === 'fleetco_master_export') {
      const masterSheetMap = {
        executive_summary: 'executive_summary',
        customer_profitability: 'customer_profitability',
        loads: 'load_summary',
        load_profitability: 'load_profitability',
        fleet: 'fleet_status',
        fuel: 'fuel_cost',
        fuel_efficiency: 'fuel_efficiency',
        work_orders: 'work_orders',
        work_order_parts: 'work_order_parts',
        invoices: 'invoice_aging',
        inspections: 'inspections',
        hos: 'hos_logs',
        incidents: 'incident_report',
        payroll: 'payroll_summary',
        compliance: 'compliance_scorecard',
        parts: 'parts_inventory',
        customers: 'customer_list',
        team: 'team_roster',
      };
      const sheets = selectedKeys?.length
        ? selectedKeys.map(k => masterSheetMap[k]).filter(Boolean)
        : MASTER_EXPORT_SHEETS;
      downloadMasterWorkbook(filteredData, userMap, effectiveFrom, effectiveTo, customerFilterText, sheets);
      setDone(reportId);
      setTimeout(() => { setDone(null); setConfigReport(null); }, 2500);
      setGenerating(null);
      return;
    }

    const result = buildReport(reportId, filteredData, userMap, effectiveFrom, effectiveTo);
    if (result) {
      let rows = result.rows;
      if (selectedKeys?.length) {
        rows = filterRowsByColumns(reportId, rows, selectedKeys, getColumnsForReport);
      }
      downloadReportRows(rows, result.filename, result.sheet, format, effectiveFrom, effectiveTo);
      setDone(reportId);
      setTimeout(() => { setDone(null); setConfigReport(null); }, 2500);
    }
    setGenerating(null);
  };

  const handleQuickDownload = async (report, format) => {
    const defaultKeys = getDefaultColumnKeys(report.id);
    await handleGenerate(report.id, defaultKeys, dateFrom, dateTo, format);
  };

  const filteredReports = useMemo(() =>
    REPORT_CATALOG.filter(r => {
      const catMatch = activeCategory === 'All' || r.category === activeCategory;
      const searchMatch = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      return catMatch && searchMatch;
    }),
    [activeCategory, search]
  );

  const grouped = useMemo(() => {
    const cats = activeCategory === 'All'
      ? [...new Set(filteredReports.map(r => r.category))]
      : [activeCategory];
    return cats.map(cat => ({
      cat,
      reports: filteredReports.filter(r => r.category === cat),
    })).filter(g => g.reports.length > 0);
  }, [filteredReports, activeCategory]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isInternalRole(user?.role) && !isCustomerPortalUser(user)) {
    return <div className="p-6 text-center text-slate-500">Reports are available to FleetCo employees and customer portal users.</div>;
  }

  const canPickCustomers = isInternalRole(user?.role);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" /> Reports Center
            </h1>
            <p className="text-slate-300 text-xs mt-0.5">
              {REPORT_CATALOG.length} reports — download Excel or CSV · read-only (no data or logins modified)
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Excel (.xlsx) · CSV (.csv)
          </div>
        </div>

        {/* Search + Date Range */}
        <div className="mt-4 flex flex-wrap gap-3 items-end">
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-48"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none" />
              <span className="text-slate-400 text-xs">to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {PRESETS.map(p => (
                <button key={p.label}
                  onClick={() => { setDateFrom(p.from); setDateTo(p.to); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    dateFrom === p.from && dateTo === p.to
                      ? 'bg-amber-500 text-slate-900 border-amber-500'
                      : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-amber-400 hover:text-amber-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Date range: <span className="text-amber-300 font-bold">{dateFrom === '2000-01-01' ? 'All Time' : `${dateFrom} → ${dateTo}`}</span>
          {' · '}
          Customers: <span className="text-amber-300 font-bold">{customerFilterText}</span>
        </div>
      </div>

      {canPickCustomers && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowCustomerPicker((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <h2 className="font-black text-slate-900 text-sm">Customer scope</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pull data from all customers or select specific accounts — applies to every report below
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              {customerFilterText}
            </span>
          </button>
          {showCustomerPicker && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <CustomerReportPicker
                customers={data.customers}
                selectedIds={selectedCustomerIds}
                allSelected={allCustomersSelected}
                onChange={(ids) => {
                  setAllCustomersSelected(false);
                  setSelectedCustomerIds(ids);
                }}
                onToggleAll={() => {
                  setAllCustomersSelected((v) => !v);
                  if (!allCustomersSelected) setSelectedCustomerIds([]);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              activeCategory === cat
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1.5 opacity-60">
                ({REPORT_CATALOG.filter(r => r.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Report Groups */}
      {grouped.map(({ cat, reports }) => (
        <div key={cat}>
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {reports.map(report => {
              const isGenerating = generating === report.id;
              const isDone = done === report.id;
              const isMaster = report.id === 'fleetco_master_export';
              return (
                <div
                  key={report.id}
                  className={`bg-white rounded-xl border ${report.border} p-4 flex flex-col gap-3 hover:shadow-md transition-all`}
                >
                  <button
                    type="button"
                    onClick={() => setConfigReport(report)}
                    className="flex items-start gap-3 text-left cursor-pointer hover:opacity-90"
                  >
                    <div className={`${report.bg} p-2 rounded-lg flex-shrink-0`}>
                      <report.icon className={`w-4 h-4 ${report.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-sm leading-tight">{report.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-snug">{report.description}</div>
                    </div>
                  </button>
                  <div className="flex gap-2">
                    {isMaster ? (
                      <button
                        type="button"
                        onClick={() => handleQuickDownload(report, 'xlsx')}
                        disabled={isGenerating}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : isGenerating
                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                            : `${report.bg} ${report.color} ${report.border} hover:opacity-80`
                        }`}
                      >
                        {isGenerating ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Downloading...</>
                        ) : isDone ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Downloaded!</>
                        ) : (
                          <><Download className="w-3.5 h-3.5" /> Download Workbook</>
                        )}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleQuickDownload(report, 'xlsx')}
                          disabled={isGenerating}
                          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                            isGenerating
                              ? 'bg-slate-100 text-slate-400 border-slate-200'
                              : `${report.bg} ${report.color} ${report.border} hover:opacity-80`
                          }`}
                        >
                          {isGenerating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <><Download className="w-3.5 h-3.5" /> Excel</>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDownload(report, 'csv')}
                          disabled={isGenerating}
                          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border border-slate-200 transition-all ${
                            isGenerating
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" /> CSV
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfigReport(report)}
                      className="px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all"
                      title="Choose columns, date range, and format"
                    >
                      Customize
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filteredReports.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No reports match your search.</p>
        </div>
      )}

      {configReport && (
        <ReportConfigModal
          report={configReport}
          onClose={() => { setConfigReport(null); setDone(null); }}
          onGenerate={handleGenerate}
          generating={generating === configReport.id}
          done={done === configReport.id}
        />
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { X, Download, Loader2, CheckCircle2, CheckSquare, Square, Calendar } from 'lucide-react';

// Column definitions per report
const REPORT_COLUMNS = {
  revenue_summary: [
    { key: 'invoice_number', label: 'Invoice #', default: true },
    { key: 'customer_id', label: 'Customer ID', default: true },
    { key: 'issue_date', label: 'Issue Date', default: true },
    { key: 'due_date', label: 'Due Date', default: true },
    { key: 'subtotal', label: 'Subtotal', default: true },
    { key: 'tax', label: 'Tax', default: false },
    { key: 'total', label: 'Total', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'type', label: 'Type', default: false },
  ],
  invoice_aging: [
    { key: 'invoice_number', label: 'Invoice #', default: true },
    { key: 'customer_id', label: 'Customer ID', default: true },
    { key: 'issue_date', label: 'Issue Date', default: true },
    { key: 'due_date', label: 'Due Date', default: true },
    { key: 'total', label: 'Total', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'days_overdue', label: 'Days Overdue', default: true },
  ],
  fuel_cost: [
    { key: 'date', label: 'Date', default: true },
    { key: 'vehicle', label: 'Vehicle', default: true },
    { key: 'driver_id', label: 'Driver ID', default: false },
    { key: 'location', label: 'Location', default: true },
    { key: 'gallons', label: 'Gallons', default: true },
    { key: 'price_per_gallon', label: 'Price/Gal', default: true },
    { key: 'total_cost', label: 'Total Cost', default: true },
    { key: 'fuel_type', label: 'Fuel Type', default: true },
    { key: 'odometer', label: 'Odometer', default: false },
  ],
  fuel_per_vehicle: [
    { key: 'vehicle', label: 'Vehicle', default: true },
    { key: 'make_model', label: 'Make/Model', default: true },
    { key: 'total_gallons', label: 'Total Gallons', default: true },
    { key: 'total_cost', label: 'Total Cost', default: true },
    { key: 'avg_per_gallon', label: 'Avg $/Gal', default: true },
    { key: 'fillups', label: 'Fill-ups', default: true },
  ],
  payroll_summary: [
    { key: 'driver_name', label: 'Driver Name', default: true },
    { key: 'pay_type', label: 'Pay Type', default: true },
    { key: 'pay_period_start', label: 'Period Start', default: true },
    { key: 'pay_period_end', label: 'Period End', default: true },
    { key: 'hours_worked', label: 'Hours Worked', default: false },
    { key: 'miles_driven', label: 'Miles Driven', default: false },
    { key: 'stops_completed', label: 'Stops', default: false },
    { key: 'gross_pay', label: 'Gross Pay', default: true },
    { key: 'bonuses', label: 'Bonuses', default: true },
    { key: 'deductions', label: 'Deductions', default: true },
    { key: 'net_pay', label: 'Net Pay', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'payment_method', label: 'Payment Method', default: true },
  ],
  load_summary: [
    { key: 'load_number', label: 'Load #', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'origin', label: 'Origin', default: true },
    { key: 'destination', label: 'Destination', default: true },
    { key: 'pickup_date', label: 'Pickup Date', default: true },
    { key: 'delivery_date', label: 'Delivery Date', default: true },
    { key: 'rate', label: 'Rate', default: true },
    { key: 'miles', label: 'Miles', default: true },
    { key: 'weight', label: 'Weight', default: false },
    { key: 'commodity', label: 'Commodity', default: false },
    { key: 'assigned_driver_id', label: 'Driver ID', default: true },
    { key: 'vehicle', label: 'Vehicle', default: true },
    { key: 'broker', label: 'Broker', default: false },
    { key: 'customer_id', label: 'Customer ID', default: false },
  ],
  load_revenue: [
    { key: 'driver_id', label: 'Driver ID', default: false },
    { key: 'driver_name', label: 'Driver Name', default: true },
    { key: 'total_loads', label: 'Total Loads', default: true },
    { key: 'total_miles', label: 'Total Miles', default: true },
    { key: 'total_revenue', label: 'Total Revenue', default: true },
    { key: 'avg_rate', label: 'Avg Rate/Load', default: true },
  ],
  driver_performance: [
    { key: 'driver_id', label: 'Driver ID', default: false },
    { key: 'driver_name', label: 'Driver Name', default: true },
    { key: 'total_loads', label: 'Total Loads', default: true },
    { key: 'delivered', label: 'Delivered', default: true },
    { key: 'completion_pct', label: 'Completion %', default: true },
    { key: 'total_miles', label: 'Total Miles', default: true },
    { key: 'total_revenue', label: 'Total Revenue', default: true },
  ],
  fleet_status: [
    { key: 'unit_number', label: 'Unit #', default: true },
    { key: 'unit_type', label: 'Type', default: true },
    { key: 'year', label: 'Year', default: true },
    { key: 'make', label: 'Make', default: true },
    { key: 'model', label: 'Model', default: true },
    { key: 'vin', label: 'VIN', default: false },
    { key: 'license_plate', label: 'License Plate', default: false },
    { key: 'status', label: 'Status', default: true },
    { key: 'odometer', label: 'Odometer', default: true },
    { key: 'purchase_price', label: 'Purchase Price', default: false },
    { key: 'purchase_date', label: 'Purchase Date', default: false },
    { key: 'assigned_driver', label: 'Assigned Driver', default: true },
    { key: 'notes', label: 'Notes', default: false },
  ],
  vehicle_downtime: [
    { key: 'wo_number', label: 'WO #', default: true },
    { key: 'vehicle', label: 'Vehicle', default: true },
    { key: 'title', label: 'Title', default: true },
    { key: 'repair_type', label: 'Repair Type', default: true },
    { key: 'opened_date', label: 'Opened Date', default: true },
    { key: 'completed_date', label: 'Completed Date', default: true },
    { key: 'days_in_shop', label: 'Days in Shop', default: true },
    { key: 'total_cost', label: 'Total Cost', default: true },
    { key: 'status', label: 'Status', default: false },
  ],
  maintenance_schedule: [
    { key: 'vehicle', label: 'Vehicle', default: true },
    { key: 'service_type', label: 'Service Type', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'due_date', label: 'Due Date', default: true },
    { key: 'due_mileage', label: 'Due Mileage', default: true },
    { key: 'last_service_date', label: 'Last Service Date', default: false },
    { key: 'last_service_mileage', label: 'Last Service Mileage', default: false },
    { key: 'interval_miles', label: 'Interval Miles', default: false },
    { key: 'interval_days', label: 'Interval Days', default: false },
    { key: 'estimated_cost', label: 'Est. Cost', default: true },
    { key: 'assigned_tech', label: 'Assigned Tech', default: true },
    { key: 'notes', label: 'Notes', default: false },
  ],
  work_orders: [
    { key: 'wo_number', label: 'WO #', default: true },
    { key: 'title', label: 'Title', default: true },
    { key: 'vehicle', label: 'Vehicle', default: true },
    { key: 'repair_type', label: 'Repair Type', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'priority', label: 'Priority', default: true },
    { key: 'opened_date', label: 'Opened', default: true },
    { key: 'due_date', label: 'Due', default: false },
    { key: 'completed_date', label: 'Completed', default: true },
    { key: 'odometer', label: 'Odometer', default: false },
    { key: 'labor_hours', label: 'Labor Hours', default: true },
    { key: 'labor_cost', label: 'Labor Cost', default: true },
    { key: 'parts_total', label: 'Parts Total', default: true },
    { key: 'total_cost', label: 'Total Cost', default: true },
    { key: 'tech', label: 'Tech', default: true },
    { key: 'shop_name', label: 'Shop', default: false },
    { key: 'warranty', label: 'Warranty', default: false },
  ],
  parts_inventory: [
    { key: 'part_number', label: 'Part #', default: true },
    { key: 'description', label: 'Description', default: true },
    { key: 'category', label: 'Category', default: true },
    { key: 'quantity_on_hand', label: 'Qty on Hand', default: true },
    { key: 'reorder_point', label: 'Reorder Point', default: true },
    { key: 'unit_cost', label: 'Unit Cost', default: true },
    { key: 'total_value', label: 'Total Value', default: true },
    { key: 'supplier', label: 'Supplier', default: true },
    { key: 'location', label: 'Location', default: false },
    { key: 'notes', label: 'Notes', default: false },
  ],
  inspections: [
    { key: 'vehicle', label: 'Vehicle', default: true },
    { key: 'inspection_type', label: 'Type', default: true },
    { key: 'inspection_date', label: 'Date', default: true },
    { key: 'inspector_name', label: 'Inspector', default: true },
    { key: 'odometer', label: 'Odometer', default: false },
    { key: 'status', label: 'Status', default: true },
    { key: 'defects_found', label: 'Defects Found', default: true },
    { key: 'defects_corrected', label: 'Defects Corrected', default: true },
    { key: 'manager_signoff', label: 'Manager Signoff', default: true },
    { key: 'manager_name', label: 'Manager', default: false },
    { key: 'notes', label: 'Notes', default: false },
  ],
  hos_logs: [
    { key: 'driver_id', label: 'Driver ID', default: false },
    { key: 'driver_name', label: 'Driver Name', default: true },
    { key: 'log_date', label: 'Date', default: true },
    { key: 'vehicle', label: 'Vehicle', default: true },
    { key: 'starting_location', label: 'Start Location', default: true },
    { key: 'ending_location', label: 'End Location', default: true },
    { key: 'total_miles', label: 'Total Miles', default: true },
    { key: 'hours_driving', label: 'Hours Driving', default: true },
    { key: 'hours_on_duty', label: 'Hours On Duty', default: true },
    { key: 'hours_off_duty', label: 'Hours Off Duty', default: false },
    { key: 'hours_sleeper', label: 'Hours Sleeper', default: false },
    { key: 'status', label: 'Status', default: true },
    { key: 'violations', label: 'Violations', default: true },
  ],
  ifta_fuel: [
    { key: 'state', label: 'State', default: true },
    { key: 'fillups', label: 'Fill-ups', default: true },
    { key: 'total_gallons', label: 'Total Gallons', default: true },
    { key: 'tax_rate', label: 'Tax Rate ($/gal)', default: true },
    { key: 'est_tax', label: 'Est. Tax Owed', default: true },
    { key: 'fuel_cost', label: 'Fuel Cost', default: true },
  ],
  customer_list: [
    { key: 'company_name', label: 'Company', default: true },
    { key: 'contact_name', label: 'Contact', default: true },
    { key: 'email', label: 'Email', default: true },
    { key: 'phone', label: 'Phone', default: true },
    { key: 'city', label: 'City', default: true },
    { key: 'state', label: 'State', default: true },
    { key: 'zip', label: 'ZIP', default: false },
    { key: 'mc_number', label: 'MC #', default: false },
    { key: 'dot_number', label: 'DOT #', default: false },
    { key: 'fleet_size', label: 'Fleet Size', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'notes', label: 'Notes', default: false },
  ],
  vendor_list: [
    { key: 'name', label: 'Name', default: true },
    { key: 'type', label: 'Type', default: true },
    { key: 'poc_name', label: 'POC Name', default: true },
    { key: 'phone', label: 'Phone', default: true },
    { key: 'email', label: 'Email', default: true },
    { key: 'city', label: 'City', default: true },
    { key: 'state', label: 'State', default: true },
    { key: 'contract_number', label: 'Contract #', default: false },
    { key: 'contract_start', label: 'Contract Start', default: false },
    { key: 'contract_end', label: 'Contract End', default: false },
    { key: 'labor_rate', label: 'Labor Rate', default: true },
    { key: 'discount_pct', label: 'Discount %', default: false },
    { key: 'status', label: 'Status', default: true },
  ],
  screening_records: [
    { key: 'driver_id', label: 'Driver ID', default: false },
    { key: 'driver_name', label: 'Driver Name', default: true },
    { key: 'check_type', label: 'Check Type', default: true },
    { key: 'provider', label: 'Provider', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'ordered_date', label: 'Ordered Date', default: true },
    { key: 'completed_date', label: 'Completed Date', default: true },
    { key: 'expiration_date', label: 'Expiration Date', default: true },
    { key: 'reference_id', label: 'Reference ID', default: false },
    { key: 'violations', label: 'Violations', default: true },
    { key: 'notes', label: 'Notes', default: false },
  ],
  fleet_pnl: [
    { key: 'vehicle', label: 'Vehicle', default: true },
    { key: 'make_model', label: 'Make/Model', default: true },
    { key: 'revenue', label: 'Revenue', default: true },
    { key: 'fuel_cost', label: 'Fuel Cost', default: true },
    { key: 'repair_cost', label: 'Repair Cost', default: true },
    { key: 'total_cost', label: 'Total Cost', default: true },
    { key: 'net_pnl', label: 'Net P&L', default: true },
  ],
  fleetco_master_export: [
    { key: 'loads', label: 'Loads sheet', default: true },
    { key: 'fleet', label: 'Fleet sheet', default: true },
    { key: 'fuel', label: 'Fuel sheet', default: true },
    { key: 'work_orders', label: 'Work orders sheet', default: true },
    { key: 'invoices', label: 'Invoices sheet', default: true },
    { key: 'inspections', label: 'Inspections sheet', default: true },
    { key: 'hos', label: 'HOS sheet', default: true },
    { key: 'payroll', label: 'Payroll sheet', default: true },
    { key: 'customers', label: 'Customers sheet', default: true },
  ],
};

export function getColumnsForReport(reportId) {
  return REPORT_COLUMNS[reportId] || [];
}

export function getDefaultColumnKeys(reportId) {
  return getColumnsForReport(reportId).filter(c => c.default).map(c => c.key);
}

const PRESETS = [
  { label: 'This Month', getDates: () => {
    const now = new Date();
    return {
      from: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`,
      to: now.toISOString().slice(0,10)
    };
  }},
  { label: 'Last 30 Days', getDates: () => {
    const now = new Date();
    return { from: new Date(now - 30*86400000).toISOString().slice(0,10), to: now.toISOString().slice(0,10) };
  }},
  { label: 'Last 90 Days', getDates: () => {
    const now = new Date();
    return { from: new Date(now - 90*86400000).toISOString().slice(0,10), to: now.toISOString().slice(0,10) };
  }},
  { label: 'This Year', getDates: () => {
    const now = new Date();
    return { from: `${now.getFullYear()}-01-01`, to: now.toISOString().slice(0,10) };
  }},
  { label: 'All Time', getDates: () => ({ from: '2000-01-01', to: '2099-12-31' }) },
];

export default function ReportConfigModal({ report, onClose, onGenerate, generating, done }) {
  const allCols = REPORT_COLUMNS[report.id] || [];
  const isMasterExport = report.id === 'fleetco_master_export';
  const [selected, setSelected] = useState(
    Object.fromEntries(allCols.map(c => [c.key, c.default]))
  );
  const [exportFormat, setExportFormat] = useState('xlsx');

  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const defaultTo = now.toISOString().slice(0,10);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [activePreset, setActivePreset] = useState('This Month');

  const applyPreset = (preset) => {
    const dates = preset.getDates();
    setDateFrom(dates.from);
    setDateTo(dates.to);
    setActivePreset(preset.label);
  };

  const toggle = (key) => setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  const selectAll = () => setSelected(Object.fromEntries(allCols.map(c => [c.key, true])));
  const clearAll = () => setSelected(Object.fromEntries(allCols.map(c => [c.key, false])));

  const selectedKeys = allCols.filter(c => selected[c.key]).map(c => c.key);
  const canExport = selectedKeys.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className={`${report.bg} rounded-t-2xl px-5 py-4 flex items-center justify-between border-b ${report.border}`}>
          <div className="flex items-center gap-3">
            <div className={`${report.bg} border ${report.border} p-2 rounded-lg`}>
              <report.icon className={`w-4 h-4 ${report.color}`} />
            </div>
            <div>
              <div className="font-black text-slate-900 text-sm">{report.title}</div>
              <div className="text-xs text-slate-500">{report.description}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Range */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-black text-slate-700">Date Range</span>
          </div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(null); }}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(null); }}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                  activePreset === p.label
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column selector */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-black text-slate-700">Select Columns to Include</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-blue-600 hover:underline font-semibold">All</button>
              <span className="text-slate-300">|</span>
              <button onClick={clearAll} className="text-xs text-slate-500 hover:underline font-semibold">None</button>
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-3">{selectedKeys.length} of {allCols.length} columns selected</div>
        </div>

        <div className="overflow-y-auto px-5 pb-4 flex-1">
          <div className="grid grid-cols-2 gap-2">
            {allCols.map(col => (
              <button
                key={col.key}
                onClick={() => toggle(col.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all text-xs font-semibold ${
                  selected[col.key]
                    ? `${report.bg} ${report.color} border-current`
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                {selected[col.key]
                  ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  : <Square className="w-3.5 h-3.5 flex-shrink-0" />
                }
                {col.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export format */}
        {!isMasterExport && (
          <div className="px-5 py-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Download format</div>
            <div className="flex gap-2">
              {[
                { id: 'xlsx', label: 'Excel (.xlsx)' },
                { id: 'csv', label: 'CSV (.csv)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExportFormat(opt.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    exportFormat === opt.id
                      ? `${report.bg} ${report.color} border-current`
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(report.id, selectedKeys, dateFrom, dateTo, exportFormat)}
            disabled={!canExport || generating}
            className={`flex-2 flex-grow-[2] flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-black transition-all ${
              done
                ? 'bg-emerald-500 text-white'
                : canExport && !generating
                ? `${report.bg} ${report.color} border ${report.border} hover:opacity-80`
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Preparing download...</>
            ) : done ? (
              <><CheckCircle2 className="w-4 h-4" /> Downloaded!</>
            ) : (
              <><Download className="w-4 h-4" /> Download {isMasterExport ? 'Workbook' : exportFormat === 'csv' ? 'CSV' : 'Excel'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
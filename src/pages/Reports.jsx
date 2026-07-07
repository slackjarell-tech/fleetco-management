import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet, Download, Loader2, CheckCircle2,
  DollarSign, Fuel, Package, Truck, Wrench, Users, BarChart2,
  ClipboardList, Globe, TrendingUp, AlertTriangle, Calendar,
  ShieldCheck, MapPin, Clock, CreditCard, BoxSelect
} from 'lucide-react';
import ReportConfigModal from '@/components/reports/ReportConfigModal';
import { isPlatformAdmin } from '@/lib/roles';

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
    id: 'fleet_pnl',
    category: 'Financial',
    title: 'Fleet P&L Summary',
    description: 'Revenue vs fuel + repair costs per vehicle for profit/loss',
    icon: BarChart2,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
  },
];

const CATEGORIES = ['All', 'Financial', 'Operations', 'Fleet', 'Compliance', 'CRM'];

// ─── State Tax Rates (for IFTA) ───────────────────────────────────────────────
const STATE_TAX_RATES = {
  AL: 0.280, AK: 0.095, AZ: 0.260, AR: 0.285, CA: 0.800, CO: 0.205,
  CT: 0.490, DE: 0.220, FL: 0.330, GA: 0.320, ID: 0.320, IL: 0.467,
  IN: 0.530, IA: 0.325, KS: 0.260, KY: 0.246, LA: 0.200, ME: 0.312,
  MD: 0.362, MA: 0.240, MI: 0.263, MN: 0.285, MS: 0.180, MO: 0.170,
  MT: 0.295, NE: 0.246, NV: 0.520, NH: 0.222, NJ: 0.415, NM: 0.220,
  NY: 0.458, NC: 0.362, ND: 0.230, OH: 0.470, OK: 0.190, OR: 0.380,
  PA: 0.747, RI: 0.340, SC: 0.250, SD: 0.280, TN: 0.270, TX: 0.200,
  UT: 0.315, VT: 0.320, VA: 0.272, WA: 0.494, WV: 0.357, WI: 0.329, WY: 0.240,
};
function extractState(str) {
  if (!str) return null;
  const m = (str || '').toUpperCase().match(/\b([A-Z]{2})\b/);
  return m && STATE_TAX_RATES[m[1]] ? m[1] : null;
}

// ─── Excel Export Builder ─────────────────────────────────────────────────────
function downloadExcel(sheetData, filename, sheetName = 'Report') {
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  // Auto column widths
  const colWidths = sheetData[0]?.map((_, ci) =>
    Math.min(60, Math.max(12, ...sheetData.map(row => String(row[ci] ?? '').length)))
  ) ?? [];
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

// ─── Report Generators ────────────────────────────────────────────────────────
function inRange(dateStr, from, to) {
  if (!dateStr) return true;
  return dateStr >= from && dateStr <= to;
}

function buildReport(reportId, data, userMap, dateFrom, dateTo) {
  const from = dateFrom || '2000-01-01';
  const to = dateTo || '2099-12-31';

  const { loads, invoices, fuel, vehicles, workOrders, maintenance, inspections,
    hosLogs, customers, vendors, payroll, parts, screenings } = data;

  // filtered slices
  const fLoads = loads.filter(l => inRange(l.pickup_date || l.delivery_date, from, to));
  const fInvoices = invoices.filter(i => inRange(i.issue_date, from, to));
  const fFuel = fuel.filter(f => inRange(f.date, from, to));
  const fWorkOrders = workOrders.filter(w => inRange(w.opened_date, from, to));
  const fInspections = inspections.filter(i => inRange(i.inspection_date, from, to));
  const fHosLogs = hosLogs.filter(h => inRange(h.log_date, from, to));
  const fPayroll = payroll.filter(p => inRange(p.pay_period_start, from, to));
  const fScreenings = screenings.filter(s => inRange(s.ordered_date, from, to));
  const fMaintenance = maintenance.filter(m => inRange(m.due_date, from, to));

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const vLabel = id => { const v = vehicleMap[id]; return v ? `Unit ${v.unit_number}` : id || ''; };

  switch (reportId) {

    case 'revenue_summary': {
      const rows = [['Invoice #', 'Customer ID', 'Issue Date', 'Due Date', 'Subtotal', 'Tax', 'Total', 'Status', 'Type']];
      fInvoices.filter(i => i.status === 'paid').forEach(i => {
        rows.push([i.invoice_number, i.customer_id, i.issue_date, i.due_date,
          i.subtotal || 0, i.tax || 0, i.total || 0, i.status, i.type]);
      });
      return { rows, filename: 'Revenue_Summary.xlsx', sheet: 'Revenue' };
    }

    case 'invoice_aging': {
      const todayD = new Date();
      const rows = [['Invoice #', 'Customer ID', 'Issue Date', 'Due Date', 'Total', 'Status', 'Days Overdue']];
      fInvoices.forEach(i => {
        const daysOverdue = i.due_date ? Math.max(0, Math.floor((todayD - new Date(i.due_date)) / 86400000)) : 0;
        rows.push([i.invoice_number, i.customer_id, i.issue_date, i.due_date,
          i.total || 0, i.status, i.status === 'paid' ? 0 : daysOverdue]);
      });
      return { rows, filename: 'Invoice_Aging.xlsx', sheet: 'Aging' };
    }

    case 'fuel_cost': {
      const rows = [['Date', 'Vehicle', 'Driver ID', 'Location', 'Gallons', 'Price/Gal', 'Total Cost', 'Fuel Type', 'Odometer']];
      fFuel.forEach(f => {
        rows.push([f.date, vLabel(f.vehicle_id), f.driver_id, f.location,
          f.gallons || 0, f.price_per_gallon || 0, f.total_cost || 0, f.fuel_type, f.odometer_reading || '']);
      });
      rows.push(['', 'TOTAL', '', '', fFuel.reduce((s, f) => s + (f.gallons || 0), 0), '',
        fFuel.reduce((s, f) => s + (f.total_cost || 0), 0)]);
      return { rows, filename: 'Fuel_Cost_Report.xlsx', sheet: 'Fuel' };
    }

    case 'fuel_per_vehicle': {
      const map = {};
      fFuel.forEach(f => {
        if (!f.vehicle_id) return;
        if (!map[f.vehicle_id]) map[f.vehicle_id] = { gallons: 0, cost: 0, logs: 0 };
        map[f.vehicle_id].gallons += f.gallons || 0;
        map[f.vehicle_id].cost += f.total_cost || 0;
        map[f.vehicle_id].logs++;
      });
      const rows = [['Vehicle', 'Make/Model', 'Total Gallons', 'Total Cost', 'Avg $/Gal', 'Fill-ups']];
      Object.entries(map).sort((a, b) => b[1].cost - a[1].cost).forEach(([id, s]) => {
        const v = vehicleMap[id];
        rows.push([vLabel(id), v ? `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim() : '',
          s.gallons.toFixed(3), s.cost.toFixed(2),
          s.gallons > 0 ? (s.cost / s.gallons).toFixed(3) : 0, s.logs]);
      });
      return { rows, filename: 'Fuel_Per_Vehicle.xlsx', sheet: 'Fuel by Vehicle' };
    }

    case 'payroll_summary': {
      const rows = [['Driver Name', 'Pay Type', 'Period Start', 'Period End', 'Hours', 'Miles', 'Stops',
        'Gross Pay', 'Bonuses', 'Deductions', 'Net Pay', 'Status', 'Payment Method']];
      fPayroll.forEach(p => {
        rows.push([p.driver_name, p.pay_type, p.pay_period_start, p.pay_period_end,
          p.hours_worked || 0, p.miles_driven || 0, p.stops_completed || 0,
          p.gross_pay || 0, p.bonuses || 0, p.deductions || 0, p.net_pay || 0,
          p.status, p.payment_method]);
      });
      rows.push(['TOTALS', '', '', '', '', '', '',
        fPayroll.reduce((s, p) => s + (p.gross_pay || 0), 0), '',
        '', fPayroll.reduce((s, p) => s + (p.net_pay || 0), 0)]);
      return { rows, filename: 'Payroll_Summary.xlsx', sheet: 'Payroll' };
    }

    case 'load_summary': {
      const rows = [['Load #', 'Status', 'Origin', 'Destination', 'Pickup Date', 'Delivery Date',
        'Rate', 'Miles', 'Weight', 'Commodity', 'Driver ID', 'Vehicle', 'Broker', 'Customer ID']];
      fLoads.forEach(l => {
        rows.push([l.load_number, l.status, l.origin, l.destination, l.pickup_date, l.delivery_date,
          l.rate || 0, l.miles || 0, l.weight, l.commodity,
          l.assigned_driver_id, vLabel(l.assigned_vehicle_id), l.broker, l.customer_id]);
      });
      return { rows, filename: 'Load_Summary.xlsx', sheet: 'Loads' };
    }

    case 'load_revenue': {
      const map = {};
      fLoads.forEach(l => {
        const key = l.assigned_driver_id || 'Unassigned';
        if (!map[key]) map[key] = { loads: 0, miles: 0, revenue: 0 };
        map[key].loads++;
        map[key].miles += l.miles || 0;
        map[key].revenue += l.rate || 0;
      });
      const rows = [['Driver ID', 'Driver Name', 'Total Loads', 'Total Miles', 'Total Revenue', 'Avg Rate/Load']];
      Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue).forEach(([id, s]) => {
        const u = userMap[id];
        rows.push([id, u?.full_name || 'Unassigned', s.loads, s.miles,
          s.revenue.toFixed(2), s.loads > 0 ? (s.revenue / s.loads).toFixed(2) : 0]);
      });
      return { rows, filename: 'Load_Revenue_By_Driver.xlsx', sheet: 'Load Revenue' };
    }

    case 'driver_performance': {
      const driverMap = {};
      fLoads.forEach(l => {
        const id = l.assigned_driver_id;
        if (!id) return;
        if (!driverMap[id]) driverMap[id] = { loads: 0, delivered: 0, miles: 0, revenue: 0 };
        driverMap[id].loads++;
        if (l.status === 'delivered') driverMap[id].delivered++;
        driverMap[id].miles += l.miles || 0;
        driverMap[id].revenue += l.rate || 0;
      });
      const rows = [['Driver ID', 'Driver Name', 'Total Loads', 'Delivered', 'Completion %', 'Total Miles', 'Total Revenue']];
      Object.entries(driverMap).sort((a, b) => b[1].revenue - a[1].revenue).forEach(([id, s]) => {
        const u = userMap[id];
        rows.push([id, u?.full_name || '', s.loads, s.delivered,
          s.loads > 0 ? ((s.delivered / s.loads) * 100).toFixed(1) + '%' : '0%',
          s.miles, s.revenue.toFixed(2)]);
      });
      return { rows, filename: 'Driver_Performance.xlsx', sheet: 'Drivers' };
    }

    case 'fleet_status': {
      const rows = [['Unit #', 'Type', 'Year', 'Make', 'Model', 'VIN', 'License Plate',
        'Status', 'Odometer', 'Purchase Price', 'Purchase Date', 'Assigned Driver', 'Notes']];
      vehicles.forEach(v => {
        rows.push([v.unit_number, v.unit_type, v.year, v.make, v.model, v.vin,
          v.license_plate, v.status, v.odometer || 0, v.purchase_price || 0,
          v.purchase_date, userMap[v.assigned_driver_id]?.full_name || '',
          v.notes || '']);
      });
      return { rows, filename: 'Fleet_Status.xlsx', sheet: 'Fleet' };
    }

    case 'vehicle_downtime': {
      const rows = [['WO #', 'Vehicle', 'Title', 'Repair Type', 'Opened Date', 'Completed Date',
        'Days in Shop', 'Total Cost', 'Status']];
      fWorkOrders.filter(w => w.opened_date && w.completed_date).forEach(w => {
        const days = Math.max(0, Math.round((new Date(w.completed_date) - new Date(w.opened_date)) / 86400000));
        rows.push([w.wo_number, vLabel(w.vehicle_id), w.title, w.repair_type,
          w.opened_date, w.completed_date, days, w.total_cost || 0, w.status]);
      });
      return { rows, filename: 'Vehicle_Downtime.xlsx', sheet: 'Downtime' };
    }

    case 'maintenance_schedule': {
      const rows = [['Vehicle', 'Service Type', 'Status', 'Due Date', 'Due Mileage',
        'Last Service Date', 'Last Service Mileage', 'Interval Miles', 'Interval Days',
        'Est. Cost', 'Assigned Tech', 'Notes']];
      fMaintenance.forEach(m => {
        rows.push([vLabel(m.vehicle_id), m.service_type, m.status, m.due_date,
          m.due_mileage || '', m.last_service_date || '', m.last_service_mileage || '',
          m.interval_miles || '', m.interval_days || '',
          m.estimated_cost || 0, m.assigned_tech || '', m.notes || '']);
      });
      return { rows, filename: 'Maintenance_Schedule.xlsx', sheet: 'Maintenance' };
    }

    case 'work_orders': {
      const rows = [['WO #', 'Title', 'Vehicle', 'Repair Type', 'Status', 'Priority',
        'Opened', 'Due', 'Completed', 'Odometer', 'Labor Hours', 'Labor Cost',
        'Parts Total', 'Total Cost', 'Tech ID', 'Shop', 'Warranty']];
      fWorkOrders.forEach(w => {
        rows.push([w.wo_number, w.title, vLabel(w.vehicle_id), w.repair_type,
          w.status, w.priority, w.opened_date, w.due_date || '', w.completed_date || '',
          w.odometer || '', w.labor_hours || 0, w.labor_cost || 0,
          w.parts_total || 0, w.total_cost || 0,
          userMap[w.assigned_tech_id]?.full_name || '',
          w.shop_name || '', w.warranty_repair ? 'Yes' : 'No']);
      });
      rows.push(['', 'TOTAL', '', '', '', '', '', '', '', '', '',
        fWorkOrders.reduce((s, w) => s + (w.labor_cost || 0), 0), '',
        fWorkOrders.reduce((s, w) => s + (w.total_cost || 0), 0)]);
      return { rows, filename: 'Work_Orders.xlsx', sheet: 'Work Orders' };
    }

    case 'parts_inventory': {
      const rows = [['Part #', 'Description', 'Category', 'Qty on Hand', 'Reorder Point',
        'Unit Cost', 'Total Value', 'Supplier', 'Location', 'Notes']];
      parts.forEach(p => {
        rows.push([p.part_number, p.description, p.category,
          p.quantity_on_hand || 0, p.reorder_point || 0,
          p.unit_cost || 0, ((p.quantity_on_hand || 0) * (p.unit_cost || 0)).toFixed(2),
          p.supplier || '', p.location || '', p.notes || '']);
      });
      rows.push(['', 'TOTAL VALUE', '', parts.reduce((s, p) => s + (p.quantity_on_hand || 0), 0),
        '', '', parts.reduce((s, p) => s + (p.quantity_on_hand || 0) * (p.unit_cost || 0), 0).toFixed(2)]);
      return { rows, filename: 'Parts_Inventory.xlsx', sheet: 'Parts' };
    }

    case 'inspections': {
      const rows = [['Vehicle', 'Type', 'Date', 'Inspector', 'Odometer', 'Status',
        'Defects Found', 'Defects Corrected', 'Manager Signoff', 'Manager', 'Notes']];
      fInspections.forEach(i => {
        rows.push([vLabel(i.vehicle_id), i.inspection_type, i.inspection_date,
          i.inspector_name, i.odometer || '', i.status,
          i.defects_found ? 'Yes' : 'No', i.defects_corrected ? 'Yes' : 'No',
          i.manager_signoff_required ? (i.manager_name ? 'Signed' : 'Pending') : 'N/A',
          i.manager_name || '', i.notes || '']);
      });
      return { rows, filename: 'Inspections_DVIR.xlsx', sheet: 'Inspections' };
    }

    case 'hos_logs': {
      const rows = [['Driver ID', 'Driver Name', 'Date', 'Vehicle', 'Start Location',
        'End Location', 'Total Miles', 'Hours Driving', 'Hours On Duty',
        'Hours Off Duty', 'Hours Sleeper', 'Status', 'Violations']];
      fHosLogs.forEach(h => {
        const u = userMap[h.driver_id];
        rows.push([h.driver_id, u?.full_name || '', h.log_date, vLabel(h.vehicle_id),
          h.starting_location || '', h.ending_location || '',
          h.total_miles || 0, h.hours_driving || 0, h.hours_on_duty || 0,
          h.hours_off_duty || 0, h.hours_sleeper || 0,
          h.status, (h.violations || []).join('; ')]);
      });
      return { rows, filename: 'HOS_ELD_Logs.xlsx', sheet: 'HOS Logs' };
    }

    case 'ifta_fuel': {
      const byState = {};
      fFuel.forEach(f => {
        const state = extractState(f.location);
        if (!state) return;
        if (!byState[state]) byState[state] = { gallons: 0, cost: 0, count: 0 };
        byState[state].gallons += f.gallons || 0;
        byState[state].cost += f.total_cost || 0;
        byState[state].count++;
      });
      const rows = [['State', 'Fill-ups', 'Total Gallons', 'Tax Rate ($/gal)', 'Est. Tax Owed', 'Fuel Cost']];
      Object.entries(byState).sort((a, b) => b[1].gallons - a[1].gallons).forEach(([state, d]) => {
        const rate = STATE_TAX_RATES[state] || 0.25;
        rows.push([state, d.count, d.gallons.toFixed(3), rate.toFixed(3),
          (d.gallons * rate).toFixed(2), d.cost.toFixed(2)]);
      });
      rows.push(['TOTAL', fFuel.length, fFuel.reduce((s, f) => s + (f.gallons || 0), 0).toFixed(3),
        '', Object.entries(byState).reduce((s, [st, d]) => s + d.gallons * (STATE_TAX_RATES[st] || 0.25), 0).toFixed(2),
        fFuel.reduce((s, f) => s + (f.total_cost || 0), 0).toFixed(2)]);
      return { rows, filename: 'IFTA_Fuel_Tax.xlsx', sheet: 'IFTA' };
    }

    case 'customer_list': {
      const rows = [['Company', 'Contact', 'Email', 'Phone', 'City', 'State', 'ZIP',
        'MC #', 'DOT #', 'Fleet Size', 'Status', 'Notes']];
      customers.forEach(c => {
        rows.push([c.company_name, c.contact_name, c.email, c.phone,
          c.city, c.state, c.zip, c.mc_number || '', c.dot_number || '',
          c.fleet_size || '', c.status, c.notes || '']);
      });
      return { rows, filename: 'Customer_List.xlsx', sheet: 'Customers' };
    }

    case 'vendor_list': {
      const rows = [['Name', 'Type', 'POC Name', 'Phone', 'Email', 'City', 'State',
        'Contract #', 'Contract Start', 'Contract End', 'Labor Rate', 'Discount %', 'Status']];
      vendors.forEach(v => {
        rows.push([v.name, v.type, v.poc_name || '', v.phone || '', v.email || '',
          v.city || '', v.state || '', v.contract_number || '',
          v.contract_start || '', v.contract_end || '',
          v.labor_rate || 0, v.discount_pct || 0, v.status]);
      });
      return { rows, filename: 'Vendor_Contracts.xlsx', sheet: 'Vendors' };
    }

    case 'screening_records': {
      const rows = [['Driver ID', 'Driver Name', 'Check Type', 'Provider', 'Status',
        'Ordered Date', 'Completed Date', 'Expiration Date', 'Reference ID', 'Violations', 'Notes']];
      fScreenings.forEach(s => {
        rows.push([s.driver_id, s.driver_name, s.check_type, s.provider, s.status,
          s.ordered_date, s.completed_date || '', s.expiration_date || '',
          s.reference_id || '', (s.violations || []).join('; '), s.notes || '']);
      });
      return { rows, filename: 'Driver_Screening_Records.xlsx', sheet: 'Screenings' };
    }

    case 'fleet_pnl': {
      const revenueByVehicle = {};
      fLoads.filter(l => l.status === 'delivered').forEach(l => {
        if (!l.assigned_vehicle_id) return;
        revenueByVehicle[l.assigned_vehicle_id] = (revenueByVehicle[l.assigned_vehicle_id] || 0) + (l.rate || 0);
      });
      const fuelByVehicle = {};
      fFuel.forEach(f => {
        if (!f.vehicle_id) return;
        fuelByVehicle[f.vehicle_id] = (fuelByVehicle[f.vehicle_id] || 0) + (f.total_cost || 0);
      });
      const repairByVehicle = {};
      fWorkOrders.forEach(w => {
        if (!w.vehicle_id) return;
        repairByVehicle[w.vehicle_id] = (repairByVehicle[w.vehicle_id] || 0) + (w.total_cost || 0);
      });
      const allVehicleIds = new Set([
        ...Object.keys(revenueByVehicle),
        ...Object.keys(fuelByVehicle),
        ...Object.keys(repairByVehicle),
      ]);
      const rows = [['Vehicle', 'Make/Model', 'Revenue', 'Fuel Cost', 'Repair Cost', 'Total Cost', 'Net P&L']];
      [...allVehicleIds].forEach(id => {
        const rev = revenueByVehicle[id] || 0;
        const fc = fuelByVehicle[id] || 0;
        const rc = repairByVehicle[id] || 0;
        const v = vehicleMap[id];
        rows.push([vLabel(id), v ? `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim() : '',
          rev.toFixed(2), fc.toFixed(2), rc.toFixed(2),
          (fc + rc).toFixed(2), (rev - fc - rc).toFixed(2)]);
      });
      return { rows, filename: 'Fleet_PnL.xlsx', sheet: 'Fleet P&L' };
    }

    default:
      return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reports() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    loads: [], invoices: [], fuel: [], vehicles: [], workOrders: [],
    maintenance: [], inspections: [], hosLogs: [], customers: [],
    vendors: [], payroll: [], parts: [], screenings: [], users: [],
  });
  const [generating, setGenerating] = useState(null);
  const [done, setDone] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [configReport, setConfigReport] = useState(null); // report being configured

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
      const [loads, invoices, fuel, vehicles, workOrders, maintenance,
        inspections, hosLogs, customers, vendors, payroll, parts, screenings, users] =
        await Promise.all([
          api.entities.Load.list('-pickup_date', 2000),
          api.entities.Invoice.list('-issue_date', 2000),
          api.entities.FuelLog.list('-date', 2000),
          api.entities.Vehicle.list(),
          api.entities.WorkOrder.list('-opened_date', 2000),
          api.entities.MaintenanceSchedule.list(),
          api.entities.Inspection.list('-inspection_date', 2000),
          api.entities.HOSLog.list('-log_date', 2000),
          api.entities.Customer.list(),
          api.entities.Vendor.list(),
          api.entities.PayrollRecord.list('-pay_period_end', 2000),
          api.entities.PartInventory.list(),
          api.entities.ScreeningRecord.list(),
          api.entities.User.list(),
        ]);
      setData({ loads, invoices, fuel, vehicles, workOrders, maintenance,
        inspections, hosLogs, customers, vendors, payroll, parts, screenings, users });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const userMap = useMemo(() =>
    Object.fromEntries(data.users.map(u => [u.id, u])),
    [data.users]
  );

  const handleGenerate = async (reportId, selectedKeys, fromDate, toDate) => {
    const effectiveFrom = fromDate || dateFrom;
    const effectiveTo = toDate || dateTo;
    setGenerating(reportId);
    setDone(null);
    await new Promise(r => setTimeout(r, 400));
    const result = buildReport(reportId, data, userMap, effectiveFrom, effectiveTo);
    if (result) {
      // Filter columns based on user selection
      let rows = result.rows;
      if (selectedKeys && selectedKeys.length > 0 && rows.length > 0) {
        const header = rows[0];
        // Build index map: column label index -> included?
        // We match by order from REPORT_COLUMNS which matches header order
        const { getColumnsForReport } = await import('@/components/reports/ReportConfigModal');
        const colDefs = getColumnsForReport(reportId);
        if (colDefs.length > 0) {
          const indices = colDefs.map((c, i) => ({ key: c.key, i }))
            .filter(({ key }) => selectedKeys.includes(key))
            .map(({ i }) => i);
          rows = rows.map(row => indices.map(i => row[i]));
        }
      }
      const rangeLabel = effectiveFrom === '2000-01-01' ? 'AllTime' : `${effectiveFrom}_to_${effectiveTo}`;
      const filename = result.filename.replace('.xlsx', `_${rangeLabel}.xlsx`);
      downloadExcel(rows, filename, result.sheet);
      setDone(reportId);
      setTimeout(() => { setDone(null); setConfigReport(null); }, 2500);
    }
    setGenerating(null);
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

  if (!isPlatformAdmin(user?.role)) {
    return <div className="p-6 text-center text-slate-500">Reports are available to administrators only.</div>;
  }

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
              {REPORT_CATALOG.length} reports available — select any to generate & download as Excel (.xlsx)
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Excel (.xlsx) format
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
          Showing data from <span className="text-amber-300 font-bold">{dateFrom === '2000-01-01' ? 'All Time' : `${dateFrom} → ${dateTo}`}</span>
        </div>
      </div>

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
              return (
                <button
                  key={report.id}
                  onClick={() => setConfigReport(report)}
                  className={`bg-white rounded-xl border ${report.border} p-4 flex flex-col gap-3 hover:shadow-md transition-all text-left cursor-pointer hover:scale-[1.01]`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${report.bg} p-2 rounded-lg flex-shrink-0`}>
                      <report.icon className={`w-4 h-4 ${report.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-sm leading-tight">{report.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-snug">{report.description}</div>
                    </div>
                  </div>
                  <div className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : isGenerating
                      ? 'bg-slate-100 text-slate-400'
                      : `${report.bg} ${report.color} border ${report.border}`
                  }`}>
                    {isGenerating ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                    ) : isDone ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Downloaded!</>
                    ) : (
                      <><Download className="w-3.5 h-3.5" /> Select &amp; Export</>
                    )}
                  </div>
                </button>
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
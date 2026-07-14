import { buildCustomerNameMap } from './reportCustomerFilter';

export const MASTER_EXPORT_SHEETS = [
  'executive_summary',
  'customer_profitability',
  'load_summary',
  'load_profitability',
  'fleet_status',
  'fuel_cost',
  'fuel_efficiency',
  'work_orders',
  'work_order_parts',
  'invoice_aging',
  'revenue_summary',
  'inspections',
  'hos_logs',
  'incident_report',
  'payroll_summary',
  'compliance_scorecard',
  'parts_inventory',
  'customer_list',
  'team_roster',
];

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
  const m = String(str).toUpperCase().match(/\b([A-Z]{2})\b/);
  return m && STATE_TAX_RATES[m[1]] ? m[1] : null;
}

function inRange(dateStr, from, to) {
  if (!dateStr) return true;
  return dateStr >= from && dateStr <= to;
}

function loadOrigin(l) {
  if (l.origin) return l.origin;
  if (l.origin_city) return `${l.origin_city}${l.origin_state ? `, ${l.origin_state}` : ''}`;
  return '';
}

function loadDestination(l) {
  if (l.destination) return l.destination;
  if (l.destination_city) return `${l.destination_city}${l.destination_state ? `, ${l.destination_state}` : ''}`;
  return '';
}

function fuelCost(f) {
  return Number(f.total_cost ?? f.cost ?? 0);
}

function fuelLocation(f) {
  return f.location || f.station_name || '';
}

function fuelOdometer(f) {
  return f.odometer_reading ?? f.odometer ?? '';
}

function incidentDate(i) {
  return i.incident_date || i.date || '';
}

function sum(arr, fn) {
  return arr.reduce((s, x) => s + fn(x), 0);
}

function pct(num, den) {
  if (!den) return '0%';
  return `${((num / den) * 100).toFixed(1)}%`;
}

export function buildReport(reportId, data, userMap, dateFrom, dateTo) {
  const from = dateFrom || '2000-01-01';
  const to = dateTo || '2099-12-31';

  const {
    loads, invoices, fuel, vehicles, workOrders, maintenance, inspections,
    hosLogs, customers, vendors, payroll, parts, screenings, incidents, users,
  } = data;

  const fLoads = loads.filter(l => inRange(l.pickup_date || l.delivery_date, from, to));
  const fInvoices = invoices.filter(i => inRange(i.issue_date, from, to));
  const fFuel = fuel.filter(f => inRange(f.date, from, to));
  const fWorkOrders = workOrders.filter(w => inRange(w.opened_date, from, to));
  const fInspections = inspections.filter(i => inRange(i.inspection_date, from, to));
  const fHosLogs = hosLogs.filter(h => inRange(h.log_date, from, to));
  const fPayroll = payroll.filter(p => inRange(p.pay_period_start, from, to));
  const fScreenings = screenings.filter(s => inRange(s.ordered_date, from, to));
  const fMaintenance = maintenance.filter(m => inRange(m.due_date, from, to));
  const fIncidents = (incidents || []).filter(i => inRange(incidentDate(i), from, to));

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const customerMap = buildCustomerNameMap(customers);
  const vLabel = id => { const v = vehicleMap[id]; return v ? `Unit ${v.unit_number}` : id || ''; };
  const cName = id => customerMap[id] || id || '';
  const vCustomer = id => {
    const v = vehicleMap[id];
    return v?.customer_id || v?.assigned_customer_id || '';
  };

  switch (reportId) {

    case 'executive_summary': {
      const delivered = fLoads.filter(l => l.status === 'delivered');
      const loadRev = sum(delivered, l => Number(l.rate) || 0);
      const paidInv = fInvoices.filter(i => i.status === 'paid');
      const invRev = sum(paidInv, i => Number(i.total ?? i.amount) || 0);
      const fuelSpend = sum(fFuel, fuelCost);
      const repairSpend = sum(fWorkOrders, w => Number(w.total_cost) || 0);
      const payrollSpend = sum(fPayroll, p => Number(p.net_pay) || 0);
      const openWo = fWorkOrders.filter(w => !['completed', 'closed'].includes(w.status)).length;
      const hosViolations = fHosLogs.filter(h => (h.violations || []).length > 0).length;
      const rows = [
        ['FleetCo Executive Summary', '', ''],
        ['Report period', `${from} → ${to}`, ''],
        ['Generated', new Date().toISOString().slice(0, 10), ''],
        [],
        ['Category', 'Metric', 'Value'],
        ['Customers', 'Active accounts in scope', customers.length],
        ['Fleet', 'Total vehicles', vehicles.length],
        ['Fleet', 'Units in shop / inactive', vehicles.filter(v => ['in_shop', 'out_of_service'].includes(v.status)).length],
        ['Operations', 'Total loads', fLoads.length],
        ['Operations', 'Delivered loads', delivered.length],
        ['Operations', 'Total load miles', sum(fLoads, l => Number(l.miles) || 0)],
        ['Operations', 'Load revenue (delivered)', loadRev.toFixed(2)],
        ['Operations', 'Avg revenue per mile', sum(delivered, l => Number(l.miles) || 0) > 0
          ? (loadRev / sum(delivered, l => Number(l.miles) || 0)).toFixed(2) : '0'],
        ['Financial', 'Paid invoice revenue', invRev.toFixed(2)],
        ['Financial', 'Outstanding invoices', fInvoices.filter(i => i.status !== 'paid').length],
        ['Financial', 'Outstanding AR ($)', sum(fInvoices.filter(i => i.status !== 'paid'), i => Number(i.total ?? i.amount) || 0).toFixed(2)],
        ['Financial', 'Fuel spend', fuelSpend.toFixed(2)],
        ['Financial', 'Repair spend', repairSpend.toFixed(2)],
        ['Financial', 'Payroll (net)', payrollSpend.toFixed(2)],
        ['Financial', 'Est. net margin (loads − fuel − repairs − payroll)',
          (loadRev - fuelSpend - repairSpend - payrollSpend).toFixed(2)],
        ['Maintenance', 'Open work orders', openWo],
        ['Maintenance', 'Completed work orders', fWorkOrders.filter(w => w.status === 'completed').length],
        ['Maintenance', 'PM tasks due in range', fMaintenance.length],
        ['Compliance', 'Inspections completed', fInspections.length],
        ['Compliance', 'Inspections with defects', fInspections.filter(i => i.defects_found).length],
        ['Compliance', 'HOS logs with violations', hosViolations],
        ['Compliance', 'Incidents logged', fIncidents.length],
        ['Compliance', 'Open incidents', fIncidents.filter(i => i.status !== 'closed').length],
        ['Parts', 'SKUs tracked', parts.length],
        ['Parts', 'Inventory value ($)', sum(parts, p => (Number(p.quantity_on_hand ?? p.quantity) || 0) * (Number(p.unit_cost) || 0)).toFixed(2)],
        ['Team', 'Portal users in scope', (users || []).length],
      ];
      return { rows, filename: 'Executive_Summary.xlsx', sheet: 'Executive Summary' };
    }

    case 'customer_profitability': {
      const stats = {};
      const ensure = cid => {
        if (!stats[cid]) stats[cid] = { loads: 0, miles: 0, loadRev: 0, invRev: 0, fuel: 0, repair: 0, payroll: 0, vehicles: 0 };
        return stats[cid];
      };
      customers.forEach(c => ensure(c.id));
      vehicles.forEach(v => {
        const cid = v.customer_id || v.assigned_customer_id;
        if (cid) ensure(cid).vehicles++;
      });
      fLoads.filter(l => l.status === 'delivered').forEach(l => {
        if (!l.customer_id) return;
        const s = ensure(l.customer_id);
        s.loads++;
        s.miles += Number(l.miles) || 0;
        s.loadRev += Number(l.rate) || 0;
      });
      const paidInv = fInvoices.filter(i => i.status === 'paid');
      paidInv.forEach(i => {
        if (!i.customer_id) return;
        ensure(i.customer_id).invRev += Number(i.total ?? i.amount) || 0;
      });
      fFuel.forEach(f => {
        const cid = vCustomer(f.vehicle_id);
        if (!cid) return;
        ensure(cid).fuel += fuelCost(f);
      });
      fWorkOrders.forEach(w => {
        const cid = vCustomer(w.vehicle_id);
        if (!cid) return;
        ensure(cid).repair += Number(w.total_cost) || 0;
      });
      fPayroll.forEach(p => {
        const cid = p.customer_id || userMap[p.driver_id]?.customer_id;
        if (!cid) return;
        ensure(cid).payroll += Number(p.net_pay) || 0;
      });
      const rows = [['Customer', 'Vehicles', 'Loads', 'Miles', 'Load Revenue', 'Invoice Revenue',
        'Total Revenue', 'Fuel Cost', 'Repair Cost', 'Payroll', 'Total Cost', 'Net Margin', 'Margin %']];
      Object.entries(stats)
        .filter(([, s]) => s.vehicles || s.loads || s.invRev || s.fuel || s.repair)
        .sort((a, b) => (b[1].loadRev + b[1].invRev) - (a[1].loadRev + a[1].invRev))
        .forEach(([cid, s]) => {
          const rev = s.loadRev + s.invRev;
          const cost = s.fuel + s.repair + s.payroll;
          const net = rev - cost;
          rows.push([
            cName(cid), s.vehicles, s.loads, s.miles,
            s.loadRev.toFixed(2), s.invRev.toFixed(2), rev.toFixed(2),
            s.fuel.toFixed(2), s.repair.toFixed(2), s.payroll.toFixed(2),
            cost.toFixed(2), net.toFixed(2), rev > 0 ? pct(net, rev) : '—',
          ]);
        });
      return { rows, filename: 'Customer_Profitability.xlsx', sheet: 'Customer P&L' };
    }

    case 'revenue_summary': {
      const rows = [['Invoice #', 'Customer ID', 'Customer Name', 'Issue Date', 'Due Date', 'Subtotal', 'Tax', 'Total', 'Status', 'Type', 'Description']];
      fInvoices.filter(i => i.status === 'paid').forEach(i => {
        rows.push([i.invoice_number, i.customer_id, cName(i.customer_id), i.issue_date, i.due_date,
          i.subtotal || 0, i.tax || 0, i.total ?? i.amount ?? 0, i.status, i.type || '', i.description || '']);
      });
      rows.push(['', '', 'TOTAL', '', '', '', '', sum(fInvoices.filter(i => i.status === 'paid'), i => Number(i.total ?? i.amount) || 0).toFixed(2)]);
      return { rows, filename: 'Revenue_Summary.xlsx', sheet: 'Revenue' };
    }

    case 'invoice_aging': {
      const todayD = new Date();
      const rows = [['Invoice #', 'Customer ID', 'Customer Name', 'Issue Date', 'Due Date', 'Total', 'Status', 'Days Overdue', 'Description']];
      fInvoices.forEach(i => {
        const daysOverdue = i.due_date ? Math.max(0, Math.floor((todayD - new Date(i.due_date)) / 86400000)) : 0;
        rows.push([i.invoice_number, i.customer_id, cName(i.customer_id), i.issue_date, i.due_date,
          i.total ?? i.amount ?? 0, i.status, i.status === 'paid' ? 0 : daysOverdue, i.description || '']);
      });
      return { rows, filename: 'Invoice_Aging.xlsx', sheet: 'Aging' };
    }

    case 'fuel_cost': {
      const rows = [['Date', 'Vehicle', 'Customer', 'Driver', 'Location', 'Gallons', 'Price/Gal', 'Total Cost', 'Fuel Type', 'Odometer']];
      fFuel.forEach(f => {
        const v = vehicleMap[f.vehicle_id];
        rows.push([f.date, vLabel(f.vehicle_id), cName(v?.customer_id || v?.assigned_customer_id),
          userMap[f.driver_id]?.full_name || f.driver_id || '', fuelLocation(f),
          f.gallons || 0, f.price_per_gallon || 0, fuelCost(f), f.fuel_type || 'diesel', fuelOdometer(f)]);
      });
      rows.push(['', 'TOTAL', '', '', '', sum(fFuel, f => Number(f.gallons) || 0), '',
        sum(fFuel, fuelCost).toFixed(2)]);
      return { rows, filename: 'Fuel_Cost_Report.xlsx', sheet: 'Fuel' };
    }

    case 'fuel_per_vehicle': {
      const map = {};
      fFuel.forEach(f => {
        if (!f.vehicle_id) return;
        if (!map[f.vehicle_id]) map[f.vehicle_id] = { gallons: 0, cost: 0, logs: 0 };
        map[f.vehicle_id].gallons += f.gallons || 0;
        map[f.vehicle_id].cost += fuelCost(f);
        map[f.vehicle_id].logs++;
      });
      const rows = [['Vehicle', 'Customer', 'Make/Model', 'Total Gallons', 'Total Cost', 'Avg $/Gal', 'Fill-ups']];
      Object.entries(map).sort((a, b) => b[1].cost - a[1].cost).forEach(([id, s]) => {
        const v = vehicleMap[id];
        rows.push([vLabel(id), cName(v?.customer_id || v?.assigned_customer_id),
          v ? `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim() : '',
          s.gallons.toFixed(3), s.cost.toFixed(2),
          s.gallons > 0 ? (s.cost / s.gallons).toFixed(3) : 0, s.logs]);
      });
      return { rows, filename: 'Fuel_Per_Vehicle.xlsx', sheet: 'Fuel by Vehicle' };
    }

    case 'fuel_efficiency': {
      const byVehicle = {};
      fFuel.forEach(f => {
        if (!f.vehicle_id) return;
        if (!byVehicle[f.vehicle_id]) byVehicle[f.vehicle_id] = [];
        byVehicle[f.vehicle_id].push(f);
      });
      const rows = [['Vehicle', 'Customer', 'Fill-ups', 'Miles Tracked', 'Gallons', 'Avg MPG', 'Cost/Mile', 'Total Fuel Cost']];
      Object.entries(byVehicle).forEach(([vid, logs]) => {
        logs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
        let miles = 0;
        let gallons = 0;
        let cost = 0;
        let mpgSamples = [];
        for (let i = 0; i < logs.length; i++) {
          gallons += Number(logs[i].gallons) || 0;
          cost += fuelCost(logs[i]);
          const odo = Number(fuelOdometer(logs[i]));
          if (i > 0 && odo) {
            const prev = Number(fuelOdometer(logs[i - 1]));
            if (prev && odo > prev) {
              const segMiles = odo - prev;
              miles += segMiles;
              const segGal = Number(logs[i].gallons) || 0;
              if (segGal > 0) mpgSamples.push(segMiles / segGal);
            }
          }
        }
        const avgMpg = mpgSamples.length ? mpgSamples.reduce((a, b) => a + b, 0) / mpgSamples.length : 0;
        const v = vehicleMap[vid];
        rows.push([
          vLabel(vid), cName(v?.customer_id || v?.assigned_customer_id),
          logs.length, miles || '—', gallons.toFixed(1),
          avgMpg ? avgMpg.toFixed(2) : '—',
          miles > 0 ? (cost / miles).toFixed(3) : '—',
          cost.toFixed(2),
        ]);
      });
      rows.sort((a, b) => Number(b[5]) - Number(a[5]));
      return { rows, filename: 'Fuel_Efficiency.xlsx', sheet: 'Fuel Efficiency' };
    }

    case 'payroll_summary': {
      const rows = [['Driver Name', 'Customer', 'Pay Type', 'Period Start', 'Period End', 'Hours', 'Miles', 'Stops',
        'Gross Pay', 'Bonuses', 'Deductions', 'Net Pay', 'Status', 'Payment Method']];
      fPayroll.forEach(p => {
        const cid = p.customer_id || userMap[p.driver_id]?.customer_id;
        rows.push([p.driver_name, cName(cid), p.pay_type, p.pay_period_start, p.pay_period_end,
          p.hours_worked || 0, p.miles_driven || 0, p.stops_completed || 0,
          p.gross_pay || 0, p.bonuses || 0, p.deductions || 0, p.net_pay || 0,
          p.status, p.payment_method]);
      });
      rows.push(['TOTALS', '', '', '', '', '', '', '',
        sum(fPayroll, p => Number(p.gross_pay) || 0), '',
        '', sum(fPayroll, p => Number(p.net_pay) || 0)]);
      return { rows, filename: 'Payroll_Summary.xlsx', sheet: 'Payroll' };
    }

    case 'load_summary': {
      const rows = [['Load #', 'Status', 'Customer', 'Origin', 'Destination', 'Pickup Date', 'Delivery Date',
        'Rate', 'Miles', '$/Mile', 'Weight', 'Commodity', 'Driver', 'Vehicle', 'Broker']];
      fLoads.forEach(l => {
        const miles = Number(l.miles) || 0;
        const rate = Number(l.rate) || 0;
        rows.push([l.load_number, l.status, cName(l.customer_id), loadOrigin(l), loadDestination(l),
          l.pickup_date, l.delivery_date, rate, miles,
          miles > 0 ? (rate / miles).toFixed(2) : '—', l.weight || '', l.commodity || '',
          userMap[l.assigned_driver_id]?.full_name || l.assigned_driver_id || '',
          vLabel(l.assigned_vehicle_id), l.broker || '']);
      });
      rows.push(['', '', 'TOTALS', '', '', '', '',
        sum(fLoads, l => Number(l.rate) || 0), sum(fLoads, l => Number(l.miles) || 0)]);
      return { rows, filename: 'Load_Summary.xlsx', sheet: 'Loads' };
    }

    case 'load_profitability': {
      const rows = [['Load #', 'Customer', 'Status', 'Origin → Dest', 'Miles', 'Rate', '$/Mile',
        'Driver', 'Vehicle', 'Pickup', 'Delivery', 'Commodity']];
      fLoads.forEach(l => {
        const miles = Number(l.miles) || 0;
        const rate = Number(l.rate) || 0;
        rows.push([
          l.load_number, cName(l.customer_id), l.status,
          `${loadOrigin(l)} → ${loadDestination(l)}`, miles, rate,
          miles > 0 ? (rate / miles).toFixed(2) : '—',
          userMap[l.assigned_driver_id]?.full_name || '',
          vLabel(l.assigned_vehicle_id),
          l.pickup_date, l.delivery_date, l.commodity || '',
        ]);
      });
      const del = fLoads.filter(l => l.status === 'delivered');
      rows.push(['', 'SUMMARY', '', '',
        sum(del, l => Number(l.miles) || 0),
        sum(del, l => Number(l.rate) || 0).toFixed(2),
        sum(del, l => Number(l.miles) || 0) > 0
          ? (sum(del, l => Number(l.rate) || 0) / sum(del, l => Number(l.miles) || 0)).toFixed(2) : '—']);
      return { rows, filename: 'Load_Profitability.xlsx', sheet: 'Load Profitability' };
    }

    case 'load_revenue': {
      const map = {};
      fLoads.forEach(l => {
        const key = l.assigned_driver_id || 'Unassigned';
        if (!map[key]) map[key] = { loads: 0, miles: 0, revenue: 0, delivered: 0 };
        map[key].loads++;
        map[key].miles += Number(l.miles) || 0;
        map[key].revenue += Number(l.rate) || 0;
        if (l.status === 'delivered') map[key].delivered++;
      });
      const rows = [['Driver ID', 'Driver Name', 'Total Loads', 'Delivered', 'Total Miles', 'Total Revenue', 'Avg Rate/Load', '$/Mile']];
      Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue).forEach(([id, s]) => {
        const u = userMap[id];
        rows.push([id, u?.full_name || 'Unassigned', s.loads, s.delivered, s.miles,
          s.revenue.toFixed(2), s.loads > 0 ? (s.revenue / s.loads).toFixed(2) : 0,
          s.miles > 0 ? (s.revenue / s.miles).toFixed(2) : '—']);
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
        driverMap[id].miles += Number(l.miles) || 0;
        driverMap[id].revenue += Number(l.rate) || 0;
      });
      const rows = [['Driver ID', 'Driver Name', 'Customer', 'Total Loads', 'Delivered', 'Completion %', 'Total Miles', 'Total Revenue', '$/Mile']];
      Object.entries(driverMap).sort((a, b) => b[1].revenue - a[1].revenue).forEach(([id, s]) => {
        const u = userMap[id];
        rows.push([id, u?.full_name || '', cName(u?.customer_id), s.loads, s.delivered,
          pct(s.delivered, s.loads), s.miles, s.revenue.toFixed(2),
          s.miles > 0 ? (s.revenue / s.miles).toFixed(2) : '—']);
      });
      return { rows, filename: 'Driver_Performance.xlsx', sheet: 'Drivers' };
    }

    case 'fleet_status': {
      const rows = [['Unit #', 'Customer', 'Type', 'Year', 'Make', 'Model', 'VIN', 'License Plate',
        'Status', 'Odometer', 'Purchase Price', 'Purchase Date', 'Assigned Driver', 'Location', 'Notes']];
      vehicles.forEach(v => {
        rows.push([v.unit_number, cName(v.customer_id || v.assigned_customer_id), v.unit_type, v.year, v.make, v.model, v.vin,
          v.license_plate, v.status, v.odometer || 0, v.purchase_price || 0,
          v.purchase_date, userMap[v.assigned_driver_id]?.full_name || '',
          v.current_location || v.last_known_location || '', v.notes || '']);
      });
      return { rows, filename: 'Fleet_Status.xlsx', sheet: 'Fleet' };
    }

    case 'vehicle_downtime': {
      const rows = [['WO #', 'Vehicle', 'Customer', 'Title', 'Repair Type', 'Priority', 'Opened Date', 'Completed Date',
        'Days in Shop', 'Labor Hrs', 'Total Cost', 'Status']];
      fWorkOrders.filter(w => w.opened_date).forEach(w => {
        const days = w.completed_date
          ? Math.max(0, Math.round((new Date(w.completed_date) - new Date(w.opened_date)) / 86400000))
          : Math.max(0, Math.round((new Date() - new Date(w.opened_date)) / 86400000));
        rows.push([w.wo_number, vLabel(w.vehicle_id), cName(vCustomer(w.vehicle_id)), w.title, w.repair_type,
          w.priority || '', w.opened_date, w.completed_date || 'Open', days,
          w.labor_hours || 0, w.total_cost || 0, w.status]);
      });
      return { rows, filename: 'Vehicle_Downtime.xlsx', sheet: 'Downtime' };
    }

    case 'maintenance_schedule': {
      const rows = [['Vehicle', 'Customer', 'Service Type', 'Status', 'Due Date', 'Due Mileage',
        'Last Service Date', 'Last Service Mileage', 'Interval Miles', 'Interval Days',
        'Est. Cost', 'Assigned Tech', 'Notes']];
      fMaintenance.forEach(m => {
        rows.push([vLabel(m.vehicle_id), cName(vCustomer(m.vehicle_id)), m.service_type, m.status, m.due_date,
          m.due_mileage || '', m.last_service_date || '', m.last_service_mileage || '',
          m.interval_miles || '', m.interval_days || '',
          m.estimated_cost || 0, m.assigned_tech || '', m.notes || '']);
      });
      return { rows, filename: 'Maintenance_Schedule.xlsx', sheet: 'Maintenance' };
    }

    case 'work_orders': {
      const rows = [['WO #', 'Title', 'Vehicle', 'Customer', 'Repair Type', 'Status', 'Priority',
        'Opened', 'Due', 'Completed', 'Odometer', 'Complaint', 'Diagnosis',
        'Labor Hours', 'Labor Cost', 'Parts Total', 'Total Cost', 'Tech', 'Shop', 'Warranty']];
      fWorkOrders.forEach(w => {
        rows.push([w.wo_number, w.title, vLabel(w.vehicle_id), cName(vCustomer(w.vehicle_id)), w.repair_type,
          w.status, w.priority, w.opened_date, w.due_date || '', w.completed_date || '',
          w.odometer || '', w.complaint || '', w.diagnosis || '',
          w.labor_hours || 0, w.labor_cost || 0,
          w.parts_total || 0, w.total_cost || 0,
          userMap[w.assigned_tech_id]?.full_name || '',
          w.shop_name || '', w.warranty_repair ? 'Yes' : 'No']);
      });
      rows.push(['', 'TOTAL', '', '', '', '', '', '', '', '', '', '', '',
        sum(fWorkOrders, w => Number(w.labor_hours) || 0),
        sum(fWorkOrders, w => Number(w.labor_cost) || 0), '',
        sum(fWorkOrders, w => Number(w.total_cost) || 0)]);
      return { rows, filename: 'Work_Orders.xlsx', sheet: 'Work Orders' };
    }

    case 'work_order_parts': {
      const rows = [['WO #', 'Vehicle', 'Customer', 'WO Title', 'Status', 'Opened', 'Part #', 'Description', 'Qty', 'Unit Cost', 'Line Total']];
      fWorkOrders.forEach(w => {
        const partsList = w.parts || [];
        if (!partsList.length) return;
        partsList.forEach(p => {
          rows.push([
            w.wo_number, vLabel(w.vehicle_id), cName(vCustomer(w.vehicle_id)), w.title, w.status, w.opened_date,
            p.part_number || '', p.description || '', p.quantity || 1,
            p.unit_cost || '', p.total_cost || ((p.quantity || 1) * (p.unit_cost || 0)),
          ]);
        });
      });
      return { rows, filename: 'Work_Order_Parts_Detail.xlsx', sheet: 'WO Parts' };
    }

    case 'parts_inventory': {
      const rows = [['Part #', 'Description', 'Category', 'Qty on Hand', 'Reorder Point',
        'Unit Cost', 'Total Value', 'Below Reorder?', 'Supplier', 'Location', 'Notes']];
      parts.forEach(p => {
        const qty = Number(p.quantity_on_hand ?? p.quantity) || 0;
        const reorder = Number(p.reorder_point) || 0;
        rows.push([p.part_number, p.description, p.category,
          qty, reorder, p.unit_cost || 0, (qty * (Number(p.unit_cost) || 0)).toFixed(2),
          reorder > 0 && qty <= reorder ? 'YES' : 'No',
          p.supplier || '', p.location || '', p.notes || '']);
      });
      rows.push(['', 'TOTAL VALUE', '', sum(parts, p => Number(p.quantity_on_hand ?? p.quantity) || 0),
        '', '', sum(parts, p => (Number(p.quantity_on_hand ?? p.quantity) || 0) * (Number(p.unit_cost) || 0)).toFixed(2)]);
      return { rows, filename: 'Parts_Inventory.xlsx', sheet: 'Parts' };
    }

    case 'inspections': {
      const rows = [['Vehicle', 'Customer', 'Type', 'Date', 'Inspector', 'Odometer', 'Status',
        'Defects Found', 'Defects Corrected', 'Manager Signoff', 'Manager', 'Notes']];
      fInspections.forEach(i => {
        rows.push([vLabel(i.vehicle_id), cName(vCustomer(i.vehicle_id)), i.inspection_type, i.inspection_date,
          i.inspector_name, i.odometer || '', i.status,
          i.defects_found ? 'Yes' : 'No', i.defects_corrected ? 'Yes' : 'No',
          i.manager_signoff_required ? (i.manager_name ? 'Signed' : 'Pending') : 'N/A',
          i.manager_name || '', i.notes || '']);
      });
      return { rows, filename: 'Inspections_DVIR.xlsx', sheet: 'Inspections' };
    }

    case 'hos_logs': {
      const rows = [['Driver ID', 'Driver Name', 'Customer', 'Date', 'Vehicle', 'Start Location',
        'End Location', 'Total Miles', 'Hours Driving', 'Hours On Duty',
        'Hours Off Duty', 'Hours Sleeper', 'Status', 'Violations']];
      fHosLogs.forEach(h => {
        const u = userMap[h.driver_id];
        rows.push([h.driver_id, u?.full_name || '', cName(u?.customer_id), h.log_date, vLabel(h.vehicle_id),
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
        const state = extractState(fuelLocation(f));
        if (!state) return;
        if (!byState[state]) byState[state] = { gallons: 0, cost: 0, count: 0 };
        byState[state].gallons += Number(f.gallons) || 0;
        byState[state].cost += fuelCost(f);
        byState[state].count++;
      });
      const rows = [['State', 'Fill-ups', 'Total Gallons', 'Tax Rate ($/gal)', 'Est. Tax Owed', 'Fuel Cost']];
      Object.entries(byState).sort((a, b) => b[1].gallons - a[1].gallons).forEach(([state, d]) => {
        const rate = STATE_TAX_RATES[state] || 0.25;
        rows.push([state, d.count, d.gallons.toFixed(3), rate.toFixed(3),
          (d.gallons * rate).toFixed(2), d.cost.toFixed(2)]);
      });
      rows.push(['TOTAL', fFuel.length, sum(fFuel, f => Number(f.gallons) || 0).toFixed(3),
        '', Object.entries(byState).reduce((s, [st, d]) => s + d.gallons * (STATE_TAX_RATES[st] || 0.25), 0).toFixed(2),
        sum(fFuel, fuelCost).toFixed(2)]);
      return { rows, filename: 'IFTA_Fuel_Tax.xlsx', sheet: 'IFTA' };
    }

    case 'incident_report': {
      const rows = [['Date', 'Type', 'Severity', 'Status', 'Vehicle', 'Customer', 'Driver', 'Location',
        'Description', 'DOT Recordable', 'Injuries', 'Tow Required', 'CSA Points', 'Est. Damage ($)',
        'Police Report #', 'Insurance Claim #', 'Corrective Action']];
      fIncidents.forEach(i => {
        rows.push([
          incidentDate(i), i.incident_type || i.title || '', i.severity || '', i.status || '',
          vLabel(i.vehicle_id), cName(i.customer_id || vCustomer(i.vehicle_id)),
          i.driver_name || userMap[i.driver_id]?.full_name || '',
          i.location || '', i.description || '',
          i.dot_recordable ? 'Yes' : 'No', i.injuries ? 'Yes' : 'No', i.tow_required ? 'Yes' : 'No',
          i.csa_points || 0, i.estimated_damage_cost || '',
          i.police_report_number || '', i.insurance_claim_number || '', i.corrective_action || '',
        ]);
      });
      return { rows, filename: 'Incident_Report.xlsx', sheet: 'Incidents' };
    }

    case 'compliance_scorecard': {
      const inspDefects = fInspections.filter(i => i.defects_found).length;
      const hosViol = fHosLogs.filter(h => (h.violations || []).length > 0).length;
      const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const expiringScreenings = fScreenings.filter(s => s.expiration_date && s.expiration_date <= soon).length;
      const overdueMaint = fMaintenance.filter(m => m.status === 'overdue' || (m.due_date && m.due_date < from)).length;
      const rows = [
        ['Compliance Scorecard', '', ''],
        ['Period', `${from} → ${to}`, ''],
        [],
        ['Area', 'Metric', 'Count', 'Rate / Notes'],
        ['Inspections', 'Total inspections', fInspections.length, ''],
        ['Inspections', 'With defects', inspDefects, fInspections.length ? pct(inspDefects, fInspections.length) : '—'],
        ['Inspections', 'Defects corrected', fInspections.filter(i => i.defects_corrected).length, ''],
        ['HOS / ELD', 'Logs in period', fHosLogs.length, ''],
        ['HOS / ELD', 'Logs with violations', hosViol, fHosLogs.length ? pct(hosViol, fHosLogs.length) : '—'],
        ['Driver Screening', 'Checks in period', fScreenings.length, ''],
        ['Driver Screening', 'Expiring within 30 days', expiringScreenings, ''],
        ['Incidents', 'Total incidents', fIncidents.length, ''],
        ['Incidents', 'Open / under review', fIncidents.filter(i => i.status !== 'closed').length, ''],
        ['Incidents', 'DOT recordable', fIncidents.filter(i => i.dot_recordable).length, ''],
        ['Maintenance', 'PM tasks in range', fMaintenance.length, ''],
        ['Maintenance', 'Overdue PM', overdueMaint, ''],
        ['Work Orders', 'Open critical priority', fWorkOrders.filter(w => w.priority === 'critical' && w.status !== 'completed').length, ''],
      ];
      return { rows, filename: 'Compliance_Scorecard.xlsx', sheet: 'Compliance' };
    }

    case 'customer_list': {
      const vehicleCounts = {};
      vehicles.forEach(v => {
        const cid = v.customer_id || v.assigned_customer_id;
        if (cid) vehicleCounts[cid] = (vehicleCounts[cid] || 0) + 1;
      });
      const rows = [['Company', 'Contact', 'Email', 'Phone', 'City', 'State', 'ZIP',
        'MC #', 'DOT #', 'Fleet Size', 'Actual Vehicles', 'Subscription', 'Payment Status', 'Status', 'Notes']];
      customers.forEach(c => {
        rows.push([c.company_name, c.contact_name, c.email, c.phone,
          c.city, c.state, c.zip, c.mc_number || '', c.dot_number || '',
          c.fleet_size || '', vehicleCounts[c.id] || 0,
          c.subscription_plan || '', c.payment_status || '', c.status, c.notes || '']);
      });
      return { rows, filename: 'Customer_List.xlsx', sheet: 'Customers' };
    }

    case 'team_roster': {
      const rows = [['Name', 'Email', 'Role', 'Customer', 'Phone', 'Status', 'Employee #']];
      (users || []).forEach(u => {
        rows.push([
          u.full_name || '', u.email || '', u.role || '',
          cName(u.customer_id), u.phone || '', u.status || 'active', u.employee_number || '',
        ]);
      });
      return { rows, filename: 'Team_Roster.xlsx', sheet: 'Team Roster' };
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
      const rows = [['Driver ID', 'Driver Name', 'Customer', 'Check Type', 'Provider', 'Status',
        'Ordered Date', 'Completed Date', 'Expiration Date', 'Reference ID', 'Violations', 'Notes']];
      fScreenings.forEach(s => {
        const u = userMap[s.driver_id];
        rows.push([s.driver_id, s.driver_name || u?.full_name || '', cName(u?.customer_id || s.customer_id),
          s.check_type, s.provider, s.status,
          s.ordered_date, s.completed_date || '', s.expiration_date || '',
          s.reference_id || '', (s.violations || []).join('; '), s.notes || '']);
      });
      return { rows, filename: 'Driver_Screening_Records.xlsx', sheet: 'Screenings' };
    }

    case 'fleet_pnl': {
      const revenueByVehicle = {};
      fLoads.filter(l => l.status === 'delivered').forEach(l => {
        if (!l.assigned_vehicle_id) return;
        revenueByVehicle[l.assigned_vehicle_id] = (revenueByVehicle[l.assigned_vehicle_id] || 0) + (Number(l.rate) || 0);
      });
      const fuelByVehicle = {};
      fFuel.forEach(f => {
        if (!f.vehicle_id) return;
        fuelByVehicle[f.vehicle_id] = (fuelByVehicle[f.vehicle_id] || 0) + fuelCost(f);
      });
      const repairByVehicle = {};
      fWorkOrders.forEach(w => {
        if (!w.vehicle_id) return;
        repairByVehicle[w.vehicle_id] = (repairByVehicle[w.vehicle_id] || 0) + (Number(w.total_cost) || 0);
      });
      const allVehicleIds = new Set([
        ...Object.keys(revenueByVehicle),
        ...Object.keys(fuelByVehicle),
        ...Object.keys(repairByVehicle),
      ]);
      const rows = [['Vehicle', 'Customer', 'Make/Model', 'Revenue', 'Fuel Cost', 'Repair Cost', 'Total Cost', 'Net P&L', 'Margin %']];
      [...allVehicleIds].forEach(id => {
        const rev = revenueByVehicle[id] || 0;
        const fc = fuelByVehicle[id] || 0;
        const rc = repairByVehicle[id] || 0;
        const cost = fc + rc;
        const net = rev - cost;
        const v = vehicleMap[id];
        rows.push([vLabel(id), cName(v?.customer_id || v?.assigned_customer_id),
          v ? `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim() : '',
          rev.toFixed(2), fc.toFixed(2), rc.toFixed(2), cost.toFixed(2), net.toFixed(2),
          rev > 0 ? pct(net, rev) : '—']);
      });
      return { rows, filename: 'Fleet_PnL.xlsx', sheet: 'Fleet P&L' };
    }

    default:
      return null;
  }
}

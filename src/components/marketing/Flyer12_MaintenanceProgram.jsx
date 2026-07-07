import React from 'react';
import { Wrench, Settings, ClipboardList, Archive, Store, Calendar as CalendarIcon, Phone, Globe, Truck, CheckCircle, Package, Cpu, Clock } from 'lucide-react';

export default function Flyer12_MaintenanceProgram() {
  return (
    <div className="max-w-[8.5in] mx-auto bg-white print:p-0" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-slate-900 text-white p-8 rounded-t-2xl print:rounded-none">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-500 p-3 rounded-xl"><Wrench className="w-8 h-8 text-slate-900" /></div>
          <div>
            <div className="font-black text-3xl">FLEETCO</div>
            <div className="text-amber-400 text-xs tracking-widest">MAINTENANCE SUITE</div>
          </div>
        </div>
        <h1 className="text-4xl font-black leading-tight">Zero Surprises.<br/>Zero Breakdowns.</h1>
        <p className="text-slate-300 text-lg mt-4">Preventive maintenance scheduling, digital work orders with service templates, parts inventory, vendor contract management, and diagnostic code tracking — all in one integrated shop system.</p>
        <div className="flex gap-3 mt-6 flex-wrap">
          {['Work Orders', 'PM Scheduling', 'Parts Inventory', 'Vendors', 'Diagnostics', 'Calendar'].map(t => (
            <span key={t} className="bg-slate-800 text-amber-400 px-4 py-2 rounded-full text-sm font-bold">{t}</span>
          ))}
        </div>
      </div>

      {/* Work Orders Deep Dive */}
      <div className="p-8 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 p-2 rounded-lg"><ClipboardList className="w-6 h-6 text-amber-600" /></div>
          <h2 className="font-black text-slate-900 text-xl">Digital Work Orders — End Paper Shop Tickets</h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            {[
              { title: 'Work Order Lifecycle', desc: 'Open → In Progress → Parts Ordered → Awaiting Parts → Completed. Full visibility at every stage.' },
              { title: 'Service Templates', desc: 'Create reusable task checklists for common jobs like brake replacements, PM services, and annual DOT inspections. Apply to any work order with one click.' },
              { title: 'Task-Level Tracking', desc: 'Each task on a work order tracks estimated minutes, completion status, who completed it, and when. Auto-calculated total labor hours.' },
              { title: 'Parts Usage', desc: 'Add parts per work order with part number, quantity, unit cost, and source (in-stock, ordered, warranty). Parts auto-deduct from inventory.' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="font-black text-slate-900 text-sm mb-4">Work Order Features at a Glance</h3>
              <ul className="space-y-2.5">
                {[
                  '13 repair categories: Engine, Transmission, Brakes, Tires, Electrical, HVAC, Suspension, Fuel System, Exhaust, PM, Body & Frame, Other',
                  'Priority levels: Low / Medium / High / Critical',
                  'Vehicle + Odometer tracking for service history',
                  'Labor hours × labor rate = auto-calculated labor cost',
                  'Parts total + labor cost = total work order cost',
                  'Warranty repair flag for manufacturer claims',
                  'External shop tracking when outsourced',
                  'Driver complaint → Tech diagnosis → Repair notes flow',
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* PM + Parts + Vendors Grid */}
      <div className="grid grid-cols-3 gap-0 border-b border-slate-200">
        <div className="p-6 border-r border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg"><CalendarIcon className="w-5 h-5 text-blue-600" /></div>
            <h3 className="font-black text-slate-900 text-sm">PM Scheduling</h3>
          </div>
          <ul className="space-y-1.5">
            {[
              '12 service types including Oil Change, Brake Service, DPF Filter, Annual DOT',
              'Due-date and due-mileage dual tracking',
              'Recurring intervals: every X miles or X days with auto-rescheduling',
              'Maintenance Calendar for monthly shop planning view',
              'Overdue flags auto-highlight in red for attention',
              'Pre-Trip Checklist with digital driver sign-off workflow',
            ].map((item, i) => (
              <li key={i} className="flex gap-1.5 text-[11px] text-slate-600">
                <CheckCircle className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 border-r border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-green-100 p-2 rounded-lg"><Archive className="w-5 h-5 text-green-600" /></div>
            <h3 className="font-black text-slate-900 text-sm">Parts Inventory</h3>
          </div>
          <ul className="space-y-1.5">
            {[
              'Full parts catalog with part number, description, category',
              'Quantity on hand with minimum stock thresholds',
              'Low-stock alerts highlight in amber/red',
              'Unit cost and supplier tracking per part',
              'Auto-deduct from inventory when used on work orders',
              'Manual restock entries update quantities instantly',
            ].map((item, i) => (
              <li key={i} className="flex gap-1.5 text-[11px] text-slate-600">
                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-purple-100 p-2 rounded-lg"><Store className="w-5 h-5 text-purple-600" /></div>
            <h3 className="font-black text-slate-900 text-sm">Vendor Contracts</h3>
          </div>
          <ul className="space-y-1.5">
            {[
              '8 vendor types: Repair Shop, Parts Supplier, Tire Shop, Towing, Fuel, Body Shop, Weigh Scale, Other',
              'Contract tracking: number, dates, labor rate, parts discount %',
              'POC details with alternate/after-hours phone',
              'Specialty matrix for makes and systems they excel at',
              'Weigh scale certified status with capacity and hours',
              'Link vendors directly to work orders for outsourced repairs',
            ].map((item, i) => (
              <li key={i} className="flex gap-1.5 text-[11px] text-slate-600">
                <CheckCircle className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Diagnostics */}
      <div className="p-8 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-lg"><Cpu className="w-5 h-5 text-red-600" /></div>
          <h3 className="font-black text-slate-900">Diagnostic Code Tracking</h3>
        </div>
        <p className="text-sm text-slate-500 mb-3">Log every DTC (Diagnostic Trouble Code) pulled from your fleet. Track resolution, link to work orders, and build a searchable fault history for every vehicle.</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Connector Types', value: 'OBD-II, J1939, J1708, Manual' },
            { label: 'Systems Covered', value: 'Engine, Transmission, Brakes, Emissions, Electrical, Body, HVAC' },
            { label: 'Severity Levels', value: 'Info → Warning → Critical' },
            { label: 'Resolution Flow', value: 'Active → Monitoring → Resolved' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg p-3 border border-slate-200 text-center">
              <div className="text-[10px] text-slate-400 mb-1">{label}</div>
              <div className="text-xs font-bold text-slate-900">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-900 text-white p-6 text-center rounded-b-2xl print:rounded-none">
        <h3 className="font-black text-xl">Your shop deserves a digital upgrade.</h3>
        <p className="text-slate-400 text-sm mt-1">Schedule a demo and see the maintenance suite in action.</p>
        <div className="flex items-center justify-center gap-6 mt-3 text-base font-black">
          <span className="flex items-center gap-2"><Phone className="w-5 h-5 text-amber-400" /> (360) 952-1249</span>
          <span className="flex items-center gap-2"><Globe className="w-5 h-5 text-amber-400" /> fleetcomanagement.org</span>
        </div>
      </div>
    </div>
  );
}
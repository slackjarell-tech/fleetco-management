import React from 'react';
import { Truck, Shield, Fuel, Wrench, TrendingDown, CheckCircle, BarChart3, Phone, Globe, Calendar, Users, MapPin } from 'lucide-react';

export default function CaseStudy01_MidwestCarrier() {
  return (
    <div className="max-w-[8.5in] mx-auto bg-white print:p-0" style={{ fontFamily: 'system-ui' }}>
      {/* Hero */}
      <div className="bg-slate-900 text-white p-10 rounded-t-2xl print:rounded-none" style={{
        backgroundImage: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.85) 100%)',
      }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-500 p-3 rounded-xl"><Truck className="w-8 h-8 text-slate-900" /></div>
          <div>
            <div className="font-black text-3xl">FLEETCO</div>
            <div className="text-amber-400 text-xs tracking-widest">CASE STUDY</div>
          </div>
        </div>
        <h1 className="text-4xl font-black leading-tight">How a 47-Truck Midwest Carrier<br/>Cut Operating Costs by 28%</h1>
        <p className="text-slate-300 text-lg mt-4">A real-world look at FleetCo Management in action</p>
        <div className="flex gap-4 mt-6">
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-full text-sm font-bold">47 Vehicles</span>
          <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-full text-sm font-bold">28% Cost Reduction</span>
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-full text-sm font-bold">12-Month Results</span>
        </div>
      </div>

      {/* Challenge + Solution */}
      <div className="grid grid-cols-2 gap-0 border-b border-slate-200">
        <div className="p-8 bg-red-50/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-red-100 p-2 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="font-black text-slate-900 text-lg">The Challenge</h2>
          </div>
          <ul className="space-y-3">
            {[
              'Managing 47 trucks across 6 states with spreadsheets and phone calls',
              'Fuel costs 18% above industry average — no system to compare station prices',
              'Missing 2 of every 5 preventive maintenance intervals due to paper tracking',
              'HOS violations accumulating — 12 in Q1 alone with no early-warning system',
              'IFTA filing took 3+ days of manual spreadsheet work each quarter',
              'No visibility into per-vehicle profitability — couldn\'t identify underperforming units',
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-8 bg-green-50/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-black text-slate-900 text-lg">The FleetCo Solution</h2>
          </div>
          <ul className="space-y-3">
            {[
              'Single unified dashboard replacing all spreadsheets — real-time fleet visibility',
              'Fuel Stations module with live pricing map and AI-driven 14-day price predictions',
              'Automated maintenance scheduling with due-date alerts and recurring interval tracking',
              'HOS/ELD compliance dashboard with automatic violation detection and driver scorecards',
              'One-click IFTA Dashboard generating quarterly reports in under 5 minutes',
              'Fleet P&L and Vehicle TCO pages showing exact profit/loss per unit with depreciation',
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Results */}
      <div className="p-8 bg-slate-50">
        <h2 className="font-black text-slate-900 text-xl mb-6 text-center">12-Month Results</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Fuel, value: '$98,700', label: 'Fuel Savings', sub: '$2,100/unit avg.', color: 'text-green-600', bg: 'bg-green-100' },
            { icon: Wrench, value: '94%', label: 'PM Compliance', sub: 'Up from 60%', color: 'text-blue-600', bg: 'bg-blue-100' },
            { icon: Shield, value: 'Zero', label: 'HOS Violations', sub: 'Down from 12/quarter', color: 'text-amber-600', bg: 'bg-amber-100' },
            { icon: BarChart3, value: '4.5 hrs', label: 'IFTA Filing Time', sub: 'Down from 3+ days', color: 'text-purple-600', bg: 'bg-purple-100' },
          ].map(({ icon: Icon, value, label, sub, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-slate-200 text-center shadow-sm">
              <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="font-bold text-slate-900 text-sm mt-1">{label}</div>
              <div className="text-xs text-slate-500">{sub}</div>
            </div>
          ))}
        </div>

        {/* Detailed breakdown */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {[
            { area: 'Fuel Optimization', saving: '$98,700/yr', detail: 'Route-based station comparison saved avg $0.31/gal across 280,000 gallons. 14-day AI predictions guided bulk purchasing at lowest price points.' },
            { area: 'Maintenance Compliance', saving: '$42,500/yr', detail: 'Automated scheduling eliminated 3 roadside breakdowns. Digital work orders with service templates cut shop admin by 12 hrs/week.' },
            { area: 'Compliance & IFTA', saving: '$18,200/yr', detail: 'Zero HOS violations in 12 months saved $15K+ in potential fines. IFTA filing went from 3 days to under 5 minutes per quarter.' },
            { area: 'Fleet Visibility', saving: '$31,000/yr', detail: 'Vehicle TCO identified 5 underperforming units. Fleet P&L enabled data-driven retirement decisions on 3 aging trucks.' },
          ].map(({ area, saving, detail }) => (
            <div key={area} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-slate-900 text-sm">{area}</span>
                <span className="font-black text-green-600 text-sm">{saving}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="p-8 bg-slate-900 text-white text-center rounded-b-2xl print:rounded-none">
        <div className="max-w-xl mx-auto">
          <div className="text-amber-400 text-4xl mb-3">"</div>
          <p className="text-lg leading-relaxed italic">
            FleetCo transformed how we manage our fleet. We went from juggling spreadsheets and praying nothing fell through the cracks, to having real-time visibility into every truck, every mile, and every dollar. The IFTA module alone saved us days of work each quarter.
          </p>
          <p className="font-black mt-4">Operations Director, Midwest Regional Carrier</p>
          <p className="text-slate-400 text-sm">47 trucks | 6 states | Active since Q1 2025</p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm font-bold">
            <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-400" /> (360) 952-1249</span>
            <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-amber-400" /> fleetcomanagement.org</span>
          </div>
        </div>
      </div>
    </div>
  );
}
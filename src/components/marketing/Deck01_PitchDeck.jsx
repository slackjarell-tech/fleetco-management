import React from 'react';
import { Presentation, Truck, Shield, Fuel, Wrench, BarChart3, Phone, Globe, MapPin, Users, DollarSign } from 'lucide-react';

export default function Deck01_PitchDeck() {
  const slides = [
    {
      title: 'The Problem', color: 'bg-red-600', items: [
        'Fleet operators juggle 5+ different software tools',
        '30% of revenue lost to inefficiency and poor data',
        'Compliance violations cost $10K+ in fines annually',
        'No single source of truth for fleet P&L',
      ]
    },
    {
      title: 'Our Solution', color: 'bg-amber-500', text: 'text-slate-900', items: [
        'One unified platform for your entire fleet operation',
        'Dispatch, maintenance, fuel, compliance — all connected',
        'Real-time dashboards with actionable KPIs',
        'Customer portal for multi-tenant fleet visibility',
      ]
    },
  ];

  return (
    <div className="max-w-[10in] mx-auto bg-white p-6 print:p-4 space-y-6" style={{ fontFamily: 'system-ui' }}>
      {/* Cover Slide */}
      <div className="bg-slate-900 text-white p-10 rounded-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-amber-500 p-3 rounded-xl"><Truck className="w-8 h-8 text-slate-900" /></div>
          <div><div className="font-black text-4xl">FLEETCO</div><div className="text-amber-400 text-sm tracking-widest">MANAGEMENT</div></div>
        </div>
        <h1 className="text-5xl font-black leading-tight">Complete Fleet Operations.<br/>One Platform.</h1>
        <p className="text-slate-400 text-xl mt-6">Investor Presentation — Confidential</p>
        <div className="flex gap-8 mt-10 text-amber-400 font-black text-lg">
          <span>fleetcomanagement.org</span>
          <span>(360) 952-1249</span>
        </div>
      </div>

      {/* Problem Slide */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-10">
        <div className="bg-red-600 text-white inline-block px-6 py-2 rounded-full font-black text-sm mb-6">THE PROBLEM</div>
        <h2 className="text-3xl font-black text-slate-900 mb-6">Fleet Management Is Broken</h2>
        <div className="grid grid-cols-2 gap-4">
          {slides[0].items.map((item, i) => (
            <div key={i} className="flex gap-3 bg-red-50 p-4 rounded-xl">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-red-600 font-black text-sm">{i + 1}</div>
              <p className="text-slate-700 text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Solution Slide */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-10">
        <div className="bg-amber-500 text-slate-900 inline-block px-6 py-2 rounded-full font-black text-sm mb-6">OUR SOLUTION</div>
        <h2 className="text-3xl font-black text-slate-900 mb-6">FleetCo Management Platform</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Truck, title: 'Fleet & Assets', desc: 'Track every vehicle, trailer, and maintenance record' },
            { icon: Fuel, title: 'Fuel Optimization', desc: 'Live pricing, IFTA reporting, cost-per-mile analytics' },
            { icon: MapPin, title: 'Dispatch & Loads', desc: 'Load board, GPS navigation, weigh scale tracking' },
            { icon: Shield, title: 'Compliance', desc: 'HOS/ELD logs, DVIRs, driver screening, incident reports' },
            { icon: Wrench, title: 'Shop Management', desc: 'Work orders, parts inventory, vendor contracts' },
            { icon: BarChart3, title: 'Analytics', desc: 'Fleet P&L, TCO per unit, customizable reporting' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 bg-amber-50 p-4 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"><Icon className="w-5 h-5 text-amber-600" /></div>
              <div><div className="font-bold text-slate-900 text-sm">{title}</div><div className="text-xs text-slate-500">{desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Slide */}
      <div className="bg-slate-900 text-white p-10 rounded-2xl text-center">
        <div className="bg-amber-500 p-4 rounded-full inline-flex mb-6"><Truck className="w-10 h-10 text-slate-900" /></div>
        <h2 className="text-3xl font-black">Let's Talk</h2>
        <p className="text-slate-400 text-lg mt-3">Schedule a demo or request our investor deck</p>
        <div className="flex items-center justify-center gap-6 mt-6 text-xl font-black">
          <span className="flex items-center gap-2"><Phone className="w-5 h-5 text-amber-400" /> (360) 952-1249</span>
          <span className="flex items-center gap-2"><Globe className="w-5 h-5 text-amber-400" /> fleetcomanagement.org</span>
        </div>
        <p className="text-slate-500 text-sm mt-6">JaRell & Desiree Slack, Owners</p>
      </div>
    </div>
  );
}
import React from 'react';
import { Truck, Shield, Fuel, Wrench, BarChart3, Phone, Globe, MapPin, Sparkles, Bot } from 'lucide-react';
import { BRAND } from '@/lib/brand';

export default function Deck02_ClientPresentation() {
  const problems = [
    '5+ disconnected tools for dispatch, maintenance, fuel, and compliance',
    '30% of revenue lost to inefficiency, downtime, and poor visibility',
    'DOT violations and missed PMs cost $10K+ in fines and lost loads',
    'No single source of truth for fleet P&L and cost-per-mile',
  ];

  const features = [
    { icon: Truck, title: 'Fleet & Assets', desc: 'Every truck, trailer, VIN, odometer & document' },
    { icon: MapPin, title: 'Dispatch & Loads', desc: 'Load board, routes, GPS map & delivery POD' },
    { icon: Wrench, title: 'Maintenance & Shop', desc: 'Work orders, PM schedules, parts & vendors' },
    { icon: Fuel, title: 'Fuel & IFTA', desc: 'Station pricing, fuel logs & tax-ready reports' },
    { icon: Shield, title: 'Compliance', desc: 'HOS/ELD, DVIRs, inspections & incident tracking' },
    { icon: BarChart3, title: 'Analytics & P&L', desc: 'Fleet-wide KPIs, TCO per unit & custom reports' },
  ];

  const stats = [
    ['15–25%', 'Reduction in unplanned downtime', 'PM alerts & work order tracking'],
    ['8–12%', 'Fuel cost savings', 'Station pricing & IFTA-ready logs'],
    ['100%', 'Compliance visibility', 'HOS, DVIRs & inspection records in one place'],
    ['1 Portal', 'For owners, dispatch & drivers', 'Role-based access, mobile-ready'],
  ];

  const segments = [
    ['Owner-Operators', '1–5 trucks', 'Fuel savings, compliance, parts sourcing'],
    ['Small Fleets', '6–15 units', 'Dispatch, maintenance, driver management'],
    ['Established Fleets', '16+ units', 'Full-service management & dedicated support'],
  ];

  return (
    <div className="max-w-[10in] mx-auto bg-white p-6 print:p-4 space-y-6" style={{ fontFamily: 'system-ui' }}>
      {/* Slide 1 — Cover */}
      <div className="bg-slate-900 text-white p-10 rounded-2xl relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
        <div className="flex items-center gap-3 mb-8 pl-2">
          <div className="bg-amber-500 p-3 rounded-xl"><Truck className="w-8 h-8 text-slate-900" /></div>
          <div><div className="font-black text-4xl">FLEETCO</div><div className="text-amber-400 text-sm tracking-widest">MANAGEMENT</div></div>
        </div>
        <h1 className="text-5xl font-black leading-tight pl-2">Complete Fleet Operations.<br />One Platform.</h1>
        <p className="text-slate-400 text-lg mt-4 pl-2 italic">{BRAND.tagline}</p>
        <p className="text-slate-400 mt-2 pl-2">Built for owner-operators & small fleets · {BRAND.location}</p>
        <div className="flex gap-6 mt-8 pl-2 text-amber-400 font-black text-lg">
          <span>{BRAND.website}</span>
          <span>{BRAND.phone}</span>
        </div>
        <p className="text-slate-500 text-sm mt-6 pl-2">Client Presentation — July 2026</p>
      </div>

      {/* Slide 2 — Problem */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-10">
        <div className="bg-red-600 text-white inline-block px-6 py-2 rounded-full font-black text-sm mb-6">THE CHALLENGE</div>
        <h2 className="text-3xl font-black text-slate-900 mb-6">Fleet Management Is Fragmented</h2>
        <div className="grid grid-cols-2 gap-4">
          {problems.map((item, i) => (
            <div key={i} className="flex gap-3 bg-red-50 p-4 rounded-xl">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-red-600 font-black text-sm">{i + 1}</div>
              <p className="text-slate-700 text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Slide 3 — Solution */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-10">
        <div className="bg-amber-500 text-slate-900 inline-block px-6 py-2 rounded-full font-black text-sm mb-6">OUR SOLUTION</div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">FleetCo — Your Command Center</h2>
        <p className="text-slate-500 text-sm mb-6">One secure portal for your entire operation — from the road to the shop to the back office.</p>
        <div className="grid grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 bg-amber-50 p-4 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"><Icon className="w-5 h-5 text-amber-600" /></div>
              <div><div className="font-bold text-slate-900 text-sm">{title}</div><div className="text-xs text-slate-500">{desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide 4 — AI */}
      <div className="bg-slate-900 text-white p-10 rounded-2xl">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-4">
          <Sparkles className="w-4 h-4" /> AI-Powered
        </div>
        <h2 className="text-3xl font-black mb-2">Site Commander & Revan AI</h2>
        <p className="text-slate-400 text-sm mb-6">Like having Cursor built into your portal — ask in plain English, get real changes.</p>
        <ul className="space-y-2 text-sm text-slate-200 mb-6">
          <li>▸ &quot;List all open work orders&quot; → instant fleet query</li>
          <li>▸ &quot;Change our homepage headline&quot; → live website update</li>
          <li>▸ &quot;Create a brake inspection WO for unit 104&quot; → done</li>
          <li>▸ Executive Revan AI: audits, user management, full control</li>
        </ul>
        <div className="bg-slate-800 border border-amber-500/40 rounded-xl p-4">
          <p className="text-amber-400 font-bold text-sm">Live demo: {BRAND.url}/login</p>
          <p className="text-slate-500 text-xs mt-1">4 customers · 12 units · 8 work orders · 5 loads — pre-loaded demo data</p>
        </div>
      </div>

      {/* Slide 5 — ROI */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-10">
        <div className="bg-amber-500 text-slate-900 inline-block px-6 py-2 rounded-full font-black text-sm mb-6">RESULTS</div>
        <h2 className="text-3xl font-black text-slate-900 mb-6">What FleetCo Delivers</h2>
        <div className="grid grid-cols-2 gap-4">
          {stats.map(([num, title, sub], i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-amber-500">{num}</div>
              <div className="font-bold text-slate-900 text-sm mt-1">{title}</div>
              <div className="text-xs text-slate-500 mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide 6 — Who we serve */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-10">
        <div className="bg-amber-500 text-slate-900 inline-block px-6 py-2 rounded-full font-black text-sm mb-6">WHO WE SERVE</div>
        <h2 className="text-3xl font-black text-slate-900 mb-6">Built for Real Fleet Operators</h2>
        <div className="grid grid-cols-3 gap-4">
          {segments.map(([title, size, benefit]) => (
            <div key={title} className="bg-slate-900 text-white p-5 rounded-xl">
              <div className="font-bold text-amber-400 text-sm">{title}</div>
              <div className="text-white text-xs mt-2 font-semibold">{size}</div>
              <div className="text-slate-400 text-xs mt-3">{benefit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide 7 — Pricing */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-10">
        <div className="bg-amber-500 text-slate-900 inline-block px-6 py-2 rounded-full font-black text-sm mb-6">PLANS & PRICING</div>
        <h2 className="text-3xl font-black text-slate-900 mb-6">Simple Plans. Fast Onboarding.</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {BRAND.pricing.map((plan) => (
            <div key={plan.name} className={`bg-white p-5 rounded-xl border-2 ${plan.highlighted ? 'border-amber-500' : 'border-slate-200'}`}>
              <div className="font-black text-slate-900">{plan.name}</div>
              <div className="text-2xl font-black text-amber-500 mt-2">{plan.price}</div>
              <div className="text-xs font-bold text-slate-700 mt-2">{plan.fleetSize}</div>
              <div className="text-xs text-slate-500 mt-2">{plan.detail}</div>
            </div>
          ))}
        </div>
        <p className="text-sm font-bold text-slate-900">Schedule a free demo: {BRAND.phone} · {BRAND.website}</p>
      </div>

      {/* Slide 8 — Contact */}
      <div className="bg-slate-900 text-white p-10 rounded-2xl text-center">
        <div className="bg-amber-500 p-4 rounded-full inline-flex mb-6"><Bot className="w-10 h-10 text-slate-900" /></div>
        <h2 className="text-3xl font-black">Let&apos;s Move Your Fleet Forward</h2>
        <p className="text-slate-400 mt-3">Schedule a demo · Request a custom quote · Tour the live portal</p>
        <div className="text-amber-400 font-black text-xl mt-6">{BRAND.website}</div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-amber-400" /> {BRAND.email}</span>
          <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-400" /> {BRAND.phone}</span>
        </div>
        <div className="mt-8 space-y-3 text-sm">
          <div><span className="font-bold">{BRAND.owner1.name}</span><span className="block text-slate-500 text-xs">{BRAND.owner1.title}</span></div>
          <div><span className="font-bold">{BRAND.owner2.name}</span><span className="block text-slate-500 text-xs">{BRAND.owner2.title}</span></div>
        </div>
        <p className="text-slate-500 text-xs mt-6">{BRAND.company}</p>
      </div>
    </div>
  );
}

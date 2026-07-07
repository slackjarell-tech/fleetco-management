import React from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Shield, TrendingUp, Users, DollarSign, BarChart2, CheckCircle,
  MapPin, Wrench, FileText, Fuel, Package, ArrowRight, Globe, Target,
  Layers, Lock, Zap, Star
} from 'lucide-react';

const PLATFORM_MODULES = [
  { icon: Truck, title: 'Load Board', desc: 'Assign, track, and manage freight loads from pickup to delivery with real-time status, driver/vehicle linking, and weight scale reporting.' },
  { icon: Shield, title: 'HOS / ELD Logs', desc: 'Full FMCSA-compliant Hours of Service logging with duty segments, violation detection, pre/post-trip DVIRs, and digital driver signatures.' },
  { icon: Wrench, title: 'Maintenance & Work Orders', desc: 'Preventive maintenance scheduling, full work order lifecycle management, diagnostic code tracking, and parts inventory control.' },
  { icon: FileText, title: 'Invoicing & Billing', desc: 'Generate and manage labor, parts, and fuel invoices linked to specific vehicles and customers with draft-to-paid status tracking.' },
  { icon: Fuel, title: 'Fuel Audits', desc: 'Log every fill-up, compute per-vehicle MPG, track spend by driver or unit, and surface anomalies that indicate waste or fraud.' },
  { icon: Users, title: 'Driver Management', desc: 'Full driver profiles with performance stats, background/MVR screening records, payroll integration, and two-way in-app messaging.' },
  { icon: DollarSign, title: 'Fleet P&L', desc: 'Real-time profit and loss per unit — revenue vs. fuel, repair, and depreciation costs — giving owners true asset-level ROI visibility.' },
  { icon: Package, title: 'Final Mile Delivery', desc: 'Route builder and command tower for last-mile operations: stop sequencing, POD capture, proof-of-delivery photos and signatures.' },
  { icon: BarChart2, title: 'Executive Dashboard', desc: 'Enterprise-level analytics consolidating fleet-wide KPIs, payroll summaries, compliance status, and net savings into a single command view.' },
  { icon: Globe, title: 'Vendor & Contract Management', desc: 'Centralized vendor database with contracts, labor rates, parts discounts, GPS coordinates, and certified weigh scale tracking.' },
];

const PILLARS = [
  {
    icon: Target,
    title: 'Our Mission',
    color: 'bg-amber-500',
    text: 'FleetCo Management LLC exists to level the playing field for independent owner-operators and small fleet owners. We provide the same enterprise-grade operations technology that large carriers pay hundreds of thousands for — packaged into an affordable, all-in-one platform.',
  },
  {
    icon: TrendingUp,
    title: 'Market Opportunity',
    color: 'bg-emerald-500',
    text: 'The U.S. trucking industry moves over $900B in freight annually. More than 500,000 small fleets (1–20 trucks) lack access to integrated management software. This fragmented, underserved segment is our primary target — and the total addressable market exceeds $4B.',
  },
  {
    icon: Layers,
    title: 'Competitive Advantage',
    color: 'bg-blue-500',
    text: 'Unlike legacy TMS platforms with 6-month onboarding cycles and six-figure contracts, FleetCo is built for speed. Our platform covers compliance, maintenance, dispatch, payroll, and P&L in one login — with no technical knowledge required to operate.',
  },
  {
    icon: DollarSign,
    title: 'Revenue Model',
    color: 'bg-purple-500',
    text: 'Recurring SaaS subscriptions scaled by fleet size ($299–$999/mo), supplemented by onboarding services, premium analytics add-ons, and a future marketplace for parts sourcing and vendor contracts — creating multiple compounding revenue streams.',
  },
];

const STATS = [
  { value: '10+', label: 'Platform Modules', sub: 'Fully integrated, one login' },
  { value: '$2K+', label: 'Avg Saved Per Unit/Year', sub: 'Fuel, parts, and compliance savings' },
  { value: '500K+', label: 'Target Addressable Fleets', sub: 'U.S. small fleet operators' },
  { value: '24/7', label: 'Support & Monitoring', sub: 'Breakdown & compliance alerts' },
];

export default function InvestorOverview() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-body">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-1.5 rounded">
              <Truck className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">FLEETCO</span>
              <span className="block text-amber-400 text-xs font-medium tracking-widest">MANAGEMENT LLC</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-amber-400 text-sm font-medium transition-colors">← Back to Home</Link>
            <Link to="/portal" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm px-4 py-2 rounded transition-colors">
              Client Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 opacity-40" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-5 py-2 mb-8">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">Company Overview & Investor Brief — 2025</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
            The Operating System<br />
            <span className="text-amber-400">for American Trucking</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            FleetCo Management LLC is a full-stack fleet operations platform serving independent owner-operators
            and small commercial fleets across the United States. We replace spreadsheets, paper logs, and
            disconnected tools with one intelligent, compliance-first platform.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-amber-500">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-black text-slate-900">{s.value}</div>
              <div className="text-slate-900 font-bold text-sm mt-1">{s.label}</div>
              <div className="text-slate-700 text-xs mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission / Pillars */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-amber-400 text-sm font-bold tracking-widest uppercase mb-3">Why We Exist</div>
            <h2 className="text-3xl sm:text-4xl font-black">Built for the Operators Who Keep America Moving</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {PILLARS.map(p => (
              <div key={p.title} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-7">
                <div className={`${p.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                  <p.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-black text-white mb-3">{p.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="py-20 px-4 sm:px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-amber-400 text-sm font-bold tracking-widest uppercase mb-3">Platform Modules</div>
            <h2 className="text-3xl sm:text-4xl font-black">Everything a Fleet Needs, Under One Roof</h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
              From the moment a driver starts their pre-trip inspection to the moment an invoice is paid, FleetCo
              manages every touchpoint of the fleet operations lifecycle.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_MODULES.map(m => (
              <div key={m.title} className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-6 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-500/10 group-hover:bg-amber-500/20 p-2 rounded-lg transition-colors">
                    <m.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-sm font-black text-white">{m.title}</h3>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology & Security */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-amber-400 text-sm font-bold tracking-widest uppercase mb-3">Technology</div>
            <h2 className="text-3xl sm:text-4xl font-black">Enterprise Infrastructure. Operator Simplicity.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: 'Role-Based Security', desc: 'Granular access control for admins, managers, drivers, customers, and executives — every user sees only what they need.' },
              { icon: Zap, title: 'Real-Time Operations', desc: 'Live messaging, instant load updates, real-time subscription feeds, and automated compliance alerts across the entire fleet.' },
              { icon: Globe, title: 'Cloud-Native Platform', desc: 'Fully hosted, zero-infrastructure SaaS with mobile-responsive design, digital signatures, document uploads, and GPS-integrated mapping.' },
            ].map(t => (
              <div key={t.title} className="text-center">
                <div className="bg-amber-500 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <t.icon className="w-6 h-6 text-slate-900" />
                </div>
                <h3 className="font-black text-white mb-2">{t.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Coverage */}
      <section className="py-16 px-4 sm:px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-12">
            <div className="grid sm:grid-cols-2 gap-10 items-center">
              <div>
                <div className="text-amber-400 text-sm font-bold tracking-widest uppercase mb-3">Compliance-First Design</div>
                <h2 className="text-2xl sm:text-3xl font-black mb-4">Built Around FMCSA Regulations</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Every module is designed with federal trucking compliance in mind. From 49 CFR §395.8 HOS logging
                  to §396.11 DVIR requirements, FleetCo keeps operators legal and audit-ready without requiring
                  regulatory expertise.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  'FMCSA Hours of Service (HOS) — 49 CFR Part 395',
                  'Driver Vehicle Inspection Reports (DVIR) — §396.11',
                  'Electronic Logging Device (ELD) Standards',
                  'DOT Annual Inspection Tracking',
                  'Drug & Background Screening Records',
                  'IFTA / IRP Registration & Permit Management',
                  'Commercial Driver License (CDL) Compliance',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-amber-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Interested in Partnering with FleetCo?</h2>
          <p className="text-slate-800 mb-8 leading-relaxed">
            Whether you're an owner-operator looking for a better way to run your fleet, or an investor seeking
            exposure to the infrastructure of American trucking — we'd love to connect.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/#contact"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              Get in Touch <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/"
              className="border-2 border-slate-900/30 hover:border-slate-900 text-slate-900 font-bold px-8 py-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              Back to Home
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-700 text-sm">
            <MapPin className="w-4 h-4" />
            FleetCo Management LLC — Dallas, TX
          </div>
        </div>
      </section>
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Package, Smartphone, ArrowRight } from 'lucide-react';

const FUNNELS = [
  {
    icon: Monitor,
    title: 'Fleet Software',
    desc: 'Dispatch, drivers, maintenance, fuel, payroll, and compliance — one portal from $35/unit/mo.',
    cta: 'Explore for Fleets',
    to: '/for-fleets',
    accent: 'bg-white border-slate-200 text-slate-900',
    iconBg: 'bg-amber-500/10 text-amber-600',
  },
  {
    icon: Package,
    title: 'Load Board',
    desc: 'Brokers post loads free. Carriers book freight. Brokers pay 3.5% and carriers pay 1.5% only when freight moves.',
    cta: 'Load Board',
    to: '/load-board',
    accent: 'bg-slate-900 border-slate-800 text-white',
    iconBg: 'bg-amber-500/20 text-amber-400',
  },
  {
    icon: Smartphone,
    title: 'Driver App',
    desc: 'Clock-in, routes, fuel logs, DVIR, dashcam, and messaging — synced to your portal in real time.',
    cta: 'Driver App',
    to: '/driver-app',
    accent: 'bg-emerald-50 border-emerald-200 text-slate-900',
    iconBg: 'bg-emerald-500/20 text-emerald-700',
  },
];

export default function FunnelSection() {
  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-amber-600 font-bold text-sm tracking-widest uppercase">Built for trucking</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Software, load board, and driver tools</h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-sm sm:text-base">
            FleetCo is one platform — pick the path that matches how you run freight today.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FUNNELS.map(({ icon: Icon, title, desc, cta, to, accent, iconBg }) => (
            <div key={title} className={`rounded-2xl border p-8 shadow-sm hover:shadow-md transition-shadow ${accent}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black mb-2">{title}</h3>
              <p className={`text-sm leading-relaxed mb-6 ${accent.includes('text-white') ? 'text-slate-400' : 'text-slate-600'}`}>{desc}</p>
              <Link
                to={to}
                className={`inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors ${
                  accent.includes('bg-slate-900') ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                }`}
              >
                {cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

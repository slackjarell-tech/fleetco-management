import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'James H.',
    role: 'Fleet Manager — 6 trucks, dry van',
    quote: 'We moved dispatch, DVIR, fuel logs, and driver payroll off spreadsheets in one weekend. The load board let us book backhaul freight without calling a broker.',
    stars: 5,
  },
  {
    name: 'Keisha R.',
    role: 'Owner Operator — OTR Driver',
    quote: 'Owner-operator mode is a game changer — I dispatch from the portal and clock in on the driver app with the same login. BOL downloads straight to my phone.',
    stars: 5,
  },
  {
    name: 'David M.',
    role: 'Operations — 12-unit reefer fleet',
    quote: 'Maintenance work orders and fuel audits alone paid for the subscription. My dispatchers finally work from one screen instead of three tabs and a shared Google Sheet.',
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">Trusted by drivers & fleet managers</h2>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
            Real outcomes from carriers running on the FleetCo platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-slate-800 rounded-2xl p-7 border border-slate-700 flex flex-col">
              <Quote className="w-8 h-8 text-amber-500 mb-4 opacity-60" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="text-white font-bold text-sm">{t.name}</div>
                <div className="text-slate-400 text-xs">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

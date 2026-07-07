import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Marcus T.',
    role: 'Owner Operator — Dallas, TX',
    quote: 'FleetCo saved me thousands on parts for my Freightliner. They found an NBO part in 24 hours that I couldn\'t find anywhere. Kept me on the road instead of sitting in a shop for 3 weeks.',
    stars: 5,
  },
  {
    name: 'Darnell W.',
    role: 'Small Fleet Owner — 4 Trucks',
    quote: 'I was drowning in paperwork and repair bills. FleetCo took over everything — maintenance scheduling, fuel tracking, tax docs. My cost per mile dropped significantly in the first quarter.',
    stars: 5,
  },
  {
    name: 'Keisha R.',
    role: 'Owner Operator — OTR Driver',
    quote: 'When my truck broke down in the middle of nowhere, I called FleetCo. They had a tow and a repair shop coordinated within the hour. That kind of support is priceless when you\'re running solo.',
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">Trusted by Drivers Nationwide</h2>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
            Real stories from owner operators who rely on FleetCo to keep their business moving.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-slate-800 rounded-2xl p-7 border border-slate-700 flex flex-col">
              <Quote className="w-8 h-8 text-amber-500 mb-4 opacity-60" />
              <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>
              <div>
                <div className="flex mb-2">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <div className="text-white font-bold text-sm">{t.name}</div>
                <div className="text-slate-500 text-xs mt-0.5">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
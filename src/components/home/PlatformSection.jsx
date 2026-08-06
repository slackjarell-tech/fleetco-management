import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PLATFORM_FEATURES } from '@/lib/marketingContent';

export default function PlatformSection() {
  const highlights = PLATFORM_FEATURES.slice(0, 8);

  return (
    <section id="platform" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">The Platform</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">Everything Built In — Not Bolted On</h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
            One portal for dispatch, drivers, maintenance, compliance, and finance. No juggling five different apps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {highlights.map(({ icon: Icon, title, desc, tag }) => (
            <div
              key={title}
              className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-amber-300 hover:shadow-md transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{tag}</span>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center my-3">
                <Icon className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-black text-slate-900 text-sm mb-1">{title}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 text-amber-600 font-bold hover:text-amber-500 transition-colors"
          >
            See all platform features <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

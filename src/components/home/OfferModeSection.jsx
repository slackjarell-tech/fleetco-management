import React from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Headphones, ArrowRight } from 'lucide-react';

export default function OfferModeSection() {
  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-amber-600 font-bold text-sm tracking-widest uppercase">Two Ways to Work With FleetCo</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Software, Managed Services — or Both</h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-sm sm:text-base">
            Run your fleet on our platform yourself, or let our team handle parts, fuel, repairs, and compliance for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Monitor className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">FleetCo Platform</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Full portal + driver app: fleet map, loads, payroll, YMS, compliance, and AI assistant. You run operations; we provide the tools.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/features"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Explore Features <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 text-amber-700 font-bold text-sm hover:underline">
                See pricing
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-sm hover:shadow-md transition-shadow text-white">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
              <Headphones className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-black mb-2">Managed Fleet Services</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Dedicated fleet manager, parts sourcing, fuel optimization, towing coordination, safety support, and tax documentation — we handle the back office.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Book a Free Demo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

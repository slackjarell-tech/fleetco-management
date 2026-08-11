import React from 'react';
import { Link } from 'react-router-dom';
import MarketingShell, { MarketingHero } from '@/components/marketing/public/MarketingShell';
import { PLATFORM_FEATURES } from '@/lib/marketingContent';
import { ELD_DISCLAIMER } from '@/lib/marketing/compareData';
import PricingRoiCalculator from '@/components/home/PricingRoiCalculator';
import { ArrowRight, AlertCircle } from 'lucide-react';

export default function ForFleetsPage() {
  const highlights = PLATFORM_FEATURES.slice(0, 6);

  return (
    <MarketingShell
      title="Fleet Software for Small Carriers"
      description="FleetCo portal for owner-operators and small fleets — dispatch, drivers, maintenance, fuel, payroll, YMS, and compliance from $299/mo."
      path="/for-fleets"
    >
      <MarketingHero
        badge="FleetCo Platform"
        title="Run Your Fleet in One Portal"
        subtitle="Built for owner-operators and fleets with 1–15 trucks. Replace spreadsheets with dispatch, driver app, maintenance, fuel, payroll, and compliance."
      >
        <Link to="/start-trial" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg text-sm">
          Start free trial
        </Link>
        <Link to="/pricing" className="border border-slate-600 hover:border-amber-400 text-white font-bold px-6 py-3 rounded-lg text-sm">
          See pricing
        </Link>
        <Link to="/compare" className="border border-slate-600 hover:border-amber-400 text-white font-bold px-6 py-3 rounded-lg text-sm">
          Compare alternatives
        </Link>
      </MarketingHero>

      <section className="py-16 max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-6">What you get</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {highlights.map(({ title, desc }) => (
              <div key={title} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="font-bold text-slate-900 text-sm">{title}</div>
                <p className="text-xs text-slate-600 mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <Link to="/features" className="inline-flex items-center gap-2 mt-6 text-amber-600 font-bold text-sm hover:underline">
            All features <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <PricingRoiCalculator />
      </section>

      <section className="py-12 bg-amber-50 border-y border-amber-100">
        <div className="max-w-3xl mx-auto px-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900"><strong>ELD & telematics:</strong> {ELD_DISCLAIMER}</p>
        </div>
      </section>

      <section className="py-16 max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-xl font-black text-slate-900 mb-2">Case study: Midwest carrier</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          A 4-truck dry van operation moved dispatch, DVIR, fuel logs, and driver payroll off spreadsheets onto FleetCo.
          <strong className="text-slate-900"> Result: ~6 hours/week saved in admin</strong>, fuel audit caught $340/mo in misassigned receipts,
          and owner-operator mode let the fleet owner drive on the same login as dispatch.
        </p>
        <Link to="/contact" className="inline-block mt-6 text-amber-600 font-bold hover:underline">Book a walkthrough →</Link>
      </section>
    </MarketingShell>
  );
}

import React, { useMemo } from 'react';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import PageMeta from '@/components/home/PageMeta';
import MarketingAiWidget from '@/components/marketing/MarketingAiWidget';
import { PLATFORM_FEATURES } from '@/lib/marketingContent';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FeaturesPage() {
  const byTag = useMemo(() => {
    const map = {};
    for (const f of PLATFORM_FEATURES) {
      if (!map[f.tag]) map[f.tag] = [];
      map[f.tag].push(f);
    }
    return map;
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PageMeta
        title="Platform Features"
        description="Fleet map, load board, payroll, YMS, compliance, driver app, and AI assistant — explore everything in the FleetCo fleet management portal."
        path="/features"
      />
      <NavBar />
      <section className="pt-24 pb-12 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-4">FleetCo Platform Features</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Built for owner-operators and small fleets — dispatch, drivers, maintenance, compliance, and finance in one system.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link to="/pricing" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg text-sm">
              See Pricing
            </Link>
            <Link to="/contact" className="border border-slate-600 hover:border-amber-400 text-white font-bold px-6 py-3 rounded-lg text-sm">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {Object.entries(byTag).map(([tag, items]) => (
          <div key={tag}>
            <h2 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-200 pb-2">{tag}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-black text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="py-12 bg-amber-50 border-y border-amber-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-3">Ready to see it live?</h2>
          <p className="text-slate-600 mb-6">We'll show you the portal, driver app, and yard management in a 15-minute walkthrough.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg">
            Book a Free Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <FooterSection />
      <MarketingAiWidget />
    </div>
  );
}

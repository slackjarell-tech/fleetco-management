import React from 'react';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import PageMeta from '@/components/home/PageMeta';
import PricingSection from '@/components/home/PricingSection';
import PricingFaq from '@/components/home/PricingFaq';
import PricingRoiCalculator from '@/components/home/PricingRoiCalculator';
import MarketingAiWidget from '@/components/marketing/MarketingAiWidget';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageMeta
        title="Pricing"
        description="FleetCo Management plans from $299/mo for owner-operators and small fleets. Full portal access, driver app, and optional managed services."
        path="/pricing"
      />
      <NavBar />
      <section className="pt-24 pb-12 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl font-black mb-4">Simple, Transparent Pricing</h1>
          <p className="text-slate-400">
            Every plan includes the full FleetCo portal and driver app. Optional managed services scale with Growth and Enterprise.
          </p>
          <p className="mt-4 text-sm">
            <Link to="/contact" className="text-amber-400 font-bold hover:underline">Book a free demo</Link>
            {' '}before you subscribe — we'll walk you through the platform.
          </p>
        </div>
      </section>
      <PricingSection />
      <section className="py-12 bg-slate-50">
        <div className="max-w-xl mx-auto px-4">
          <PricingRoiCalculator />
        </div>
      </section>
      <PricingFaq />
      <FooterSection />
      <MarketingAiWidget />
    </div>
  );
}

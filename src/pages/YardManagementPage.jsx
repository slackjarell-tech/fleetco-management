import React from 'react';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import PageMeta from '@/components/home/PageMeta';
import YmsSection from '@/components/home/YmsSection';
import MarketingAiWidget from '@/components/marketing/MarketingAiWidget';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function YardManagementPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageMeta
        title="Yard Management System"
        description="Design your yard layout, assign trailer spots, and track occupancy live with FleetCo YMS — included in every FleetCo plan."
        path="/yard-management"
      />
      <NavBar />
      <section className="pt-24 pb-8 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl font-black mb-4">Yard Management System</h1>
          <p className="text-slate-400">
            A FleetCo differentiator — custom yard maps, live trailer placement, and spot tracking built into your portal.
          </p>
        </div>
      </section>
      <YmsSection />
      <section className="py-12 bg-amber-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-slate-700 mb-6">
            YMS is included with every subscription. Sign in to the client portal to configure your first yard.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/login" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg text-sm">
              Open Client Portal
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 border border-slate-300 text-slate-800 font-bold px-6 py-3 rounded-lg text-sm hover:bg-white">
              Book a Demo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      <FooterSection />
      <MarketingAiWidget />
    </div>
  );
}

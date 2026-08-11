import React from 'react';
import { Link } from 'react-router-dom';
import MarketingShell, { MarketingHero } from '@/components/marketing/public/MarketingShell';
import FreightBrokerSection from '@/components/home/FreightBrokerSection';
import { ArrowRight } from 'lucide-react';

export default function LoadBoardMarketingPage() {
  return (
    <MarketingShell
      title="Free Load Board for Freight Brokers"
      description="Post freight free on FleetCo. Attach electronic BOLs. Carriers book loads. Posters and carriers each pay 1.5% when freight moves."
      path="/load-board"
    >
      <MarketingHero
        badge="FleetCo Load Board"
        title="Post Loads Free. Carriers Book Direct."
        subtitle="Freight brokers and shippers list freight at no cost. FleetCo carriers find matching equipment and download BOLs — poster and carrier each pay 1.5% only when the load delivers."
      >
        <Link to="/broker-signup" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg text-sm inline-flex items-center gap-2">
          Create broker account <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/login" className="border border-slate-600 hover:border-amber-400 text-white font-bold px-6 py-3 rounded-lg text-sm">
          Carrier sign in
        </Link>
      </MarketingHero>
      <FreightBrokerSection />
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-3">Carriers: find freight that fits</h2>
          <p className="text-slate-600 mb-6">Browse posted loads in the portal, book freight matched to your equipment, and download the bill of lading to your driver app.</p>
          <Link to="/for-fleets" className="text-amber-600 font-bold hover:underline">Fleet software for carriers →</Link>
        </div>
      </section>
    </MarketingShell>
  );
}

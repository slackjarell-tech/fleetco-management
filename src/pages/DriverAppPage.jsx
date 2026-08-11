import React from 'react';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import PageMeta from '@/components/home/PageMeta';
import DriverAppDownload from '@/components/shared/DriverAppDownload';
import MarketingAiWidget from '@/components/marketing/MarketingAiWidget';
import { Link } from 'react-router-dom';
import { Smartphone, Clock, Camera, Route, Fuel, MessageSquare, ArrowRight, AlertCircle } from 'lucide-react';
import { ELD_DISCLAIMER } from '@/lib/marketing/compareData';
import { BRAND } from '@/lib/brand';

const DRIVER_FEATURES = [
  { icon: Clock, title: 'Time Clock', desc: 'Clock in and out from the field — hours sync to payroll in the portal.' },
  { icon: Camera, title: 'DVIR & Inspections', desc: 'Complete pre-trip and post-trip inspections with signatures and photos.' },
  { icon: Route, title: 'Routes & Navigation', desc: 'View assigned stops, turn-by-turn links, and mark deliveries complete.' },
  { icon: Fuel, title: 'Fuel Logs', desc: 'Log diesel purchases with receipts — fleet managers audit in the portal.' },
  { icon: MessageSquare, title: 'Fleet Messaging', desc: 'Message dispatch and managers without personal phone numbers.' },
];

export default function DriverAppPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageMeta
        title="FleetCo Driver App"
        description="Download FleetCo Driver for Android — clock-in, DVIR, routes, fuel logs, and messaging synced with your fleet portal."
        path="/driver-app"
      />
      <NavBar />
      <section className="pt-24 pb-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Smartphone className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-black mb-4">FleetCo Driver App</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
            A dedicated mobile app for drivers — synced with your FleetCo portal in real time.
          </p>
          <div className="flex justify-center">
            <DriverAppDownload variant="badges" />
          </div>
        </div>
      </section>

      {/* Sync flow */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-10">How It Syncs</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-center">
            {[
              { step: '1', label: 'Driver App', sub: 'Clock, DVIR, scans, fuel' },
              { step: '→', label: '', sub: '' },
              { step: '2', label: 'FleetCo Portal', sub: 'Map, payroll, compliance' },
              { step: '→', label: '', sub: '' },
              { step: '3', label: 'You', sub: 'One dashboard, full visibility' },
            ].map((item, i) =>
              item.step === '→' ? (
                <ArrowRight key={i} className="w-6 h-6 text-amber-500 hidden md:block flex-shrink-0" />
              ) : (
                <div key={item.step} className="bg-white border border-slate-200 rounded-xl px-6 py-5 min-w-[140px] shadow-sm">
                  <div className="text-amber-600 font-black text-lg">{item.step}</div>
                  <div className="font-black text-slate-900">{item.label}</div>
                  <div className="text-slate-500 text-xs mt-1">{item.sub}</div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-black text-slate-900 text-center mb-10">Built for Drivers in the Field</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DRIVER_FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="border border-slate-200 rounded-xl p-5">
              <Icon className="w-8 h-8 text-amber-500 mb-3" />
              <h3 className="font-black text-slate-900 mb-1">{title}</h3>
              <p className="text-slate-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 bg-amber-50 border-y border-amber-100">
        <div className="max-w-3xl mx-auto px-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900"><strong>ELD note:</strong> {ELD_DISCLAIMER}</p>
        </div>
      </section>

      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-xl font-black mb-2">iOS Coming Soon</h2>
          <p className="text-slate-400 text-sm mb-4">
            Want early access when FleetCo Driver hits the App Store? Email us and we'll add you to the waitlist.
          </p>
          <a
            href={`mailto:${BRAND.email}?subject=FleetCo%20Driver%20iOS%20Waitlist`}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg text-sm"
          >
            Join iOS Waitlist
          </a>
          <p className="mt-6 text-sm">
            Already have portal access?{' '}
            <Link to="/login?app=driver" className="text-amber-400 font-bold hover:underline">Sign in as a driver</Link>
          </p>
        </div>
      </section>

      <FooterSection />
      <MarketingAiWidget />
    </div>
  );
}

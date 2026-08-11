import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ArrowRight,
  Truck,
  Building2,
  Percent,
  CheckCircle2,
  MapPin,
  BadgeDollarSign,
} from 'lucide-react';
import { LOAD_BOARD_MARKETPLACE } from '@/lib/marketingContent';

export default function FreightBrokerSection() {
  const { platformFeePercent, equipmentExamples, brokerBenefits, feeNote } = LOAD_BOARD_MARKETPLACE;

  return (
    <section id="load-board" className="py-20 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            <Package className="w-3.5 h-3.5" />
            For Freight Brokers & Shippers
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-2 leading-tight">
            Post Loads Free.
            <span className="block text-amber-400 mt-1">Pay {platformFeePercent}% Only When Freight Moves.</span>
          </h2>
          <p className="text-slate-400 mt-4 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed">
            {LOAD_BOARD_MARKETPLACE.description}
          </p>
        </div>

        {/* Pricing highlight */}
        <div className="grid md:grid-cols-3 gap-5 mb-12 max-w-5xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <BadgeDollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-3xl font-black text-white">$0</div>
            <div className="text-sm font-bold text-slate-300 mt-1">To Post Loads</div>
            <p className="text-xs text-slate-500 mt-2">Unlimited listings for brokers and shippers</p>
          </div>
          <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-6 text-center md:scale-105 shadow-lg shadow-amber-500/10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/30 flex items-center justify-center mx-auto mb-4">
              <Percent className="w-6 h-6 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400">{platformFeePercent}%</div>
            <div className="text-sm font-bold text-white mt-1">Platform Fee</div>
            <p className="text-xs text-slate-400 mt-2">On total load revenue when freight is hauled</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Truck className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-lg font-black text-white leading-snug">Split Between Poster & Driver</div>
            <div className="text-sm font-bold text-slate-300 mt-1">Fair & Transparent</div>
            <p className="text-xs text-slate-500 mt-2">Fee shared by load poster and carrier</p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm max-w-2xl mx-auto mb-12">{feeNote}</p>

        <div className="grid lg:grid-cols-2 gap-10 items-start mb-12">
          {/* How it works */}
          <div>
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              How It Works for Brokers
            </h3>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Create a broker account', desc: 'Sign up for FleetCo broker access — no subscription required to post loads.' },
                { step: '2', title: 'Post your freight', desc: 'Enter lane, rate, dates, and required equipment (dry van, reefer, box truck, power only, and more).' },
                { step: '3', title: 'Carriers book & haul', desc: 'Owner-operators and fleet drivers on FleetCo see matched loads and book freight that fits their equipment.' },
                { step: '4', title: 'Pay only on completion', desc: `FleetCo deducts ${platformFeePercent}% from total load revenue — split between you and the carrier. No fee to list.` },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-slate-900 font-black text-sm flex items-center justify-center">
                    {step}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{title}</div>
                    <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits + equipment */}
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {brokerBenefits.map(({ title, desc }) => (
                <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 mb-2" />
                  <div className="font-bold text-white text-sm">{title}</div>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">
                <MapPin className="w-3.5 h-3.5" />
                Supported Equipment Types
              </div>
              <div className="flex flex-wrap gap-2">
                {equipmentExamples.map((eq) => (
                  <span key={eq} className="text-xs bg-slate-700/80 text-slate-300 px-3 py-1.5 rounded-full border border-slate-600">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-8 sm:p-10 text-center">
          <h3 className="text-2xl font-black text-white mb-2">Ready to Post Loads on FleetCo?</h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">
            Broker accounts are opening now. Contact us to get early access to the FleetCo Load Board — post freight free and keep more of every load.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-3.5 rounded-lg transition-colors"
            >
              Request Broker Access <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 border border-slate-600 hover:border-amber-400 text-white hover:text-amber-300 font-bold px-8 py-3.5 rounded-lg transition-colors"
            >
              Broker Portal Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

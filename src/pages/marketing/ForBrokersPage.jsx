import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MarketingShell, { MarketingHero } from '@/components/marketing/public/MarketingShell';
import { LOAD_BOARD_MARKETPLACE } from '@/lib/marketingContent';
import { LOAD_BOARD_TRANSACTION_FEE_PERCENT } from '@/lib/loadBoardFeeDisclosure';
import { ArrowRight, CheckCircle2, DollarSign, Package } from 'lucide-react';

export default function ForBrokersPage() {
  return (
    <MarketingShell
      title="Freight Broker Access"
      description="Create a free FleetCo broker account. Post loads, attach BOLs, and pay only the 3.5% platform fee when freight moves — no monthly subscription."
      path="/for-brokers"
    >
      <MarketingHero
        badge="Freight Brokers"
        title="Post Loads Free — No Monthly Fee"
        subtitle={`Create your broker account with full company and FMCSA details. Pay ${LOAD_BOARD_TRANSACTION_FEE_PERCENT}% on load value only when freight moves. A credit card stays on file for transaction fees.`}
        dark
      >
        <Link
          to="/broker-signup"
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-3 rounded-lg text-sm inline-flex items-center gap-2"
        >
          Create broker account <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/login" className="border border-slate-600 hover:border-amber-400 text-white font-bold px-8 py-3 rounded-lg text-sm">
          Sign in
        </Link>
      </MarketingHero>

      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
            <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <div className="text-2xl font-black text-slate-900">$0/mo</div>
            <p className="text-sm text-slate-600 mt-1">No fleet subscription required for brokers</p>
          </div>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center">
            <Package className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <div className="text-2xl font-black text-slate-900">{LOAD_BOARD_TRANSACTION_FEE_PERCENT}%</div>
            <p className="text-sm text-slate-600 mt-1">Platform fee when a load delivers</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <div className="text-lg font-black text-slate-900">Full business profile</div>
            <p className="text-sm text-slate-600 mt-1">Company, MC/DOT, address &amp; equipment required at signup</p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-sm max-w-2xl mx-auto mb-10">{LOAD_BOARD_MARKETPLACE.feeNote}</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {LOAD_BOARD_MARKETPLACE.brokerBenefits.map(({ title, desc }) => (
            <div key={title} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="font-bold text-slate-900 text-sm">{title}</div>
              <p className="text-xs text-slate-600 mt-1">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/broker-signup"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-3 rounded-lg"
          >
            Create broker account <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-slate-500 mt-4">
            Need help? <Link to="/contact" className="text-amber-600 font-bold hover:underline">Contact FleetCo</Link>
            {' · '}
            <Link to="/load-board" className="text-amber-600 font-bold hover:underline">Load board overview</Link>
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}

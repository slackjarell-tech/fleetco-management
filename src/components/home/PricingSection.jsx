import React, { useState } from 'react';
import { CheckCircle, Loader2, Star } from 'lucide-react';
import { api } from '@/api/apiClient';
import {
  PRICE_PER_UNIT_MONTHLY,
  YEARLY_DISCOUNT_PERCENT,
  DEFAULT_SUBSCRIPTION_PLAN,
  pricingSummary,
  formatPrice,
} from '@/lib/subscriptions';
import LoadBoardFeeAcknowledgment from '@/components/loadboard/LoadBoardFeeAcknowledgment';

const FEATURES = [
  'Full FleetCo portal access',
  'Fleet map & vehicle registry',
  'Driver mobile app (per unit)',
  'Maintenance, fuel & compliance',
  'Load board marketplace',
  'Payroll & time clock',
  'Email & phone support',
];

const enterprisePlan = {
  name: 'Enterprise',
  description: 'Volume fleets — custom onboarding & integrations',
  fleetSize: '50+ units or multi-location',
  features: [
    'Everything in Per Unit pricing',
    'Telematics integrations',
    'Custom roles & permissions',
    'Dedicated onboarding',
    'API & export options',
    'Dedicated account team',
  ],
};

export default function PricingSection() {
  const [loading, setLoading] = useState(false);
  const [billingTerm, setBillingTerm] = useState('monthly');
  const [units, setUnits] = useState(5);
  const [feeAcknowledged, setFeeAcknowledged] = useState(false);

  const summary = pricingSummary(units, billingTerm);

  const handleCheckout = async () => {
    if (window.self !== window.top) {
      alert('Payment checkout is only available from the published app, not the preview. Please open the live site to subscribe.');
      return;
    }
    if (!feeAcknowledged) {
      alert('Please agree to the load board platform fee and credit card on file terms before subscribing.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.functions.invoke('createCheckout', {
        planName: DEFAULT_SUBSCRIPTION_PLAN,
        billingTerm,
        unitCount: units,
        load_board_fee_acknowledged: true,
      });
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Something went wrong. Please try again or contact us directly.');
    }
    setLoading(false);
  };

  const handleEnterprise = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
      || (window.location.href = '/contact');
  };

  return (
    <section id="pricing" className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">Simple, Per-Unit Pricing</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            {formatPrice(PRICE_PER_UNIT_MONTHLY)} per fleet unit per month. No tiers. Cancel anytime.
            Save {YEARLY_DISCOUNT_PERCENT}% when you pay annually.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="bg-amber-500 rounded-xl px-8 py-4 text-center shadow-lg shadow-amber-500/20">
            <div className="text-3xl font-black text-slate-900">
              {formatPrice(PRICE_PER_UNIT_MONTHLY)}<span className="text-base font-bold text-slate-800">/unit/mo</span>
            </div>
            <div className="text-xs text-slate-800 font-bold mt-1">Every feature included</div>
          </div>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-slate-800 border border-slate-700 rounded-full p-1">
            <button
              type="button"
              onClick={() => setBillingTerm('monthly')}
              className={`px-5 py-2 text-sm font-bold rounded-full transition-all ${
                billingTerm === 'monthly' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingTerm('yearly')}
              className={`px-5 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
                billingTerm === 'yearly' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                billingTerm === 'yearly' ? 'bg-slate-900 text-amber-400' : 'bg-emerald-600 text-white'
              }`}>
                SAVE {YEARLY_DISCOUNT_PERCENT}%
              </span>
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-10">
          <LoadBoardFeeAcknowledgment
            variant="dark"
            checked={feeAcknowledged}
            onChange={setFeeAcknowledged}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="relative rounded-2xl p-8 flex flex-col bg-amber-500 text-slate-900 shadow-2xl shadow-amber-500/30">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-400 text-xs font-bold px-4 py-1.5 rounded-full border border-amber-500 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" /> FleetCo Portal
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-black mb-1">Per Unit</h3>
              <p className="text-sm mb-4 text-slate-700">Scale up or down as your fleet grows — one price per truck, trailer, or power unit.</p>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-800 mb-2">
                How many units?
              </label>
              <input
                type="range"
                min={1}
                max={50}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full accent-slate-900 mb-2"
              />
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold">{units} unit{units !== 1 ? 's' : ''}</span>
                <div className="text-right">
                  <div className="text-3xl font-black">
                    {formatPrice(billingTerm === 'yearly' ? summary.yearlyMonthlyEquivalent : summary.monthlyTotal)}
                    <span className="text-sm font-bold text-slate-700">/mo</span>
                  </div>
                  <span className="text-xs text-slate-700">
                    {billingTerm === 'yearly'
                      ? `${formatPrice(summary.yearlyTotal)}/yr billed annually`
                      : `${formatPrice(summary.yearlyTotal)}/yr if paid annually · save ${YEARLY_DISCOUNT_PERCENT}%`}
                  </span>
                </div>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-900" />
                  <span className="text-slate-800">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleCheckout}
              disabled={loading || !feeAcknowledged}
              className="w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                'Get Started Now'
              )}
            </button>
          </div>

          <div className="rounded-2xl p-8 flex flex-col bg-slate-800 text-white border border-slate-700">
            <div className="mb-6">
              <h3 className="text-xl font-black mb-1">{enterprisePlan.name}</h3>
              <p className="text-sm mb-4 text-slate-400">{enterprisePlan.description}</p>
              <span className="text-2xl font-black">Custom quote</span>
              <div className="text-xs mt-1 font-semibold text-amber-400">{enterprisePlan.fleetSize}</div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {enterprisePlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                  <span className="text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleEnterprise}
              className="w-full font-bold py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900"
            >
              Request a Quote
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Need help sizing your fleet?{' '}
          <a href="/contact" className="text-amber-400 underline hover:text-amber-300">Contact us</a>
          {' '}or{' '}
          <a href="/contact" className="text-amber-400 underline hover:text-amber-300">book a free demo</a>.
        </p>
      </div>
    </section>
  );
}

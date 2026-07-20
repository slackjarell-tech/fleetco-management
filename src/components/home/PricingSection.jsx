import React, { useState } from 'react';
import { CheckCircle, Loader2, Star } from 'lucide-react';
import { api } from '@/api/apiClient';
import { SUBSCRIPTION_PLANS, subscriptionAmount, yearlyMonthlyEquivalent, formatPrice } from '@/lib/subscriptions';

const plans = [
  {
    name: 'Starter',
    priceId: 'price_1TeONARdSUUW62RaxuR5Q5RA',
    description: 'Perfect for owner operators and micro-fleets',
    fleetSize: '1–5 Vehicles',
    features: [
      'Dedicated Fleet Manager',
      'Parts sourcing & NBO locating',
      'Fuel price optimization',
      'Towing & repair coordination',
      'Monthly expense report',
      'Email & phone support',
    ],
    highlighted: false,
  },
  {
    name: 'Growth',
    priceId: 'price_1TeONARdSUUW62RaCIqcHhVB',
    description: 'Built for growing fleets that need more coverage',
    fleetSize: '6–15 Vehicles',
    features: [
      'Everything in Starter',
      'Safety Coordinator',
      'Preventive maintenance scheduling',
      'Fuel station relationship discounts',
      'Quarterly budget review',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    priceLabel: 'Custom pricing',
    priceSub: 'Quote on request',
    description: 'Full-service management tailored to your operation',
    fleetSize: '16+ Vehicles',
    features: [
      'Everything in Growth',
      'Telematics integration',
      'Full tax documentation per unit',
      'EV fleet transition planning',
      'Annual budget optimization',
      'Dedicated account team',
    ],
    highlighted: false,
    contactOnly: true,
  },
];

export default function PricingSection() {
  const [loading, setLoading] = useState(null);
  const [billingTerm, setBillingTerm] = useState('monthly');

  const getDisplayPrice = (planName) => {
    const monthly = SUBSCRIPTION_PLANS[planName]?.monthly;
    if (!monthly) return null;
    if (billingTerm === 'yearly') {
      return {
        main: formatPrice(yearlyMonthlyEquivalent(monthly)),
        suffix: '/mo',
        sub: `${formatPrice(subscriptionAmount(planName, 'yearly'))}/yr billed annually · save 10%`,
      };
    }
    return {
      main: formatPrice(monthly),
      suffix: '/mo',
      sub: `${formatPrice(subscriptionAmount(planName, 'yearly'))}/yr if paid annually · save 10%`,
    };
  };

  const handleCheckout = async (plan) => {
    if (plan.contactOnly) {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
        || (window.location.href = '/contact');
      return;
    }
    if (window.self !== window.top) {
      alert('Payment checkout is only available from the published app, not the preview. Please open the live site to subscribe.');
      return;
    }

    setLoading(plan.name);
    try {
      const response = await api.functions.invoke('createCheckout', {
        priceId: plan.priceId,
        planName: plan.name,
        billingTerm,
      });
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Something went wrong. Please try again or contact us directly.');
    }
    setLoading(null);
  };

  return (
    <section id="pricing" className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            No hidden fees. Cancel anytime. Pay monthly or save 10% with annual billing.
          </p>
          <p className="text-slate-500 text-sm mt-4 max-w-2xl mx-auto leading-relaxed">
            Every plan includes full access to the FleetCo portal — fleet tracking, fuel, maintenance, drivers, and reports.
            Optional hands-on managed services (parts sourcing, repair coordination, safety support) scale with Growth and Enterprise.
          </p>
        </div>

        {/* Headline prices */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-6 py-3 text-center">
            <div className="text-2xl font-black text-white">$299<span className="text-sm font-bold text-slate-400">/mo</span></div>
            <div className="text-xs text-amber-400 font-bold mt-1">Starter · 1–5 vehicles</div>
          </div>
          <div className="bg-amber-500 rounded-xl px-6 py-3 text-center shadow-lg shadow-amber-500/20">
            <div className="text-2xl font-black text-slate-900">$599<span className="text-sm font-bold text-slate-700">/mo</span></div>
            <div className="text-xs text-slate-800 font-bold mt-1">Growth · 6–15 vehicles</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-6 py-3 text-center">
            <div className="text-lg font-black text-white">Custom</div>
            <div className="text-xs text-slate-400 font-bold mt-1">Enterprise · 16+ vehicles</div>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-12">
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
                SAVE 10%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const pricing = getDisplayPrice(plan.name);
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.highlighted
                    ? 'bg-amber-500 text-slate-900 shadow-2xl shadow-amber-500/30 scale-105'
                    : 'bg-slate-800 text-white border border-slate-700'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-400 text-xs font-bold px-4 py-1.5 rounded-full border border-amber-500 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" /> Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-black mb-1 ${plan.highlighted ? 'text-slate-900' : 'text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.highlighted ? 'text-slate-700' : 'text-slate-400'}`}>
                    {plan.description}
                  </p>
                  <div className="flex flex-col">
                    {plan.priceLabel ? (
                      <>
                        <span className={`text-2xl sm:text-3xl font-black leading-tight ${plan.highlighted ? 'text-slate-900' : 'text-white'}`}>
                          {plan.priceLabel}
                        </span>
                        <span className={`text-sm mt-1 ${plan.highlighted ? 'text-slate-700' : 'text-slate-400'}`}>
                          {plan.priceSub}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-4xl font-black ${plan.highlighted ? 'text-slate-900' : 'text-white'}`}>
                            {pricing.main}
                          </span>
                          <span className={`text-sm ${plan.highlighted ? 'text-slate-700' : 'text-slate-400'}`}>{pricing.suffix}</span>
                        </div>
                        <span className={`text-xs mt-1 ${plan.highlighted ? 'text-slate-700' : 'text-slate-500'}`}>
                          {pricing.sub}
                        </span>
                      </>
                    )}
                  </div>
                  <div className={`text-xs mt-1 font-semibold ${plan.highlighted ? 'text-slate-800' : 'text-amber-400'}`}>
                    {plan.fleetSize}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-slate-900' : 'text-amber-400'}`} />
                      <span className={plan.highlighted ? 'text-slate-800' : 'text-slate-300'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={loading === plan.name}
                  className={`w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loading === plan.name ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : plan.contactOnly ? (
                    'Request a Quote'
                  ) : (
                    'Get Started Now'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Need a custom plan for a larger fleet? <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-amber-400 underline">Contact us</button> for enterprise pricing.
        </p>
      </div>
    </section>
  );
}

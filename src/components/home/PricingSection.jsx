import React, { useState } from 'react';
import { CheckCircle, Loader2, Star } from 'lucide-react';
import { api } from '@/api/apiClient';

const plans = [
  {
    name: 'Starter',
    price: 299,
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
    price: 599,
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
    price: 999,
    priceId: 'price_1TeONARdSUUW62RaQ3CjNFLl',
    description: 'Full-service management for established fleets',
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
  },
];

export default function PricingSection() {
  const [loading, setLoading] = useState(null);

  const handleCheckout = async (plan) => {
    // Check if running in iframe (embedded preview)
    if (window.self !== window.top) {
      alert('Payment checkout is only available from the published app, not the preview. Please open the live site to subscribe.');
      return;
    }

    setLoading(plan.name);
    try {
      const response = await api.functions.invoke('createCheckout', {
        priceId: plan.priceId,
        planName: plan.name,
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
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
        <div className="text-center mb-14">
          <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            No hidden fees. No long-term contracts. Cancel anytime. Start saving on fleet costs today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
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
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${plan.highlighted ? 'text-slate-900' : 'text-white'}`}>
                    ${plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? 'text-slate-700' : 'text-slate-400'}`}>/month</span>
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
                ) : (
                  'Get Started Now'
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Need a custom plan for a larger fleet? <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-amber-400 underline">Contact us</button> for enterprise pricing.
        </p>
      </div>
    </section>
  );
}
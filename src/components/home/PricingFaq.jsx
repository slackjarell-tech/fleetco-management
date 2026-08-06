import React from 'react';
import { PRICING_FAQ } from '@/lib/marketingContent';

export default function PricingFaq() {
  return (
    <section className="py-16 bg-slate-800 border-t border-slate-700">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-black text-white text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {PRICING_FAQ.map(({ q, a }) => (
            <details key={q} className="group bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
              <summary className="cursor-pointer px-5 py-4 font-bold text-white text-sm list-none flex justify-between items-center">
                {q}
                <span className="text-amber-400 text-lg group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-5 pb-4 text-slate-400 text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { HOME_IMAGES } from '@/lib/homeImages';

const advantages = [
  'All-in-one portal — dispatch, fleet, fuel, payroll, and compliance',
  'FleetCo Driver app synced to the same data in real time',
  'Load board for brokers and carriers — pay only when freight moves',
  'Owner-operator mode — run the business and drive on one login',
  'Yard management with live trailer placement maps',
  'Executive dashboards, scorecards, and exportable reports',
  'FleetCo AI assistant built into the portal',
  'Transparent pricing — $35/unit/mo, 5% off annual billing',
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={HOME_IMAGES.about}
                alt="Fleet trucks on highway"
                className="w-full h-80 lg:h-96 object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-amber-500 rounded-xl p-6 shadow-xl">
              <div className="text-slate-900 font-black text-3xl">2022</div>
              <div className="text-slate-900 font-medium text-sm">Founded in Dallas, TX</div>
            </div>
          </div>

          <div>
            <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">About FleetCo</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 mb-4">
              Fleet software built for independents
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              FleetCo Management LLC was founded in Dallas, Texas to give owner-operators and small fleets the same operational tools large carriers use — without the enterprise price tag or six-month implementation project.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Our mission is simple: <strong>one platform to run your fleet.</strong> Portal for the office, app for the road, load board when you need freight — subscription software you can start using this week.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {advantages.map((adv) => (
                <div key={adv} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 text-sm">{adv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

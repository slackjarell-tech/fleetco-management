import React from 'react';
import { CheckCircle } from 'lucide-react';

const advantages = [
  'Dedicated Fleet Manager & Safety Coordinator per account',
  'National back-order (NBO) parts network partnerships',
  'Fuel station relationships for maximized discounts',
  'Full invoice documentation for year-end tax preparation',
  'Telematics integration (Detroit Connect, Volvo Assist & more)',
  'Planning for EV fleet transitions',
  'Cost-per-unit tracking and annual budget optimization',
  'Virtual company — low overhead, savings passed to you',
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80"
                alt="Fleet trucks on highway"
                className="w-full h-80 lg:h-96 object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-amber-500 rounded-xl p-6 shadow-xl">
              <div className="text-slate-900 font-black text-3xl">2022</div>
              <div className="text-slate-900 font-medium text-sm">Founded in Dallas, TX</div>
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">About FleetCo</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 mb-4">
              Your Fleet's Trusted Partner
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              FleetCo Management LLC was founded in Dallas, Texas to serve owner operators and small fleet
              owners who can't afford the downtime or the rising cost of doing it alone. We handle the logistics
              so you can handle the road.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Our mission is simple: <strong>quality, low-cost service to keep your fleet running.</strong> 
              We partner with parts suppliers, repair shops, fuel stations, and towing companies nationwide 
              to make sure you're never stranded and never overpaying.
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
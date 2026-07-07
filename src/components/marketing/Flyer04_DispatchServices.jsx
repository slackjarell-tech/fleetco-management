import React from 'react';
import { Truck, Phone, Globe, MapPin, Navigation, Package, Clock, DollarSign } from 'lucide-react';

export default function Flyer04_DispatchServices() {
  return (
    <div className="max-w-[8.5in] mx-auto bg-white p-8 print:p-4" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-t-2xl print:rounded-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white p-2 rounded"><Package className="w-6 h-6 text-blue-700" /></div>
          <div>
            <div className="font-black text-2xl">FLEETCO</div>
            <div className="text-blue-200 text-xs tracking-widest">DISPATCH SERVICES</div>
          </div>
        </div>
        <h1 className="text-4xl font-black">More Loads. Better Rates. Less Headache.</h1>
        <p className="text-blue-100 text-lg mt-3">Let our dispatch team find and book the best-paying freight while you focus on driving.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 p-8 bg-slate-50">
        {[
          { icon: Package, title: 'Load Sourcing', desc: 'We find high-paying loads from trusted brokers and direct shippers daily' },
          { icon: DollarSign, title: 'Rate Negotiation', desc: 'Our team negotiates the best rates so you earn more per mile' },
          { icon: MapPin, title: 'Route Planning', desc: 'Optimized routes for fuel efficiency, HOS compliance, and timely delivery' },
          { icon: Navigation, title: '24/7 Tracking', desc: 'Real-time GPS tracking and driver support around the clock' },
          { icon: Clock, title: 'Paperwork Done', desc: 'BOLs, rate confirmations, invoices — we handle it all' },
          { icon: Phone, title: 'Dedicated Rep', desc: 'One point of contact who knows your equipment and preferences' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl p-4 border border-slate-200 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Icon className="w-6 h-6 text-blue-600" /></div>
            <div className="font-bold text-slate-900 text-sm">{title}</div>
            <div className="text-xs text-slate-500 mt-1">{desc}</div>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 text-white p-6 rounded-b-2xl print:rounded-none text-center">
        <p className="font-black text-xl">Ready to maximize your revenue?</p>
        <div className="flex items-center justify-center gap-6 mt-3">
          <span className="flex items-center gap-2 font-bold"><Phone className="w-5 h-5 text-amber-400" /> (360) 952-1249</span>
          <span className="flex items-center gap-2 font-bold"><Globe className="w-5 h-5 text-amber-400" /> fleetcomanagement.org</span>
        </div>
      </div>
    </div>
  );
}
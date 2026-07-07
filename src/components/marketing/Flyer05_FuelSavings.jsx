import React from 'react';
import { Fuel, TrendingDown, Phone, Globe, Truck, BarChart3, MapPin } from 'lucide-react';

export default function Flyer05_FuelSavings() {
  return (
    <div className="max-w-[8.5in] mx-auto bg-white p-8 print:p-4" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-gradient-to-br from-green-700 to-green-900 text-white p-8 rounded-t-2xl print:rounded-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white p-2 rounded"><Fuel className="w-6 h-6 text-green-700" /></div>
          <div>
            <div className="font-black text-2xl">FLEETCO</div>
            <div className="text-green-300 text-xs tracking-widest">FUEL PROGRAM</div>
          </div>
        </div>
        <h1 className="text-4xl font-black">Save Up to 30% on Fuel Costs</h1>
        <p className="text-green-100 text-lg mt-3">Our fuel optimization platform tracks every gallon, predicts prices, and finds the cheapest diesel along your route.</p>
        <div className="flex gap-3 mt-4 text-sm font-bold">
          <span className="bg-green-800 text-green-200 px-4 py-1 rounded-full">14-Day Price Predictions</span>
          <span className="bg-green-800 text-green-200 px-4 py-1 rounded-full">30-Min Refresh</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 p-8 bg-slate-50">
        {[
          { icon: MapPin, title: 'Live Station Map', value: '1,200+', desc: 'Truck stops across North America with real-time pricing' },
          { icon: TrendingDown, title: 'Avg. Savings', value: '$2,400/yr', desc: 'Per truck through optimized fuel purchasing' },
          { icon: BarChart3, title: 'AI Predictions', value: '14 Days', desc: 'Machine learning price forecasts to plan fill-ups' },
          { icon: Truck, title: 'Fleet Tracking', value: 'All Units', desc: 'Monitor fuel spend per vehicle with cost-per-mile' },
        ].map(({ icon: Icon, title, value, desc }) => (
          <div key={title} className="bg-white rounded-xl p-5 border border-slate-200 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><Icon className="w-6 h-6 text-green-600" /></div>
            <div className="text-2xl font-black text-green-600">{value}</div>
            <div className="font-bold text-slate-900 mt-1">{title}</div>
            <div className="text-xs text-slate-500 mt-1">{desc}</div>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 text-white p-5 text-center rounded-b-2xl print:rounded-none">
        <p className="font-black text-lg">Stop overpaying for fuel. Start saving today.</p>
        <div className="flex items-center justify-center gap-6 mt-2 text-sm font-bold">
          <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-400" /> (360) 952-1249</span>
          <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-amber-400" /> fleetcomanagement.org</span>
        </div>
      </div>
    </div>
  );
}
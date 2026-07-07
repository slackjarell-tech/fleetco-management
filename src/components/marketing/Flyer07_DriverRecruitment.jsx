import React from 'react';
import { Users, Shield, Award, Phone, Globe, Truck, Star, TrendingUp, DollarSign } from 'lucide-react';

export default function Flyer07_DriverRecruitment() {
  const benefits = [
    { icon: Truck, title: 'Top Equipment', desc: 'Late-model trucks assigned just to you' },
    { icon: DollarSign, title: 'Competitive Pay', desc: 'Per mile, percentage, or salary — you choose' },
    { icon: Shield, title: 'Full Benefits', desc: 'Health, dental, vision, and 401(k) matching' },
    { icon: TrendingUp, title: 'Growth Path', desc: 'Advancement to trainer, dispatcher, or fleet manager' },
  ];

  return (
    <div className="max-w-[8.5in] mx-auto bg-white p-8 print:p-4" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-t-2xl print:rounded-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-500 p-2 rounded"><Truck className="w-6 h-6 text-slate-900" /></div>
          <div><div className="font-black text-2xl">FLEETCO</div><div className="text-amber-400 text-xs tracking-widest">NOW HIRING</div></div>
        </div>
        <h1 className="text-4xl font-black">DRIVERS WANTED</h1>
        <p className="text-amber-400 text-2xl font-black mt-2">Join a Fleet That Respects You</p>
        <div className="flex gap-6 mt-4">
          {['Regional • OTR • Dedicated', 'Sign-On Bonus Available', 'Home Weekly'].map(t => (
            <span key={t} className="text-sm text-slate-300">{t}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 p-8 bg-slate-50">
        {benefits.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-amber-600" /></div>
            <div><div className="font-bold text-slate-900">{title}</div><div className="text-xs text-slate-500">{desc}</div></div>
          </div>
        ))}
        <div className="col-span-2 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-center">
          <div className="font-black text-slate-900 text-lg">Requirements</div>
          <div className="text-sm text-slate-600 mt-1">Valid CDL-A • 2+ Years Experience • Clean MVR • Pass Drug Screen</div>
        </div>
      </div>
      <div className="bg-slate-900 text-white p-5 text-center rounded-b-2xl print:rounded-none">
        <p className="font-black text-lg">Call or Apply Online Today</p>
        <div className="flex items-center justify-center gap-6 mt-2">
          <span className="flex items-center gap-2 font-bold"><Phone className="w-4 h-4 text-amber-400" /> (360) 952-1249</span>
          <span className="flex items-center gap-2 font-bold"><Globe className="w-4 h-4 text-amber-400" /> fleetcomanagement.org</span>
        </div>
      </div>
    </div>
  );
}
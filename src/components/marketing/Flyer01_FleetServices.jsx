import React from 'react';
import { Truck, Shield, Fuel, Wrench, Phone, Globe } from 'lucide-react';

export default function Flyer01_FleetServices() {
  return (
    <div className="max-w-[8.5in] mx-auto bg-white p-8 print:p-4" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-slate-900 text-white p-8 rounded-t-2xl print:rounded-none">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-500 p-2 rounded"><Truck className="w-6 h-6 text-slate-900" /></div>
          <div>
            <div className="font-black text-2xl">FLEETCO</div>
            <div className="text-amber-400 text-xs tracking-widest">MANAGEMENT</div>
          </div>
        </div>
        <h1 className="text-4xl font-black leading-tight">Your Fleet. Our Platform. Total Control.</h1>
        <p className="text-slate-300 text-lg mt-4">Full-service fleet management for carriers of all sizes. Dispatch, maintenance, fuel, compliance — all in one place.</p>
        <div className="flex gap-3 mt-6">
          {['24/7 Support', 'FMCSA Compliant', 'Real-Time Tracking'].map(t => (
            <span key={t} className="bg-slate-800 text-amber-400 px-4 py-2 rounded-full text-sm font-bold">{t}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 p-8 bg-slate-50 rounded-b-2xl print:rounded-none">
        {[
          { icon: Truck, title: 'Fleet Management', desc: 'Track every vehicle, trailer, and maintenance record' },
          { icon: Fuel, title: 'Fuel Optimization', desc: 'Live station pricing and IFTA-ready reporting' },
          { icon: Wrench, title: 'Work Orders', desc: 'Digital shop management with parts tracking' },
          { icon: Shield, title: 'Compliance', desc: 'HOS logs, DVIRs, and driver screening' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3 bg-white p-4 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-amber-600" /></div>
            <div><div className="font-bold text-slate-900">{title}</div><div className="text-sm text-slate-500">{desc}</div></div>
          </div>
        ))}
      </div>
      <div className="bg-amber-500 text-slate-900 p-6 text-center rounded-b-2xl print:rounded-none">
        <div className="flex items-center justify-center gap-6 text-lg font-black">
          <span className="flex items-center gap-2"><Phone className="w-5 h-5" /> (360) 952-1249</span>
          <span className="flex items-center gap-2"><Globe className="w-5 h-5" /> fleetcomanagement.org</span>
        </div>
      </div>
    </div>
  );
}
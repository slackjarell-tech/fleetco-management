import React from 'react';
import { Truck, Shield, Fuel, Wrench, Phone, Globe, CheckCircle } from 'lucide-react';

export default function Ad02_GoogleDisplay() {
  const features = [
    { icon: Truck, text: 'Full Fleet Management' },
    { icon: Fuel, text: 'Fuel Optimization & IFTA' },
    { icon: Wrench, text: 'Maintenance & Work Orders' },
    { icon: Shield, text: 'FMCSA-Compliant Platform' },
  ];

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {/* 728x90 Leaderboard */}
      <div className="w-[728px] h-[90px] bg-slate-900 rounded-lg overflow-hidden flex shadow-lg" style={{ fontFamily: 'system-ui' }}>
        <div className="bg-amber-500 w-1.5 flex-shrink-0" />
        <div className="flex items-center p-4 gap-4 flex-1">
          <div className="bg-amber-500 p-2 rounded-lg"><Truck className="w-6 h-6 text-slate-900" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2"><span className="font-black text-white text-lg">FLEETCO MANAGEMENT</span><span className="text-amber-400 text-xs tracking-widest font-bold">FLEET PLATFORM</span></div>
            <p className="text-slate-300 text-sm">Dispatch, maintenance, fuel, compliance — all in one dashboard.</p>
          </div>
          <div className="text-right">
            <div className="font-black text-amber-400 text-sm">fleetcomanagement.org</div>
            <button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs px-4 py-1.5 rounded-lg mt-1">Get a Demo</button>
          </div>
        </div>
      </div>

      {/* 300x250 Medium Rectangle */}
      <div className="w-[300px] h-[250px] bg-slate-900 rounded-lg overflow-hidden shadow-lg text-center" style={{ fontFamily: 'system-ui' }}>
        <div className="p-5">
          <div className="bg-amber-500 p-3 rounded-xl inline-flex mb-3"><Truck className="w-8 h-8 text-slate-900" /></div>
          <div className="font-black text-2xl text-white">FLEETCO</div>
          <div className="text-amber-400 text-xs tracking-widest mb-3">MANAGEMENT</div>
          <h3 className="font-black text-sm text-white">Complete Fleet Operations.<br/>One Platform.</h3>
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            {features.slice(0, 3).map(({ icon: Icon, text }) => (
              <span key={text} className="bg-slate-800 text-amber-400 text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Icon className="w-2.5 h-2.5" />{text}</span>
            ))}
          </div>
          <div className="mt-4">
            <button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm px-6 py-2 rounded-lg w-full">Learn More</button>
            <p className="text-slate-500 text-[9px] mt-2">fleetcomanagement.org</p>
          </div>
        </div>
      </div>

      {/* 160x600 Skyscraper */}
      <div className="w-[160px] h-[600px] bg-slate-900 rounded-lg overflow-hidden shadow-lg text-center flex flex-col" style={{ fontFamily: 'system-ui' }}>
        <div className="p-4 flex-1">
          <div className="bg-amber-500 p-2 rounded-xl inline-flex mb-3"><Truck className="w-6 h-6 text-slate-900" /></div>
          <div className="font-black text-sm text-white">FLEETCO</div>
          <div className="text-amber-400 text-[8px] tracking-widest mb-4">MANAGEMENT</div>
          <div className="space-y-2">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="bg-slate-800 rounded-lg p-2 flex items-center gap-1.5">
                <Icon className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="text-[9px] text-slate-300 text-left leading-tight">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-amber-500 p-3">
          <div className="font-black text-xs text-slate-900">fleetcomanagement.org</div>
          <div className="text-[9px] text-slate-800 font-bold mt-0.5">(360) 952-1249</div>
        </div>
      </div>
    </div>
  );
}
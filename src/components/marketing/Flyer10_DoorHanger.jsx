import React from 'react';
import { Truck, Wrench, Clock, CheckCircle, Phone, Globe } from 'lucide-react';

export default function Flyer10_DoorHanger() {
  return (
    <div className="max-w-[3.5in] mx-auto bg-white" style={{ fontFamily: 'system-ui' }}>
      <div className="border-2 border-slate-300 rounded-xl overflow-hidden">
        {/* Top circle cutout area */}
        <div className="bg-slate-900 text-white p-3 text-center relative">
          <div className="w-8 h-8 rounded-full bg-amber-500 mx-auto flex items-center justify-center mb-2"><Truck className="w-4 h-4 text-slate-900" /></div>
          <div className="font-black text-sm">FLEETCO</div>
          <div className="text-amber-400 text-[8px] tracking-widest">MANAGEMENT</div>
        </div>
        <div className="bg-slate-50 p-4 text-center space-y-3">
          <h2 className="font-black text-sm text-slate-900">Need Fleet Management?</h2>
          <div className="space-y-1.5">
            {[
              { icon: Wrench, text: 'Maintenance & Repairs' },
              { icon: Clock, text: '24/7 Dispatch Support' },
              { icon: CheckCircle, text: 'IFTA & FMCSA Compliance' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-slate-600"><div className="w-5 h-5 bg-amber-100 rounded flex items-center justify-center"><Icon className="w-3 h-3 text-amber-600" /></div>{text}</div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-3">
            <div className="font-black text-sm text-slate-900">(360) 952-1249</div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-center gap-1"><Globe className="w-3 h-3 text-amber-600" /> fleetcomanagement.org</div>
          </div>
          <p className="text-[9px] text-slate-400">We stopped by to introduce FleetCo!</p>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { FileText, Phone, Globe, Truck, Shield, Fuel, Wrench, MapPin } from 'lucide-react';

export default function Flyer08_Postcard() {
  return (
    <div className="max-w-[6in] mx-auto bg-white p-6 print:p-2" style={{ fontFamily: 'system-ui' }}>
      <div className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-lg">
        {/* Front */}
        <div className="bg-slate-900 text-white p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-amber-500 p-1.5 rounded"><Truck className="w-5 h-5 text-slate-900" /></div>
            <div className="font-black text-lg">FLEETCO MANAGEMENT</div>
          </div>
          <h2 className="text-2xl font-black leading-tight">One Platform. Total Fleet Control.</h2>
          <div className="flex gap-2 mt-3 flex-wrap">
            {[{ icon: Truck, label: 'Fleet' }, { icon: Fuel, label: 'Fuel' }, { icon: Wrench, label: 'Shop' }, { icon: Shield, label: 'Compliance' }, { icon: MapPin, label: 'Dispatch' }].map(({ icon: Icon, label }) => (
              <span key={label} className="bg-slate-800 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><Icon className="w-3 h-3" />{label}</span>
            ))}
          </div>
        </div>
        {/* Divider */}
        <div className="h-2 bg-amber-500" />
        {/* Back */}
        <div className="p-5 bg-white text-center">
          <p className="text-slate-600 text-sm">Schedule a free demo and see how FleetCo can transform your operation.</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm font-bold">
            <span className="flex items-center gap-1.5 text-slate-900"><Phone className="w-4 h-4 text-amber-600" /> (360) 952-1249</span>
            <span className="flex items-center gap-1.5 text-slate-500"><Globe className="w-4 h-4 text-amber-600" /> fleetcomanagement.org</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">JaRell & Desiree Slack, Owners</p>
        </div>
      </div>
    </div>
  );
}
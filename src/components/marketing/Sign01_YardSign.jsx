import React from 'react';
import { Phone, Globe, Truck, MapPin } from 'lucide-react';

export default function Sign01_YardSign() {
  return (
    <div className="max-w-[4in] mx-auto bg-white" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-slate-900 text-white p-6 text-center rounded-t-xl">
        <div className="bg-amber-500 p-3 rounded-xl inline-flex mb-4"><Truck className="w-10 h-10 text-slate-900" /></div>
        <div className="font-black text-3xl leading-none">FLEETCO</div>
        <div className="text-amber-400 text-sm tracking-widest mb-4">MANAGEMENT</div>
        <div className="border-t border-slate-700 pt-4">
          <p className="font-black text-xl">Fleet Management</p>
          <p className="text-slate-300 text-sm mt-1">Dispatch • Maintenance • Fuel • Compliance</p>
        </div>
      </div>
      <div className="bg-amber-500 text-slate-900 p-4 text-center rounded-b-xl">
        <div className="font-black text-2xl">(360) 952-1249</div>
        <div className="text-sm font-bold">fleetcomanagement.org</div>
      </div>
    </div>
  );
}
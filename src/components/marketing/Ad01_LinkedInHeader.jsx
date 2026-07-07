import React from 'react';
import { Truck, Users, TrendingUp, Shield, Phone, Globe, Star } from 'lucide-react';

export default function Ad01_LinkedInHeader() {
  return (
    <div className="max-w-[7in] mx-auto bg-white" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center p-6 gap-6">
          <div className="bg-amber-500 p-4 rounded-2xl flex-shrink-0"><Truck className="w-10 h-10 text-slate-900" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-black text-3xl">FLEETCO</div>
              <div className="text-amber-400 text-xs tracking-widest font-bold">MANAGEMENT</div>
            </div>
            <h1 className="text-xl font-black leading-tight">Complete Fleet Operations — One Platform.</h1>
            <p className="text-slate-400 text-sm mt-1">Dispatch • Maintenance • Fuel • Compliance • Analytics</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-black text-amber-400 text-lg">fleetcomanagement.org</div>
            <div className="text-slate-300 text-sm">(360) 952-1249</div>
          </div>
        </div>
        <div className="h-1 bg-amber-500" />
      </div>
    </div>
  );
}
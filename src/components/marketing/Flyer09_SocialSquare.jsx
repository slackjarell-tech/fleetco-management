import React from 'react';
import { Megaphone, Phone, Globe, Truck, Users, TrendingUp, Shield, Star } from 'lucide-react';

export default function Flyer09_SocialSquare() {
  const stats = [
    { value: '50+', label: 'Fleets Served' },
    { value: '30%', label: 'Fuel Savings' },
    { value: '24/7', label: 'Support' },
  ];

  return (
    <div className="max-w-[4in] mx-auto bg-white p-4 print:p-2" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-center p-6">
          <div className="bg-amber-500 p-2 rounded-xl inline-flex mb-3"><Truck className="w-8 h-8 text-slate-900" /></div>
          <div className="font-black text-2xl text-white">FLEETCO</div>
          <div className="text-amber-400 text-xs tracking-widest mb-4">MANAGEMENT</div>
          <h2 className="text-xl font-black text-white leading-tight">Complete Fleet Operations. One Platform.</h2>
          <div className="flex justify-center gap-4 mt-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-black text-amber-400 text-lg">{value}</div>
                <div className="text-slate-400 text-[9px]">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-amber-500 text-slate-900 p-4 text-center">
          <p className="font-black text-sm">fleetcomanagement.org</p>
          <p className="text-xs font-bold mt-1">(360) 952-1249</p>
        </div>
      </div>
    </div>
  );
}
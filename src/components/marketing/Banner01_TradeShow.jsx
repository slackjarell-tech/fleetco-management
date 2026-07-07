import React from 'react';
import { Truck, Shield, Fuel, Wrench, MapPin, BarChart3, Phone, Globe, Star, CheckCircle } from 'lucide-react';

export default function Banner01_TradeShow() {
  return (
    <div className="max-w-[3ft] mx-auto bg-white" style={{ fontFamily: 'system-ui', width: '36in', maxWidth: '3ft' }}>
      {/* 33" x 78" typical retractable banner - we render at 3:7 ratio */}
      <div className="bg-slate-900 text-white rounded-xl overflow-hidden shadow-2xl" style={{ minHeight: 'auto' }}>
        {/* Top amber stripe */}
        <div className="bg-amber-500 h-3" />

        {/* Logo Section */}
        <div className="p-6 text-center">
          <div className="bg-amber-500 p-4 rounded-2xl inline-flex mb-4">
            <Truck className="w-12 h-12 text-slate-900" />
          </div>
          <div className="font-black text-5xl tracking-tight">FLEETCO</div>
          <div className="text-amber-400 text-lg tracking-widest mt-1">MANAGEMENT</div>
          <div className="w-24 h-0.5 bg-amber-500 mx-auto mt-4" />
        </div>

        {/* Main headline */}
        <div className="px-8 py-4 text-center">
          <h1 className="text-3xl font-black leading-tight">
            Complete Fleet Operations.<br/>One Platform.
          </h1>
          <p className="text-slate-400 text-base mt-3 max-w-md mx-auto">
            The all-in-one fleet management platform for carriers who demand efficiency, compliance, and profitability.
          </p>
        </div>

        {/* Feature Columns */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4">
          {[
            { icon: Truck, label: 'Fleet Management', desc: 'Track every vehicle, trailer, and maintenance record in one unified dashboard' },
            { icon: Fuel, label: 'Fuel Optimization', desc: 'Live station pricing, AI-powered 14-day price predictions, IFTA-ready reporting' },
            { icon: MapPin, label: 'Dispatch & Loads', desc: 'Load board with driver assignment, GPS navigation, and weigh scale tracking' },
            { icon: Shield, label: 'Full Compliance', desc: 'HOS/ELD logs, digital DVIR inspections, driver screening, incident reports' },
            { icon: Wrench, label: 'Shop Management', desc: 'Digital work orders, service templates, parts inventory, vendor contracts' },
            { icon: BarChart3, label: 'Analytics & P&L', desc: 'Fleet profitability dashboards, vehicle TCO with depreciation, custom exports' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex gap-3 items-start p-3 bg-slate-800 rounded-xl">
              <div className="bg-amber-500/20 p-2 rounded-lg flex-shrink-0">
                <Icon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">{label}</div>
                <div className="text-slate-400 text-xs mt-0.5 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Bar */}
        <div className="flex justify-center gap-6 py-4 px-6">
          {['FMCSA Compliant', '24/7 Support', '5-Star Service', 'Nationwide Coverage'].map(item => (
            <span key={item} className="bg-slate-800 text-amber-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" /> {item}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-amber-500 text-slate-900 p-6 text-center mt-2">
          <div className="font-black text-2xl">fleetcomanagement.org</div>
          <div className="text-base font-bold mt-1">(360) 952-1249</div>
          <p className="text-sm mt-2 font-semibold">JaRell & Desiree Slack, Owners | Schedule a free demo today</p>
        </div>
      </div>
    </div>
  );
}
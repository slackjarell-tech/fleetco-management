import React from 'react';
import { Car, Wrench, Clock, DollarSign, Phone, Globe, Truck, CheckCircle } from 'lucide-react';

export default function Flyer03_ShopServices() {
  const services = [
    { icon: Wrench, title: 'Preventive Maintenance', price: 'PM Packages from $149', desc: 'Oil changes, filters, belts, fluids — everything to keep you rolling' },
    { icon: Car, title: 'Engine & Transmission', price: 'Major Repairs', desc: 'Full engine overhauls, transmission rebuilds, clutch replacement' },
    { icon: Clock, title: 'Emergency Repairs', price: '24/7 Roadside', desc: 'Breakdown support anywhere — we dispatch service to you' },
    { icon: CheckCircle, title: 'DOT Inspections', price: 'Annual & Level 1', desc: 'Certified annual inspections and full Level 1 DOT compliance checks' },
    { icon: DollarSign, title: 'Tire Services', price: 'Mount, Balance, Align', desc: 'Commercial tire sales, mounting, balancing, and alignment' },
    { icon: Truck, title: 'Trailer Repair', price: 'Full Service', desc: 'Lights, brakes, doors, floors, landing gear, and refrigeration units' },
  ];

  return (
    <div className="max-w-[8.5in] mx-auto bg-white p-8 print:p-4" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 rounded-t-2xl print:rounded-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-500 p-2 rounded"><Wrench className="w-6 h-6 text-slate-900" /></div>
          <div>
            <div className="font-black text-2xl">FLEETCO</div>
            <div className="text-amber-400 text-xs tracking-widest">SHOP SERVICES</div>
          </div>
        </div>
        <h1 className="text-4xl font-black">Keep Your Fleet Rolling</h1>
        <p className="text-slate-300 text-lg mt-2">Professional truck & trailer repair with fleet management integration.</p>
        <div className="flex gap-4 mt-4 text-sm text-amber-400 font-bold">
          <span>ASE Certified Techs</span>
          <span>•</span>
          <span>Warranty on All Work</span>
          <span>•</span>
          <span>Digital Work Orders</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 p-8 bg-slate-50">
        {services.map(({ icon: Icon, title, price, desc }) => (
          <div key={title} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-amber-600" /></div>
              <div className="flex-1">
                <div className="font-bold text-slate-900">{title}</div>
                <div className="text-amber-600 font-bold text-sm">{price}</div>
                <div className="text-xs text-slate-500 mt-1">{desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 text-white p-5 text-center rounded-b-2xl print:rounded-none">
        <p className="font-black">Call to Schedule Service</p>
        <div className="flex items-center justify-center gap-6 mt-2 text-lg font-black">
          <span className="flex items-center gap-2"><Phone className="w-5 h-5 text-amber-400" /> (360) 952-1249</span>
          <span className="flex items-center gap-2"><Globe className="w-5 h-5 text-amber-400" /> fleetcomanagement.org</span>
        </div>
      </div>
    </div>
  );
}
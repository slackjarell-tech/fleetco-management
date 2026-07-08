import React from 'react';
import { Link } from 'react-router-dom';
import { Warehouse, Grid3X3, Truck, LogIn } from 'lucide-react';

export default function YmsSection() {
  return (
    <section id="yard-management" className="py-20 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Yard Management System</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              Design Your Yard. Your Size. Your Layout.
            </h2>
            <p className="text-slate-600 mt-4 leading-relaxed">
              FleetCo YMS lets every customer build a custom yard map — set dimensions in feet, place
              <strong> buildings </strong> and <strong> parking spots </strong>, resize each to fit your terminal,
              then assign trailers and trucks in live mode.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <Grid3X3 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                Buildings: office, warehouse, shop — custom width &amp; depth
              </li>
              <li className="flex items-start gap-2">
                <Warehouse className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                Parking: spots, trailer slots, tractor bays, full rows
              </li>
              <li className="flex items-start gap-2">
                <Truck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                Live spot assignment — see what&apos;s empty or occupied at a glance
              </li>
            </ul>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 mt-8 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <LogIn className="w-5 h-5" /> Open YMS in Client Portal
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-lg">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sample yard · 400×300 ft</div>
            <div
              className="relative rounded-xl overflow-hidden border border-slate-300"
              style={{
                height: 280,
                backgroundImage: 'linear-gradient(to right, rgba(148,163,184,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.3) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundColor: '#e2e8f0',
              }}
            >
              <div className="absolute left-2 top-2 w-24 h-16 rounded bg-stone-600 text-white text-[9px] font-bold flex flex-col items-center justify-center border-2 border-stone-800">
                <span>Building</span>
                <span className="font-normal opacity-80">100×75 ft</span>
              </div>
              <div className="absolute left-28 top-2 w-16 h-8 rounded bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">Dock 2</div>
              <div className="absolute right-2 top-2 w-10 h-10 rounded bg-teal-500 text-white text-[8px] font-bold flex items-center justify-center">IN</div>
              <div className="absolute left-2 top-14 w-20 h-14 rounded bg-green-600 text-white text-[9px] font-bold flex flex-col items-center justify-center">
                <span>TR-101</span>
                <span className="font-normal opacity-80">Occupied</span>
              </div>
              <div className="absolute left-24 top-14 w-20 h-14 rounded bg-green-500 text-white text-[9px] font-bold flex items-center justify-center">Empty</div>
              <div className="absolute left-2 bottom-2 w-24 h-8 rounded bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">Storage Lane</div>
              <div className="absolute right-2 bottom-2 w-10 h-10 rounded bg-orange-500 text-white text-[8px] font-bold flex items-center justify-center">OUT</div>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">Customers configure their own yards inside the portal — no two layouts are the same.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

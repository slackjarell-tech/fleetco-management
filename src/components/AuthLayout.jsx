import React from "react";
import { Link } from "react-router-dom";
import FleetcoLogo from "@/components/home/FleetcoLogo";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-slate-950 border-r border-slate-800">
        <Link to="/" className="inline-block">
          <FleetcoLogo size={48} variant="full" />
        </Link>

        <div>
          <blockquote className="text-slate-300 text-xl font-light leading-relaxed mb-6">
            "The portal gives us full visibility across our entire fleet — fuel, repairs, invoices, all in one place."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">JR</div>
            <div>
              <div className="text-white text-sm font-semibold">James R.</div>
              <div className="text-slate-500 text-xs">Fleet Manager, 47 trucks</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '500+', label: 'Vehicles Managed' },
            { value: '98%', label: 'Uptime Tracked' },
            { value: '24/7', label: 'Portal Access' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
              <div className="text-amber-400 text-xl font-black">{s.value}</div>
              <div className="text-slate-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        {/* Mobile logo */}
        <Link to="/" className="inline-block mb-10 lg:hidden">
          <FleetcoLogo size={40} variant="full" />
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white">{title}</h1>
            {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
            {children}
          </div>

          {footer && (
            <p className="text-center text-sm text-slate-500 mt-6">{footer}</p>
          )}

          <p className="text-center text-xs text-slate-600 mt-4">
            <Link to="/" className="hover:text-slate-400 transition-colors">← Back to website</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
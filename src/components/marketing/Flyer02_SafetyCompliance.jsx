import React from 'react';
import { Truck, Phone, Globe, Star, Shield, Fuel, Wrench, FileText } from 'lucide-react';

export default function Flyer02_SafetyCompliance() {
  return (
    <div className="max-w-[8.5in] mx-auto bg-white p-8 print:p-4" style={{ fontFamily: 'system-ui' }}>
      <div className="border-4 border-red-600 rounded-2xl p-8 bg-white print:rounded-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-600 p-2 rounded"><Shield className="w-6 h-6 text-white" /></div>
          <div>
            <div className="font-black text-2xl text-slate-900">FLEETCO</div>
            <div className="text-red-600 text-xs tracking-widest font-bold">SAFETY & COMPLIANCE</div>
          </div>
        </div>
        <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl mb-6">
          <h1 className="text-3xl font-black text-slate-900">Stay DOT Compliant. Avoid Fines. Protect Your CSA Score.</h1>
          <p className="text-slate-600 text-lg mt-3">Our platform automates FMCSA compliance so you never miss a filing deadline or inspection requirement.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { title: 'HOS / ELD Logs', desc: 'Automated violation detection for 11-hr, 14-hr, and 70-hr rules' },
            { title: 'DVIR Inspections', desc: 'Pre-trip and post-trip with digital signatures and manager sign-off' },
            { title: 'DOT Annual Inspections', desc: 'Schedule and track annual vehicle inspections with reminders' },
            { title: 'Driver Qualification Files', desc: 'CDL, medical cards, MVRs — all tracked with expiration alerts' },
            { title: 'CSA Score Monitoring', desc: 'Track violations and points to protect your safety rating' },
            { title: 'Incident Reporting', desc: 'Log accidents and near-misses with corrective action tracking' },
          ].map(({ title, desc }) => (
            <div key={title} className="flex gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 mt-1" />
              <div><div className="font-bold text-sm text-slate-900">{title}</div><div className="text-xs text-slate-500">{desc}</div></div>
            </div>
          ))}
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-xl text-center">
          <p className="font-black text-xl">Protect Your Fleet. Protect Your Business.</p>
          <p className="text-slate-400 mt-2">Call for a free compliance audit</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-lg font-black">
            <span className="flex items-center gap-2"><Phone className="w-5 h-5 text-amber-400" /> (360) 952-1249</span>
            <span className="flex items-center gap-2"><Globe className="w-5 h-5 text-amber-400" /> fleetcomanagement.org</span>
          </div>
        </div>
      </div>
    </div>
  );
}
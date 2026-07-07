import React from 'react';
import { Truck, Phone, Globe, FileText, Calculator, DollarSign } from 'lucide-react';

export default function Flyer06_TaxSeason() {
  return (
    <div className="max-w-[8.5in] mx-auto bg-white p-8 print:p-4" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-gradient-to-br from-purple-700 to-purple-900 text-white p-8 rounded-t-2xl print:rounded-none text-center">
        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"><Calculator className="w-8 h-8 text-white" /></div>
        <h1 className="text-4xl font-black">Tax Season Ready?</h1>
        <p className="text-purple-200 text-lg mt-3">Get your fleet finances in order with automated IFTA reporting, expense tracking, and tax-ready exports.</p>
        <div className="inline-flex gap-3 mt-4 bg-purple-800 px-6 py-2 rounded-full text-sm font-bold">
          <span>IFTA Filing</span><span>•</span><span>2290 HVUT</span><span>•</span><span>Expense Reports</span>
        </div>
      </div>
      <div className="p-8 bg-slate-50 space-y-4">
        {[
          { title: 'IFTA Quarterly Reports', desc: 'Auto-generated state-by-state fuel tax calculations. FMCSA-ready exports for filing.', price: 'Included' },
          { title: 'Mileage Tracking', desc: 'GPS-verified mileage logs by state for accurate IFTA and IRP reporting.', price: 'Included' },
          { title: 'Expense Categorization', desc: 'Fuel, maintenance, insurance, permits — all categorized for maximum deductions.', price: 'Included' },
          { title: 'Profit & Loss Statements', desc: 'Monthly P&L with revenue vs. cost breakdown per vehicle and fleet-wide.', price: 'Included' },
          { title: '2290 Heavy Vehicle Use Tax', desc: 'Track VINs and filing deadlines for annual HVUT compliance.', price: 'Included' },
          { title: 'CPA-Ready Exports', desc: 'Download all reports as Excel files to send directly to your accountant.', price: 'Included' },
        ].map(({ title, desc, price }) => (
          <div key={title} className="flex items-center justify-between bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex-1">
              <div className="font-bold text-slate-900">{title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
            </div>
            <span className="bg-purple-100 text-purple-700 font-bold text-sm px-3 py-1 rounded-full flex-shrink-0 ml-4">{price}</span>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 text-white p-5 rounded-b-2xl print:rounded-none text-center">
        <div className="flex items-center justify-center gap-6 font-bold">
          <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-400" /> (360) 952-1249</span>
          <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-amber-400" /> fleetcomanagement.org</span>
        </div>
      </div>
    </div>
  );
}
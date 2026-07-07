import React from 'react';
import { Truck, Phone, Globe, TrendingUp, BarChart3 } from 'lucide-react';

export default function Email02_Newsletter() {
  return (
    <div className="max-w-[6.5in] mx-auto bg-white p-6 print:p-4" style={{ fontFamily: 'system-ui' }}>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-900 p-5">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-1 rounded"><Truck className="w-4 h-4 text-slate-900" /></div>
            <div><div className="font-black text-white text-sm">FLEETCO</div><div className="text-amber-400 text-[9px] tracking-widest">MONTHLY INSIGHTS</div></div>
          </div>
          <h1 className="text-xl font-black text-white mt-3">This Month in Fleet: Fuel Prices Drop, New Features, and Q2 IFTA Tips</h1>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <h3 className="font-black text-sm text-amber-600 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Fuel Market Update</h3>
            <p className="text-sm text-slate-600 mt-1">National diesel average dropped 8 cents this month. Our AI prediction model shows continued decline over the next 2 weeks. Best time to fill: Thursdays.</p>
          </div>
          <div>
            <h3 className="font-black text-sm text-amber-600 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> New Platform Features</h3>
            <ul className="list-disc pl-5 text-sm text-slate-600 mt-1 space-y-1">
              <li>VIN Decoder — auto-populate vehicle specs from NHTSA database</li>
              <li>Service Templates — create reusable maintenance checklists</li>
              <li>Module Preferences — customize your sidebar navigation</li>
            </ul>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="font-bold text-sm text-slate-900">Q2 IFTA Filing Deadline: July 31</p>
            <p className="text-xs text-slate-600 mt-1">Generate your IFTA report now from the IFTA Dashboard. Select Q2, review state-by-state data, and download your FMCSA-ready export.</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">FleetCo Management | fleetcomanagement.org | (360) 952-1249</p>
          </div>
        </div>
      </div>
    </div>
  );
}
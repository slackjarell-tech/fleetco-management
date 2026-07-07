import React from 'react';
import { Mail, Truck, Phone, Globe } from 'lucide-react';

export default function Email01_Welcome() {
  return (
    <div className="max-w-[6.5in] mx-auto bg-white p-6 print:p-4" style={{ fontFamily: 'system-ui' }}>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-900 p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-amber-500 p-1 rounded"><Truck className="w-4 h-4 text-slate-900" /></div>
            <div className="font-black text-white">FLEETCO MANAGEMENT</div>
          </div>
          <h1 className="text-2xl font-black text-white">Welcome to FleetCo!</h1>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-700">Dear [Customer Name],</p>
          <p className="text-slate-600">Thank you for choosing FleetCo Management for your fleet operations. We're excited to have you on board.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-bold text-slate-900 text-sm">Getting Started:</p>
            <ol className="list-decimal pl-4 text-sm text-slate-600 mt-2 space-y-1">
              <li>Log in at fleetcomanagement.org with your email and temporary password</li>
              <li>Change your password on first login</li>
              <li>Explore the Dashboard to see your fleet KPIs</li>
              <li>Set up your vehicles in the Fleet Units page</li>
              <li>Contact your Fleet Manager with any questions</li>
            </ol>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="font-bold text-sm text-slate-900">Need Help?</p>
            <p className="text-xs text-slate-500 mt-1">Call (360) 952-1249 or reply to this email</p>
          </div>
          <p className="text-slate-600 text-sm">Best regards,<br/>The FleetCo Team</p>
        </div>
        <div className="bg-slate-100 p-3 text-center text-[10px] text-slate-400">
          FleetCo Management | fleetcomanagement.org | (360) 952-1249
        </div>
      </div>
    </div>
  );
}
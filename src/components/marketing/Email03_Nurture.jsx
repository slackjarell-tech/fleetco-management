import React from 'react';
import { Truck, Phone, Globe, Fuel, Shield, Wrench, MapPin, BarChart3 } from 'lucide-react';

export default function Email03_Nurture() {
  return (
    <div className="max-w-[6.5in] mx-auto bg-white p-6 print:p-4" style={{ fontFamily: 'system-ui' }}>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-amber-500 p-1.5 rounded"><Truck className="w-5 h-5 text-slate-900" /></div>
            <div className="font-black text-white text-lg">FLEETCO MANAGEMENT</div>
          </div>
          <h1 className="text-2xl font-black text-white">5 Ways FleetCo Saves Your Operation Money</h1>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-slate-700 text-sm">Hi [Customer Name],</p>
          <p className="text-slate-600 text-sm">
            You've been exploring our platform — we wanted to break down exactly how FleetCo puts money back in your pocket. Here are the five biggest savings areas our customers see:
          </p>

          {/* Savings breakdown */}
          <div className="space-y-3">
            {[
              { icon: Fuel, num: '1', title: 'Fuel Cost Reduction — Avg $2,100/yr per truck', desc: 'Our Fuel Stations module shows live diesel prices at 1,200+ truck stops across North America. Paired with AI-powered 14-day price predictions, our customers fill at the cheapest stations along their route. Most save 18-30% on their annual fuel spend.', color: 'bg-blue-600' },
              { icon: Wrench, num: '2', title: 'Preventive Maintenance — Stop breakdowns before they happen', desc: 'Automated PM scheduling tracks both date and mileage for every vehicle. Our calendar view lets your shop plan weeks ahead. Customers report 60% fewer roadside breakdowns within 6 months of adopting our maintenance module.', color: 'bg-green-600' },
              { icon: Shield, num: '3', title: 'Compliance — Zero violations means zero fines', desc: 'HOS violation auto-detection catches issues before they become citations. Digital DVIR inspections with manager sign-off ensure nothing slips through. Average customer saves $15K+/year in avoided fines and legal costs.', color: 'bg-purple-600' },
              { icon: MapPin, num: '4', title: 'Dispatch Efficiency — More loads, less deadhead', desc: 'Our Load Board with integrated GPS navigation and weigh scale tracking means your dispatchers make better decisions faster. Route Builder with bulk CSV import cuts planning time from hours to minutes.', color: 'bg-amber-600' },
              { icon: BarChart3, num: '5', title: 'Fleet Visibility — Know exactly where every dollar goes', desc: 'Our Fleet P&L dashboard and Vehicle TCO module show per-unit profitability with straight-line depreciation. Identify underperforming assets and make data-driven fleet decisions. Knowledge is savings.', color: 'bg-red-600' },
            ].map(({ icon: Icon, num, title, desc, color }) => (
              <div key={num} className="flex gap-3 bg-slate-50 rounded-lg p-4">
                <div className={`${color} text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm`}>{num}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total Savings Callout */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 text-center">
            <div className="text-amber-600 font-black text-lg">Total Potential Savings: $5,000+/year per truck</div>
            <p className="text-slate-600 text-sm mt-1">That's a 28% reduction in operating costs — proven across 50+ fleets.</p>
          </div>

          {/* Platform Stats */}
          <div className="bg-slate-900 text-white rounded-xl p-4">
            <h3 className="font-black text-sm mb-3">What a 47-Truck Fleet Achieved in 12 Months:</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '$98,700', label: 'Fuel Savings' },
                { value: '94%', label: 'PM Compliance' },
                { value: 'Zero', label: 'HOS Violations' },
              ].map(({ value, label }) => (
                <div key={label} className="bg-slate-800 rounded-lg p-3 text-center">
                  <div className="font-black text-xl text-amber-400">{value}</div>
                  <div className="text-xs text-slate-400 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-2">
            <p className="text-slate-700 text-sm font-bold">Ready to see these savings in your fleet?</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="bg-amber-500 text-slate-900 font-black px-4 py-2 rounded-lg text-sm">Schedule a Demo</span>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><Phone className="w-3.5 h-3.5 text-amber-600" /> (360) 952-1249</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500"><Globe className="w-3.5 h-3.5 text-amber-600" /> fleetcomanagement.org</div>
              </div>
            </div>
          </div>

          <p className="text-slate-600 text-sm pt-2">Best regards,<br/><strong>JaRell & Desiree Slack</strong><br/>Owners, FleetCo Management</p>
        </div>

        <div className="bg-slate-100 p-3 text-center text-[10px] text-slate-400">
          FleetCo Management | fleetcomanagement.org | (360) 952-1249 | To unsubscribe, reply to this email
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Phone, Mail, Globe, ChevronRight, Printer, Download, Shield, Fuel, Wrench, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { BUSINESS_PLAN_PDF, REVENUE_PROJECTIONS_PDF, REVENUE_PANDL_PDF } from '@/lib/brand';

export default function MarketingMaterials() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-black">Marketing Materials Hub</h1>
          <p className="text-slate-400 text-sm mt-1">Downloadable resources to share with prospective customers</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Intro Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm print:hidden">
          <h2 className="text-lg font-black text-slate-900 mb-2">FleetCo Marketing Kit</h2>
          <p className="text-slate-600 text-sm">
            Below you'll find professionally designed materials ready for print or digital distribution. 
            Each item is formatted for standard paper sizes — just print or save as PDF. 
            Use these to introduce FleetCo Management to potential fleet customers.
          </p>
        </div>

        {/* Tri-Fold Pamphlet */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
            <div>
              <h2 className="font-black text-lg">Tri-Fold Brochure</h2>
              <p className="text-slate-400 text-xs">Two-sided, folds to standard #10 envelope size</p>
            </div>
            <button onClick={() => window.print()} className="px-4 py-2 text-sm font-bold bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print Brochure
            </button>
          </div>

          {/* Pamphlet Content - Print Optimized (8.5x11 landscape, tri-fold) */}
          <div className="p-0">
            {/* ---- FRONT PANELS (outside of folded brochure) ---- */}
            <div className="print:flex print:flex-row hidden">
              {/* Panel 1: Front Cover (right panel when folded) */}
              <div className="w-1/3 bg-slate-900 text-white p-6 flex flex-col justify-between min-h-[400px] border-r border-slate-700">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-amber-500 p-1.5 rounded"><Truck className="w-5 h-5 text-slate-900" /></div>
                    <div>
                      <div className="font-black text-base leading-none">FLEETCO</div>
                      <div className="text-amber-400 text-[10px] tracking-widest">MANAGEMENT</div>
                    </div>
                  </div>
                  <h1 className="text-xl font-black leading-tight mt-6">
                    Complete Fleet Operations. One Platform.
                  </h1>
                  <p className="text-slate-300 text-xs mt-3 leading-relaxed">
                    From dispatch to maintenance, fuel tracking to IFTA compliance — 
                    FleetCo Management brings your entire operation under one roof.
                  </p>
                </div>
                <div className="text-[9px] text-slate-500">
                  www.fleetcomanagement.org
                </div>
              </div>

              {/* Panel 2: Back Cover (middle panel when folded) */}
              <div className="w-1/3 bg-slate-800 text-white p-6 flex flex-col justify-center items-center text-center min-h-[400px] border-r border-slate-700">
                <div className="bg-amber-500 p-4 rounded-full mb-4">
                  <Truck className="w-8 h-8 text-slate-900" />
                </div>
                <h2 className="font-black text-sm mb-2">Ready to Transform Your Fleet?</h2>
                <p className="text-slate-300 text-xs leading-relaxed mb-4">
                  Schedule a demo today and see how FleetCo can save your operation time and money.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 justify-center">
                    <Phone className="w-3 h-3 text-amber-400" />
                    <span className="text-white font-bold">(360) 952-1249</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Globe className="w-3 h-3 text-amber-400" />
                    <span className="text-slate-300">fleetcomanagement.org</span>
                  </div>
                </div>
              </div>

              {/* Panel 3: Address/Contact (left panel when folded) */}
              <div className="w-1/3 bg-slate-900 text-white p-6 flex flex-col justify-center items-center text-center min-h-[400px]">
                <h3 className="font-black text-sm mb-3">Contact Us</h3>
                <div className="space-y-2 text-xs">
                  <p className="font-bold">JaRell D. Slack</p>
                  <p className="font-bold">Desiree Slack</p>
                  <p className="text-slate-400">Owners</p>
                  <div className="mt-3 pt-3 border-t border-slate-700 space-y-1.5">
                    <div className="flex items-center gap-2 justify-center">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span className="text-white">(360) 952-1249</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-[10px] text-slate-500 mt-2">Serving fleet operators nationwide</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- INSIDE PANELS ---- */}
            <div className="print:flex print:flex-row hidden">
              {/* Panel 4: Features (left inside) */}
              <div className="w-1/3 bg-white p-5 border-r border-slate-200 min-h-[400px]">
                <h3 className="font-black text-xs text-slate-900 mb-3 uppercase tracking-wide">Platform Features</h3>
                <div className="space-y-3">
                  {[
                    { icon: Truck, title: 'Fleet Management', desc: 'Track all vehicles, trailers, maintenance, and inspections in one place.' },
                    { icon: Fuel, title: 'Fuel Optimization', desc: 'Live fuel station pricing, IFTA reporting, and cost-per-mile analytics.' },
                    { icon: FileText, title: 'Dispatch & Loads', desc: 'Load board with driver assignment, weigh scale tracking, and GPS navigation.' },
                    { icon: Shield, title: 'Compliance', desc: 'HOS/ELD logs, DVIR inspections, driver screening, and FMCSA-ready reporting.' },
                    { icon: Wrench, title: 'Work Orders', desc: 'Service templates, parts inventory, vendor contracts, and repair cost tracking.' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex gap-2.5">
                      <div className="w-5 h-5 bg-amber-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3 h-3 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-bold text-[10px] text-slate-900">{title}</div>
                        <div className="text-[8px] text-slate-500 leading-relaxed">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 5: Benefits (middle inside) */}
              <div className="w-1/3 bg-slate-50 p-5 border-r border-slate-200 min-h-[400px]">
                <h3 className="font-black text-xs text-slate-900 mb-3 uppercase tracking-wide">Why FleetCo?</h3>
                <div className="space-y-3">
                  {[
                    { stat: '30%', label: 'Average fuel cost reduction through optimized purchasing' },
                    { stat: '100%', label: 'FMCSA-compliant electronic DVIR and HOS logging' },
                    { stat: '24/7', label: 'Real-time fleet visibility from any device, anywhere' },
                    { stat: 'All-in-One', label: 'No need for multiple software subscriptions' },
                  ].map(({ stat, label }) => (
                    <div key={stat} className="bg-white rounded-lg p-2.5 border border-slate-100">
                      <div className="font-black text-sm text-amber-600">{stat}</div>
                      <div className="text-[8px] text-slate-600 mt-0.5 leading-relaxed">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-[9px] text-slate-700 font-semibold">
                    "FleetCo transformed how we manage our 47 trucks. Everything from IFTA to maintenance is now in one place."
                  </p>
                  <p className="text-[8px] text-slate-500 mt-1">— Regional Carrier, Midwest</p>
                </div>
              </div>

              {/* Panel 6: Plans (right inside) */}
              <div className="w-1/3 bg-white p-5 min-h-[400px]">
                <h3 className="font-black text-xs text-slate-900 mb-3 uppercase tracking-wide">Service Plans</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Starter', price: '$299/mo', features: ['Up to 10 vehicles', 'Fuel tracking', 'Basic maintenance', 'Load board', 'Driver management'] },
                    { name: 'Growth', price: '$599/mo', features: ['Up to 50 vehicles', 'Advanced analytics', 'IFTA reporting', 'Vendor contracts', 'Parts inventory', 'DVIR inspections'] },
                    { name: 'Enterprise', price: 'Custom pricing', priceSub: 'Quote on request', features: ['Unlimited vehicles', 'Full platform access', 'Custom integrations', 'Dedicated support', 'Multi-customer portal', 'Executive dashboard'] },
                  ].map(({ name, price, features }) => (
                    <div key={name} className="border border-slate-200 rounded-lg p-2.5">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-black text-[10px] text-slate-900">{name}</span>
                        <span className="font-black text-[10px] text-amber-600">{price}</span>
                      </div>
                      <ul className="space-y-0.5">
                        {features.map(f => (
                          <li key={f} className="text-[8px] text-slate-600 flex items-center gap-1">
                            <span className="text-amber-500">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="text-[7px] text-slate-400 mt-3 text-center">Custom pricing available for large fleets. Contact us for a quote.</p>
              </div>
            </div>
          </div>

          {/* Print button for brochure section */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center print:hidden">
            <p className="text-xs text-slate-500 mb-2">Prints as a two-page tri-fold brochure on standard letter paper (8.5" x 11")</p>
            <button onClick={() => window.print()} className="px-5 py-2.5 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg inline-flex items-center gap-2">
              <Download className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>

          {/* Screen preview of brochure */}
          <div className="p-6 print:hidden">
            <h3 className="font-black text-sm text-slate-900 mb-3">Brochure Preview</h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              <div className="flex-shrink-0 w-64 bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between min-h-[280px]">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-amber-500 p-1 rounded"><Truck className="w-4 h-4 text-slate-900" /></div>
                    <div className="font-black text-sm">FLEETCO</div>
                  </div>
                  <h4 className="font-black text-sm leading-tight mt-4">Complete Fleet Operations. One Platform.</h4>
                  <p className="text-slate-300 text-[10px] mt-2">From dispatch to maintenance, fuel tracking to IFTA compliance.</p>
                </div>
                <p className="text-[9px] text-slate-500">FRONT COVER</p>
              </div>
              <div className="flex-shrink-0 w-64 bg-white rounded-xl border border-slate-200 p-5 min-h-[280px]">
                <h4 className="font-black text-[10px] text-slate-900 mb-2 uppercase">Key Benefits</h4>
                <div className="space-y-2">
                  {['30% fuel cost reduction', 'Full FMCSA compliance', '24/7 fleet visibility', 'All-in-one platform'].map(b => (
                    <div key={b} className="text-[10px] text-slate-600 bg-slate-50 rounded px-2 py-1.5">{b}</div>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400 mt-4">INSIDE PANEL</p>
              </div>
              <div className="flex-shrink-0 w-64 bg-slate-800 text-white rounded-xl p-5 min-h-[280px] flex flex-col justify-center items-center">
                <Phone className="w-6 h-6 text-amber-400 mb-2" />
                <p className="font-bold text-xs">(360) 952-1249</p>
                <p className="text-[10px] text-slate-400 mt-1">fleetcomanagement.org</p>
                <p className="text-[9px] text-slate-500 mt-4">CONTACT PANEL</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---- BUSINESS CARDS ---- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-6 py-4 flex items-center justify-between print:hidden">
            <div>
              <h2 className="font-black text-lg">Business Cards</h2>
              <p className="text-slate-800 text-xs">Standard 3.5" x 2" — prints 10 per sheet</p>
            </div>
            <button onClick={() => window.print()} className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print Cards
            </button>
          </div>

          {/* Print-optimized business card grid (10 per sheet) */}
          <div className="hidden print:grid print:grid-cols-2 print:gap-4 print:p-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="border-2 border-slate-300 rounded-lg p-4 flex items-center gap-4" style={{ width: '3.5in', height: '2in' }}>
                {/* Left accent bar */}
                <div className="w-1.5 self-stretch bg-amber-500 rounded-full flex-shrink-0" />
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="bg-amber-500 p-1 rounded"><Truck className="w-3.5 h-3.5 text-slate-900" /></div>
                    <div className="font-black text-[11px] text-slate-900 leading-tight">FLEETCO<br /><span className="text-amber-600 text-[8px] tracking-widest">MANAGEMENT</span></div>
                  </div>
                  <div className="space-y-0.5 mt-2">
                    <p className="font-black text-[9px] text-slate-900">JaRell D. Slack</p>
                    <p className="font-black text-[9px] text-slate-900">Desiree Slack</p>
                    <p className="text-[7px] text-slate-500">Owners</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-0.5">
                    <div className="flex items-center gap-1 text-[8px] text-slate-700">
                      <Phone className="w-2.5 h-2.5 text-amber-600" /> (360) 952-1249
                    </div>
                    <div className="flex items-center gap-1 text-[8px] text-slate-500">
                      <Globe className="w-2.5 h-2.5 text-amber-600" /> fleetcomanagement.org
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Screen preview of business cards */}
          <div className="p-6 print:hidden space-y-4">
            <h3 className="font-black text-sm text-slate-900">Card Preview</h3>

            {/* Card 1: JaRell */}
            <div className="max-w-sm bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden">
              <div className="flex">
                <div className="w-2 bg-amber-500 flex-shrink-0" />
                <div className="p-5 flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                      <div className="bg-amber-500 p-1 rounded"><Truck className="w-4 h-4 text-slate-900" /></div>
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-900">FLEETCO <span className="text-amber-600 text-[9px] tracking-widest">MANAGEMENT</span></div>
                    <div className="mt-2">
                      <p className="font-black text-sm text-slate-900">JaRell D. Slack</p>
                      <p className="text-[10px] text-slate-500">Owner</p>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
                        <Phone className="w-3 h-3 text-amber-600" /> (360) 952-1249
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Globe className="w-3 h-3 text-amber-600" /> fleetcomanagement.org
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Desiree */}
            <div className="max-w-sm bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden">
              <div className="flex">
                <div className="w-2 bg-amber-500 flex-shrink-0" />
                <div className="p-5 flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                      <div className="bg-amber-500 p-1 rounded"><Truck className="w-4 h-4 text-slate-900" /></div>
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-900">FLEETCO <span className="text-amber-600 text-[9px] tracking-widest">MANAGEMENT</span></div>
                    <div className="mt-2">
                      <p className="font-black text-sm text-slate-900">Desiree Slack</p>
                      <p className="text-[10px] text-slate-500">Owner</p>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
                        <Phone className="w-3 h-3 text-amber-600" /> (360) 952-1249
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Globe className="w-3 h-3 text-amber-600" /> fleetcomanagement.org
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 pt-2">
              Print layout produces 10 cards per sheet — 5 of each owner card. Use the Print button to generate the full sheet.
            </p>
            <button onClick={() => window.print()} className="px-5 py-2.5 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg inline-flex items-center gap-2">
              <Download className="w-4 h-4" /> Print Business Cards
            </button>
          </div>
        </div>

        {/* Business Plan & Financial PDFs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4">
            <h2 className="font-black text-lg">Business Plan & Financial Projections</h2>
            <p className="text-slate-400 text-xs mt-1">10-year growth plan · revenue projections · P&amp;L scenarios</p>
          </div>
          <div className="p-6 grid md:grid-cols-3 gap-4">
            {[
              {
                title: 'Full Business Plan',
                desc: 'Executive summary, market analysis, products, GTM strategy, operations, risks, and financial overview.',
                href: BUSINESS_PLAN_PDF,
                icon: FileText,
                file: 'FleetCo-Business-Plan.pdf',
              },
              {
                title: '10-Year Revenue Projections',
                desc: 'Year-by-year customers, ARPU, annual revenue, ARR, and growth rates — base case 2026–2035.',
                href: REVENUE_PROJECTIONS_PDF,
                icon: TrendingUp,
                file: 'FleetCo-Revenue-Projections-10Year.pdf',
              },
              {
                title: 'Revenue P&L & Scenarios',
                desc: 'Profit & loss by year plus conservative, base, and optimistic scenarios at Year 5 and Year 10.',
                href: REVENUE_PANDL_PDF,
                icon: BarChart3,
                file: 'FleetCo-Revenue-PandL-Scenarios.pdf',
              },
            ].map(({ title, desc, href, icon: Icon, file }) => (
              <div key={file} className="border border-slate-200 rounded-xl p-5 flex flex-col">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-black text-sm text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 mt-2 flex-1 leading-relaxed">{desc}</p>
                <a
                  href={href}
                  download
                  className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
                <p className="text-[10px] text-slate-400 mt-2 text-center">{file}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Manual Link */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between print:hidden">
          <div>
            <h2 className="font-black text-lg text-slate-900">System User Manual</h2>
            <p className="text-slate-500 text-sm">Complete platform reference guide — 15 sections covering every module</p>
          </div>
          <Link to="/manual" className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-sm">
            View Manual <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
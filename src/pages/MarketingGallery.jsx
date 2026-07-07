import React, { useState } from 'react';
import { Eye, Download, Printer, FileText } from 'lucide-react';
import Flyer01_FleetServices from '@/components/marketing/Flyer01_FleetServices';
import Flyer02_SafetyCompliance from '@/components/marketing/Flyer02_SafetyCompliance';
import Flyer03_ShopServices from '@/components/marketing/Flyer03_ShopServices';
import Flyer04_DispatchServices from '@/components/marketing/Flyer04_DispatchServices';
import Flyer05_FuelSavings from '@/components/marketing/Flyer05_FuelSavings';
import Flyer06_TaxSeason from '@/components/marketing/Flyer06_TaxSeason';
import Flyer07_DriverRecruitment from '@/components/marketing/Flyer07_DriverRecruitment';
import Flyer08_Postcard from '@/components/marketing/Flyer08_Postcard';
import Flyer09_SocialSquare from '@/components/marketing/Flyer09_SocialSquare';
import Flyer10_DoorHanger from '@/components/marketing/Flyer10_DoorHanger';
import Email01_Welcome from '@/components/marketing/Email01_Welcome';
import Email02_Newsletter from '@/components/marketing/Email02_Newsletter';
import Sign01_YardSign from '@/components/marketing/Sign01_YardSign';
import Deck01_PitchDeck from '@/components/marketing/Deck01_PitchDeck';
import Ad01_LinkedInHeader from '@/components/marketing/Ad01_LinkedInHeader';
import Ad02_GoogleDisplay from '@/components/marketing/Ad02_GoogleDisplay';
import CaseStudy01_MidwestCarrier from '@/components/marketing/CaseStudy01_MidwestCarrier';
import Flyer11_IFTACompliance from '@/components/marketing/Flyer11_IFTACompliance';
import Flyer12_MaintenanceProgram from '@/components/marketing/Flyer12_MaintenanceProgram';
import Banner01_TradeShow from '@/components/marketing/Banner01_TradeShow';
import Email03_Nurture from '@/components/marketing/Email03_Nurture';

const TEMPLATES = [
  { id: 'Flyer01', name: 'Fleet Services Flyer', category: 'Flyer', component: Flyer01_FleetServices, desc: 'Full-service fleet management overview with service cards and CTA' },
  { id: 'Flyer02', name: 'Safety & Compliance Flyer', category: 'Flyer', component: Flyer02_SafetyCompliance, desc: 'DOT compliance, HOS, DVIR, and driver qualification focus' },
  { id: 'Flyer03', name: 'Shop Services Flyer', category: 'Flyer', component: Flyer03_ShopServices, desc: 'Truck & trailer repair services with pricing tiers' },
  { id: 'Flyer04', name: 'Dispatch Services Flyer', category: 'Flyer', component: Flyer04_DispatchServices, desc: 'Load sourcing, rate negotiation, and 24/7 dispatch support' },
  { id: 'Flyer05', name: 'Fuel Savings Flyer', category: 'Flyer', component: Flyer05_FuelSavings, desc: 'Fuel optimization program with 14-day AI price predictions' },
  { id: 'Flyer06', name: 'Tax Season Flyer', category: 'Flyer', component: Flyer06_TaxSeason, desc: 'IFTA, HVUT, and tax-ready financial exports for carriers' },
  { id: 'Flyer07', name: 'Driver Recruitment Flyer', category: 'Flyer', component: Flyer07_DriverRecruitment, desc: 'Hiring flyer with benefits, requirements, and contact info' },
  { id: 'Flyer08', name: 'Postcard Mailer', category: 'Direct Mail', component: Flyer08_Postcard, desc: 'Two-sided postcard for direct mail campaigns' },
  { id: 'Flyer09', name: 'Social Media Square', category: 'Social', component: Flyer09_SocialSquare, desc: 'Square format for Instagram, Facebook, and social feeds' },
  { id: 'Flyer10', name: 'Door Hanger', category: 'Direct Mail', component: Flyer10_DoorHanger, desc: 'Door hanger for truck stops, terminals, and offices' },
  { id: 'Email01', name: 'Welcome Email', category: 'Email', component: Email01_Welcome, desc: 'New customer onboarding email with getting-started steps' },
  { id: 'Email02', name: 'Monthly Newsletter', category: 'Email', component: Email02_Newsletter, desc: 'Monthly fleet insights, fuel prices, and platform updates' },
  { id: 'Sign01', name: 'Yard Sign', category: 'Signage', component: Sign01_YardSign, desc: 'Outdoor sign for fleet yards, terminals, and truck stops' },
  { id: 'Deck01', name: 'Investor Pitch Deck', category: 'Presentation', component: Deck01_PitchDeck, desc: 'Multi-slide presentation covering problem, solution, and features' },
  { id: 'Ad01', name: 'LinkedIn Banner', category: 'Digital Ad', component: Ad01_LinkedInHeader, desc: 'Company page header for LinkedIn and professional networks' },
  { id: 'Ad02', name: 'Google Display Ads', category: 'Digital Ad', component: Ad02_GoogleDisplay, desc: 'Leaderboard (728x90), Rectangle (300x250), and Skyscraper (160x600)' },
  { id: 'Case01', name: 'Case Study — Midwest Carrier', category: 'Sales', component: CaseStudy01_MidwestCarrier, desc: '47-truck carrier case study: 28% cost reduction across fuel, maintenance, compliance, and IFTA' },
  { id: 'Flyer11', name: 'IFTA & Compliance Suite', category: 'Flyer', component: Flyer11_IFTACompliance, desc: 'Deep dive on IFTA Dashboard, HOS/ELD, DVIR inspections, driver screening, and incident reporting' },
  { id: 'Flyer12', name: 'Maintenance Program Flyer', category: 'Flyer', component: Flyer12_MaintenanceProgram, desc: 'Work orders, service templates, PM scheduling, parts inventory, vendor contracts, and diagnostic tracking' },
  { id: 'Banner01', name: 'Trade Show Banner', category: 'Signage', component: Banner01_TradeShow, desc: 'Retractable trade show banner layout (33" x 78") with features grid and trust bar' },
  { id: 'Email03', name: 'Nurture Email — 5 Savings', category: 'Email', component: Email03_Nurture, desc: 'Detailed nurture email breaking down fuel, maintenance, compliance, dispatch, and visibility savings' },
];

const CATEGORIES = [...new Set(TEMPLATES.map(t => t.category))];

export default function MarketingGallery() {
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');

  const selected = TEMPLATES.find(t => t.id === selectedId);
  const filtered = filter === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === filter);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Marketing Gallery</h1>
        <p className="text-slate-500 text-sm mt-0.5">21 print-ready marketing templates — click any to preview, then print or save as PDF</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All (21)</button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {cat} ({TEMPLATES.filter(t => t.category === cat).length})
          </button>
        ))}
      </div>

      {/* Preview Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4" onClick={() => setSelectedId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="font-black text-slate-900">{selected.name}</h3>
                <p className="text-xs text-slate-500">{selected.category} — {selected.desc}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 text-sm font-bold bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print / PDF
                </button>
                <button onClick={() => setSelectedId(null)} className="px-4 py-2 text-sm font-bold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Close</button>
              </div>
            </div>
            <div className="p-6 bg-slate-100 max-h-[70vh] overflow-y-auto">
              <selected.component />
            </div>
          </div>
        </div>
      )}

      {/* Template Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(template => (
          <button
            key={template.id}
            onClick={() => setSelectedId(template.id)}
            className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md hover:border-amber-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">{template.category}</span>
              <Eye className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="font-black text-slate-900 text-sm">{template.name}</div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.desc}</p>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
              <Printer className="w-3 h-3" /> Click to preview & print
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
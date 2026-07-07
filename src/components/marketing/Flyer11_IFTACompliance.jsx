import React from 'react';
import { Shield, FileText, BarChart3, Globe, Phone, Truck, CheckCircle, AlertTriangle, Calendar, Search } from 'lucide-react';

export default function Flyer11_IFTACompliance() {
  return (
    <div className="max-w-[8.5in] mx-auto bg-white print:p-0" style={{ fontFamily: 'system-ui' }}>
      <div className="bg-slate-900 text-white p-8 rounded-t-2xl print:rounded-none">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-500 p-3 rounded-xl"><Globe className="w-8 h-8 text-slate-900" /></div>
          <div>
            <div className="font-black text-3xl">FLEETCO</div>
            <div className="text-amber-400 text-xs tracking-widest">COMPLIANCE SUITE</div>
          </div>
        </div>
        <h1 className="text-4xl font-black leading-tight">IFTA Filing in Minutes.<br/>Not Days.</h1>
        <p className="text-slate-300 text-lg mt-4">Automated IFTA reporting, HOS compliance monitoring, DVIR inspections, and driver screening — all FMCSA-ready.</p>
        <div className="flex gap-3 mt-6 flex-wrap">
          {['IFTA Dashboard', 'HOS / ELD Logs', 'DVIR Inspections', 'Driver Screening', 'Incident Reports'].map(t => (
            <span key={t} className="bg-slate-800 text-amber-400 px-4 py-2 rounded-full text-sm font-bold">{t}</span>
          ))}
        </div>
      </div>

      {/* IFTA Deep Dive */}
      <div className="p-8 border-b border-slate-200 bg-amber-50/30">
        <h2 className="font-black text-slate-900 text-xl mb-6 flex items-center gap-2">
          <Globe className="w-6 h-6 text-amber-600" /> IFTA Dashboard — Your Quarter-End Secret Weapon
        </h2>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-black text-slate-900 text-sm mb-3">What It Does</h3>
              <ul className="space-y-2.5">
                {[
                  'Auto-compiles all fuel purchases by state from your Fuel Logs',
                  'Calculates total miles per jurisdiction from trip data',
                  'Computes average MPG per state for accurate tax calculations',
                  'Generates FMCSA-ready summary with tax liability breakdown',
                  'Select any quarter/year — data is always live and auditable',
                  'One-click Excel export for your CPA or self-filing',
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <div className="bg-slate-900 rounded-xl p-5 text-white">
              <h3 className="font-black text-sm mb-3 text-amber-400">Time Saved Per Quarter</h3>
              <div className="space-y-3">
                {[
                  { task: 'Manual spreadsheet compilation', before: '8 hours', after: '0 min' },
                  { task: 'Per-state mileage calculation', before: '6 hours', after: 'Auto' },
                  { task: 'Fuel reconciliation by state', before: '5 hours', after: 'Auto' },
                  { task: 'Tax liability computation', before: '3 hours', after: '1 click' },
                  { task: 'Report formatting & export', before: '4 hours', after: 'Instant' },
                ].map(({ task, before, after }) => (
                  <div key={task} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{task}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 line-through">{before}</span>
                      <span className="text-green-400 font-bold">{after}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                <span className="text-2xl font-black text-amber-400">26 hrs</span>
                <p className="text-slate-400 text-xs">saved per quarter × 4 = <strong className="text-white">104 hrs/year</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOS + DVIR */}
      <div className="grid grid-cols-2 gap-0 border-b border-slate-200">
        <div className="p-8 bg-white border-r border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
            <h2 className="font-black text-slate-900">HOS / ELD Logs</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">Full FMCSA-compliant hours-of-service logging with automatic violation detection and driver certification workflow.</p>
          <ul className="space-y-2">
            {[
              'Track duty status: Off Duty, Sleeper, Driving, On Duty',
              'Auto-detect 11-hour, 14-hour, and 70-hour violations',
              'Digital driver signature certification',
              'Manager review & approval workflow',
              'Filterable dashboard with violation summaries',
              'Export-ready for roadside inspections',
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600">
                <CheckCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-8 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg"><AlertTriangle className="w-5 h-5 text-purple-600" /></div>
            <h2 className="font-black text-slate-900">DVIR Inspections</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">Digital pre-trip and post-trip vehicle inspection reports with manager sign-off workflow and PDF export.</p>
          <ul className="space-y-2">
            {[
              'Pre-Trip and Post-Trip checklists per FMCSA §396.11/§396.13',
              'Digital signature pad for driver & manager authentication',
              'Employee number auto-captured on every signature',
              'Defect tracking with automatic manager sign-off trigger',
              'Combined PDF export of all inspections for date range',
              'Printable DVIR reports with defect summaries',
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600">
                <CheckCircle className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Driver Screening + Incidents */}
      <div className="grid grid-cols-2 gap-0 border-b border-slate-200">
        <div className="p-8 bg-slate-50 border-r border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-green-100 p-2 rounded-lg"><Search className="w-5 h-5 text-green-600" /></div>
            <h2 className="font-black text-slate-900">Driver Screening</h2>
          </div>
          <ul className="space-y-2">
            {[
              'Track Background Checks, MVR Reports, Drug Tests per driver',
              'Provider tracking: Checkr, Sterling, HireRight, or Manual',
              'Status: Pending → In Progress → Clear / Flagged / Failed',
              'Expiration date monitoring with automatic alerts',
              'Upload and store screening reports directly',
              'Violation flags and notes for compliance review',
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-8 bg-slate-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-red-100 p-2 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            <h2 className="font-black text-slate-900">Incident Reports</h2>
          </div>
          <ul className="space-y-2">
            {[
              'Log Accidents, Near Misses, CSA Violations, Cargo Damage',
              'Severity tracking: Minor → Moderate → Serious → Critical',
              'DOT Recordable flag for FMCSA reporting',
              'CSA point tracking with citation list',
              'Insurance claim number and damage cost tracking',
              'Corrective action documentation and status workflow',
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600">
                <CheckCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-amber-500 text-slate-900 p-6 text-center rounded-b-2xl print:rounded-none">
        <h3 className="font-black text-xl">Stop dreading audit season.</h3>
        <p className="text-sm mt-1">Every compliance module is FMCSA-ready. Start your free demo today.</p>
        <div className="flex items-center justify-center gap-6 mt-3 text-base font-black">
          <span className="flex items-center gap-2"><Phone className="w-5 h-5" /> (360) 952-1249</span>
          <span className="flex items-center gap-2"><Globe className="w-5 h-5" /> fleetcomanagement.org</span>
        </div>
      </div>
    </div>
  );
}
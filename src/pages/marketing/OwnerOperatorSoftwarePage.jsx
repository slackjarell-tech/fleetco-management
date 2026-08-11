import React from 'react';
import { Link } from 'react-router-dom';
import MarketingShell, { MarketingHero } from '@/components/marketing/public/MarketingShell';

export default function OwnerOperatorSoftwarePage() {
  return (
    <MarketingShell
      title="Owner Operator Dispatch Software"
      description="Owner-operator trucking software — one login for dispatch and driving, load board, DVIR, fuel, and payroll."
      path="/owner-operator-software"
    >
      <MarketingHero
        badge="Owner Operators"
        title="Dispatch Software Built for Owner-Ops"
        subtitle="Run loads, clock in, complete DVIRs, and manage fuel — from the same account you use to dispatch your business."
        dark={false}
      />
      <section className="py-16 max-w-3xl mx-auto px-4 prose prose-slate">
        <h2 className="text-xl font-black">Why owner-operators choose FleetCo</h2>
        <ul className="text-slate-600 space-y-2 text-sm">
          <li><strong>Owner-operator mode</strong> — portal + driver app on one login</li>
          <li><strong>Load board</strong> — post or book freight with equipment matching</li>
          <li><strong>Electronic BOL</strong> — download PDFs to your phone</li>
          <li><strong>Maintenance & fuel</strong> — PM schedules and fuel audit in one place</li>
          <li><strong>From $299/mo</strong> — full platform, no per-module nickel-and-diming</li>
        </ul>
        <div className="flex flex-wrap gap-3 mt-8 not-prose">
          <Link to="/start-trial" className="bg-amber-500 text-slate-900 font-bold px-6 py-3 rounded-lg text-sm">Start trial</Link>
          <Link to="/fleet-owners" className="border border-slate-300 font-bold px-6 py-3 rounded-lg text-sm">Need managed help?</Link>
        </div>
      </section>
    </MarketingShell>
  );
}

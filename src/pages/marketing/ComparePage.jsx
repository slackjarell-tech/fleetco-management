import React from 'react';
import { Link } from 'react-router-dom';
import MarketingShell, { MarketingHero } from '@/components/marketing/public/MarketingShell';
import { COMPARE_COMPETITORS, COMPARE_ROWS, ELD_DISCLAIMER } from '@/lib/marketing/compareData';
import { AlertCircle } from 'lucide-react';

export default function ComparePage() {
  return (
    <MarketingShell
      title="Compare FleetCo"
      description="Compare FleetCo vs FleetLegend, Samsara, Motive, and Fleetio for small fleet TMS, load board, and yard management."
      path="/compare"
    >
      <MarketingHero
        badge="Comparison"
        title="FleetCo vs Alternatives"
        subtitle="Honest comparison for owner-operators and small fleets — what we do better and where we differ."
        dark={false}
      />

      <section className="py-12 max-w-6xl mx-auto px-4 overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 pr-4 font-bold text-slate-500">Feature</th>
              {COMPARE_COMPETITORS.map((c) => (
                <th key={c.id} className={`py-3 px-2 font-black ${c.highlight ? 'text-amber-600 bg-amber-50' : 'text-slate-800'}`}>
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.feature} className="border-b border-slate-100">
                <td className="py-3 pr-4 text-slate-700 font-medium">{row.feature}</td>
                {COMPARE_COMPETITORS.map((c) => (
                  <td key={c.id} className={`py-3 px-2 text-center ${c.highlight ? 'bg-amber-50/50 font-semibold' : 'text-slate-600'}`}>
                    {row.values[c.id]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="py-8 max-w-3xl mx-auto px-4">
        <div className="flex gap-3 bg-slate-50 border border-slate-200 rounded-xl p-5">
          <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
          <p className="text-sm text-slate-600">{ELD_DISCLAIMER}</p>
        </div>
      </section>

      <section className="py-12 text-center">
        <Link to="/start-trial" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-3 rounded-lg inline-block">
          Start free trial
        </Link>
      </section>
    </MarketingShell>
  );
}

import React, { useState, useMemo } from 'react';
import { FileText, Download, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

// IFTA quarters
const QUARTERS = [
  { label: 'Q1 (Jan–Mar)', months: [0, 1, 2] },
  { label: 'Q2 (Apr–Jun)', months: [3, 4, 5] },
  { label: 'Q3 (Jul–Sep)', months: [6, 7, 8] },
  { label: 'Q4 (Oct–Dec)', months: [9, 10, 11] },
];

// US state tax rates per gallon (approximate 2024 diesel rates for demo)
const STATE_TAX_RATES = {
  AL: 0.280, AK: 0.095, AZ: 0.260, AR: 0.285, CA: 0.800, CO: 0.205,
  CT: 0.490, DE: 0.220, FL: 0.330, GA: 0.320, HI: 0.160, ID: 0.320,
  IL: 0.467, IN: 0.530, IA: 0.325, KS: 0.260, KY: 0.246, LA: 0.200,
  ME: 0.312, MD: 0.362, MA: 0.240, MI: 0.263, MN: 0.285, MS: 0.180,
  MO: 0.170, MT: 0.295, NE: 0.246, NV: 0.520, NH: 0.222, NJ: 0.415,
  NM: 0.220, NY: 0.458, NC: 0.362, ND: 0.230, OH: 0.470, OK: 0.190,
  OR: 0.380, PA: 0.747, RI: 0.340, SC: 0.250, SD: 0.280, TN: 0.270,
  TX: 0.200, UT: 0.315, VT: 0.320, VA: 0.272, WA: 0.494, WV: 0.357,
  WI: 0.329, WY: 0.240, DC: 0.235,
};

function getStateFromLocation(location) {
  if (!location) return null;
  // Try to extract 2-letter state abbreviation from location string
  const match = location.match(/\b([A-Z]{2})\b/);
  if (match && STATE_TAX_RATES[match[1]]) return match[1];
  return null;
}

export default function IFTAReport({ logs, vehicles }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  const [expandedVehicle, setExpandedVehicle] = useState(null);

  const years = [currentYear, currentYear - 1, currentYear - 2];

  const quarterLogs = useMemo(() => {
    const { months } = QUARTERS[quarter];
    return logs.filter(l => {
      if (!l.date) return false;
      const d = new Date(l.date);
      return d.getFullYear() === year && months.includes(d.getMonth());
    });
  }, [logs, year, quarter]);

  // Aggregate by vehicle
  const vehicleData = useMemo(() => {
    const truckVehicles = vehicles.filter(v => v.unit_type === 'truck' || !v.unit_type);
    return truckVehicles.map(v => {
      const vLogs = quarterLogs.filter(l => l.vehicle_id === v.id);
      if (vLogs.length === 0) return null;

      const totalGallons = vLogs.reduce((s, l) => s + (l.gallons || 0), 0);
      const totalCost = vLogs.reduce((s, l) => s + (l.total_cost || 0), 0);

      // Odometer-based total miles
      const sorted = [...vLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
      const hasOdometer = sorted.some(l => l.odometer_reading);
      const totalMiles = hasOdometer
        ? (sorted[sorted.length - 1].odometer_reading || 0) - (sorted[0].odometer_reading || 0)
        : 0;
      const mpg = totalGallons > 0 && totalMiles > 0 ? totalMiles / totalGallons : 0;

      // Breakdown by state
      const byState = {};
      vLogs.forEach(l => {
        const state = getStateFromLocation(l.location);
        if (state) {
          if (!byState[state]) byState[state] = { gallons: 0, cost: 0, count: 0 };
          byState[state].gallons += l.gallons || 0;
          byState[state].cost += l.total_cost || 0;
          byState[state].count++;
        }
      });

      // IFTA tax calculation per state
      const stateEntries = Object.entries(byState).map(([state, data]) => {
        const taxRate = STATE_TAX_RATES[state] || 0.25;
        const taxOwed = data.gallons * taxRate;
        return { state, ...data, taxRate, taxOwed };
      });

      const totalTaxOwed = stateEntries.reduce((s, e) => s + e.taxOwed, 0);
      const untaggedLogs = vLogs.filter(l => !getStateFromLocation(l.location)).length;

      return { vehicle: v, vLogs, totalGallons, totalCost, totalMiles, mpg, stateEntries, totalTaxOwed, untaggedLogs };
    }).filter(Boolean);
  }, [quarterLogs, vehicles]);

  const grandTotals = useMemo(() => ({
    gallons: vehicleData.reduce((s, v) => s + v.totalGallons, 0),
    miles: vehicleData.reduce((s, v) => s + v.totalMiles, 0),
    tax: vehicleData.reduce((s, v) => s + v.totalTaxOwed, 0),
    cost: vehicleData.reduce((s, v) => s + v.totalCost, 0),
  }), [vehicleData]);

  const handleExportCSV = () => {
    const rows = [['Unit #', 'State', 'Gallons', 'Tax Rate', 'Tax Owed', 'Fuel Cost']];
    vehicleData.forEach(vd => {
      vd.stateEntries.forEach(e => {
        rows.push([
          vd.vehicle.unit_number,
          e.state,
          e.gallons.toFixed(3),
          e.taxRate.toFixed(3),
          e.taxOwed.toFixed(2),
          e.cost.toFixed(2),
        ]);
      });
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IFTA_${year}_Q${quarter + 1}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* IFTA Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-300" /> IFTA Quarterly Fuel Tax Report
            </h2>
            <p className="text-blue-200 text-xs mt-0.5">International Fuel Tax Agreement — FMCSA Compliant</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="bg-blue-800 border border-blue-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={quarter}
              onChange={e => setQuarter(Number(e.target.value))}
              className="bg-blue-800 border border-blue-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            >
              {QUARTERS.map((q, i) => <option key={i} value={i}>{q.label}</option>)}
            </select>
            <Button
              size="sm"
              onClick={handleExportCSV}
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Compliance notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
        <span>
          <strong>IFTA Filing Reminder:</strong> Quarterly returns are due April 30, July 31, October 31, and January 31.
          State tax rates shown are approximate — verify current rates with your base jurisdiction before filing.
          Include location/state abbreviation in fuel logs (e.g. "Dallas, TX") for accurate per-state reporting.
        </span>
      </div>

      {/* Grand totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Gallons', value: grandTotals.gallons.toFixed(1) + ' gal', color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Total Miles', value: grandTotals.miles > 0 ? grandTotals.miles.toLocaleString() + ' mi' : 'N/A', color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Est. Tax Owed', value: '$' + grandTotals.tax.toFixed(2), color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Total Fuel Cost', value: '$' + grandTotals.cost.toFixed(2), color: 'text-purple-700', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-vehicle breakdown */}
      {vehicleData.length === 0 ? (
        <div className="text-center py-14 text-slate-400 bg-white rounded-xl border border-slate-200">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No fuel logs found for this period.</p>
          <p className="text-xs mt-1">Add fuel logs with state in the location field to generate IFTA reports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicleData.map(vd => {
            const isOpen = expandedVehicle === vd.vehicle.id;
            return (
              <div key={vd.vehicle.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Vehicle header row */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedVehicle(isOpen ? null : vd.vehicle.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-700 font-black text-xs">{vd.vehicle.unit_number}</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        Unit #{vd.vehicle.unit_number} — {vd.vehicle.year} {vd.vehicle.make} {vd.vehicle.model}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {vd.vLogs.length} fill-ups · {vd.stateEntries.length} state(s)
                        {vd.untaggedLogs > 0 && (
                          <span className="ml-2 text-amber-600 font-bold">⚠ {vd.untaggedLogs} untagged location(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden sm:block">
                      <div className="text-sm font-bold text-slate-900">{vd.totalGallons.toFixed(1)} gal</div>
                      <div className="text-xs text-slate-400">gallons</div>
                    </div>
                    <div>
                      <div className="text-sm font-black text-red-700">${vd.totalTaxOwed.toFixed(2)}</div>
                      <div className="text-xs text-slate-400">est. tax</div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded state breakdown */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    {vd.stateEntries.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No state data available. Add state abbreviations to fuel log locations (e.g. "Memphis, TN").
                      </p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-400 font-bold border-b border-slate-100">
                            <th className="pb-2">State</th>
                            <th className="pb-2 text-right">Fill-ups</th>
                            <th className="pb-2 text-right">Gallons</th>
                            <th className="pb-2 text-right">Tax Rate</th>
                            <th className="pb-2 text-right">Est. Tax Owed</th>
                            <th className="pb-2 text-right">Fuel Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vd.stateEntries.sort((a, b) => a.state.localeCompare(b.state)).map(e => (
                            <tr key={e.state} className="border-b border-slate-50 hover:bg-slate-50">
                              <td className="py-2">
                                <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{e.state}</span>
                              </td>
                              <td className="py-2 text-right text-slate-600">{e.count}</td>
                              <td className="py-2 text-right text-slate-700">{e.gallons.toFixed(3)}</td>
                              <td className="py-2 text-right text-slate-600">${e.taxRate.toFixed(3)}/gal</td>
                              <td className="py-2 text-right font-bold text-red-700">${e.taxOwed.toFixed(2)}</td>
                              <td className="py-2 text-right text-slate-600">${e.cost.toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="font-black text-slate-900 bg-slate-50">
                            <td className="py-2 text-xs uppercase tracking-wide">Total</td>
                            <td className="py-2 text-right">{vd.vLogs.length}</td>
                            <td className="py-2 text-right">{vd.totalGallons.toFixed(3)}</td>
                            <td />
                            <td className="py-2 text-right text-red-700">${vd.totalTaxOwed.toFixed(2)}</td>
                            <td className="py-2 text-right">${vd.totalCost.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                    {/* MPG */}
                    {vd.mpg > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Fleet MPG this quarter: {vd.mpg.toFixed(2)} mpg ({vd.totalMiles.toLocaleString()} mi / {vd.totalGallons.toFixed(1)} gal)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
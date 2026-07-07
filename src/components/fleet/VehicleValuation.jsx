import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { DollarSign, TrendingDown, TrendingUp, Gauge, Wrench, Package, BarChart2, ExternalLink, AlertCircle } from 'lucide-react';

/**
 * Industry-standard depreciation model:
 * - Year 1: ~20–25% loss (new vehicles lose most value immediately)
 * - Years 2–5: ~15%/yr compounding
 * - Years 6+: ~10%/yr compounding
 * - Mileage penalty: $0.05–$0.10 per mile above average (15,000 mi/yr for trucks)
 * - Condition multiplier applied on top
 * - Absolute floor: 5% of purchase price
 */
function calcAdvancedDepreciation(purchasePrice, purchaseDate, yearMade, odometer, condition, unitType) {
  if (!purchasePrice) return null;

  let ageYears = 0;
  if (purchaseDate) {
    ageYears = (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  } else if (yearMade) {
    ageYears = new Date().getFullYear() - yearMade;
  }
  ageYears = Math.max(0, ageYears);

  // Build value at each year milestone
  let value = purchasePrice;
  const schedule = [];

  for (let y = 0; y <= Math.ceil(ageYears) + 5; y++) {
    schedule.push({ year: y, value: Math.round(value) });
    if (y === 0) {
      // First year: 25% for trucks, 15% for trailers
      value *= unitType === 'trailer' ? 0.85 : 0.75;
    } else if (y < 5) {
      value *= unitType === 'trailer' ? 0.88 : 0.85;
    } else {
      value *= unitType === 'trailer' ? 0.91 : 0.90;
    }
    value = Math.max(value, purchasePrice * 0.05);
  }

  // Interpolate current value based on fractional ageYears
  const floorIdx = Math.floor(ageYears);
  const ceilIdx = Math.min(floorIdx + 1, schedule.length - 1);
  const frac = ageYears - floorIdx;
  let currentValue = schedule[floorIdx].value + (schedule[ceilIdx].value - schedule[floorIdx].value) * frac;

  // Mileage adjustment (avg is ~15,000 mi/yr for trucks, 0 for trailers)
  let mileageNote = null;
  if (odometer && ageYears > 0 && unitType !== 'trailer') {
    const avgMiles = ageYears * 15000;
    const excessMiles = odometer - avgMiles;
    if (Math.abs(excessMiles) > 5000) {
      const penalty = excessMiles * 0.06; // $0.06/mi excess penalty
      currentValue = Math.max(currentValue - penalty, purchasePrice * 0.05);
      mileageNote = excessMiles > 0
        ? `−$${Math.round(Math.abs(penalty)).toLocaleString()} for ${Math.round(excessMiles).toLocaleString()} excess miles`
        : `+$${Math.round(Math.abs(penalty)).toLocaleString()} for below-avg mileage`;
    }
  }

  // Condition multiplier
  const conditionMultipliers = { excellent: 1.10, good: 1.00, fair: 0.85, poor: 0.70 };
  const condMult = conditionMultipliers[condition] || 1.00;
  currentValue *= condMult;
  currentValue = Math.max(currentValue, purchasePrice * 0.05);

  const totalLost = purchasePrice - currentValue;
  const retainedPct = (currentValue / purchasePrice) * 100;

  return {
    currentValue: Math.round(currentValue),
    totalLost: Math.round(totalLost),
    retainedPct: retainedPct.toFixed(0),
    ageYears: ageYears.toFixed(1),
    schedule: schedule.slice(0, Math.min(schedule.length, 11)), // max 10 years shown
    mileageNote,
    conditionMultiplier: condMult,
  };
}

function StatBox({ label, value, sub, icon: Icon, color = 'text-slate-700' }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

const VALUATION_TOOLS = [
  { name: 'Kelley Blue Book', short: 'KBB', color: 'bg-blue-600', url: (v) => `https://www.kbb.com/cars-for-sale/?${v.year ? `year=${v.year}&` : ''}${v.make ? `make=${encodeURIComponent(v.make)}&` : ''}${v.model ? `model=${encodeURIComponent(v.model)}` : ''}`, desc: 'Industry standard' },
  { name: 'Carfax', short: 'Carfax', color: 'bg-red-600', url: (v) => v.vin ? `https://www.carfax.com/vehicle/${v.vin}` : `https://www.carfax.com/`, desc: 'VIN history-based' },
  { name: 'TrueCar', short: 'TrueCar', color: 'bg-green-600', url: (v) => `https://www.truecar.com/used-cars-for-sale/listings/${encodeURIComponent(v.make || '')}/${encodeURIComponent(v.model || '')}/?year=${v.year || ''}`, desc: 'Local market pricing' },
  { name: 'Autotrader', short: 'AutoTrader', color: 'bg-orange-600', url: (v) => `https://www.autotrader.com/cars-for-sale/used-cars/${encodeURIComponent(v.make || '')}/${encodeURIComponent(v.model || '')}`, desc: 'Instant valuation' },
  { name: 'CarGurus', short: 'CarGurus', color: 'bg-purple-600', url: (v) => `https://www.cargurus.com/Cars/new/nl_s${v.make ? `?trim=${encodeURIComponent(v.make)}` : ''}`, desc: 'Instant Market Value' },
];

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent', desc: '+10% — Like new, no issues' },
  { value: 'good', label: 'Good', desc: 'Baseline — Normal wear' },
  { value: 'fair', label: 'Fair', desc: '−15% — Visible wear/minor issues' },
  { value: 'poor', label: 'Poor', desc: '−30% — Major wear/repairs needed' },
];

export default function VehicleValuation({ vehicle }) {
  const [loads, setLoads] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [condition, setCondition] = useState('good');
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    Promise.all([
      api.entities.Load.filter({ assigned_vehicle_id: vehicle.id }, '-pickup_date', 500),
      api.entities.WorkOrder.filter({ vehicle_id: vehicle.id }, '-opened_date', 500),
      api.entities.FuelLog.filter({ vehicle_id: vehicle.id }, '-date', 500),
    ]).then(([ls, wos, fuel]) => {
      setLoads(ls);
      setWorkOrders(wos);
      setFuelLogs(fuel);
      setLoading(false);
    });
  }, [vehicle.id]);

  const valuation = useMemo(() =>
    calcAdvancedDepreciation(vehicle.purchase_price, vehicle.purchase_date, vehicle.year, vehicle.odometer, condition, vehicle.unit_type),
    [vehicle, condition]
  );

  const financials = useMemo(() => {
    const totalRevenue = loads.reduce((s, l) => s + (l.rate || 0), 0);
    const totalMiles = loads.reduce((s, l) => s + (l.miles || 0), 0);
    const repairCost = workOrders.filter(w => w.status === 'completed').reduce((s, w) => s + (w.total_cost || 0), 0);
    const fuelCost = fuelLogs.reduce((s, f) => s + (f.total_cost || 0), 0);
    const totalCost = repairCost + fuelCost;
    const netProfit = totalRevenue - totalCost;
    const rpmRevenue = totalMiles > 0 ? totalRevenue / totalMiles : 0;
    const rpmCost = totalMiles > 0 ? totalCost / totalMiles : 0;
    return { totalRevenue, totalMiles, repairCost, fuelCost, totalCost, netProfit, rpmRevenue, rpmCost };
  }, [loads, workOrders, fuelLogs]);

  const fmt = (n) => `$${Math.round(n || 0).toLocaleString()}`;
  const fmtPm = (n) => `$${(n || 0).toFixed(3)}/mi`;

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <div className="w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── VALUATION ── */}
      {vehicle.purchase_price ? (
        <div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5" /> Asset Valuation & Depreciation
          </div>

          {/* Condition Selector */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-500 mb-2">Vehicle Condition</div>
            <div className="grid grid-cols-4 gap-1.5">
              {CONDITIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCondition(c.value)}
                  className={`text-center px-2 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    condition === c.value
                      ? 'bg-amber-500 border-amber-500 text-slate-900'
                      : 'border-slate-200 text-slate-600 hover:border-amber-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400 mt-1.5">
              {CONDITIONS.find(c => c.value === condition)?.desc}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <StatBox label="Purchase Price" value={fmt(vehicle.purchase_price)} sub={vehicle.purchase_date ? `Bought ${vehicle.purchase_date}` : (vehicle.year ? `${vehicle.year} model year` : undefined)} icon={DollarSign} color="text-slate-700" />
            <StatBox label="Est. Current Value" value={fmt(valuation.currentValue)} sub={`After ${valuation.ageYears} years`} icon={TrendingDown} color="text-amber-600" />
            <StatBox label="Total Depreciation" value={fmt(valuation.totalLost)} sub={`Year 1: ~25% · Years 2–5: ~15%/yr`} icon={TrendingDown} color="text-red-500" />
            <StatBox label="Value Retained" value={`${valuation.retainedPct}%`} sub="of original price" icon={BarChart2} color="text-green-600" />
          </div>

          {valuation.mileageNote && (
            <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Mileage adjustment: {valuation.mileageNote}</span>
            </div>
          )}

          {/* Depreciation Schedule */}
          <button
            onClick={() => setShowSchedule(s => !s)}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 mb-2"
          >
            {showSchedule ? '▲ Hide' : '▼ Show'} year-by-year depreciation schedule
          </button>
          {showSchedule && (
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800 text-slate-300">
                    <th className="px-3 py-2 text-left font-semibold">Year</th>
                    <th className="px-3 py-2 text-right font-semibold">Est. Value</th>
                    <th className="px-3 py-2 text-right font-semibold">Retained</th>
                    <th className="px-3 py-2 text-right font-semibold">Lost</th>
                  </tr>
                </thead>
                <tbody>
                  {valuation.schedule.map((row, i) => {
                    const isCurrentYear = Math.floor(parseFloat(valuation.ageYears)) === row.year;
                    return (
                      <tr key={row.year} className={`border-t border-slate-100 ${isCurrentYear ? 'bg-amber-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-3 py-2 font-medium text-slate-700">
                          Year {row.year} {isCurrentYear && <span className="text-amber-600 font-bold">← now</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">{fmt(row.value)}</td>
                        <td className="px-3 py-2 text-right text-green-600">{((row.value / vehicle.purchase_price) * 100).toFixed(0)}%</td>
                        <td className="px-3 py-2 text-right text-red-500">{fmt(vehicle.purchase_price - row.value)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Live Market Valuation Tools */}
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Get a Live Market Value</div>
            <div className="grid grid-cols-1 gap-2">
              {VALUATION_TOOLS.map(tool => (
                <a
                  key={tool.name}
                  href={tool.url(vehicle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`${tool.color} text-white text-xs font-black px-2 py-1 rounded-lg w-20 text-center`}>{tool.short}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{tool.name}</div>
                      <div className="text-xs text-slate-400">{tool.desc}</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Add a <strong>Purchase Price</strong> to this unit to see valuation, depreciation schedule, and market value tools.
        </div>
      )}

      {/* ── REVENUE & COSTS ── */}
      <div>
        <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" /> Revenue & Operating Costs
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Total Revenue" value={fmt(financials.totalRevenue)} sub={`${loads.length} loads`} icon={TrendingUp} color="text-green-600" />
          <StatBox label="Net Profit" value={fmt(financials.netProfit)} sub="revenue minus costs" icon={DollarSign} color={financials.netProfit >= 0 ? 'text-green-600' : 'text-red-500'} />
          <StatBox label="Repair Costs" value={fmt(financials.repairCost)} sub={`${workOrders.filter(w => w.status === 'completed').length} work orders`} icon={Wrench} color="text-orange-500" />
          <StatBox label="Fuel Costs" value={fmt(financials.fuelCost)} sub={`${fuelLogs.length} fill-ups`} icon={Gauge} color="text-blue-500" />
        </div>
      </div>

      {/* ── COST PER MILE ── */}
      <div>
        <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5" /> Cost Per Mile Analysis
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Total Miles" value={(financials.totalMiles || 0).toLocaleString()} sub="across all loads" icon={Gauge} color="text-slate-700" />
          <StatBox label="Revenue / Mile" value={financials.totalMiles > 0 ? fmtPm(financials.rpmRevenue) : '—'} sub="avg across loads" icon={TrendingUp} color="text-green-600" />
          <StatBox label="Cost / Mile" value={financials.totalMiles > 0 ? fmtPm(financials.rpmCost) : '—'} sub="fuel + repairs" icon={TrendingDown} color="text-red-500" />
          <StatBox label="Profit / Mile" value={financials.totalMiles > 0 ? fmtPm(financials.rpmRevenue - financials.rpmCost) : '—'} sub="net" icon={BarChart2} color={(financials.rpmRevenue - financials.rpmCost) >= 0 ? 'text-green-600' : 'text-red-500'} />
        </div>
      </div>

      {/* ── LOAD BREAKDOWN ── */}
      {loads.length > 0 && (
        <div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Load History
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {loads.slice(0, 20).map(l => (
              <div key={l.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-800">#{l.load_number}</span>
                  <span className="text-slate-400 text-xs ml-2">{l.origin} → {l.destination}</span>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="font-bold text-green-600">{l.rate ? fmt(l.rate) : '—'}</div>
                  {l.miles > 0 && l.rate > 0 && (
                    <div className="text-xs text-slate-400">${(l.rate / l.miles).toFixed(2)}/mi</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
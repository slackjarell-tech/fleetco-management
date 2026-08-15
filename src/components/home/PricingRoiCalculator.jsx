import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PricingRoiCalculator() {
  const [trucks, setTrucks] = useState(5);
  const [fuelSavings, setFuelSavings] = useState(75);
  const [downtimeHours, setDowntimeHours] = useState(4);

  const planCost = trucks * 35;
  const monthlySavings = trucks * fuelSavings + downtimeHours * 85;
  const net = monthlySavings - planCost;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 sm:p-8 text-white max-w-xl mx-auto">
      <h3 className="text-lg font-black mb-1">ROI Estimator</h3>
      <p className="text-slate-400 text-sm mb-6">Rough monthly savings vs FleetCo subscription</p>
      <div className="space-y-4 text-sm">
        <label className="block">
          <span className="text-slate-400">Fleet size (trucks)</span>
          <input type="range" min={1} max={20} value={trucks} onChange={(e) => setTrucks(Number(e.target.value))} className="w-full mt-1 accent-amber-500" />
          <span className="font-bold">{trucks} trucks</span>
        </label>
        <label className="block">
          <span className="text-slate-400">Fuel audit savings per truck ($/mo)</span>
          <input type="range" min={0} max={200} step={25} value={fuelSavings} onChange={(e) => setFuelSavings(Number(e.target.value))} className="w-full mt-1 accent-amber-500" />
          <span className="font-bold">${fuelSavings}/truck</span>
        </label>
        <label className="block">
          <span className="text-slate-400">Downtime hours avoided per month</span>
          <input type="range" min={0} max={20} value={downtimeHours} onChange={(e) => setDowntimeHours(Number(e.target.value))} className="w-full mt-1 accent-amber-500" />
          <span className="font-bold">{downtimeHours} hrs (~$85/hr)</span>
        </label>
      </div>
      <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-slate-500">Est. savings</div>
          <div className="text-lg font-black text-green-400">${monthlySavings.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Plan cost</div>
          <div className="text-lg font-black">${planCost}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Net / mo</div>
          <div className={`text-lg font-black ${net >= 0 ? 'text-amber-400' : 'text-red-400'}`}>${net.toLocaleString()}</div>
        </div>
      </div>
      <Link to="/start-trial" className="mt-6 block text-center bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-lg text-sm">
        Start free trial / demo
      </Link>
    </div>
  );
}

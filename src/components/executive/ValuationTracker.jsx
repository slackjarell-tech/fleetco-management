import React from 'react';
import { TrendingUp, DollarSign, BarChart3, Target, Building2, CalendarDays, Users, ArrowUpRight, Gauge } from 'lucide-react';

const fmt = (n) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${Number(n || 0).toFixed(0)}`;
};

// Pricing tiers
const PLANS = {
  starter: { price: 299, label: 'Starter' },
  growth: { price: 599, label: 'Growth' },
  enterprise: { price: 999, label: 'Enterprise' },
};

// Estimate plan from customer data
function estimatePlan(customer) {
  const fleet = customer.fleet_size || 5;
  if (fleet <= 8) return 'starter';
  if (fleet <= 45) return 'growth';
  return 'enterprise';
}

// SaaS valuation multiples by ARR tier
function getValuationMultiple(arr) {
  if (arr >= 5000000) return 8;
  if (arr >= 1000000) return 7;
  if (arr >= 500000) return 6;
  if (arr >= 100000) return 5;
  return 3.5;
}

export default function ValuationTracker({ customers, totalRevenue, loadRevenue, fuelSpend, maintCost, pendingRevenue }) {
  const active = customers.filter(c => c.status === 'active');

  // MRR & ARR
  const mrr = active.reduce((sum, c) => {
    const plan = estimatePlan(c);
    return sum + (PLANS[plan]?.price || 299);
  }, 0);
  const arr = mrr * 12;

  // System Valuation
  const multiple = getValuationMultiple(arr);
  const valuation = arr * multiple;

  // Revenue metrics
  const allRevenue = totalRevenue + loadRevenue;
  const allCosts = fuelSpend + maintCost;
  const netProfit = allRevenue - allCosts;
  const profitMargin = allRevenue > 0 ? ((netProfit / allRevenue) * 100).toFixed(1) : '0.0';

  // Customer metrics
  const avgRevenuePerCustomer = active.length > 0 ? mrr / active.length : 0;
  const avgCostPerCustomer = active.length > 0 ? allCosts / Math.max(active.length, 1) : 0;

  // Growth rate (new customers this month)
  const now = new Date();
  const thisMonth = active.filter(c => {
    const cd = new Date(c.created_date);
    return cd.getMonth() === now.getMonth() && cd.getFullYear() === now.getFullYear();
  }).length;

  // Valuation milestones
  const milestones = [
    { customers: 25, label: '25 Fleets', multiple: 5, price: 599 },
    { customers: 100, label: '100 Fleets', multiple: 7, price: 599 },
    { customers: 500, label: '500 Fleets', multiple: 8, price: 700 },
  ].map(m => ({
    ...m,
    valuation: m.customers * m.price * 12 * m.multiple,
  }));

  const totalSubscribers = customers.filter(c => c.status === 'active').length;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-black text-sm">System Valuation & Profit Tracker</h2>
            <p className="text-slate-500 text-xs">Real-time platform worth based on active fleet customers</p>
          </div>
        </div>
        <div className="text-xs text-slate-500">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </div>

      {/* Primary KPI: Valuation */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-slate-900/50 border border-emerald-500/30 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">Estimated System Valuation</div>
            <div className="text-3xl font-black text-emerald-300">{fmt(valuation)}</div>
            <div className="text-slate-400 text-xs mt-1">
              Based on {active.length} active subscribers × SaaS multiple of {multiple.toFixed(1)}x
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-white font-black text-lg">{fmt(mrr)}</div>
              <div className="text-slate-400 text-[10px]">MRR</div>
            </div>
            <div className="text-center">
              <div className="text-white font-black text-lg">{fmt(arr)}</div>
              <div className="text-slate-400 text-[10px]">ARR</div>
            </div>
            <div className="text-center">
              <div className="text-emerald-400 font-black text-lg">{multiple.toFixed(1)}x</div>
              <div className="text-slate-400 text-[10px]">Multiple</div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700">
          <DollarSign className="w-3.5 h-3.5 text-green-400 mb-1.5" />
          <div className="text-lg font-black text-white">{fmt(netProfit)}</div>
          <div className="text-slate-400 text-[10px]">Total Net Profit</div>
          <div className={`text-xs font-semibold mt-0.5 ${parseFloat(profitMargin) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profitMargin}% margin
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700">
          <BarChart3 className="w-3.5 h-3.5 text-amber-400 mb-1.5" />
          <div className="text-lg font-black text-white">{fmt(allRevenue)}</div>
          <div className="text-slate-400 text-[10px]">Total Revenue (All Time)</div>
          <div className="text-xs text-slate-500 mt-0.5">{active.length} paying fleets</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700">
          <Gauge className="w-3.5 h-3.5 text-blue-400 mb-1.5" />
          <div className="text-lg font-black text-white">{fmt(allCosts)}</div>
          <div className="text-slate-400 text-[10px]">Total Costs (Fuel + Maint)</div>
          <div className="text-xs text-slate-500 mt-0.5">avg {fmt(avgCostPerCustomer)}/customer</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700">
          <Target className="w-3.5 h-3.5 text-purple-400 mb-1.5" />
          <div className="text-lg font-black text-white">{fmt(pendingRevenue)}</div>
          <div className="text-slate-400 text-[10px]">Pending / Outstanding</div>
          <div className="text-xs text-amber-400 font-semibold mt-0.5">Awaiting collection</div>
        </div>
      </div>

      {/* Valuation Growth Projections */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Valuation Projections at Scale</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {milestones.map((m, i) => (
            <div key={m.label}
              className="bg-slate-900 rounded-xl border border-slate-700 p-3 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
              <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">{m.label}</div>
              <div className={`text-xl font-black ${i === 2 ? 'text-emerald-300' : i === 1 ? 'text-amber-300' : 'text-blue-300'}`}>
                {fmt(m.valuation)}
              </div>
              <div className="text-slate-500 text-[10px]">
                {m.customers} fleets × {fmt(m.price)}/mo × {m.multiple}x
              </div>
              {active.length > 0 && active.length < m.customers && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <div className="text-slate-400 text-[10px]">Progress</div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${i === 2 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, (active.length / m.customers) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{Math.round((active.length / m.customers) * 100)}% — {m.customers - active.length} to go</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Runway & Unit Economics */}
      <div className="border-t border-slate-700 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Unit Economics & Metrics</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-white font-bold text-sm">{fmt(avgRevenuePerCustomer)}</div>
            <div className="text-slate-500 text-[10px]">Avg MRR / Fleet</div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-sm">{thisMonth}</div>
            <div className="text-slate-500 text-[10px]">New This Month</div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-sm">{totalSubscribers > 0 ? ((active.length / totalSubscribers) * 100).toFixed(0) : '0'}%</div>
            <div className="text-slate-500 text-[10px]">Conversion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-sm">{multiple.toFixed(1)}x</div>
            <div className="text-slate-500 text-[10px]">Valuation Multiple</div>
          </div>
        </div>
      </div>
    </div>
  );
}
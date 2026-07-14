import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useCustomerContext } from '@/lib/CustomerContext';
import {
  BarChart2, Building2, Package, Wrench, TrendingUp, Users, Truck,
  Activity, ChevronRight, RefreshCw,
} from 'lucide-react';

function BarRow({ label, value, max, suffix = '' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="font-bold text-slate-900">{value}{suffix}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CustomerCard({ customer, onSelect }) {
  const topSection = customer.section_usage?.[0];
  const totalVisits = customer.section_usage?.reduce((s, x) => s + x.visits, 0) || 0;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(customer.customerId)}
      className="text-left w-full bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-900">{customer.company_name || 'Unnamed'}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{customer.contact_name}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="bg-slate-50 rounded-lg py-2">
          <div className="text-lg font-black text-slate-900">{customer.entity_counts?.work_orders || 0}</div>
          <div className="text-[10px] text-slate-500 uppercase">Work orders</div>
        </div>
        <div className="bg-slate-50 rounded-lg py-2">
          <div className="text-lg font-black text-slate-900">{customer.entity_counts?.vehicles || 0}</div>
          <div className="text-[10px] text-slate-500 uppercase">Vehicles</div>
        </div>
        <div className="bg-slate-50 rounded-lg py-2">
          <div className="text-lg font-black text-slate-900">{customer.team_count || 0}</div>
          <div className="text-[10px] text-slate-500 uppercase">Team</div>
        </div>
      </div>
      {topSection && (
        <p className="text-xs text-amber-700 mt-3 font-semibold">
          Most active: {topSection.name} ({totalVisits} tracked events)
        </p>
      )}
    </button>
  );
}

export default function CustomerInsights() {
  const { viewAsCustomerId, selectCustomer, isViewingAsCustomer, viewAsCustomer } = useCustomerContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [u, summary] = await Promise.all([
        api.auth.me(),
        api.customerAnalytics.summary(),
      ]);
      setUser(u);
      setData(summary);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [viewAsCustomerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const internal = ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(user?.role);
  if (!internal) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="font-semibold">FleetCo employee access only</p>
      </div>
    );
  }

  const single = data?.mode === 'single' ? data.customer : null;
  const allCustomers = data?.mode === 'all' ? data.customers : [];

  const maxSection = single
    ? Math.max(...(single.section_usage?.map((s) => s.visits) || [1]), 1)
    : 1;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider">
            <BarChart2 className="w-4 h-4" /> FleetCo Internal
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Customer Insights</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track portal section usage, work orders, and parts — read-only analytics. No customer or login data is modified.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {isViewingAsCustomer && single && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900">
          Viewing analytics for <strong>{viewAsCustomer?.company_name || single.company_name}</strong>.
          {' '}Use the sidebar customer switcher to change accounts, or{' '}
          <Link to="/portal/fleet" className="font-bold underline">open their fleet</Link> to edit records.
        </div>
      )}

      {!isViewingAsCustomer && allCustomers.length > 0 && (
        <div>
          <h2 className="font-black text-slate-900 mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" /> All customers
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {allCustomers.map((c) => (
              <CustomerCard
                key={c.customerId}
                customer={c}
                onSelect={(id) => selectCustomer(id)}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Select a customer in the sidebar switcher for detailed breakdown.</p>
        </div>
      )}

      {single && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Truck, label: 'Vehicles', value: single.entity_counts?.vehicles },
              { icon: Wrench, label: 'Work orders', value: single.entity_counts?.work_orders },
              { icon: Package, label: 'Loads', value: single.entity_counts?.loads },
              { icon: Users, label: 'Team members', value: single.team_count },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
                <Icon className="w-5 h-5 text-amber-500 mb-2" />
                <div className="text-2xl font-black text-slate-900">{value ?? 0}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" /> Portal sections used most
              </h2>
              <div className="space-y-3">
                {(single.section_usage || []).map((s) => (
                  <BarRow key={s.name} label={s.name} value={s.visits} max={maxSection} />
                ))}
              </div>
              {single.sidebar_modules?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Enabled modules (team)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {single.sidebar_modules.map((m) => (
                      <span key={m} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-3">{single.activity_events} page visits tracked</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" /> Work orders by type
              </h2>
              <div className="space-y-3">
                {(single.work_orders_by_type || []).slice(0, 8).map((row) => (
                  <BarRow
                    key={row.name}
                    label={row.name}
                    value={row.count}
                    max={single.work_orders_by_type[0]?.count || 1}
                  />
                ))}
                {(single.work_orders_by_type || []).length === 0 && (
                  <p className="text-sm text-slate-400">No work orders yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" /> Top parts on work orders
            </h2>
            {(single.top_parts || []).length === 0 ? (
              <p className="text-sm text-slate-400">No parts logged on work orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100">
                      <th className="pb-2 pr-4">Part #</th>
                      <th className="pb-2 pr-4">Description</th>
                      <th className="pb-2 pr-4 text-right">Qty</th>
                      <th className="pb-2 text-right">Total cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {single.top_parts.map((p) => (
                      <tr key={`${p.part_number}-${p.description}`} className="border-b border-slate-50">
                        <td className="py-2 pr-4 font-mono text-xs">{p.part_number || '—'}</td>
                        <td className="py-2 pr-4">{p.description}</td>
                        <td className="py-2 pr-4 text-right font-bold">{p.quantity}</td>
                        <td className="py-2 text-right">${(p.total_cost || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(single.recent_activity || []).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" /> Recent portal activity
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {single.recent_activity.map((e, i) => (
                  <div key={i} className="flex justify-between text-xs border-b border-slate-50 py-1.5">
                    <span className="text-slate-700">
                      <strong>{e.section}</strong> · {e.path}
                      {e.user_email && <span className="text-slate-400"> · {e.user_email}</span>}
                    </span>
                    <span className="text-slate-400 flex-shrink-0 ml-2">
                      {e.visited_at ? new Date(e.visited_at).toLocaleString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { isSLT } from '@/lib/roles';
import { formatUsd, PLATFORM_FEE_PERCENT, POSTER_FEE_PERCENT, CARRIER_FEE_PERCENT } from '@/lib/loadMarketplaceFinance';
import LoadThreadPanel from '@/components/loadboard/LoadThreadPanel';
import {
  Crown, DollarSign, Package, TrendingUp, MessageCircle, ArrowLeft, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function StatCard({ icon: Icon, label, value, sub, color = 'amber' }) {
  const colors = {
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-slate-400 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

const STATUS_STYLE = {
  available: 'text-green-400',
  assigned: 'text-amber-400',
  in_transit: 'text-blue-400',
  delivered: 'text-slate-400',
  cancelled: 'text-red-400',
};

export default function LoadMarketplaceExecutive() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [threadLoad, setThreadLoad] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.functions.invoke('getExecutiveLoadMarketplace', {});
      setData(res);
    } catch {
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    api.auth.me().then(async (u) => {
      setUser(u);
      if (isSLT(u?.role) || u?.role === 'admin') await fetchData();
      else setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isSLT(user?.role) && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-950">
        <div className="text-center text-slate-400">
          <Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Executive or fleet manager access required</p>
        </div>
      </div>
    );
  }

  const loads = data?.loads || [];
  const totals = data?.totals || {};

  const filtered = loads.filter((l) => {
    if (filter === 'accepted') return l.booking_status === 'accepted' || ['assigned', 'in_transit'].includes(l.status);
    if (filter === 'delivered') return l.status === 'delivered';
    if (filter === 'pending') return l.booking_status === 'pending';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/portal/executive" className="text-slate-500 hover:text-amber-400 text-sm flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Executive View
            </Link>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Package className="w-8 h-8 text-amber-500" />
              Load Marketplace
            </h1>
            <p className="text-slate-400 mt-1">
              Posters and carriers each pay {POSTER_FEE_PERCENT}% of load value to FleetCo ({PLATFORM_FEE_PERCENT}% total)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={DollarSign} label="Total Load Value" value={formatUsd(totals.load_value)} sub={`${loads.length} marketplace loads`} color="blue" />
          <StatCard icon={TrendingUp} label="FleetCo Platform Fees" value={formatUsd(totals.fleetco_fee)} sub={`${POSTER_FEE_PERCENT}% poster + ${CARRIER_FEE_PERCENT}% carrier`} color="amber" />
          <StatCard icon={Package} label="Poster Fees" value={formatUsd(totals.poster_fee)} sub={`${POSTER_FEE_PERCENT}% of load value`} color="green" />
          <StatCard icon={Package} label="Carrier Fees" value={formatUsd(totals.carrier_fee)} sub={`${CARRIER_FEE_PERCENT}% of load value`} color="purple" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'pending', 'accepted', 'delivered'].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              className={filter === f ? 'bg-amber-500 text-slate-900 font-bold' : 'border-slate-600 text-slate-300'}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700 text-left">
                  <th className="py-3 px-4 font-medium">Load</th>
                  <th className="py-3 px-4 font-medium">Route</th>
                  <th className="py-3 px-4 font-medium">Posted By</th>
                  <th className="py-3 px-4 font-medium">Accepted By</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Load Value</th>
                  <th className="py-3 px-4 font-medium text-right">Poster {POSTER_FEE_PERCENT}%</th>
                  <th className="py-3 px-4 font-medium text-right">Carrier {CARRIER_FEE_PERCENT}%</th>
                  <th className="py-3 px-4 font-medium text-right">Carrier Net</th>
                  <th className="py-3 px-4 font-medium text-right">FleetCo {PLATFORM_FEE_PERCENT}%</th>
                  <th className="py-3 px-4 font-medium text-center">Comms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="py-8 text-center text-slate-500">No loads match this filter</td></tr>
                )}
                {filtered.map((load) => (
                  <tr key={load.id} className="text-slate-200 hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-bold">#{load.load_number}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-[180px] truncate">{load.origin} → {load.destination}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{load.poster_company}</div>
                      <div className="text-xs text-slate-500">{load.poster_contact}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{load.carrier_company}</div>
                      <div className="text-xs text-slate-500">{load.booked_by_name}{load.assigned_driver_name && load.assigned_driver_name !== '—' ? ` · ${load.assigned_driver_name}` : ''}</div>
                    </td>
                    <td className={`py-3 px-4 capitalize ${STATUS_STYLE[load.status] || 'text-slate-400'}`}>
                      {load.status?.replace('_', ' ')}
                      {load.booking_status === 'pending' && <span className="block text-xs text-purple-400">booking pending</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">{formatUsd(load.load_value || load.rate)}</td>
                    <td className="py-3 px-4 text-right text-green-400">{formatUsd(load.poster_fee_amount)}</td>
                    <td className="py-3 px-4 text-right text-blue-400">{formatUsd(load.carrier_fee_amount)}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{formatUsd(load.carrier_payout_amount)}</td>
                    <td className="py-3 px-4 text-right text-amber-400 font-bold">{formatUsd(load.fleetco_fee_amount || load.platform_fee_amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <Button size="sm" variant="ghost" className="text-slate-300 hover:text-amber-400" onClick={() => setThreadLoad(load)}>
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {load.message_count || 0}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Posters/brokers pay {POSTER_FEE_PERCENT}% and carriers pay {CARRIER_FEE_PERCENT}% of total load value to FleetCo ({PLATFORM_FEE_PERCENT}% combined). Carrier net is load value minus their {CARRIER_FEE_PERCENT}% fee.
        </p>
      </div>

      {threadLoad && (
        <LoadThreadPanel load={threadLoad} onClose={() => setThreadLoad(null)} />
      )}
    </div>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import {
  Loader2,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Wallet,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortalPageShell from '@/components/layout/PortalPageShell';
import { billingStatusColor, formatDueDate } from '@/lib/billing';

const SLT_ROLES = ['owner', 'executive', 'fleet_manager'];

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub ? <div className="text-slate-500 text-xs mt-1">{sub}</div> : null}
    </div>
  );
}

function formatDollars(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(amount));
}

function formatStripeAmount(amount, currency = 'usd') {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
  }).format(Number(amount) / 100);
}

function StripeLink({ href, children }) {
  if (!href) return <span className="text-slate-600 text-sm">Not linked</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm"
    >
      {children}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export default function SltBillingHub() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [portalLoadingId, setPortalLoadingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dash = await api.sltBilling.getDashboard();
      setData(dash);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.auth.me().then((u) => { setUser(u); setLoadingUser(false); }).catch(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (user && SLT_ROLES.includes(user.role)) load();
  }, [user, load]);

  const toggleDetail = async (customerId) => {
    if (expandedId === customerId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(customerId);
    setDetailLoading(true);
    try {
      const d = await api.sltBilling.getCustomerDetail(customerId);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCustomerPortal = async (customerId) => {
    setPortalLoadingId(customerId);
    try {
      const { url } = await api.sltBilling.openCustomerPortal(customerId);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setPortalLoadingId(null);
    }
  };

  if (loadingUser) {
    return (
      <PortalPageShell variant="wide" className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </PortalPageShell>
    );
  }

  if (!SLT_ROLES.includes(user?.role)) {
    return (
      <PortalPageShell variant="wide" className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center max-w-md">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-300 text-lg font-medium">SLT access required</p>
          <p className="text-slate-500 text-sm mt-2">
            Customer payments and Stripe are for owner, executive, and fleet manager roles.
          </p>
        </div>
      </PortalPageShell>
    );
  }

  const summary = data?.summary;
  const dash = data?.dashboard;
  const stripeOk = data?.stripe?.configured;

  return (
    <PortalPageShell variant="wide" className="space-y-6 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-cyan-500" />
            Customer payments & Stripe
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            View subscription payments across customers and open the Stripe Dashboard for banking and payouts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {dash?.payments && (
            <Button asChild size="sm" variant="default">
              <a href={dash.payments} target="_blank" rel="noopener noreferrer">
                <Wallet className="w-4 h-4 mr-2" />
                Stripe payments
              </a>
            </Button>
          )}
          {dash?.balance && (
            <Button asChild size="sm" variant="secondary">
              <a href={dash.balance} target="_blank" rel="noopener noreferrer">
                Balance & banking
                <ExternalLink className="w-3 h-3 ml-2" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {!stripeOk && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-800/50 bg-amber-950/30 p-4 text-amber-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            Stripe is not configured on the server (<code className="text-amber-100">STRIPE_SECRET_KEY</code>).
            You can still see FleetCo billing records; live Stripe invoices require configuration.
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Customers" value={summary.customerCount} />
          <StatCard label="Active subs" value={summary.activeSubscriptions} />
          <StatCard label="Est. MRR" value={formatDollars(summary.estimatedMrr)} sub="Monthly equivalent" />
          <StatCard
            label="Attention"
            value={summary.overdueOrPaused}
            sub={`${summary.stripeLinked} linked in Stripe`}
          />
        </div>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-left">
              <tr>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium hidden md:table-cell">Plan</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium hidden lg:table-cell">Last payment</th>
                <th className="p-3 font-medium hidden lg:table-cell">Next due</th>
                <th className="p-3 font-medium">Stripe</th>
                <th className="p-3 font-medium w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(data?.customers || []).map((row) => {
                const billingStatus = row.billing?.status || 'current';
                const open = expandedId === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr className="bg-slate-950/50 hover:bg-slate-900/50">
                      <td className="p-3">
                        <div className="font-medium text-white">{row.company_name || '—'}</div>
                        <div className="text-slate-500 text-xs">{row.email}</div>
                      </td>
                      <td className="p-3 hidden md:table-cell text-slate-300">
                        {row.subscription_plan || '—'}
                        {row.subscription_amount != null && (
                          <span className="text-slate-500">
                            {' '}
                            · {formatDollars(row.subscription_amount)}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${billingStatusColor(billingStatus)}`}>
                          {row.system_paused ? 'Paused' : billingStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-slate-400">
                        {formatDueDate(row.last_payment_at)}
                      </td>
                      <td className="p-3 hidden lg:table-cell text-slate-400">
                        {formatDueDate(row.next_payment_due_at)}
                      </td>
                      <td className="p-3">
                        <StripeLink href={row.stripe_customer_url}>Customer</StripeLink>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleDetail(row.id)}>
                          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-slate-900/40">
                        <td colSpan={7} className="p-4">
                          {detailLoading ? (
                            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                          ) : detail?.customer?.id === row.id ? (
                            <div className="space-y-4 text-sm">
                              <div className="flex flex-wrap gap-2">
                                {row.stripe_subscription_url && (
                                  <Button asChild size="sm" variant="outline">
                                    <a href={row.stripe_subscription_url} target="_blank" rel="noopener noreferrer">
                                      Subscription in Stripe
                                    </a>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={!stripeOk || portalLoadingId === row.id}
                                  onClick={() => openCustomerPortal(row.id)}
                                >
                                  {portalLoadingId === row.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Customer billing portal'
                                  )}
                                </Button>
                              </div>

                              <div>
                                <h3 className="text-slate-300 font-medium mb-2">FleetCo payment history</h3>
                                <ul className="space-y-1 text-slate-400">
                                  {(detail.local_payments || []).length === 0 && <li>None recorded</li>}
                                  {(detail.local_payments || []).map((p) => (
                                    <li key={p.id}>
                                      {formatDueDate(p.started_at)} — {formatDollars(p.amount)} ({p.type || p.collected_by || 'payment'})
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {detail.stripe?.invoices?.length > 0 && (
                                <div>
                                  <h3 className="text-slate-300 font-medium mb-2">Stripe invoices</h3>
                                  <ul className="space-y-1">
                                    {detail.stripe.invoices.map((inv) => (
                                      <li key={inv.id} className="flex flex-wrap items-center gap-2 text-slate-400">
                                        <span>
                                          {inv.number || inv.id} · {formatStripeAmount(inv.amount_paid, inv.currency)} · {inv.status}
                                        </span>
                                        {inv.hosted_invoice_url && (
                                          <a
                                            href={inv.hosted_invoice_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-cyan-400 hover:underline"
                                          >
                                            View
                                          </a>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {detail.stripe?.error && (
                                <p className="text-red-400 text-xs">{detail.stripe.error}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-500">Could not load payment detail.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {(data?.customers || []).length === 0 && (
            <p className="p-8 text-center text-slate-500">No customers yet.</p>
          )}
        </div>
      )}

      {dash && (
        <p className="text-slate-600 text-xs">
          Stripe Dashboard links use your server&apos;s live vs test mode from <code>STRIPE_SECRET_KEY</code>.
          Sign in at{' '}
          <a href={dash.home} className="text-cyan-600 hover:underline" target="_blank" rel="noopener noreferrer">
            dashboard.stripe.com
          </a>{' '}
          with your FleetCo Stripe account for full banking, payouts, and dispute tools.
        </p>
      )}
    </PortalPageShell>
  );
}

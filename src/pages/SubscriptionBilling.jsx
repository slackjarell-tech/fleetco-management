import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { CreditCard, Loader2, CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_PLANS, subscriptionAmount, formatPrice } from '@/lib/subscriptions';
import { isCustomerPortalUser } from '@/lib/customerRoles';
import { formatDueDate } from '@/lib/billing';

export default function SubscriptionBilling() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [billingTerm, setBillingTerm] = useState('monthly');

  const load = async () => {
    setLoading(true);
    try {
      const u = await api.auth.me();
      setUser(u);
      if (u?.customer_id) {
        const data = await api.billing.getStatus();
        setBilling(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');
    if (checkout === 'success' && sessionId) {
      setBusy('sync');
      api.billing.syncSession(sessionId)
        .then((r) => {
          if (r.success) {
            setMessage('Payment received — your subscription is active. Thank you!');
            load();
          } else {
            setError(r.error || 'Payment received; activation may take a minute. Refresh or contact support if access is still paused.');
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setBusy(''));
    }
  }, [searchParams]);

  const startCheckout = async (planName) => {
    setBusy(planName);
    setError('');
    try {
      const result = await api.billing.createCheckoutSession({
        planName,
        billingTerm,
      });
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      setError(result?.message || 'Checkout unavailable');
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setBusy('');
    }
  };

  const openPortal = async () => {
    setBusy('portal');
    setError('');
    try {
      const { url } = await api.billing.createPortalSession();
      if (url) window.location.href = url;
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <p className="text-slate-600 mb-4">Sign in to manage your FleetCo subscription.</p>
        <Link to="/login" className="text-amber-600 font-bold hover:underline">Go to login</Link>
      </div>
    );
  }

  if (!isCustomerPortalUser(user)) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center text-slate-600">
        <p>Subscription self-service is for customer portal accounts.</p>
        <Link to="/portal" className="text-amber-600 font-bold text-sm mt-2 inline-block">Back to portal</Link>
      </div>
    );
  }

  const c = billing?.customer;
  const stripeOn = billing?.stripe?.configured;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-amber-500" />
          Subscription & billing
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pay for FleetCo on your own — secure checkout powered by Stripe. Update card, invoices, and renewals anytime.
        </p>
      </div>

      {message && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {message}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {c && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <div className="font-bold text-slate-900">{c.company_name}</div>
          <div className="text-sm text-slate-600">
            Plan: <strong>{c.subscription_plan || '—'}</strong>
            {' · '}
            {formatPrice(c.subscription_amount || 0)}/{c.subscription_term === 'yearly' ? 'yr' : 'mo'}
          </div>
          <div className="text-sm text-slate-600">
            Status:{' '}
            <span className={c.system_paused ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
              {c.system_paused ? 'Paused — payment required' : c.payment_status || c.subscription_status || '—'}
            </span>
          </div>
          {c.next_payment_due_at && (
            <div className="text-xs text-slate-500">Next billing date: {formatDueDate(c.next_payment_due_at)}</div>
          )}
          {stripeOn && c.stripe_customer_id && (
            <Button type="button" variant="outline" className="mt-3" disabled={busy === 'portal'} onClick={openPortal}>
              {busy === 'portal' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
              Manage payment method & invoices
            </Button>
          )}
        </div>
      )}

      {!stripeOn && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Online card checkout is not enabled on this server yet (missing STRIPE_SECRET_KEY). Contact FleetCo to pay or ask support to enable Stripe.
        </p>
      )}

      {stripeOn && (
        <>
          <div className="flex justify-center">
            <div className="inline-flex bg-slate-100 rounded-full p-1">
              {['monthly', 'yearly'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setBillingTerm(term)}
                  className={`px-4 py-1.5 text-sm font-bold rounded-full capitalize ${
                    billingTerm === term ? 'bg-amber-500 text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {term === 'yearly' ? 'Yearly (save 10%)' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {Object.keys(SUBSCRIPTION_PLANS).map((planName) => (
              <div key={planName} className="border border-slate-200 rounded-2xl p-5 bg-white">
                <h2 className="font-black text-lg">{planName}</h2>
                <p className="text-2xl font-black text-amber-600 mt-2">
                  {formatPrice(subscriptionAmount(planName, billingTerm))}
                  <span className="text-sm font-bold text-slate-400">/{billingTerm === 'yearly' ? 'yr' : 'mo'}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">Up to {SUBSCRIPTION_PLANS[planName].fleetMax} vehicles</p>
                <Button
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
                  disabled={!!busy}
                  onClick={() => startCheckout(planName)}
                >
                  {busy === planName ? <Loader2 className="w-4 h-4 animate-spin" /> : `Subscribe — ${planName}`}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-slate-400 text-center">
        Payments are processed by Stripe. By subscribing you agree to our{' '}
        <Link to="/terms" className="underline">Terms</Link> and{' '}
        <Link to="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}

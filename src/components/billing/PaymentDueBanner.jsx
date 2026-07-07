import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { AlertTriangle, Bell, Clock, PauseCircle, X, DollarSign } from 'lucide-react';
import { formatCountdown, formatDueDate } from '@/lib/billing';

export default function PaymentDueBanner({ user }) {
  const [data, setData] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.functions.invoke('getBillingAlerts', {})
      .then(setData)
      .catch(() => {});
  }, [user?.id]);

  if (!data || dismissed) return null;

  const { alerts = [], userBilling, unreadCount, summary } = data;
  const hasInternalAlerts = alerts.length > 0;
  const hasCustomerAlert = userBilling && userBilling.status !== 'current';
  if (!hasInternalAlerts && !hasCustomerAlert) return null;

  const isOverdue = userBilling?.isOverdue || summary?.overdue > 0;
  const isPaused = userBilling?.isPaused || summary?.paused > 0;

  return (
    <div className={`border-b px-4 py-3 ${isPaused ? 'bg-slate-800 border-slate-700' : isOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="max-w-6xl mx-auto flex flex-wrap items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isPaused ? 'bg-slate-700' : isOverdue ? 'bg-red-100' : 'bg-amber-100'}`}>
          {isPaused ? <PauseCircle className="w-5 h-5 text-slate-300" /> : <Bell className={`w-5 h-5 ${isOverdue ? 'text-red-600' : 'text-amber-600'}`} />}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {hasCustomerAlert && (
            <div>
              <div className={`font-black text-sm ${isPaused ? 'text-white' : isOverdue ? 'text-red-800' : 'text-amber-900'}`}>
                {userBilling.isPaused
                  ? `${user.customer_name || 'Your account'} — Portal paused`
                  : formatCountdown(userBilling.daysUntilDue)}
              </div>
              <div className={`text-xs ${isPaused ? 'text-slate-400' : 'text-slate-600'}`}>
                {userBilling.plan} · ${userBilling.amount?.toLocaleString()}/{userBilling.term === 'yearly' ? 'yr' : 'mo'} · Due {formatDueDate(userBilling.dueAt)}
              </div>
            </div>
          )}

          {hasInternalAlerts && (
            <div>
              <div className={`font-black text-sm ${isOverdue ? 'text-red-800' : 'text-amber-900'}`}>
                {summary?.overdue > 0 && `${summary.overdue} overdue`}
                {summary?.overdue > 0 && summary?.dueSoon > 0 && ' · '}
                {summary?.dueSoon > 0 && `${summary.dueSoon} due within 7 days`}
                {summary?.paused > 0 && ` · ${summary.paused} paused`}
              </div>
              <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {alerts.slice(0, 3).map((a) => (
                  <span key={a.customerId} className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <strong>{a.companyName}</strong>: {a.countdown}
                  </span>
                ))}
              </div>
            </div>
          )}

          {unreadCount > 0 && (
            <div className="text-xs font-semibold text-amber-700 flex items-center gap-1">
              <Bell className="w-3 h-3" /> {unreadCount} payment reminder{unreadCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {hasInternalAlerts && (
            <Link
              to="/portal/customers"
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg ${isOverdue ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Manage billing
            </Link>
          )}
          <button type="button" onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

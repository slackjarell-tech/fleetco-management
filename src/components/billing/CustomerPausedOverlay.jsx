import React from 'react';
import { PauseCircle, Mail, Phone } from 'lucide-react';
import { formatCountdown, formatDueDate } from '@/lib/billing';
import { SITE } from '@/lib/site';

export default function CustomerPausedOverlay({ user, billing }) {
  if (!user?.system_paused && !billing?.isPaused) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PauseCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Portal Access Paused</h2>
        <p className="text-slate-600 text-sm mb-4">
          {user.customer_name || 'Your account'} has been paused because subscription payment is overdue.
          Please contact FleetCo to restore access.
        </p>
        {billing && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm mb-5 text-left">
            <div className="font-bold text-amber-900">{formatCountdown(billing.daysUntilDue)}</div>
            <div className="text-amber-800 mt-1">
              {billing.plan} plan · ${billing.amount?.toLocaleString()}/{billing.term === 'yearly' ? 'yr' : 'mo'}
            </div>
            <div className="text-xs text-amber-700 mt-1">Due date: {formatDueDate(billing.dueAt)}</div>
          </div>
        )}
        <div className="space-y-2 text-sm text-slate-600">
          <a href={`mailto:${SITE.supportEmail}`} className="flex items-center justify-center gap-2 text-amber-600 font-semibold hover:underline">
            <Mail className="w-4 h-4" /> {SITE.supportEmail}
          </a>
          <a href={`tel:${SITE.phone.replace(/\D/g, '')}`} className="flex items-center justify-center gap-2 text-slate-700 font-semibold hover:underline">
            <Phone className="w-4 h-4" /> {SITE.phone}
          </a>
        </div>
      </div>
    </div>
  );
}

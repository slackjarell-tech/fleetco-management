import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Bell, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { NOTIFICATION_OPTIONS, DEFAULT_NOTIFICATION_PREFS } from '@/lib/notificationPreferences';

export default function NotificationPreferences() {
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState({ ...DEFAULT_NOTIFICATION_PREFS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.auth.me().then((u) => {
      setUser(u);
      setPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...(u.notification_prefs || {}) });
      setLoading(false);
    });
  }, []);

  const toggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await api.functions.invoke('updateCustomerNotificationPrefs', { prefs });
      setPrefs(result.notification_prefs || prefs);
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err?.message || 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPrefs({ ...DEFAULT_NOTIFICATION_PREFS });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.customer_id) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-black text-slate-900">Notification Preferences</h1>
        <p className="text-slate-500 text-sm mt-2">
          Email notification settings are available for customer portal accounts linked to a fleet organization.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Notification Preferences</h1>
        <p className="text-slate-500 text-sm mt-1">
          Choose which email notifications {user.customer_name ? `${user.customer_name} receives` : 'your organization receives'}.
          Security emails (password resets and account access) are always sent.
        </p>
      </div>

      <div className="space-y-3">
        {NOTIFICATION_OPTIONS.map((opt) => {
          const isEnabled = !!prefs[opt.key];
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => toggle(opt.key)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                isEnabled
                  ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                  : 'border-slate-100 bg-white opacity-60 hover:opacity-80'
              }`}
            >
              <div className={`p-2.5 rounded-lg flex-shrink-0 ${isEnabled ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>
              </div>
              <div
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isEnabled ? 'bg-amber-500 border-amber-500' : 'border-slate-300 bg-white'
                }`}
              >
                {isEnabled && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
        >
          <RotateCcw className="w-4 h-4" /> Reset to defaults
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { LayoutDashboard, Package, Truck, Wrench, Users, ShieldCheck, DollarSign, Building2, Save, RotateCcw } from 'lucide-react';
import { toast } from "sonner";

const ALL_MODULES = [
  { label: 'Dashboard', icon: LayoutDashboard, description: 'Admin dashboard & fleet overview' },
  { label: 'Operations', icon: Package, description: 'Load Board, Route Builder, Navigation' },
  { label: 'Fleet', icon: Truck, description: 'Fleet units, P&L, Work Orders, Diagnostics' },
  { label: 'Maintenance', icon: Wrench, description: 'PM schedules, Inspections, Parts, Vendors' },
  { label: 'Drivers & Payroll', icon: Users, description: 'Drivers, Payroll, Time Clock' },
  { label: 'Compliance', icon: ShieldCheck, description: 'HOS logs, IFTA, Incidents' },
  { label: 'Finance', icon: DollarSign, description: 'Invoices, Accounting, Fuel, Reports' },
  { label: 'Other', icon: Building2, description: 'Messages, AI Assistant' },
];

export default function ModulePreferences() {
  const [user, setUser] = useState(null);
  const [enabled, setEnabled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.auth.me().then(u => {
      setUser(u);
      setEnabled(u.sidebar_modules || ALL_MODULES.map(m => m.label));
      setLoading(false);
    });
  }, []);

  const toggle = (label) => {
    setEnabled(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const save = async () => {
    setSaving(true);
    await api.auth.updateMe({ sidebar_modules: enabled });
    toast.success("Module preferences saved");
    setSaving(false);
  };

  const reset = () => {
    setEnabled(ALL_MODULES.map(m => m.label));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Module Preferences</h1>
        <p className="text-slate-500 text-sm mt-1">Choose which navigation modules appear in your sidebar. Uncheck any module to hide it.</p>
      </div>

      <div className="space-y-3">
        {ALL_MODULES.map(mod => {
          const isEnabled = enabled.includes(mod.label);
          return (
            <button
              key={mod.label}
              onClick={() => toggle(mod.label)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                isEnabled
                  ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                  : 'border-slate-100 bg-white opacity-60 hover:opacity-80'
              }`}
            >
              <div className={`p-2.5 rounded-lg flex-shrink-0 ${isEnabled ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <mod.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm">{mod.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{mod.description}</div>
              </div>
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                isEnabled ? 'bg-amber-500 border-amber-500' : 'border-slate-300 bg-white'
              }`}>
                {isEnabled && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
          <RotateCcw className="w-4 h-4" /> Reset to All
        </button>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
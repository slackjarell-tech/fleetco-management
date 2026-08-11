import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { canManageCustomerTeam } from '@/lib/customerRoles';

export default function DeliveryFleetSettings({ user, onUpdated }) {
  const [settings, setSettings] = useState({
    max_stops_per_route: user?.max_stops_per_route || 200,
    require_pod_signature: !!user?.require_pod_signature,
    allow_virtual_pod: user?.allow_virtual_pod !== false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (!user?.customer_id || !canManageCustomerTeam(user.role)) return null;

  const save = async (patch) => {
    setSaving(true);
    setMessage('');
    try {
      const result = await api.functions.invoke('updateCustomerDeliverySettings', patch);
      const next = {
        max_stops_per_route: Number(result.customer.max_stops_per_route) || 200,
        require_pod_signature: !!result.customer.require_pod_signature,
        allow_virtual_pod: result.customer.allow_virtual_pod !== false,
      };
      setSettings(next);
      setMessage('Settings saved');
      onUpdated?.(next);
    } catch (err) {
      setMessage(err?.data?.error || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
        <Settings className="w-4 h-4 text-amber-600" /> Delivery fleet settings
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        Controls driver scanner, route size, and proof-of-delivery options for last-mile delivery fleets.
      </p>

      <div>
        <label className="text-xs font-bold text-slate-600">Max stops per driver route</label>
        <div className="flex gap-2 mt-1">
          <input
            type="number"
            min={1}
            max={500}
            value={settings.max_stops_per_route}
            onChange={(e) => setSettings((s) => ({ ...s, max_stops_per_route: Number(e.target.value) }))}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <button type="button" disabled={saving} onClick={() => save({ max_stops_per_route: settings.max_stops_per_route })}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg disabled:opacity-50">
            Save
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={saving}
          onClick={() => save({ require_pod_signature: !settings.require_pod_signature })}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border ${settings.require_pod_signature ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600'}`}>
          {settings.require_pod_signature ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          Require signature POD
        </button>
        <button type="button" disabled={saving}
          onClick={() => save({ allow_virtual_pod: !settings.allow_virtual_pod })}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border ${settings.allow_virtual_pod ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600'}`}>
          {settings.allow_virtual_pod ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          Allow virtual POD (photo)
        </button>
      </div>

      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
}

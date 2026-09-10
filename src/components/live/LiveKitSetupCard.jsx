import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Radio, CheckCircle, AlertCircle, Save } from 'lucide-react';

/** Executive-only — connect LiveKit for live road dashcam viewing (no Render env vars required). */
export default function LiveKitSetupCard() {
  const [status, setStatus] = useState(null);
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const result = await api.functions.invoke('getLiveKitSetupStatus');
      setStatus(result);
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await api.functions.invoke('saveLiveKitSettings', {
        url,
        apiKey,
        apiSecret,
      });
      setMessage(result.message || 'LiveKit connected.');
      setApiSecret('');
      await load();
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Could not save LiveKit settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-indigo-200 p-4 space-y-4">
      <div>
        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-600" /> LiveKit upgrade (optional)
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Live office viewing already works without LiveKit (~3–5 sec delay). Connect LiveKit here for lower-latency WebRTC — saved securely in FleetCo (no Render dashboard needed).
        </p>
      </div>

      {status?.configured ? (
        <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">LiveKit connected</div>
            <div className="text-xs mt-0.5">{status.url}</div>
            <div className="text-xs text-emerald-700 mt-1">
              Source: {status.source === 'environment' ? 'Render environment variables' : 'FleetCo platform settings'}
              {status.apiKeyPreview ? ` · Key ${status.apiKeyPreview}` : ''}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">LiveKit not connected</div>
            <div className="text-xs mt-0.5">
              Chunked live viewing is active now. Add LiveKit below only if you want lower-latency WebRTC.
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">WebSocket URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="wss://your-project.livekit.cloud"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="APIxxxxxxxx"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">API Secret</label>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Paste secret from LiveKit (shown once at key creation)"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
          />
        </div>
        <p className="text-[11px] text-slate-400">
          Get these from{' '}
          <a href="https://cloud.livekit.io" target="_blank" rel="noreferrer" className="text-indigo-600 underline">
            cloud.livekit.io
          </a>
          {' '}→ your project → Settings → Keys → Create key.
        </p>
        <button
          type="submit"
          disabled={saving || !url || !apiKey || !apiSecret}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Validating & saving…' : status?.configured ? 'Update LiveKit' : 'Connect LiveKit'}
        </button>
      </form>

      {message && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{message}</div>}
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { CloudOff, CloudUpload, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  enableDriverOfflineSync,
  disableDriverOfflineSync,
  subscribeOfflineQueue,
  getOfflineQueueCounts,
  isOfflineMode,
  retryFailedQueueItems,
} from '@/lib/offline/offlineSync';
import { syncDriverOfflineQueue } from '@/api/apiClient';

export default function OfflineSyncProvider({ user, children }) {
  const [online, setOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [counts, setCounts] = useState({ pending: 0, failed: 0, total: 0 });
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const refreshCounts = useCallback(async () => {
    try {
      const c = await getOfflineQueueCounts();
      setCounts(c);
    } catch { /* ignore */ }
  }, []);

  const runSync = useCallback(async () => {
    if (syncing || isOfflineMode()) return;
    setSyncing(true);
    try {
      const result = await syncDriverOfflineQueue();
      await refreshCounts();
      if (result.processed > 0) setLastSync(new Date());
      return result;
    } finally {
      setSyncing(false);
    }
  }, [syncing, refreshCounts]);

  useEffect(() => {
    if (user?.id) enableDriverOfflineSync(user.id);
    return () => disableDriverOfflineSync();
  }, [user?.id]);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      runSync();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [runSync]);

  useEffect(() => {
    const unsub = subscribeOfflineQueue(() => { refreshCounts(); });
    refreshCounts();
    const interval = setInterval(refreshCounts, 4000);
    return () => { unsub(); clearInterval(interval); };
  }, [refreshCounts]);

  useEffect(() => {
    if (online && counts.pending > 0 && !syncing) runSync();
  }, [online, counts.pending, syncing, runSync]);

  const showBanner = !online || counts.pending > 0 || counts.failed > 0 || syncing;

  return (
    <>
      {showBanner && (
        <div
          className={`sticky top-[52px] z-20 px-3 py-2 text-xs font-semibold flex items-center gap-2 border-b ${
            !online
              ? 'bg-amber-950 text-amber-100 border-amber-800'
              : counts.failed > 0
                ? 'bg-red-950 text-red-100 border-red-800'
                : syncing
                  ? 'bg-blue-950 text-blue-100 border-blue-800'
                  : 'bg-slate-800 text-slate-200 border-slate-700'
          }`}
        >
          {!online ? (
            <>
              <CloudOff className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">
                Offline — activity is saved on this device
                {counts.pending > 0 ? ` (${counts.pending} waiting to upload)` : ''}
              </span>
            </>
          ) : syncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="flex-1">Syncing saved activity to fleet office…</span>
            </>
          ) : counts.failed > 0 ? (
            <>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{counts.failed} item(s) failed to sync</span>
              <button
                type="button"
                onClick={async () => { await retryFailedQueueItems(); runSync(); }}
                className="text-[10px] font-black uppercase tracking-wide bg-white/10 px-2 py-1 rounded"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{counts.pending} saved — uploading now…</span>
            </>
          )}
          {online && !syncing && counts.pending === 0 && counts.failed === 0 && lastSync && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
        </div>
      )}
      {children}
    </>
  );
}

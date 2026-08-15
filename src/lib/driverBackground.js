/**
 * Mobile web mitigations for FleetCo Driver — wake lock, persistent storage,
 * service worker background sync (Android Chrome), and visibility resume hooks.
 */

const SYNC_TAG = 'fleetco-driver-sync';
const SW_URL = '/driver-sw.js';

let swRegistration = null;

export function isWakeLockSupported() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export function isBackgroundSyncSupported() {
  return typeof window !== 'undefined' && 'SyncManager' in window;
}

/** Prevent the browser from evicting IndexedDB offline queue data. */
export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;
  try {
    const persisted = await navigator.storage.persisted();
    if (persisted) return true;
    return navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function registerDriverServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    swRegistration = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
    await navigator.serviceWorker.ready;
    return swRegistration;
  } catch {
    return null;
  }
}

/** Ask the service worker to retry sync when connectivity returns (Android Chrome). */
export async function scheduleBackgroundSync() {
  if (!enabledServiceWorker()) return;
  try {
    const reg = swRegistration || (await navigator.serviceWorker.ready);
    if (reg.sync) await reg.sync.register(SYNC_TAG);
  } catch { /* iOS / Safari — no Background Sync API */ }
}

function enabledServiceWorker() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

/** Call once when the driver shell mounts. */
export async function initDriverBackgroundSupport() {
  await Promise.all([
    requestPersistentStorage(),
    registerDriverServiceWorker(),
  ]);
}

export function subscribeServiceWorkerSync(onSync) {
  if (!('serviceWorker' in navigator)) return () => {};
  const handler = (event) => {
    if (event.data?.type === 'FLEETCO_SYNC_OFFLINE') onSync();
  };
  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}

export function onAppVisible(callback) {
  if (typeof document === 'undefined') return () => {};
  const handler = () => {
    if (document.visibilityState === 'visible') callback();
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}

export function isAppHidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

/**
 * Keep the screen awake while dashcam / active driving UI is in foreground.
 * Browsers release wake lock when the tab is hidden — by design.
 */
export function createWakeLock() {
  let lock = null;
  let wantActive = false;

  const reacquire = async () => {
    if (!wantActive || !isWakeLockSupported() || isAppHidden()) return;
    try {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => {
        lock = null;
        if (wantActive && !isAppHidden()) reacquire();
      });
    } catch { /* low battery, unsupported, etc. */ }
  };

  return {
    async acquire() {
      wantActive = true;
      await reacquire();
    },
    async release() {
      wantActive = false;
      try {
        await lock?.release();
      } catch { /* ignore */ }
      lock = null;
    },
    get active() {
      return !!lock;
    },
  };
}

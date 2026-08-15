/**
 * FleetCo Driver service worker — triggers offline queue sync when connectivity returns.
 * Background Sync works on Android Chrome; iOS falls back to visibility-based sync in the app.
 */
const SYNC_TAG = 'fleetco-driver-sync';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  await Promise.all(
    clients.map((client) => client.postMessage({ type: 'FLEETCO_SYNC_OFFLINE' })),
  );
}

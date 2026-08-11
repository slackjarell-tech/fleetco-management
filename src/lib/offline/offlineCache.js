import { getCacheEntry, putCacheEntry } from '@/lib/offline/offlineDb';

function routeCacheKey(userId, date) {
  return `driver_route_${userId}_${date}`;
}

export async function cacheDriverRoute(userId, date, payload) {
  if (!userId || !date) return;
  await putCacheEntry(routeCacheKey(userId, date), {
    ...payload,
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedDriverRoute(userId, date) {
  if (!userId || !date) return null;
  return getCacheEntry(routeCacheKey(userId, date));
}

export function mergeServerRouteWithCache(serverStops, cachedStops) {
  if (!cachedStops?.length || !serverStops?.length) return serverStops;
  const serverById = new Map(serverStops.map((s) => [s.id, s]));
  return serverStops.map((serverStop) => {
    const cached = cachedStops.find((c) => c.id === serverStop.id);
    if (!cached?._offlineQueued) return serverStop;
    const serverTime = serverStop.updated_at || serverStop.delivered_at;
    const cachedTime = cached.delivered_at || cached.updated_at;
    if (serverTime && cachedTime && new Date(serverTime) > new Date(cachedTime)) {
      return serverStop;
    }
    return { ...serverStop, ...cached, _conflictResolved: true };
  });
}

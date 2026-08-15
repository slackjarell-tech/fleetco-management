/**
 * Offline outbox for FleetCo Driver — queues writes when cellular is unavailable,
 * replays in order when connectivity returns.
 */

import {
  deleteBlob,
  deleteQueueItem,
  getBlob,
  listQueueItems,
  putBlob,
  putQueueItem,
} from '@/lib/offline/offlineDb';
import { scheduleBackgroundSync } from '@/lib/driverBackground';

const MAX_RETRIES = 8;
const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

let enabled = false;
let userId = null;
let syncing = false;
let uploadUrlResults = {};
let idMap = {};
let functionResults = {};
const listeners = new Set();

const ID_MAP_KEY = 'fleetco_offline_id_map';

function loadIdMap() {
  try {
    return JSON.parse(localStorage.getItem(ID_MAP_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveIdMap() {
  try {
    localStorage.setItem(ID_MAP_KEY, JSON.stringify(idMap));
  } catch { /* private browsing */ }
}

function notify() {
  listeners.forEach((cb) => {
    try { cb(getQueueSnapshot()); } catch { /* ignore */ }
  });
  scheduleBackgroundSync();
}

export function subscribeOfflineQueue(cb) {
  listeners.add(cb);
  cb(getQueueSnapshot());
  return () => listeners.delete(cb);
}

export function getQueueSnapshot() {
  return { enabled, syncing, userId };
}

export async function getOfflineQueueCounts() {
  const items = await listQueueItems();
  const pending = items.filter((i) => i.status === 'pending' || i.status === 'processing').length;
  const failed = items.filter((i) => i.status === 'failed').length;
  const uploads = items.filter((i) => i.type === 'upload' && i.status !== 'failed').length;
  const dashcam = items.filter((i) => i.path?.includes('captureDashcamFrame') && i.status !== 'failed').length;
  return { pending, failed, total: items.length, uploads, dashcam };
}

export function enableDriverOfflineSync(uid) {
  enabled = true;
  userId = uid || null;
  uploadUrlResults = {};
  idMap = loadIdMap();
  functionResults = {};
  notify();
}

export function disableDriverOfflineSync() {
  enabled = false;
  userId = null;
  notify();
}

export function isDriverOfflineEnabled() {
  return enabled;
}

export function isOfflineMode() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function isNetworkFailure(err) {
  if (!err) return true;
  if (err.name === 'TypeError' && /fetch|network|failed/i.test(err.message || '')) return true;
  return !err.status || err.status === 0;
}

function shouldQueue(method, path) {
  if (!enabled || !WRITE_METHODS.has(method)) return false;
  if (path.startsWith('/auth/login') || path.startsWith('/auth/register')) return false;
  if (path.startsWith('/auth/me') && method === 'GET') return false;
  return (
    path.startsWith('/entities/') ||
    path.startsWith('/functions/') ||
    path.startsWith('/integrations/upload')
  );
}

function newId() {
  return crypto.randomUUID?.() || `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function resolveOfflineStrings(value) {
  if (typeof value === 'string') {
    if (value.startsWith('offline://')) {
      const key = value.slice('offline://'.length);
      const resolved = uploadUrlResults[key];
      if (!resolved) throw new Error(`Upload not synced yet: ${key}`);
      return resolved;
    }
    if (idMap[value]) return idMap[value];
    return value;
  }
  if (Array.isArray(value)) return value.map(resolveOfflineStrings);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveOfflineStrings(v);
    return out;
  }
  return value;
}

function remapPath(path) {
  return path.replace(/\/entities\/([^/]+)\/([^/?]+)/, (_, entity, id) => {
    const mapped = idMap[id] || id;
    return `/entities/${entity}/${mapped}`;
  });
}

function buildOptimisticResponse(item) {
  if (item.type === 'upload') {
    return {
      file_url: `offline://${item.blobKey}`,
      _offlineQueued: true,
      _queueId: item.id,
    };
  }

  const body = item.body ? JSON.parse(item.body) : {};

  if (item.method === 'POST' && item.path.startsWith('/entities/')) {
    const optimisticId = `offline_${item.id}`;
    item.optimisticId = optimisticId;
    return {
      ...body,
      id: optimisticId,
      _offlineQueued: true,
      _queueId: item.id,
      created_date: new Date().toISOString(),
    };
  }

  if (item.method === 'PATCH' && item.path.startsWith('/entities/')) {
    const id = item.path.split('/').pop();
    return { ...body, id: idMap[id] || id, _offlineQueued: true, _queueId: item.id };
  }

  if (item.method === 'POST' && item.path.startsWith('/functions/')) {
    const fnName = item.path.split('/').pop();
    return {
      _offlineQueued: true,
      _queueId: item.id,
      message: `${fnName} saved offline — will sync when connected`,
      ok: true,
    };
  }

  return { _offlineQueued: true, _queueId: item.id, ok: true };
}

/** Coalesce GPS pings — keep one pending DriverLocation write per driver. */
async function coalesceDriverLocation(item) {
  if (item.path !== '/entities/DriverLocation' || item.method !== 'POST') return item;
  const items = await listQueueItems();
  const existing = items.find(
    (i) => i.status === 'pending' && i.path === '/entities/DriverLocation' && i.method === 'POST'
  );
  if (existing) {
    existing.body = item.body;
    existing.createdAt = item.createdAt;
    await putQueueItem(existing);
    return existing;
  }
  return item;
}

export async function enqueueApiRequest({ path, method, body, headers = {} }) {
  const item = {
    id: newId(),
    type: 'fetch',
    path,
    method,
    body: body != null ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    headers,
    status: 'pending',
    retries: 0,
    createdAt: new Date().toISOString(),
    userId,
  };

  const stored = await coalesceDriverLocation(item);
  if (stored.id === item.id) await putQueueItem(item);
  notify();
  return buildOptimisticResponse(stored.id === item.id ? item : stored);
}

export async function enqueueUploadRequest({ file }) {
  const blobKey = newId();
  await putBlob(blobKey, file, { fileName: file.name });

  const item = {
    id: newId(),
    type: 'upload',
    blobKey,
    fileName: file.name,
    mimeType: file.type,
    status: 'pending',
    retries: 0,
    createdAt: new Date().toISOString(),
    userId,
  };
  await putQueueItem(item);
  notify();
  return buildOptimisticResponse(item);
}

/**
 * Wrap apiFetch — queue when offline or on network failure (driver app only).
 */
export async function maybeQueueApiFetch(path, options, doFetch) {
  const method = (options.method || 'GET').toUpperCase();
  const queueable = shouldQueue(method, path);

  if (queueable && (isOfflineMode() || options._forceOfflineQueue)) {
    return enqueueApiRequest({
      path,
      method,
      body: options.body,
      headers: options.headers,
    });
  }

  try {
    return await doFetch();
  } catch (err) {
    if (queueable && isNetworkFailure(err)) {
      return enqueueApiRequest({
        path,
        method,
        body: options.body,
        headers: options.headers,
      });
    }
    throw err;
  }
}

export async function maybeQueueUpload(file, doUpload) {
  if (isOfflineMode()) return enqueueUploadRequest({ file });

  try {
    return await doUpload();
  } catch (err) {
    if (isNetworkFailure(err)) return enqueueUploadRequest({ file });
    throw err;
  }
}

async function executeUpload(item, apiRoot, token) {
  const row = await getBlob(item.blobKey);
  if (!row?.blob) throw new Error('Blob missing from offline store');

  const form = new FormData();
  form.append('file', row.blob, item.fileName || 'upload.bin');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${apiRoot}/api/integrations/upload`, { method: 'POST', headers, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed');

  uploadUrlResults[item.blobKey] = data.file_url;
  await deleteBlob(item.blobKey);
  return data;
}

async function executeFetch(item, doFetch) {
  let path = remapPath(item.path);
  let body = item.body;

  if (body) {
    const parsed = resolveOfflineStrings(JSON.parse(body));
    body = JSON.stringify(parsed);
  }

  const result = await doFetch(path, {
    method: item.method,
    body,
    headers: item.headers,
    skipOfflineQueue: true,
  });

  if (item.optimisticId && result?.id) {
    idMap[item.optimisticId] = result.id;
    saveIdMap();
  }

  if (item.method === 'POST' && item.path.startsWith('/functions/')) {
    functionResults[item.id] = result;
  }

  return result;
}

export async function processOfflineQueue(doFetch, { getToken, apiRoot }) {
  if (syncing || !enabled) return { processed: 0, failed: 0 };
  if (isOfflineMode()) return { processed: 0, failed: 0 };

  syncing = true;
  notify();

  let processed = 0;
  let failed = 0;
  const token = getToken?.();

  try {
    const items = await listQueueItems();
    const pending = items.filter((i) => i.status === 'pending' || i.status === 'failed');

    for (const item of pending) {
      if (isOfflineMode()) break;

      item.status = 'processing';
      await putQueueItem(item);
      notify();

      try {
        if (item.type === 'upload') {
          await executeUpload(item, apiRoot, token);
        } else {
          await executeFetch(item, doFetch);
        }
        await deleteQueueItem(item.id);
        processed += 1;
      } catch (err) {
        item.retries += 1;
        item.lastError = err?.message || 'Sync failed';
        item.status = item.retries >= MAX_RETRIES ? 'failed' : 'pending';
        await putQueueItem(item);
        if (item.status === 'failed') failed += 1;
      }
      notify();
    }
  } finally {
    syncing = false;
    notify();
    if (processed > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fleetco:offline-sync-complete', { detail: { processed, failed } }));
    }
  }

  return { processed, failed };
}

export async function retryFailedQueueItems() {
  const items = await listQueueItems();
  for (const item of items.filter((i) => i.status === 'failed')) {
    item.status = 'pending';
    item.retries = 0;
    item.lastError = undefined;
    await putQueueItem(item);
  }
  notify();
}

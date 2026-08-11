const DB_NAME = 'fleetco_driver_offline';
const DB_VERSION = 2;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('blobs')) {
        db.createObjectStore('blobs', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('dashcamFrames')) {
        const df = db.createObjectStore('dashcamFrames', { keyPath: 'id' });
        df.createIndex('status', 'status', { unique: false });
        df.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(storeName, mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const result = fn(store);
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error);
      })
  );
}

export async function putQueueItem(item) {
  await tx('queue', 'readwrite', (store) => store.put(item));
  return item;
}

export async function getQueueItem(id) {
  return tx('queue', 'readonly', (store) => new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  }));
}

export async function deleteQueueItem(id) {
  await tx('queue', 'readwrite', (store) => store.delete(id));
}

export async function listQueueItems({ status } = {}) {
  return tx('queue', 'readonly', (store) => new Promise((resolve, reject) => {
    const items = [];
    const req = status ? store.index('status').openCursor(IDBKeyRange.only(status)) : store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        resolve(items);
      }
    };
    req.onerror = () => reject(req.error);
  }));
}

export async function putBlob(key, blob, meta = {}) {
  await tx('blobs', 'readwrite', (store) =>
    store.put({ key, blob, mimeType: blob.type, size: blob.size, createdAt: new Date().toISOString(), ...meta })
  );
  return key;
}

export async function getBlob(key) {
  const row = await tx('blobs', 'readonly', (store) => new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  }));
  return row;
}

export async function deleteBlob(key) {
  await tx('blobs', 'readwrite', (store) => store.delete(key));
}

export async function clearOfflineData() {
  await tx('queue', 'readwrite', (store) => store.clear());
  await tx('blobs', 'readwrite', (store) => store.clear());
}

export async function putCacheEntry(key, value) {
  await tx('cache', 'readwrite', (store) =>
    store.put({ key, value, updatedAt: new Date().toISOString() })
  );
}

export async function getCacheEntry(key) {
  const row = await tx('cache', 'readonly', (store) => new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  }));
  return row?.value || null;
}

export async function putDashcamFrame(item) {
  await tx('dashcamFrames', 'readwrite', (store) => store.put(item));
  return item;
}

export async function listDashcamFrames({ status } = {}) {
  return tx('dashcamFrames', 'readonly', (store) => new Promise((resolve, reject) => {
    const items = [];
    const req = status ? store.index('status').openCursor(IDBKeyRange.only(status)) : store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        resolve(items);
      }
    };
    req.onerror = () => reject(req.error);
  }));
}

export async function deleteDashcamFrame(id) {
  await tx('dashcamFrames', 'readwrite', (store) => store.delete(id));
}

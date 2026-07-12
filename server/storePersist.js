/**
 * Persistent store — PostgreSQL in production (survives redeploys), JSON file locally.
 *
 * Production rule: when Postgres has a row, it is the source of truth.
 * The disk mirror is a backup only — never overwrite Postgres with a stale/empty file.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isStartupPhase,
  mergeStorePreserveData,
  wouldShrinkData,
} from './dataIntegrity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_PATH || path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'store.json');
const backupPath = `${dbPath}.bak`;

export const defaultStore = {
  users: [],
  entities: [],
  otp_codes: {},
  site_settings: {},
};

let memoryStore = null;
let persistQueue = Promise.resolve();
let backend = 'file';
let pool = null;

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function normalizeStore(raw) {
  const store = raw && typeof raw === 'object' ? raw : {};
  return {
    users: Array.isArray(store.users) ? store.users : [],
    entities: Array.isArray(store.entities) ? store.entities : [],
    otp_codes: store.otp_codes && typeof store.otp_codes === 'object' ? store.otp_codes : {},
    site_settings: store.site_settings && typeof store.site_settings === 'object' ? store.site_settings : {},
  };
}

function customerCount(store) {
  return store?.entities?.filter((e) => e.entity_type === 'Customer').length ?? 0;
}

function userCount(store) {
  return store?.users?.length ?? 0;
}

let baselineCustomerCount = 0;
let baselineUserCount = 0;

function writeStoreFile(store) {
  ensureDataDir();
  const payload = JSON.stringify(store, null, 2);
  const tmpPath = path.join(dataDir, `store.${process.pid}.${Date.now()}.tmp.json`);
  fs.writeFileSync(tmpPath, payload, 'utf8');
  if (fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(dbPath, backupPath);
    } catch (err) {
      console.warn('[datastore] Could not write backup:', err.message);
    }
    fs.unlinkSync(dbPath);
  }
  fs.renameSync(tmpPath, dbPath);
}

function loadFromFile() {
  ensureDataDir();
  if (!fs.existsSync(dbPath)) {
    if (fs.existsSync(backupPath)) {
      console.warn('[datastore] store.json missing — restoring from .bak');
      fs.copyFileSync(backupPath, dbPath);
    } else {
      return null;
    }
  }
  try {
    return normalizeStore(JSON.parse(fs.readFileSync(dbPath, 'utf8')));
  } catch (err) {
    if (fs.existsSync(backupPath)) {
      console.error('[datastore] Corrupt store.json — restoring .bak:', err.message);
      return normalizeStore(JSON.parse(fs.readFileSync(backupPath, 'utf8')));
    }
    throw new Error(`Database file corrupt: ${err.message}`);
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_store (
      id SMALLINT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function loadFromPostgres() {
  const res = await pool.query('SELECT data FROM app_store WHERE id = 1');
  if (!res.rows.length) return { store: normalizeStore(defaultStore), hasRow: false };
  return { store: normalizeStore(res.rows[0].data), hasRow: true };
}

async function persistToPostgres(store, { allowShrink = false } = {}) {
  if (!pool) return;

  const { store: existing, hasRow } = await loadFromPostgres();
  let payload = store;

  if (hasRow && isStartupPhase()) {
    payload = mergeStorePreserveData(existing, store);
    memoryStore = payload;
  }

  if (hasRow && !allowShrink) {
    if (wouldShrinkData(existing, payload)) {
      const ex = countStats(existing);
      const nx = countStats(payload);
      console.error(
        `[datastore] BLOCKED Postgres write — would shrink data ` +
          `(users ${ex.users}→${nx.users}, customers ${ex.customers}→${nx.customers}, entities ${ex.entities}→${nx.entities})`,
      );
      if (isStartupPhase()) {
        memoryStore = existing;
      }
      return;
    }
  }

  await pool.query(
    `INSERT INTO app_store (id, data, updated_at)
     VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [JSON.stringify(payload)],
  );
}

function countStats(store) {
  return {
    users: store?.users?.length ?? 0,
    customers: store?.entities?.filter((e) => e.entity_type === 'Customer').length ?? 0,
    entities: store?.entities?.length ?? 0,
  };
}

function logStats() {
  const stats = getStoreStats();
  console.log(
    `[datastore] backend=${stats.backend} users=${stats.userCount} customers=${stats.customerCount} entities=${stats.entityCount}` +
      (stats.path ? ` mirror=${stats.path}` : ''),
  );
}

function isEmptyStore(store) {
  return userCount(store) === 0 && (store?.entities?.length ?? 0) === 0;
}

/**
 * Pick startup store for production Postgres.
 * Postgres wins whenever it already has users or entities — disk cannot replace it.
 */
function resolveProductionStore(pgSnapshot, pgHasRow, fileSnapshot) {
  if (pgHasRow && !isEmptyStore(pgSnapshot)) {
    const pgStats = countStats(pgSnapshot);
    const fileStats = fileSnapshot ? countStats(fileSnapshot) : null;
    if (
      fileStats &&
      (fileStats.users > pgStats.users || fileStats.customers > pgStats.customers)
    ) {
      console.warn(
        `[datastore] Keeping Postgres (users=${pgStats.users}, customers=${pgStats.customers}) — disk mirror is stale`,
      );
    }
    return pgSnapshot;
  }

  if (pgHasRow && isEmptyStore(pgSnapshot) && fileSnapshot && !isEmptyStore(fileSnapshot)) {
    console.warn('[datastore] Postgres empty — importing from disk mirror');
    return fileSnapshot;
  }

  if (pgHasRow) {
    return pgSnapshot;
  }

  if (fileSnapshot) {
    console.warn('[datastore] Postgres empty — bootstrapping from disk mirror');
    return fileSnapshot;
  }

  return normalizeStore(defaultStore);
}

export async function initDatabase() {
  const fileSnapshot = loadFromFile();

  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.error(
      '[datastore] WARNING: DATABASE_URL is not set in production — customer data may be lost on redeploy. Link Postgres in Render.',
    );
  }

  if (process.env.DATABASE_URL) {
    backend = 'postgres';
    const pg = await import('pg');
    pool = new pg.default.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    });
    await ensureSchema();
    const { store: pgSnapshot, hasRow: pgHasRow } = await loadFromPostgres();

    memoryStore = resolveProductionStore(pgSnapshot, pgHasRow, fileSnapshot);

    const shouldSeedPostgres =
      !pgHasRow || customerCount(memoryStore) > customerCount(pgSnapshot);
    if (shouldSeedPostgres) {
      await persistToPostgres(memoryStore, { allowShrink: false });
    }

    try {
      writeStoreFile(memoryStore);
    } catch (err) {
      console.warn('[datastore] Could not mirror store to disk:', err.message);
    }
  } else {
    backend = 'file';
    memoryStore = fileSnapshot || normalizeStore(defaultStore);
    if (!fileSnapshot) {
      writeStoreFile(memoryStore);
    }
  }

  baselineCustomerCount = customerCount(memoryStore);
  baselineUserCount = userCount(memoryStore);
  logStats();
}

export function getMemoryStore() {
  if (!memoryStore) {
    throw new Error('Database not initialized — call initDatabase() before using the store');
  }
  return memoryStore;
}

export function scheduleSave(store, { allowShrink = false } = {}) {
  memoryStore = store;
  try {
    writeStoreFile(store);
  } catch (err) {
    console.warn('[datastore] File mirror write failed:', err.message);
  }
  if (backend === 'postgres' && pool) {
    persistQueue = persistQueue
      .then(() => persistToPostgres(store, { allowShrink }))
      .catch((err) => console.error('[datastore] Postgres persist failed:', err.message));
  }
}

export async function flushDatabase() {
  await persistQueue;
  const currentCustomers = customerCount(memoryStore || defaultStore);
  const currentUsers = userCount(memoryStore || defaultStore);
  if (baselineCustomerCount > 0 && currentCustomers < baselineCustomerCount) {
    console.error(
      `[datastore] Customer count dropped during session (${baselineCustomerCount} → ${currentCustomers})`,
    );
  }
  if (baselineUserCount > 0 && currentUsers < baselineUserCount) {
    console.error(
      `[datastore] User count dropped during session (${baselineUserCount} → ${currentUsers})`,
    );
  }
}

export function getStoreStats() {
  const store = memoryStore || defaultStore;
  return {
    backend,
    path: dbPath,
    dataDir,
    userCount: store.users?.length ?? 0,
    customerCount: store.entities?.filter((e) => e.entity_type === 'Customer').length ?? 0,
    entityCount: store.entities?.length ?? 0,
    fileExists: fs.existsSync(dbPath),
    backupExists: fs.existsSync(backupPath),
    postgres: !!process.env.DATABASE_URL,
    lastModified: fs.existsSync(dbPath) ? fs.statSync(dbPath).mtime.toISOString() : null,
  };
}

export function exportStoreSnapshot() {
  return structuredClone(getMemoryStore());
}

export async function importStoreSnapshot(raw) {
  const store =
    raw?.users !== undefined
      ? {
          users: Array.isArray(raw.users) ? raw.users : [],
          entities: Array.isArray(raw.entities) ? raw.entities : [],
          otp_codes: raw.otp_codes && typeof raw.otp_codes === 'object' ? raw.otp_codes : {},
          site_settings: raw.site_settings && typeof raw.site_settings === 'object' ? raw.site_settings : {},
        }
      : normalizeStore(raw);

  memoryStore = store;
  baselineCustomerCount = customerCount(store);
  baselineUserCount = userCount(store);

  try {
    writeStoreFile(store);
  } catch (err) {
    console.warn('[datastore] Could not write restored store to disk:', err.message);
  }

  if (backend === 'postgres' && pool) {
    await persistToPostgres(store, { allowShrink: true });
  }

  logStats();
  return getStoreStats();
}

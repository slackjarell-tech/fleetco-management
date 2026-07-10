/**
 * Persistent store — PostgreSQL in production (survives redeploys), JSON file locally.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function storeScore(store) {
  const customers = store.entities?.filter((e) => e.entity_type === 'Customer').length ?? 0;
  return (store.users?.length ?? 0) * 100 + (store.entities?.length ?? 0) + customers * 50;
}

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
  if (!res.rows.length) return normalizeStore(defaultStore);
  return normalizeStore(res.rows[0].data);
}

async function persistToPostgres(store) {
  await pool.query(
    `INSERT INTO app_store (id, data, updated_at)
     VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [JSON.stringify(store)],
  );
}

function logStats() {
  const stats = getStoreStats();
  console.log(
    `[datastore] backend=${stats.backend} users=${stats.userCount} customers=${stats.customerCount} entities=${stats.entityCount}` +
      (stats.path ? ` mirror=${stats.path}` : ''),
  );
}

export async function initDatabase() {
  const fileSnapshot = loadFromFile();

  if (process.env.DATABASE_URL) {
    backend = 'postgres';
    const pg = await import('pg');
    pool = new pg.default.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    });
    await ensureSchema();
    const pgSnapshot = await loadFromPostgres();

    if (fileSnapshot && storeScore(fileSnapshot) > storeScore(pgSnapshot)) {
      console.warn('[datastore] Local file has more data than Postgres — importing file snapshot into database');
      memoryStore = fileSnapshot;
    } else {
      memoryStore = pgSnapshot;
    }

    await persistToPostgres(memoryStore);
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

  logStats();
}

export function getMemoryStore() {
  if (!memoryStore) {
    throw new Error('Database not initialized — call initDatabase() before using the store');
  }
  return memoryStore;
}

export function scheduleSave(store) {
  memoryStore = store;
  try {
    writeStoreFile(store);
  } catch (err) {
    console.warn('[datastore] File mirror write failed:', err.message);
  }
  if (backend === 'postgres' && pool) {
    persistQueue = persistQueue
      .then(() => persistToPostgres(store))
      .catch((err) => console.error('[datastore] Postgres persist failed:', err.message));
  }
}

export async function flushDatabase() {
  await persistQueue;
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

import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_PATH || path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'store.json');
const backupPath = `${dbPath}.bak`;

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const defaultStore = {
  users: [],
  entities: [],
  otp_codes: {},
  site_settings: {},
};

export const DEFAULT_SITE_SETTINGS = {
  hero_badge: 'Dallas, TX — Serving Owner Operators Nationwide',
  hero_title_line1: 'Keep Your Fleet',
  hero_title_highlight: 'Running Strong.',
  hero_description:
    'FleetCo Management LLC helps owner operators and small fleet owners cut costs, find parts, optimize fuel, and stay compliant — so you can focus on moving freight, not managing breakdowns.',
  tagline: 'Move freight. We handle the rest.',
  contact_email: 'info@fleetcomanagement.org',
  contact_phone: '(360) 952-1249',
  company_location: 'Dallas, TX',
};

export function getSiteSettings() {
  const store = loadStore();
  return { ...DEFAULT_SITE_SETTINGS, ...(store.site_settings || {}) };
}

export function updateSiteSettings(changes) {
  const allowed = Object.keys(DEFAULT_SITE_SETTINGS);
  const patch = {};
  for (const [key, value] of Object.entries(changes || {})) {
    if (allowed.includes(key) && value != null) patch[key] = String(value);
  }
  if (!Object.keys(patch).length) return getSiteSettings();
  withStore((store) => {
    store.site_settings = { ...(store.site_settings || {}), ...patch };
  });
  return getSiteSettings();
}

function loadStore() {
  if (!fs.existsSync(dbPath)) {
    if (fs.existsSync(backupPath)) {
      console.warn('[datastore] store.json missing — restoring from backup');
      fs.copyFileSync(backupPath, dbPath);
    } else {
      fs.writeFileSync(dbPath, JSON.stringify(defaultStore, null, 2));
      return structuredClone(defaultStore);
    }
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.entities)) {
      throw new Error('Invalid store schema');
    }
    if (!parsed.otp_codes) parsed.otp_codes = {};
    if (!parsed.site_settings) parsed.site_settings = {};
    return parsed;
  } catch (err) {
    if (fs.existsSync(backupPath)) {
      console.error('[datastore] Corrupt store.json — restoring backup:', err.message);
      const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      writeStoreFile(backup);
      return backup;
    }
    throw new Error(`Database file corrupt and no backup available: ${err.message}`);
  }
}

function writeStoreFile(store) {
  const payload = JSON.stringify(store, null, 2);
  const tmpPath = path.join(dataDir, `store.${process.pid}.${Date.now()}.tmp.json`);
  fs.writeFileSync(tmpPath, payload, 'utf8');
  if (fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(dbPath, backupPath);
    } catch (copyErr) {
      console.warn('[datastore] Could not write backup:', copyErr.message);
    }
    fs.unlinkSync(dbPath);
  }
  fs.renameSync(tmpPath, dbPath);
}

function saveStore(store) {
  writeStoreFile(store);
}

export function getStoreStats() {
  let store;
  try {
    store = loadStore();
  } catch {
    store = defaultStore;
  }
  return {
    path: dbPath,
    dataDir,
    userCount: store.users?.length ?? 0,
    customerCount: store.entities?.filter((e) => e.entity_type === 'Customer').length ?? 0,
    entityCount: store.entities?.length ?? 0,
    fileExists: fs.existsSync(dbPath),
    backupExists: fs.existsSync(backupPath),
    lastModified: fs.existsSync(dbPath) ? fs.statSync(dbPath).mtime.toISOString() : null,
  };
}

function withStore(mutator) {
  const store = loadStore();
  const result = mutator(store);
  saveStore(store);
  return result;
}

export const db = {
  setOtp(email, code, expiresAt) {
    withStore((store) => {
      store.otp_codes[email.toLowerCase()] = { code, expires_at: expiresAt };
    });
  },
  getOtp(email) {
    return loadStore().otp_codes[email.toLowerCase()] || null;
  },
  deleteOtp(email) {
    withStore((store) => {
      delete store.otp_codes[email.toLowerCase()];
    });
  },
};

export function nowIso() {
  return new Date().toISOString();
}

export function newId() {
  return randomUUID();
}

export function parseUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name || row.email.split('@')[0],
    role: row.role,
    customer_id: row.customer_id,
    status: row.status,
    sidebar_modules: row.sidebar_modules,
    employee_number: row.employee_number,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

export function listUsers() {
  return loadStore().users
    .slice()
    .sort((a, b) => (a.created_date < b.created_date ? 1 : -1))
    .map(parseUser);
}

export function findUserByEmail(email) {
  const row = loadStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return parseUser(row);
}

export function findUserById(id) {
  const row = loadStore().users.find((u) => u.id === id);
  return parseUser(row);
}

export function getUserRowByEmail(email) {
  return loadStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function createUser({ email, passwordHash, fullName, role = 'user', customerId, employeeNumber }) {
  const id = newId();
  const ts = nowIso();
  const user = {
    id,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    full_name: fullName || email.split('@')[0],
    role,
    customer_id: customerId || null,
    employee_number: employeeNumber || null,
    status: 'active',
    created_date: ts,
    updated_date: ts,
  };
  withStore((store) => {
    store.users.push(user);
  });
  return findUserById(id);
}

export function updateUser(id, fields) {
  const allowed = ['full_name', 'role', 'customer_id', 'status', 'sidebar_modules', 'employee_number', 'password_hash'];
  let updated = null;
  withStore((store) => {
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return;
    for (const [key, val] of Object.entries(fields)) {
      if (!allowed.includes(key)) continue;
      store.users[idx][key] = val;
    }
    store.users[idx].updated_date = nowIso();
    updated = parseUser(store.users[idx]);
  });
  return updated;
}

export function deleteUser(id) {
  withStore((store) => {
    store.users = store.users.filter((u) => u.id !== id);
  });
}

export function filterUsers(criteria = {}) {
  let users = listUsers();
  for (const [key, val] of Object.entries(criteria)) {
    if (val === undefined || val === null || val === '') continue;
    users = users.filter((u) => u[key] === val || String(u[key]) === String(val));
  }
  return users;
}

export function parseEntityRow(row) {
  return {
    id: row.id,
    ...row.data,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

export function listEntities(entityType, sort, limit) {
  let items = loadStore().entities
    .filter((e) => e.entity_type === entityType)
    .map(parseEntityRow);
  items = sortEntities(items, sort);
  if (limit) items = items.slice(0, limit);
  return items;
}

export function filterEntities(entityType, criteria = {}, sort, limit) {
  let items = listEntities(entityType);
  const keys = Object.keys(criteria).filter((k) => criteria[k] !== undefined && criteria[k] !== '');
  if (keys.length) {
    items = items.filter((item) =>
      keys.every((k) => item[k] === criteria[k] || String(item[k]) === String(criteria[k]))
    );
  }
  items = sortEntities(items, sort);
  if (limit) items = items.slice(0, limit);
  return items;
}

export function sortEntities(items, sort) {
  if (!sort) return items;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

export function getEntity(entityType, id) {
  const row = loadStore().entities.find((e) => e.entity_type === entityType && e.id === id);
  return row ? parseEntityRow(row) : null;
}

export function createEntity(entityType, data) {
  const id = data.id || newId();
  const ts = nowIso();
  const { created_date, updated_date, id: _id, ...rest } = data;
  const row = {
    id,
    entity_type: entityType,
    data: { ...rest },
    created_date: created_date || ts,
    updated_date: updated_date || ts,
  };
  withStore((store) => {
    store.entities.push(row);
  });
  return getEntity(entityType, id);
}

export function updateEntity(entityType, id, data) {
  const existing = getEntity(entityType, id);
  if (!existing) return null;
  const ts = nowIso();
  const { id: _id, created_date, updated_date, ...rest } = data;
  const merged = { ...existing, ...rest, id, created_date: existing.created_date, updated_date: ts };
  const { id: __, created_date: cd, updated_date: ud, ...payload } = merged;
  withStore((store) => {
    const idx = store.entities.findIndex((e) => e.entity_type === entityType && e.id === id);
    if (idx !== -1) {
      store.entities[idx].data = payload;
      store.entities[idx].updated_date = ts;
    }
  });
  return getEntity(entityType, id);
}

export function deleteEntity(entityType, id) {
  withStore((store) => {
    store.entities = store.entities.filter((e) => !(e.entity_type === entityType && e.id === id));
  });
}

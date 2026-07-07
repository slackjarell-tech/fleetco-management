import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'store.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const defaultStore = {
  users: [],
  entities: [],
  otp_codes: {},
};

function loadStore() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultStore, null, 2));
    return structuredClone(defaultStore);
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveStore(store) {
  fs.writeFileSync(dbPath, JSON.stringify(store, null, 2));
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

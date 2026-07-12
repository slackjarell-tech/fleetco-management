import {
  exportStoreSnapshot,
  getStoreStats,
  importStoreSnapshot,
} from './storePersist.js';

export const BACKUP_VERSION = 1;

function parseEntityRow(row) {
  return row?.data ? { id: row.id, entity_type: row.entity_type, ...row.data } : row;
}

/** Build login/password manifest for executives and SLT. */
export function buildCredentialsManifest(store) {
  const users = store.users || [];
  const entities = (store.entities || []).map(parseEntityRow);
  const customers = entities.filter((e) => e.entity_type === 'Customer');
  const customerById = Object.fromEntries(customers.map((c) => [c.id, c]));
  const pendingByEmail = {};

  for (const row of store.entities || []) {
    if (row.entity_type !== 'PendingAccount') continue;
    const p = parseEntityRow(row);
    if (!p.email) continue;
    const key = p.email.trim().toLowerCase();
    if (!pendingByEmail[key] || !p.activated) {
      pendingByEmail[key] = p;
    }
  }

  const credentials = [];

  for (const user of users) {
    const email = user.email?.trim().toLowerCase();
    if (!email) continue;
    const pending = pendingByEmail[email];
    const customer = user.customer_id ? customerById[user.customer_id] : null;
    const entry = {
      email,
      full_name: user.full_name || email.split('@')[0],
      role: user.role,
      user_id: user.id,
      customer_id: user.customer_id || null,
      company_name: customer?.company_name || null,
      login_preserved: true,
    };

    if (pending?.temp_password) {
      entry.password = pending.temp_password;
      entry.password_source = 'pending_account';
      entry.activated = !!pending.activated;
    } else if (user.password_hash) {
      entry.password = null;
      entry.password_source = 'bcrypt_hash';
      entry.note = 'Password hash included in backup — logins work after restore. Plaintext not stored.',
    } else {
      entry.password = null;
      entry.password_source = 'unknown';
      entry.note = 'No password on file',
    }

    credentials.push(entry);
  }

  // Pending accounts without a user row yet
  for (const p of Object.values(pendingByEmail)) {
    const email = p.email?.trim().toLowerCase();
    if (!email || credentials.some((c) => c.email === email)) continue;
    const customer = p.customer_id ? customerById[p.customer_id] : null;
    credentials.push({
      email,
      full_name: p.full_name || email.split('@')[0],
      role: p.role || 'user',
      user_id: null,
      customer_id: p.customer_id || null,
      company_name: customer?.company_name || null,
      password: p.temp_password || null,
      password_source: 'pending_account',
      activated: !!p.activated,
      login_preserved: false,
      note: 'Pending account — user row may be created on first login',
    });
  }

  credentials.sort((a, b) => {
    const roleOrder = (r) =>
      ['owner', 'executive', 'fleet_manager', 'fleet_coordinator', 'user', 'driver'].indexOf(r);
    const ra = roleOrder(a.role);
    const rb = roleOrder(b.role);
    if (ra !== rb) return ra - rb;
    return a.email.localeCompare(b.email);
  });

  return credentials;
}

export function buildFullBackup(exportedBy) {
  const store = exportStoreSnapshot();
  const stats = getStoreStats();
  const credentials = buildCredentialsManifest(store);

  return {
    backup_version: BACKUP_VERSION,
    app: 'fleetco-management',
    exported_at: new Date().toISOString(),
    exported_by: exportedBy?.email || null,
    stats: {
      users: stats.userCount,
      customers: stats.customerCount,
      entities: stats.entityCount,
      backend: stats.backend,
    },
    store,
    credentials,
  };
}

function normalizeImportedStore(raw) {
  const store = raw?.store || raw;
  if (!store || typeof store !== 'object') {
    throw new Error('Backup file is missing a store object');
  }
  return {
    users: Array.isArray(store.users) ? store.users : [],
    entities: Array.isArray(store.entities) ? store.entities : [],
    otp_codes: store.otp_codes && typeof store.otp_codes === 'object' ? store.otp_codes : {},
    site_settings: store.site_settings && typeof store.site_settings === 'object' ? store.site_settings : {},
  };
}

export function validateBackup(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid backup file — expected JSON object');
  }
  const version = payload.backup_version ?? payload.version;
  if (version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version (${version}). Expected ${BACKUP_VERSION}.`);
  }
  const store = normalizeImportedStore(payload);
  if (!store.users.length && !store.entities.length) {
    throw new Error('Backup appears empty — no users or entities found');
  }
  const missingHashes = store.users.filter((u) => u.email && !u.password_hash).length;
  return {
    valid: true,
    users: store.users.length,
    customers: store.entities.filter((e) => e.entity_type === 'Customer').length,
    entities: store.entities.length,
    credentials: payload.credentials?.length ?? buildCredentialsManifest(store).length,
    usersMissingPasswordHash: missingHashes,
    exported_at: payload.exported_at || null,
  };
}

export async function restoreFromBackup(payload) {
  validateBackup(payload);
  const store = normalizeImportedStore(payload);
  const before = getStoreStats();
  const stats = await importStoreSnapshot(store);
  return {
    success: true,
    before,
    after: stats,
    message: `Restored ${stats.userCount} users, ${stats.customerCount} customers, ${stats.entityCount} entities. Password hashes preserved — logins unchanged.`,
  };
}

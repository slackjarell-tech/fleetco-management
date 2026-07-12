/**
 * Protect live user/customer data during deploy startup.
 * Code updates must not reset passwords or remove existing users or entities.
 */

let startupPhase = false;

export function beginStartupPhase() {
  startupPhase = true;
}

export function endStartupPhase() {
  startupPhase = false;
}

export function isStartupPhase() {
  return startupPhase;
}

function entityKey(row) {
  return `${row.entity_type}:${row.id}`;
}

/**
 * Union-merge stores: incoming updates win, but nothing is deleted and
 * existing password hashes are never replaced by startup migrations.
 */
export function mergeStorePreserveData(existing, incoming) {
  const existingUsers = Array.isArray(existing?.users) ? existing.users : [];
  const incomingUsers = Array.isArray(incoming?.users) ? incoming.users : [];
  const userById = new Map(existingUsers.map((u) => [u.id, { ...u }]));

  for (const user of incomingUsers) {
    const prev = userById.get(user.id);
    if (!prev) {
      userById.set(user.id, { ...user });
      continue;
    }
    const merged = { ...prev, ...user };
    if (prev.password_hash && user.password_hash && prev.password_hash !== user.password_hash) {
      merged.password_hash = prev.password_hash;
    }
    userById.set(user.id, merged);
  }

  const existingEntities = Array.isArray(existing?.entities) ? existing.entities : [];
  const incomingEntities = Array.isArray(incoming?.entities) ? incoming.entities : [];
  const entityByKey = new Map(existingEntities.map((e) => [entityKey(e), { ...e }]));

  for (const entity of incomingEntities) {
    const key = entityKey(entity);
    const prev = entityByKey.get(key);
    if (!prev) {
      entityByKey.set(key, { ...entity });
      continue;
    }
    entityByKey.set(key, {
      ...prev,
      ...entity,
      data: { ...(prev.data || {}), ...(entity.data || {}) },
      created_date: prev.created_date || entity.created_date,
    });
  }

  return {
    users: [...userById.values()],
    entities: [...entityByKey.values()],
    otp_codes: { ...(existing?.otp_codes || {}), ...(incoming?.otp_codes || {}) },
    site_settings: { ...(existing?.site_settings || {}), ...(incoming?.site_settings || {}) },
  };
}

export function sanitizeUserPatch(userId, fields, getUserById) {
  if (!startupPhase || !fields?.password_hash) return fields;

  const row = getUserById(userId);
  if (!row?.password_hash) return fields;

  if (fields.password_hash !== row.password_hash) {
    console.log(`[integrity] Preserved password for ${row.email} during startup`);
    const { password_hash: _removed, ...rest } = fields;
    return rest;
  }

  return fields;
}

export function assertUserDeleteAllowed(userId, getUserById) {
  if (!startupPhase) return true;
  const row = getUserById(userId);
  console.warn(`[integrity] Blocked user delete during startup: ${row?.email || userId}`);
  return false;
}

export function countStats(store) {
  return {
    users: store?.users?.length ?? 0,
    customers: store?.entities?.filter((e) => e.entity_type === 'Customer').length ?? 0,
    entities: store?.entities?.length ?? 0,
  };
}

export function wouldShrinkData(existing, incoming) {
  const before = countStats(existing);
  const after = countStats(incoming);
  return (
    (before.customers > 0 && after.customers < before.customers) ||
    (before.users > 0 && after.users < before.users) ||
    (before.entities > 0 && after.entities < before.entities)
  );
}

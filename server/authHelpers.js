import { filterEntities, updateEntity } from './db.js';

export function findPendingActivation(email) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const pending = filterEntities('PendingAccount', { email: normalized, activated: false }, null, 1)[0];
  if (pending) return pending;
  const all = filterEntities('PendingAccount', { email: normalized });
  return all.find((p) => !p.activated) || null;
}

export function userMustChangePassword(email) {
  return !!findPendingActivation(email);
}

export function activatePendingAccount(email) {
  const normalized = email.trim().toLowerCase();
  const rows = filterEntities('PendingAccount', { email: normalized });
  let updated = 0;
  for (const row of rows) {
    if (!row.activated) {
      updateEntity('PendingAccount', row.id, { activated: true });
      updated += 1;
    }
  }
  return updated;
}

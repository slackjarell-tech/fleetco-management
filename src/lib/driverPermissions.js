const STORAGE_PREFIX = 'fleetco_driver_permissions_v1';

export function permissionsStorageKey(userId) {
  return `${STORAGE_PREFIX}_${userId || 'unknown'}`;
}

export function hasCompletedPermissionSetup(userId) {
  try {
    return localStorage.getItem(permissionsStorageKey(userId)) === 'granted';
  } catch {
    return false;
  }
}

export function markPermissionSetupComplete(userId) {
  try {
    localStorage.setItem(permissionsStorageKey(userId), 'granted');
  } catch { /* private browsing */ }
}

export function clearPermissionSetup(userId) {
  try {
    localStorage.removeItem(permissionsStorageKey(userId));
  } catch { /* ignore */ }
}

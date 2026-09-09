/**
 * Driver Media — live video, dashcam, and recordings access for all customers + FleetCo team.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listEntities, updateEntity } from './db.js';
import { isInternalRole } from './entityScope.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION_MARKER = path.join(
  process.env.DATA_PATH || path.join(__dirname, 'data'),
  '.driver-media-all-fleets-v1',
);

/** Customer portal roles that may view live feeds and recordings (not mobile drivers). */
export const CUSTOMER_VIEW_MEDIA_ROLES = [
  'customer_owner',
  'customer_hr',
  'customer_fleet_manager',
  'customer_fleet_coordinator',
  'customer_parts_manager',
  'user',
];

/** Customer roles that may download or permanently keep recordings. */
export const CUSTOMER_DOWNLOAD_MEDIA_ROLES = [
  'customer_owner',
  'customer_hr',
  'customer_fleet_manager',
  'customer_fleet_coordinator',
  'user',
];

function normalizeCustomerRole(role) {
  return role === 'user' ? 'customer_owner' : role;
}

/** Dual camera / live stream is on by default for every customer (opt-out only). */
export function isDualCameraEnabledForCustomer(customer) {
  return customer?.driver_dual_camera_enabled !== false;
}

export function canViewDriverMedia(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  if (!user.customer_id) return false;
  return CUSTOMER_VIEW_MEDIA_ROLES.includes(normalizeCustomerRole(user.role));
}

export function canDownloadDriverMedia(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  if (!user.customer_id) return false;
  return CUSTOMER_DOWNLOAD_MEDIA_ROLES.includes(normalizeCustomerRole(user.role));
}

/** Fleet office staff who may request a driver start live video remotely. */
export function canStartLiveVideoForDriver(user) {
  return canDownloadDriverMedia(user);
}

/** Enable live video for all customer fleets (one-time), then backfill any unset records. */
export function ensureDriverMediaDefaults() {
  const customers = listEntities('Customer');
  let updated = 0;

  if (!fs.existsSync(MIGRATION_MARKER)) {
    for (const c of customers) {
      if (c.driver_dual_camera_enabled !== true) {
        updateEntity('Customer', c.id, { driver_dual_camera_enabled: true });
        updated += 1;
      }
    }
    try {
      fs.mkdirSync(path.dirname(MIGRATION_MARKER), { recursive: true });
      fs.writeFileSync(MIGRATION_MARKER, new Date().toISOString());
    } catch { /* non-fatal */ }
    if (updated > 0) {
      console.log(`[driver-media] One-time: enabled live video for ${updated} existing customer fleet(s)`);
    }
    return;
  }

  for (const c of customers) {
    if (c.driver_dual_camera_enabled == null) {
      updateEntity('Customer', c.id, { driver_dual_camera_enabled: true });
      updated += 1;
    }
  }
  if (updated > 0) {
    console.log(`[driver-media] Enabled live video by default for ${updated} new customer fleet(s)`);
  }
}

import { uploadUrl } from '@/lib/nativeBridge';
import { canPostLoad, canDispatchLoad } from '@/lib/loadBoardAccess';
import { isPureDriverUser, isDriverCapableUser } from '@/lib/driverAccess';

export const BOL_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx';
export const BOL_MAX_MB = 15;

export function bolFileUrl(load) {
  if (!load?.bol_file_url) return null;
  return uploadUrl(load.bol_file_url);
}

export function bolDisplayName(load) {
  return load?.bol_file_name || 'Bill of Lading.pdf';
}

export function hasBol(load) {
  return !!load?.bol_file_url;
}

/** Brokers, shippers, and dispatch can attach or replace a BOL. */
export function canUploadBol(user) {
  if (!user) return false;
  return canPostLoad(user) || canDispatchLoad(user);
}

/** Assigned drivers and load posters can view/download the BOL. */
export function canDownloadBol(user, load) {
  if (!user || !hasBol(load)) return false;
  if (canDispatchLoad(user) || canPostLoad(user)) return true;
  if (load.assigned_driver_id && (user.id === load.assigned_driver_id)) return true;
  if (isDriverCapableUser(user) && load.assigned_driver_id === user.id) return true;
  if (isPureDriverUser(user) && load.assigned_driver_id === user.id) return true;
  if (user.customer_id && load.customer_id === user.customer_id && canPostLoad(user)) return true;
  return false;
}

export function bolDownloadFilename(load) {
  const base = load?.load_number ? `BOL-${load.load_number}` : 'bill-of-lading';
  const name = load?.bol_file_name || '';
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '.pdf';
  return `${base}${ext}`;
}

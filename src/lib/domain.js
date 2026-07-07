export const FLEETCO_EMAIL_DOMAIN = 'fleetcomanagement.org';

export function normalizeFleetCoEmail(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim().toLowerCase();
  const local = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  const cleaned = local.replace(/[^a-z0-9._-]/g, '');
  if (!cleaned) return '';
  return `${cleaned}@${FLEETCO_EMAIL_DOMAIN}`;
}

export function isFleetCoDomainEmail(email) {
  return !!email && email.trim().toLowerCase().endsWith(`@${FLEETCO_EMAIL_DOMAIN}`);
}

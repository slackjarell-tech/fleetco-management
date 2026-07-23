/** Routes that fill the main column (no default padding; no h-screen bleed). */
export const PORTAL_FULL_BLEED_PATHS = [
  '/portal/slt-marketing',
  '/portal/assistant',
  '/portal/revan',
  '/portal/messages',
];

export function isPortalFullBleedPath(pathname) {
  if (!pathname) return false;
  return PORTAL_FULL_BLEED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

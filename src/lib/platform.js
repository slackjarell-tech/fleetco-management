/** Detect FleetCo Driver native shell vs mobile browser */
export function isNativeApp() {
  try {
    return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

export function getNativePlatform() {
  try {
    return window.Capacitor?.getPlatform?.() || 'web';
  } catch {
    return 'web';
  }
}

export function isDriverAppContext() {
  if (typeof window === 'undefined') return false;
  return isNativeApp()
    || window.location.pathname.startsWith('/driver')
    || new URLSearchParams(window.location.search).get('app') === 'driver';
}

export const DRIVER_APP_STORE = {
  ios: 'https://apps.apple.com/app/fleetco-driver/id0000000000',
  android: 'https://play.google.com/store/apps/details?id=org.fleetcomanagement.driver',
};

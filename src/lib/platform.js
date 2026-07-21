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

const DEFAULT_ANDROID_URL = 'https://play.google.com/store/apps/details?id=org.fleetcomanagement.driver';

/**
 * FleetCo Driver app store links.
 * Override VITE_DRIVER_APP_ANDROID_URL for internal testing (Play Console opt-in / closed track)
 * before the app is publicly listed on the Play Store.
 * Set VITE_DRIVER_APP_IOS_URL when the iOS app ships on the App Store.
 */
export const DRIVER_APP = {
  android: import.meta.env.VITE_DRIVER_APP_ANDROID_URL || DEFAULT_ANDROID_URL,
  ios: import.meta.env.VITE_DRIVER_APP_IOS_URL || null,
  iosComingSoon: !import.meta.env.VITE_DRIVER_APP_IOS_URL,
};

/** @deprecated Prefer DRIVER_APP */
export const DRIVER_APP_STORE = {
  android: DRIVER_APP.android,
  ios: DRIVER_APP.ios,
};

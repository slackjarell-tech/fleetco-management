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

/** iPhone/iPad Safari (not Chrome/Firefox on iOS — they use WebKit too but detect Safari specifically). */
export function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIos) return false;
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

/** iOS mobile browser — Safari and all WebKit wrappers (Chrome on iOS uses WebKit). */
export function isIosMobileBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Safari on iOS requires getUserMedia during a user tap — not after async API calls. */
export function needsGestureCamera() {
  return isIosMobileBrowser() && !isNativeApp();
}

export function supportsMediaRecorder() {
  if (typeof MediaRecorder === 'undefined') return false;
  const types = ['video/mp4', 'video/webm;codecs=vp8', 'video/webm'];
  return types.some((t) => {
    try { return MediaRecorder.isTypeSupported(t); } catch { return false; }
  });
}

const DEFAULT_ANDROID_URL = 'https://play.google.com/apps/internaltest/4701271726337402202';

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

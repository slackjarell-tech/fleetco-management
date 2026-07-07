import { isNativeApp } from '@/lib/platform';

const API_ROOT = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p.startsWith('/api')) return `${API_ROOT}${p}`;
  return `${API_ROOT}/api${p}`;
}

export function uploadUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Take photo — native Camera on iOS/Android, file input on web */
export async function takePhoto() {
  if (isNativeApp()) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      saveToGallery: false,
    });
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const ext = photo.format === 'png' ? 'png' : 'jpg';
    const file = new File([blob], `fleetco-${Date.now()}.${ext}`, { type: blob.type || `image/${ext}` });
    return { file, previewUrl: photo.webPath };
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No photo selected'));
      resolve({ file, previewUrl: URL.createObjectURL(file) });
    };
    input.click();
  });
}

/** High-accuracy position — native Geolocation in app, browser API on web */
export async function getCurrentPosition() {
  if (isNativeApp()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    await Geolocation.requestPermissions();
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed || 0,
      heading: pos.coords.heading || 0,
      timestamp: pos.timestamp,
    };
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        accuracy: p.coords.accuracy,
        speed: p.coords.speed || 0,
        heading: p.coords.heading || 0,
        timestamp: p.timestamp,
      }),
      reject,
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

/** Watch position — returns cleanup function */
export async function watchPosition(onPosition, onError) {
  if (isNativeApp()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    await Geolocation.requestPermissions();
    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 30000 },
      (pos, err) => {
        if (err) return onError?.(err);
        if (!pos) return;
        onPosition({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed || 0,
            heading: pos.coords.heading || 0,
          },
          timestamp: pos.timestamp,
        });
      }
    );
    return () => Geolocation.clearWatch({ id });
  }

  if (!navigator.geolocation) return () => {};
  const id = navigator.geolocation.watchPosition(onPosition, onError, {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 15000,
  });
  return () => navigator.geolocation.clearWatch(id);
}

/** Scan barcode using device camera (works in native WebView + mobile browser) */
export async function startBarcodeScanner(elementId, onScan) {
  const { Html5Qrcode } = await import('html5-qrcode');
  const scanner = new Html5Qrcode(elementId);
  await scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 260, height: 260 } },
    (decoded) => onScan(decoded),
    () => {}
  );
  return scanner;
}

export async function stopBarcodeScanner(scanner) {
  if (!scanner) return;
  try {
    await scanner.stop();
    await scanner.clear();
  } catch { /* ignore */ }
}

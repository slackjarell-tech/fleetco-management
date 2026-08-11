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

/** Check camera + location permission state */
export async function checkDriverPermissions() {
  const result = { camera: 'unknown', location: 'unknown' };

  if (isNativeApp()) {
    try {
      const { Camera } = await import('@capacitor/camera');
      const cam = await Camera.checkPermissions();
      result.camera = cam.camera === 'granted' ? 'granted' : cam.camera || 'denied';
    } catch {
      result.camera = 'unknown';
    }
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const geo = await Geolocation.checkPermissions();
      const loc = geo.location || geo.coarseLocation;
      result.location = loc === 'granted' ? 'granted' : loc || 'denied';
    } catch {
      result.location = 'unknown';
    }
    return result;
  }

  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    try {
      const cam = await navigator.permissions.query({ name: 'camera' });
      result.camera = cam.state === 'granted' ? 'granted' : cam.state;
    } catch { /* unsupported */ }
    try {
      const geo = await navigator.permissions.query({ name: 'geolocation' });
      result.location = geo.state === 'granted' ? 'granted' : geo.state;
    } catch { /* unsupported */ }
  }

  return result;
}

/** Request camera permission (native prompt or browser getUserMedia) */
export async function requestCameraPermission() {
  if (isNativeApp()) {
    const { Camera } = await import('@capacitor/camera');
    const status = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    if (status.camera !== 'granted') {
      throw new Error('Camera permission denied — enable it in Settings to use the ELD dashcam.');
    }
    return true;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera not supported on this device');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  });
  stream.getTracks().forEach((t) => t.stop());
  return true;
}

/** Request location permission and return first GPS fix */
export async function requestLocationPermission() {
  return getCurrentPosition(true);
}

/** Request both permissions and verify by opening camera + GPS */
export async function requestDriverPermissions() {
  await requestCameraPermission();
  const position = await requestLocationPermission();
  return { camera: true, location: true, position };
}

/** Live camera stream — environment (road) or user (in-cabin / driver face) */
export async function startCameraStream(videoEl, facingMode = 'environment', { skipPermission = false } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera stream not supported');
  }
  if (!skipPermission) await requestCameraPermission();
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  if (videoEl) {
    videoEl.srcObject = stream;
    videoEl.playsInline = true;
    videoEl.muted = true;
    await videoEl.play();
  }
  return stream;
}

/**
 * Start road (rear) + cabin (front) cameras together for distraction monitoring.
 * Works on many Android devices; iOS may only allow one stream — returns dualSupported: false on fallback.
 */
export async function startDualCameraStreams(roadVideoEl, cabinVideoEl) {
  await requestCameraPermission();
  let roadStream = null;
  let cabinStream = null;
  let dualSupported = false;

  try {
    roadStream = await startCameraStream(roadVideoEl, 'environment', { skipPermission: true });
    try {
      cabinStream = await startCameraStream(cabinVideoEl, 'user', { skipPermission: true });
      dualSupported = true;
    } catch {
      dualSupported = false;
    }
  } catch (err) {
    stopCameraStream(roadStream);
    stopCameraStream(cabinStream);
    throw err;
  }

  return { roadStream, cabinStream, dualSupported };
}

export function stopCameraStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}

/** Capture a JPEG frame from an active video element */
export async function captureFrameFromVideo(videoEl, quality = 0.85) {
  if (!videoEl?.videoWidth) {
    throw new Error('Camera not ready');
  }
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext('2d').drawImage(videoEl, 0, 0);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Frame capture failed'))), 'image/jpeg', quality);
  });
  const file = new File([blob], `fleetco-eld-${Date.now()}.jpg`, { type: 'image/jpeg' });
  return { file, previewUrl: URL.createObjectURL(blob) };
}

/** Take photo — native Camera on iOS/Android, file input on web */
export async function takePhoto() {
  if (isNativeApp()) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    await requestCameraPermission();
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
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
export async function getCurrentPosition(requestPermission = false) {
  if (isNativeApp()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    if (requestPermission) {
      const perm = await Geolocation.requestPermissions();
      const loc = perm.location || perm.coarseLocation;
      if (loc !== 'granted') {
        throw new Error('Location permission denied — enable it in Settings for live fleet map and ELD GPS.');
      }
    }
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
      (err) => reject(err?.code === 1
        ? new Error('Location permission denied — enable it in Settings for live fleet map and ELD GPS.')
        : err),
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

/** Scan barcode — all common 1D/2D formats for package delivery */
export async function startBarcodeScanner(elementId, onScan, { continuous = false } = {}) {
  await requestCameraPermission();
  const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
  const formats = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.CODABAR,
    Html5QrcodeSupportedFormats.DATA_MATRIX,
    Html5QrcodeSupportedFormats.PDF_417,
    Html5QrcodeSupportedFormats.AZTEC,
  ];
  const scanner = new Html5Qrcode(elementId, { formatsToSupport: formats, verbose: false });
  let lastCode = '';
  let lastAt = 0;
  await scanner.start(
    { facingMode: 'environment' },
    { fps: 12, qrbox: { width: 280, height: 280 }, aspectRatio: 1 },
    (decoded) => {
      const now = Date.now();
      if (decoded === lastCode && now - lastAt < 2000) return;
      lastCode = decoded;
      lastAt = now;
      onScan(decoded);
      if (!continuous) {
        scanner.stop().catch(() => {});
      }
    },
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

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  captureFrameFromVideo,
  getCurrentPosition,
  requestDriverPermissions,
  startCameraStream,
  startDualCameraStreams,
  stopCameraStream,
  takePhoto,
  watchPosition,
} from '@/lib/nativeBridge';
import {
  hasCompletedPermissionSetup,
  markPermissionSetupComplete,
} from '@/lib/driverPermissions';

const DriverDeviceContext = createContext(null);

export function useDriverDevice() {
  const ctx = useContext(DriverDeviceContext);
  if (!ctx) {
    throw new Error('useDriverDevice must be used within DriverDeviceProvider');
  }
  return ctx;
}

export function DriverDeviceProvider({ user, children }) {
  const roadVideoRef = useRef(null);
  const cabinVideoRef = useRef(null);
  const roadStreamRef = useRef(null);
  const cabinStreamRef = useRef(null);
  const locationCleanupRef = useRef(null);

  const dualCameraEnabled = !!user?.driver_dual_camera_enabled;

  const [permissionsReady, setPermissionsReady] = useState(() => hasCompletedPermissionSetup(user?.id));
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [position, setPosition] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [dualCameraActive, setDualCameraActive] = useState(false);
  const [dualCameraSupported, setDualCameraSupported] = useState(false);

  const stopDevices = useCallback(() => {
    stopCameraStream(roadStreamRef.current);
    stopCameraStream(cabinStreamRef.current);
    roadStreamRef.current = null;
    cabinStreamRef.current = null;
    locationCleanupRef.current?.();
    locationCleanupRef.current = null;
    setCameraActive(false);
    setDualCameraActive(false);
    setDualCameraSupported(false);
  }, []);

  const skipLimitedMode = useCallback(() => {
    markPermissionSetupComplete(user.id);
    setPermissionsReady(true);
    setActivationError('');
    setActivating(false);
  }, [user?.id]);

  const activateDevices = useCallback(async () => {
    setActivating(true);
    setActivationError('');
    try {
      const { position: initialPos } = await requestDriverPermissions();
      setPosition(initialPos);

      if (dualCameraEnabled) {
        const { roadStream, cabinStream, dualSupported } = await startDualCameraStreams(
          roadVideoRef.current,
          cabinVideoRef.current
        );
        roadStreamRef.current = roadStream;
        cabinStreamRef.current = cabinStream;
        setDualCameraSupported(dualSupported);
        setDualCameraActive(dualSupported);
      } else {
        const stream = await startCameraStream(roadVideoRef.current, 'environment');
        roadStreamRef.current = stream;
      }
      setCameraActive(true);

      const cleanup = await watchPosition(
        (pos) => {
          const coords = pos.coords || pos;
          setPosition({
            lat: coords.latitude ?? coords.lat,
            lng: coords.longitude ?? coords.lng,
            accuracy: coords.accuracy,
            speed: coords.speed || 0,
            heading: coords.heading || 0,
            timestamp: pos.timestamp || Date.now(),
          });
        },
        () => {}
      );
      locationCleanupRef.current = cleanup;

      markPermissionSetupComplete(user.id);
      setPermissionsReady(true);
      return true;
    } catch (err) {
      setActivationError(err?.message || 'Could not enable camera and location');
      stopDevices();
      return false;
    } finally {
      setActivating(false);
    }
  }, [user?.id, dualCameraEnabled, stopDevices]);

  useEffect(() => {
    if (!permissionsReady || roadStreamRef.current) return;
    activateDevices();
    return () => stopDevices();
  }, [permissionsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopDevices(), [stopDevices]);

  const captureEldFrame = useCallback(async () => {
    if (roadVideoRef.current?.videoWidth && roadStreamRef.current) {
      return captureFrameFromVideo(roadVideoRef.current);
    }
    return takePhoto();
  }, []);

  const captureCabinFrame = useCallback(async () => {
    if (cabinVideoRef.current?.videoWidth && cabinStreamRef.current) {
      return captureFrameFromVideo(cabinVideoRef.current);
    }
    return null;
  }, []);

  const captureDualEldFrames = useCallback(async () => {
    const road = await captureEldFrame();
    let cabin = null;
    if (dualCameraActive && cabinStreamRef.current) {
      try {
        cabin = await captureCabinFrame();
      } catch { /* cabin optional if stream dropped */ }
    }
    return { road, cabin };
  }, [captureEldFrame, captureCabinFrame, dualCameraActive]);

  const refreshPosition = useCallback(async () => {
    const pos = await getCurrentPosition();
    setPosition(pos);
    return pos;
  }, []);

  const value = {
    permissionsReady,
    activating,
    activationError,
    position,
    cameraActive,
    dualCameraEnabled,
    dualCameraActive,
    dualCameraSupported,
    activateDevices,
    skipLimitedMode,
    limitedMode: permissionsReady && !cameraActive,
    captureEldFrame,
    captureDualEldFrames,
    refreshPosition,
    bindRoadPreview(el) {
      if (el && roadStreamRef.current) {
        el.srcObject = roadStreamRef.current;
        el.playsInline = true;
        el.muted = true;
        el.play().catch(() => {});
      }
    },
    bindCabinPreview(el) {
      if (el && cabinStreamRef.current) {
        el.srcObject = cabinStreamRef.current;
        el.playsInline = true;
        el.muted = true;
        el.play().catch(() => {});
      }
    },
    /** @deprecated use bindRoadPreview */
    bindCameraPreview(el) {
      if (el && roadStreamRef.current) {
        el.srcObject = roadStreamRef.current;
        el.playsInline = true;
        el.muted = true;
        el.play().catch(() => {});
      }
    },
  };

  return (
    <DriverDeviceContext.Provider value={value}>
      <video ref={roadVideoRef} className="hidden" aria-hidden playsInline muted />
      <video ref={cabinVideoRef} className="hidden" aria-hidden playsInline muted />
      {children}
    </DriverDeviceContext.Provider>
  );
}

import { useEffect, useRef } from 'react';
import { createWakeLock, isWakeLockSupported, onAppVisible } from '@/lib/driverBackground';

/** Keeps the screen on while `active` (dashcam, navigation, etc.). */
export function useWakeLock(active) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!active) {
      lockRef.current?.release();
      lockRef.current = null;
      return;
    }

    if (!lockRef.current) lockRef.current = createWakeLock();
    lockRef.current.acquire();

    const unsub = onAppVisible(() => {
      if (active) lockRef.current?.acquire();
    });

    return () => {
      unsub();
      lockRef.current?.release();
    };
  }, [active]);

  return { supported: isWakeLockSupported() };
}

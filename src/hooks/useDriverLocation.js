import { useEffect, useRef, useCallback } from 'react';
import { api } from '@/api/apiClient';

/**
 * Tracks driver location while clocked in.
 * Pings every 30 seconds and saves to DriverLocation entity.
 * Includes vehicle assignment info if provided.
 */
export default function useDriverLocation(user, clockEntryId, isClockedIn, vehicleInfo = null) {
  const watchIdRef = useRef(null);
  const lastPingRef = useRef(0);

  const pingLocation = useCallback(async (position) => {
    const now = Date.now();
    if (now - lastPingRef.current < 30000) return;
    lastPingRef.current = now;

    try {
      await api.entities.DriverLocation.create({
        user_id: user.id,
        user_name: user.full_name,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0,
        timestamp: new Date(position.timestamp || now).toISOString(),
        clock_entry_id: clockEntryId,
        vehicle_id: vehicleInfo?.vehicle_id || null,
        vehicle_unit_number: vehicleInfo?.vehicle_unit_number || null,
        trailer_id: vehicleInfo?.trailer_id || null,
        trailer_unit_number: vehicleInfo?.trailer_unit_number || null,
      });
    } catch (err) {
      // Silently fail - location tracking is best-effort
    }
  }, [user, clockEntryId, vehicleInfo]);

  useEffect(() => {
    if (!isClockedIn || !user) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pingLocation,
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        pingLocation,
        () => {},
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 15000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isClockedIn, user, pingLocation]);
}
import { useEffect, useRef, useCallback } from 'react';
import { api } from '@/api/apiClient';
import { watchPosition } from '@/lib/nativeBridge';
import { recordHosMovementEvent } from '@/lib/hosDutyClient';
import { getDriverDuty } from '@/lib/driverDuty';

/**
 * Tracks driver location while clocked in.
 * Uses native GPS in the FleetCo Driver app (cellular + GPS), browser API on web.
 * Pings every 30 seconds to DriverLocation — visible on Fleet Map & Route Dashboard.
 */
export default function useDriverLocation(user, clockEntryId, isClockedIn, vehicleInfo = null) {
  const lastPingRef = useRef(0);
  const cleanupRef = useRef(null);

  const pingLocation = useCallback(async (position) => {
    const now = Date.now();
    if (now - lastPingRef.current < 30000) return;
    lastPingRef.current = now;

    const coords = position.coords || position;
    const lat = coords.latitude ?? coords.lat;
    const lng = coords.longitude ?? coords.lng;

    const speedMps = coords.speed || 0;
    const moving = speedMps >= 2.2;

    try {
      await api.entities.DriverLocation.create({
        user_id: user.id,
        user_name: user.full_name,
        lat,
        lng,
        accuracy: coords.accuracy,
        speed: speedMps,
        heading: coords.heading || 0,
        timestamp: new Date(position.timestamp || now).toISOString(),
        clock_entry_id: clockEntryId,
        vehicle_id: vehicleInfo?.vehicle_id || null,
        vehicle_unit_number: vehicleInfo?.vehicle_unit_number || null,
        trailer_id: vehicleInfo?.trailer_id || null,
        trailer_unit_number: vehicleInfo?.trailer_unit_number || null,
        source: 'driver_app',
        moving,
      });
    } catch {
      // best-effort
    }

    if (moving || getDriverDuty() === 'driving') {
      recordHosMovementEvent({
        event_type: moving ? 'movement_ping' : 'location_ping',
        duty_status: getDriverDuty(),
        vehicle_id: vehicleInfo?.vehicle_id,
        vehicle_unit_number: vehicleInfo?.vehicle_unit_number,
        clock_entry_id: clockEntryId,
        lat,
        lng,
        speed: speedMps,
        driver_name: user.full_name,
        source: 'driver_gps',
      });
    }
  }, [user, clockEntryId, vehicleInfo]);

  useEffect(() => {
    if (!isClockedIn || !user) return;

    let cancelled = false;

    (async () => {
      const cleanup = await watchPosition(
        (pos) => { if (!cancelled) pingLocation(pos); },
        () => {}
      );
      cleanupRef.current = cleanup;
    })();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [isClockedIn, user, pingLocation]);
}

import React from 'react';
import FuelStations from '@/pages/FuelStations';

/** Driver read-only fuel + EV charging map (portal editor hidden). */
export default function DriverFuelStations() {
  return <FuelStations driverMode />;
}

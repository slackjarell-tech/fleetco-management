import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '@/api/apiClient';
import { OSM_TILES, fixLeafletDefaultIcons, DEFAULT_MAP_CENTER } from '@/lib/fleetMaps';
import { mpsToMph } from '@/lib/dashcamForeground';
import { MapPin } from 'lucide-react';

fixLeafletDefaultIcons();

const truckIcon = L.divIcon({
  className: '',
  html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.45);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function LiveDriverMap({ session, driverLocation }) {
  const [loc, setLoc] = useState(driverLocation || null);

  useEffect(() => {
    if (driverLocation?.lat != null) {
      setLoc(driverLocation);
      return undefined;
    }
    if (!session?.driver_id) return undefined;

    const load = async () => {
      const locs = await api.entities.DriverLocation.list('-timestamp', 100);
      const hit = (locs || []).find((l) => l.user_id === session.driver_id);
      if (hit?.lat != null) {
        setLoc({
          lat: hit.lat,
          lng: hit.lng,
          speed_mps: hit.speed,
          at: hit.timestamp,
        });
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [session?.driver_id, driverLocation]);

  const center = loc?.lat != null ? [loc.lat, loc.lng] : DEFAULT_MAP_CENTER;
  const mph = mpsToMph(loc?.speed_mps);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 flex flex-col min-h-[12rem] sm:min-h-[16rem]">
      <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs font-bold text-white flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-red-400" /> Live GPS
        </span>
        {session?.vehicle_unit_number && (
          <span className="text-[10px] text-slate-400 font-mono">Unit {session.vehicle_unit_number}</span>
        )}
      </div>
      <div className="flex-1 min-h-[10rem] relative">
        <MapContainer center={center} zoom={loc ? 14 : 4} className="h-full w-full min-h-[10rem]" scrollWheelZoom={false}>
          <TileLayer attribution={OSM_TILES.attribution} url={OSM_TILES.url} />
          {loc?.lat != null && (
            <Marker position={[loc.lat, loc.lng]} icon={truckIcon}>
              <Popup>
                <div className="text-xs font-semibold">{session?.driver_name || 'Driver'}</div>
                {mph != null && <div>{mph} mph</div>}
                {loc.at && <div className="text-slate-500">{new Date(loc.at).toLocaleTimeString()}</div>}
              </Popup>
            </Marker>
          )}
        </MapContainer>
        {!loc && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs pointer-events-none bg-slate-900/40">
            Waiting for GPS from driver…
          </div>
        )}
      </div>
    </div>
  );
}

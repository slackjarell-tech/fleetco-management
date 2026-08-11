import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';
import {
  OSM_TILES, fixLeafletDefaultIcons, fetchOsrmRoute, buildNavigationUrl, DEFAULT_MAP_CENTER,
} from '@/lib/fleetMaps';

fixLeafletDefaultIcons();

function numberedIcon(num, done) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${done ? '#10b981' : '#f59e0b'};color:${done ? '#fff' : '#1e293b'};width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);">${num}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export default function DriverRouteMap({ stops, className = '' }) {
  const sorted = useMemo(
    () => [...stops].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)),
    [stops]
  );

  const pinned = sorted.filter((s) => s.lat != null && s.lng != null);
  const center = pinned.length ? [pinned[0].lat, pinned[0].lng] : DEFAULT_MAP_CENTER;
  const stopPoints = pinned.map((s) => [s.lat, s.lng]);
  const [routeLine, setRouteLine] = useState(stopPoints);

  useEffect(() => {
    if (stopPoints.length < 2) {
      setRouteLine(stopPoints);
      return;
    }
    let cancelled = false;
    fetchOsrmRoute(stopPoints).then((line) => {
      if (!cancelled) setRouteLine(line || stopPoints);
    });
    return () => { cancelled = true; };
  }, [JSON.stringify(stopPoints)]);

  if (pinned.length === 0) {
    return (
      <div className={`bg-slate-100 rounded-xl p-4 text-center text-xs text-slate-500 ${className}`}>
        Map pins appear after stops are geocoded. Tap Optimize on your route or ask dispatch to refresh map data.
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 ${className}`} style={{ height: 220 }}>
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer attribution={OSM_TILES.attribution} url={OSM_TILES.url} maxZoom={OSM_TILES.maxZoom} />
        {routeLine.length > 1 && (
          <Polyline positions={routeLine} pathOptions={{ color: '#f59e0b', weight: 3, opacity: 0.7 }} />
        )}
        {sorted.map((stop, i) => {
          if (stop.lat == null || stop.lng == null) return null;
          const done = stop.status === 'delivered' || stop.status === 'failed';
          const nav = buildNavigationUrl({
            lat: stop.lat,
            lng: stop.lng,
            address: stop.address,
            city: stop.city,
            state: stop.state,
            zip: stop.zip,
            label: stop.recipient_name,
          });
          return (
            <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={numberedIcon(i + 1, done)}>
              <Popup>
                <div className="text-sm font-bold">{stop.recipient_name}</div>
                <div className="text-xs text-slate-600">{nav.label}</div>
                <a
                  href={nav.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-600 font-bold mt-1 inline-flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" /> Navigate
                </a>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

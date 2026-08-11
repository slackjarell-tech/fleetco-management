import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OSM_TILES, fixLeafletDefaultIcons, DEFAULT_MAP_CENTER } from '@/lib/fleetMaps';

fixLeafletDefaultIcons();

/**
 * License-free route preview for loads — geocodes via Nominatim client-side when needed.
 */
export default function LoadRoutePreview({ origin, destination, className = '' }) {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!origin && !destination) {
      setPoints(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function geocode(q) {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', `${q}, USA`);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'us');
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const hit = data?.[0];
      return hit ? { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) } : null;
    }

    (async () => {
      try {
        const [from, to] = await Promise.all([
          origin ? geocode(origin) : null,
          destination ? geocode(destination) : null,
        ]);
        if (!cancelled) setPoints({ from, to });
      } catch {
        if (!cancelled) setPoints(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [origin, destination]);

  if (loading) {
    return (
      <div className={`bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400 ${className}`} style={{ height: 220 }}>
        Loading map preview…
      </div>
    );
  }

  const from = points?.from;
  const to = points?.to;
  const center = from ? [from.lat, from.lng] : to ? [to.lat, to.lng] : DEFAULT_MAP_CENTER;
  const line = [from, to].filter(Boolean).map((p) => [p.lat, p.lng]);

  const greenIcon = L.divIcon({
    html: '<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  const redIcon = L.divIcon({
    html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 ${className}`} style={{ height: 220 }}>
      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer attribution={OSM_TILES.attribution} url={OSM_TILES.url} maxZoom={OSM_TILES.maxZoom} />
        {line.length === 2 && (
          <Polyline positions={line} pathOptions={{ color: '#f59e0b', weight: 3, opacity: 0.8, dashArray: '6 4' }} />
        )}
        {from && <Marker position={[from.lat, from.lng]} icon={greenIcon} />}
        {to && <Marker position={[to.lat, to.lng]} icon={redIcon} />}
      </MapContainer>
    </div>
  );
}

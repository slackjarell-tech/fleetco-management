import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { X, Navigation, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/api/apiClient';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  OSM_TILES, fixLeafletDefaultIcons, fetchOsrmRoute, buildNavigationUrl,
  buildMultiStopDirectionsUrl, DEFAULT_MAP_CENTER,
} from '@/lib/fleetMaps';

function numberedIcon(num, done) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${done ? '#10b981' : '#f59e0b'};color:${done ? '#fff' : '#1e293b'};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [map, points]);
  return null;
}

fixLeafletDefaultIcons();

function buildDirectionsUrl(stops) {
  return buildMultiStopDirectionsUrl(stops);
}

export default function RouteMapView({ route, stops: initialStops, driver, onClose }) {
  const [stops, setStops] = useState(initialStops);
  const [geocoding, setGeocoding] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');
  const [activeDrivers, setActiveDrivers] = useState([]);

  const sorted = useMemo(() => [...stops].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)), [stops]);
  const pinned = sorted.filter((s) => s.lat != null && s.lng != null);
  const line = pinned.map((s) => [s.lat, s.lng]);
  const center = pinned.length ? [pinned[0].lat, pinned[0].lng] : DEFAULT_MAP_CENTER;
  const directionsUrl = buildDirectionsUrl(sorted);

  useEffect(() => {
    api.entities.DriverLocation.list('-timestamp', 500).then((locs) => {
      const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
      const recent = (locs || []).filter((l) => new Date(l.timestamp).getTime() > eightHoursAgo);
      const latest = {};
      recent.forEach((l) => {
        if (!latest[l.user_id] || new Date(l.timestamp) > new Date(latest[l.user_id].timestamp)) {
          latest[l.user_id] = l;
        }
      });
      setActiveDrivers(Object.values(latest));
    }).catch(() => {});
  }, []);

  const refreshGeocode = async () => {
    setGeocoding(true);
    setGeoMessage('');
    try {
      const result = await api.functions.invoke('geocodeDeliveryRoute', { routeId: route.id });
      setStops(result.stops || sorted);
      setGeoMessage(result.message || 'Map updated');
    } catch (err) {
      setGeoMessage(err?.data?.error || err?.message || 'Geocode failed');
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (pinned.length < sorted.length && sorted.length > 0) {
      refreshGeocode();
    }
  }, [route.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl flex-shrink-0">
          <div>
            <div className="text-white font-black">{route.route_name}</div>
            <div className="text-slate-400 text-xs mt-0.5">
              {route.route_date} · {driver?.full_name || 'Unassigned'} · {sorted.length} stops · {pinned.length} mapped
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={geocoding} onClick={refreshGeocode}
              className="text-xs border-slate-600 text-slate-200">
              <MapPin className="w-3.5 h-3.5 mr-1" /> {geocoding ? 'Mapping…' : 'Refresh pins'}
            </Button>
            {directionsUrl && (
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs gap-1">
                  <Navigation className="w-3.5 h-3.5" /> Directions
                </Button>
              </a>
            )}
            <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {geoMessage && (
          <div className="px-4 py-2 text-xs bg-slate-50 text-slate-600 border-b border-slate-100">{geoMessage}</div>
        )}

        <div className="flex-1 overflow-hidden min-h-0" style={{ minHeight: 320 }}>
          <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%', minHeight: 320 }} scrollWheelZoom>
            <TileLayer attribution={OSM_TILES.attribution} url={OSM_TILES.url} maxZoom={OSM_TILES.maxZoom} />
            {line.length > 1 && <Polyline positions={line} pathOptions={{ color: '#f59e0b', weight: 3, opacity: 0.75 }} />}
            {pinned.length > 0 && <FitBounds points={line} />}

            {sorted.map((stop, i) => {
              if (stop.lat == null || stop.lng == null) return null;
              const done = stop.status === 'delivered' || stop.status === 'failed';
              const fullAddr = [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ');
              return (
                <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={numberedIcon(i + 1, done)}>
                  <Popup>
                    <div className="text-sm font-bold">{stop.recipient_name}</div>
                    <div className="text-xs text-slate-600">{fullAddr}</div>
                    {stop.tracking_number && <div className="text-[10px] font-mono text-slate-400">#{stop.tracking_number}</div>}
                  </Popup>
                </Marker>
              );
            })}

            {activeDrivers.map((d) => {
              const driverIcon = L.divIcon({
                html: '<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.6)"></div>',
                className: '',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              });
              return (
                <Marker key={`driver-${d.user_id}`} position={[d.lat, d.lng]} icon={driverIcon}>
                  <Popup>
                    <div className="text-sm font-bold">{d.user_name}</div>
                    <div className="text-xs text-blue-600 mt-1">Live GPS</div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div className="flex-shrink-0 border-t border-slate-200">
          <div className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            Stops — open directions per stop (OpenStreetMap / device maps)
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
            {sorted.map((stop, i) => {
              const fullAddr = [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ');
              const nav = buildNavigationUrl({
                lat: stop.lat,
                lng: stop.lng,
                address: stop.address,
                city: stop.city,
                state: stop.state,
                zip: stop.zip,
                label: stop.recipient_name,
              });
              const done = stop.status === 'delivered' || stop.status === 'failed';
              return (
                <div key={stop.id || stop._key} className={`flex items-center gap-3 px-4 py-2.5 ${done ? 'opacity-60' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{stop.recipient_name}</div>
                    <div className="text-xs text-slate-400 truncate">{fullAddr}</div>
                  </div>
                  <a href={nav.href} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1">
                      <ExternalLink className="w-3 h-3" /> Nav
                    </Button>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

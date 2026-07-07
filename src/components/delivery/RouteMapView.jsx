import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { X, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/api/apiClient';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function numberedIcon(num, done) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${done ? '#10b981' : '#f59e0b'};
      color:${done ? '#fff' : '#1e293b'};
      width:28px;height:28px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-weight:900;font-size:12px;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    ">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function buildGoogleMapsUrl(stops) {
  const addressable = stops.filter(s => s.address);
  if (addressable.length === 0) return null;
  if (addressable.length === 1) {
    const addr = encodeURIComponent([addressable[0].address, addressable[0].city, addressable[0].state].filter(Boolean).join(', '));
    return `https://www.google.com/maps/dir/?api=1&destination=${addr}`;
  }
  const destination = encodeURIComponent(
    [addressable[addressable.length - 1].address, addressable[addressable.length - 1].city, addressable[addressable.length - 1].state].filter(Boolean).join(', ')
  );
  const waypoints = addressable.slice(0, -1).map(s =>
    encodeURIComponent([s.address, s.city, s.state].filter(Boolean).join(', '))
  ).join('|');
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
}

export default function RouteMapView({ route, stops, driver, onClose }) {
  const sorted = useMemo(() => [...stops].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)), [stops]);
  const [activeDrivers, setActiveDrivers] = useState([]);

  useEffect(() => {
    api.entities.DriverLocation.list('-timestamp', 500).then(locs => {
      const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
      const recent = (locs || []).filter(l => new Date(l.timestamp).getTime() > eightHoursAgo);
      const latest = {};
      recent.forEach(l => {
        if (!latest[l.user_id] || new Date(l.timestamp) > new Date(latest[l.user_id].timestamp)) {
          latest[l.user_id] = l;
        }
      });
      setActiveDrivers(Object.values(latest));
    }).catch(() => {});
  }, []);

  // Geocode using OSM Nominatim lazily — for now we use a placeholder center
  // and rely on Google Maps for actual turn-by-turn.
  // We'll show a map centered on Dallas as fallback, with stop list overlay.
  const googleUrl = buildGoogleMapsUrl(sorted);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl flex-shrink-0">
          <div>
            <div className="text-white font-black">{route.route_name}</div>
            <div className="text-slate-400 text-xs mt-0.5">
              {route.route_date} · {driver?.full_name || 'Unassigned'} · {sorted.length} stops
            </div>
          </div>
          <div className="flex items-center gap-2">
            {googleUrl && (
              <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs gap-1">
                  <Navigation className="w-3.5 h-3.5" /> Navigate Full Route
                </Button>
              </a>
            )}
            <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 overflow-hidden min-h-0" style={{ minHeight: 320 }}>
          <MapContainer
            center={[32.7767, -96.7970]}
            zoom={10}
            style={{ height: '100%', width: '100%', minHeight: 320 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Live Driver Locations */}
            {activeDrivers.map(d => {
              const driverIcon = L.divIcon({
                html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.6)"></div>`,
                className: '',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              });
              return (
                <Marker key={`driver-${d.user_id}`} position={[d.lat, d.lng]} icon={driverIcon}>
                  <Popup>
                    <div className="text-sm font-bold">👤 {d.user_name}</div>
                    <div className="text-xs text-blue-600 mt-1">Live GPS location</div>
                    {d.speed > 0 && <div className="text-xs text-gray-500">Speed: {(d.speed * 2.237).toFixed(0)} mph</div>}
                    <div className="text-xs text-gray-400">{new Date(d.timestamp).toLocaleTimeString()}</div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Stop list with individual nav links */}
        <div className="flex-shrink-0 border-t border-slate-200">
          <div className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            Stops — tap Nav to open in Google Maps
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
            {sorted.map((stop, i) => {
              const fullAddr = [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ');
              const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddr)}&travelmode=driving`;
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {done && <span className="text-xs text-emerald-600 font-bold capitalize">{stop.status}</span>}
                    <a href={navUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1">
                        <Navigation className="w-3 h-3" /> Nav
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
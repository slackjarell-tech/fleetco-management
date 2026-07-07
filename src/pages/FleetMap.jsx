import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { MapPin, Truck, Filter, RefreshCw, AlertCircle, User } from 'lucide-react';
import SimulatorPanel from '@/components/simulation/SimulatorPanel';

const STATUS_COLORS = {
  active: '#22c55e',
  in_shop: '#ef4444',
  waiting_for_parts: '#f97316',
  out_of_service: '#dc2626',
  inactive: '#94a3b8',
  pending_inspection: '#f59e0b',
  leased_out: '#8b5cf6',
  retired: '#64748b',
  sold: '#64748b',
};

const STATUS_DOT = {
  active: 'bg-green-500',
  in_shop: 'bg-red-500',
  waiting_for_parts: 'bg-orange-500',
  out_of_service: 'bg-red-600',
  inactive: 'bg-slate-400',
  pending_inspection: 'bg-amber-500',
  leased_out: 'bg-purple-500',
  retired: 'bg-slate-500',
  sold: 'bg-slate-500',
};

// US city coordinates map for demo/manual location
const CITY_COORDS = {
  'chicago': [41.8781, -87.6298],
  'dallas': [32.7767, -96.7970],
  'houston': [29.7604, -95.3698],
  'atlanta': [33.7490, -84.3880],
  'los angeles': [34.0522, -118.2437],
  'new york': [40.7128, -74.0060],
  'miami': [25.7617, -80.1918],
  'denver': [39.7392, -104.9903],
  'phoenix': [33.4484, -112.0740],
  'seattle': [47.6062, -122.3321],
  'nashville': [36.1627, -86.7816],
  'memphis': [35.1495, -90.0490],
  'st. louis': [38.6270, -90.1994],
  'kansas city': [39.0997, -94.5786],
  'indianapolis': [39.7684, -86.1581],
  'columbus': [39.9612, -82.9988],
  'charlotte': [35.2271, -80.8431],
  'jacksonville': [30.3322, -81.6557],
  'austin': [30.2672, -97.7431],
  'san antonio': [29.4241, -98.4936],
};

function guessCoords(locationStr) {
  if (!locationStr) return null;
  const lower = locationStr.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }
  return null;
}

export default function FleetMap() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loads, setLoads] = useState([]);
  const [users, setUsers] = useState([]);
  const [driverLocations, setDriverLocations] = useState([]);
  const [showDrivers, setShowDrivers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [MapComponents, setMapComponents] = useState(null);

  useEffect(() => {
    // Dynamically import react-leaflet to avoid SSR issues
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, L]) => {
      // Fix default marker icon
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapComponents({ ...rl, L: L.default });
    });
  }, []);

  useEffect(() => {
    api.auth.me().then(async u => {
      setUser(u);
      const [vs, ls, us, locs] = await Promise.all([
        api.entities.Vehicle.list(),
        api.entities.Load.list('-pickup_date', 200),
        api.entities.User.list(),
        api.entities.DriverLocation.list('-timestamp', 500),
      ]);
      setVehicles(vs);
      setLoads(ls);
      setUsers(us);
      setDriverLocations(locs || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Real-time subscription for driver locations (includes simulated drivers)
    const unsubscribe = api.entities.DriverLocation.subscribe((event) => {
      if (event.type === 'create') {
        setDriverLocations(prev => [...prev, event.data]);
      }
    });

    return () => unsubscribe();
  }, []);

  const userMap = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users]);

  // Get latest location per driver — includes simulated drivers (sim_driver_*)
  const liveDrivers = useMemo(() => {
    const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
    const recent = (driverLocations || []).filter(l => new Date(l.timestamp).getTime() > eightHoursAgo);
    const latest = {};
    recent.forEach(l => {
      if (!latest[l.user_id] || new Date(l.timestamp) > new Date(latest[l.user_id].timestamp)) {
        latest[l.user_id] = l;
      }
    });
    return Object.values(latest).filter(d => userMap[d.user_id] || d.user_id?.startsWith('sim_driver_'));
  }, [driverLocations, userMap]);

  // Map vehicles to last known location from active loads
  const mappedVehicles = useMemo(() => {
    const activeLoads = loads.filter(l => l.status === 'in_transit' || l.status === 'assigned');
    const vehicleLoad = {};
    activeLoads.forEach(l => {
      if (l.assigned_vehicle_id && !vehicleLoad[l.assigned_vehicle_id]) {
        vehicleLoad[l.assigned_vehicle_id] = l;
      }
    });

    return vehicles.map(v => {
      const load = vehicleLoad[v.id];
      const location = load?.origin || v.notes;
      const coords = guessCoords(location) || guessCoords(load?.destination);
      return { ...v, activeLoad: load, lastKnownLocation: location, coords };
    }).filter(v => v.coords);
  }, [vehicles, loads]);

  const filtered = useMemo(() =>
    filterStatus === 'all' ? mappedVehicles : mappedVehicles.filter(v => v.status === filterStatus),
    [mappedVehicles, filterStatus]
  );

  const statusCounts = useMemo(() => {
    const counts = {};
    vehicles.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return counts;
  }, [vehicles]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-slate-900 px-5 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="text-white font-black text-sm">Fleet Map</span>
          <span className="text-slate-400 text-xs">— Last known locations from active loads</span>
          {liveDrivers.length > 0 && (
            <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full ml-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              {liveDrivers.length} live driver{liveDrivers.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none">
            <option value="all">All Statuses ({vehicles.length})</option>
            {Object.entries(statusCounts).map(([s, c]) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')} ({c})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {filtered.length} vehicles on map
            </p>
          </div>
          <div className="p-2 border-b border-slate-100">
            <SimulatorPanel />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="p-5 text-center text-slate-400 text-sm">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No vehicles with location data.</p>
                <p className="text-xs mt-1">Location is inferred from active load origins.</p>
              </div>
            ) : filtered.map(v => {
              const driver = userMap[v.assigned_driver_id];
              return (
                <div key={v.id} onClick={() => setSelected(selected?.id === v.id ? null : v)}
                  className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-amber-50 transition-colors ${selected?.id === v.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[v.status] || 'bg-slate-400'}`} />
                    <span className="font-black text-slate-800 text-sm">Unit {v.unit_number}</span>
                    <span className="text-xs text-slate-400 ml-auto capitalize">{v.status?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 ml-4">{v.year} {v.make} {v.model}</div>
                  {driver && <div className="text-xs text-blue-600 mt-0.5 ml-4">👤 {driver.full_name}</div>}
                  {v.activeLoad && <div className="text-xs text-amber-600 mt-0.5 ml-4">🚛 Load #{v.activeLoad.load_number}</div>}
                  <div className="text-xs text-slate-400 mt-0.5 ml-4 truncate">📍 {v.lastKnownLocation || 'Unknown'}</div>
                </div>
              );
            })}
          </div>

          {/* Live Drivers */}
          {liveDrivers.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3" /> Live Drivers ({liveDrivers.length})
                </p>
                <button onClick={() => setShowDrivers(!showDrivers)}
                  className={`text-xs font-bold px-2 py-0.5 rounded ${showDrivers ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                  {showDrivers ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {liveDrivers.map(d => {
                  const driverInfo = userMap[d.user_id];
                  const age = Math.round((Date.now() - new Date(d.timestamp).getTime()) / 60000);
                  const isSim = d.user_id?.startsWith('sim_driver_');
                  return (
                    <div key={d.user_id} onClick={() => setSelectedDriver(d)}
                      className={`text-xs p-1.5 rounded cursor-pointer hover:bg-blue-100 ${selectedDriver?.user_id === d.user_id ? 'bg-blue-100' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSim ? 'bg-amber-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`} />
                        <span className="font-bold text-slate-700 truncate flex-1">{driverInfo?.full_name || d.user_name}</span>
                        <span className="text-slate-400 flex-shrink-0">{age}m ago</span>
                      </div>
                      {(d.vehicle_unit_number || d.trailer_unit_number) && (
                        <div className="ml-4 mt-0.5 text-[10px] text-slate-500">
                          {d.vehicle_unit_number === 'POV' ? '🚗 POV' : d.vehicle_unit_number ? `🚛 Unit #${d.vehicle_unit_number}` : ''}
                          {d.trailer_unit_number && ` + 📦 #${d.trailer_unit_number}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Legend */}
          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">Fleet Status</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(statusCounts).map(([s, c]) => (
                <div key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[s] || 'bg-slate-400'}`} />
                  <span className="capitalize truncate">{s.replace(/_/g, ' ')}</span>
                  <span className="text-slate-400 ml-auto">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {!MapComponents ? (
            <div className="flex items-center justify-center h-full bg-slate-100">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
              <MapComponents.MapContainer
                center={[39.5, -98.35]}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
              >
                <MapComponents.TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filtered.map(v => {
                  const driver = userMap[v.assigned_driver_id];
                  const color = STATUS_COLORS[v.status] || '#94a3b8';
                  const icon = MapComponents.L.divIcon({
                    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
                    className: '',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                  });
                  return (
                    <MapComponents.Marker key={v.id} position={v.coords} icon={icon}
                      eventHandlers={{ click: () => setSelected(v) }}>
                      <MapComponents.Popup>
                        <div className="text-sm font-bold">Unit {v.unit_number}</div>
                        <div className="text-xs text-gray-600">{v.year} {v.make} {v.model}</div>
                        <div className="text-xs mt-1 capitalize font-semibold" style={{ color }}>{v.status?.replace(/_/g, ' ')}</div>
                        {driver && <div className="text-xs text-blue-600">Driver: {driver.full_name}</div>}
                        {v.activeLoad && <div className="text-xs text-orange-600">Load #{v.activeLoad.load_number}</div>}
                        <div className="text-xs text-gray-500 mt-1">📍 {v.lastKnownLocation}</div>
                      </MapComponents.Popup>
                    </MapComponents.Marker>
                  );
                })}

                {/* Live Driver Locations */}
                {showDrivers && liveDrivers.map(d => {
                  const driverInfo = userMap[d.user_id];
                  const isSim = d.user_id?.startsWith('sim_driver_');
                  const dotColor = isSim ? '#f59e0b' : '#3b82f6';
                  const glowColor = isSim ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.2)';
                  const driverIcon = MapComponents.L.divIcon({
                    html: `<div style="background:${dotColor};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px ${glowColor};position:relative">
                      <div style="position:absolute;inset:-6px;border-radius:50%;background:${glowColor};animation:pulse 2s infinite"></div>
                    </div>`,
                    className: '',
                    iconSize: [18, 18],
                    iconAnchor: [9, 9],
                  });
                  return (
                    <MapComponents.Marker key={`driver-${d.user_id}`} position={[d.lat, d.lng]} icon={driverIcon}
                      eventHandlers={{ click: () => setSelectedDriver(d) }}>
                      <MapComponents.Popup>
                        <div className="text-sm font-bold">👤 {driverInfo?.full_name || d.user_name}</div>
                        <div className="text-xs text-gray-600">{new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-xs text-blue-600 mt-1">📍 Lat: {d.lat?.toFixed(5)}, Lng: {d.lng?.toFixed(5)}</div>
                        {d.speed > 0 && <div className="text-xs text-gray-500">Speed: {(d.speed * 2.237).toFixed(0)} mph</div>}
                        {d.vehicle_unit_number && (
                          <div className="text-xs text-slate-700 font-semibold mt-1">
                            {d.vehicle_unit_number === 'POV' ? '🚗 POV' : `🚛 Unit #${d.vehicle_unit_number}`}
                            {d.trailer_unit_number && ` + 📦 #${d.trailer_unit_number}`}
                          </div>
                        )}
                        <div className="text-xs text-emerald-600 font-bold mt-1 animate-pulse">● Live</div>
                      </MapComponents.Popup>
                    </MapComponents.Marker>
                  );
                })}
                </MapComponents.MapContainer>
            </>
          )}

          {filtered.length === 0 && MapComponents && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6 text-center max-w-sm">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="font-black text-slate-800">No Location Data Available</p>
                <p className="text-sm text-slate-500 mt-1">
                  Vehicle locations are inferred from active load origins (city names). Assign loads with city names in the origin field to see vehicles on the map.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
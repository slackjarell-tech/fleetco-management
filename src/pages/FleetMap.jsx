import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '@/api/apiClient';
import { MapPin, Truck, Filter, User, Route } from 'lucide-react';
import SimulatorPanel from '@/components/simulation/SimulatorPanel';
import {
  getVehicleMapColor,
  getVehicleMapColorKey,
  MAP_COLOR_HEX,
  MAP_COLOR_LABELS,
  mpsToMph,
} from '@/lib/vehicleMapColors';
import {
  truckCircleIcon,
  trailerRectIcon,
  offsetTrailerCoords,
  startOfLocalDay,
} from '@/lib/fleetMapMarkers';

const MAP_DOT = {
  driveable: 'bg-green-500',
  support_needed: 'bg-red-500',
  in_shop: 'bg-blue-500',
};

export default function FleetMap() {
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [driverLocations, setDriverLocations] = useState([]);
  const [activeShifts, setActiveShifts] = useState([]);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showTrailers, setShowTrailers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [filterColor, setFilterColor] = useState('all');
  const [MapComponents, setMapComponents] = useState(null);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, L]) => {
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapComponents({ ...rl, L: L.default });
    });
  }, []);

  const loadData = useCallback(async () => {
    const [vs, us, locs, shifts] = await Promise.all([
      api.entities.Vehicle.list(),
      api.entities.User.list(),
      api.entities.DriverLocation.list('-timestamp', 2000),
      api.entities.TimeClockEntry.filter({}, '-clock_in', 300),
    ]);
    setVehicles(vs);
    setUsers(us);
    setDriverLocations(locs || []);
    setActiveShifts((shifts || []).filter((e) => e.entry_type === 'shift' && !e.clock_out));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData().catch(() => setLoading(false));
    const unsubscribe = api.entities.DriverLocation.subscribe((event) => {
      if (event.type === 'create') {
        setDriverLocations((prev) => [...prev, event.data]);
      }
    });
    const poll = setInterval(() => { loadData().catch(() => {}); }, 45000);
    return () => {
      unsubscribe();
      clearInterval(poll);
    };
  }, [loadData]);

  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);

  const activeShiftByUser = useMemo(() => {
    const map = {};
    activeShifts.forEach((s) => { map[s.user_id] = s; });
    return map;
  }, [activeShifts]);

  const liveDrivers = useMemo(() => {
    const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
    const recent = (driverLocations || []).filter((l) => new Date(l.timestamp).getTime() > eightHoursAgo);
    const latest = {};
    recent.forEach((l) => {
      if (!latest[l.user_id] || new Date(l.timestamp) > new Date(latest[l.user_id].timestamp)) {
        latest[l.user_id] = l;
      }
    });
    return Object.values(latest).filter((d) => userMap[d.user_id] || d.user_id?.startsWith('sim_driver_'));
  }, [driverLocations, userMap]);

  const todayTrails = useMemo(() => {
    const dayStart = startOfLocalDay();
    const byUser = {};
    (driverLocations || []).forEach((l) => {
      if (new Date(l.timestamp) < dayStart) return;
      if (!byUser[l.user_id]) byUser[l.user_id] = [];
      byUser[l.user_id].push([l.lat, l.lng]);
    });
    Object.keys(byUser).forEach((uid) => {
      const pings = (driverLocations || [])
        .filter((l) => l.user_id === uid && new Date(l.timestamp) >= dayStart)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      byUser[uid] = pings.map((p) => [p.lat, p.lng]);
    });
    return byUser;
  }, [driverLocations]);

  const parkedTrailers = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.unit_type !== 'trailer') return false;
      if (v.coupled_driver_id) return false;
      return v.last_known_lat != null && v.last_known_lng != null;
    });
  }, [vehicles]);

  const colorCounts = useMemo(() => {
    const counts = { driveable: 0, support_needed: 0, in_shop: 0 };
    vehicles.forEach((v) => {
      const key = getVehicleMapColorKey(v);
      if (counts[key] != null) counts[key] += 1;
    });
    return counts;
  }, [vehicles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="bg-slate-900 px-5 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="text-white font-black text-sm">Fleet Map</span>
          <span className="text-slate-400 text-xs">— Live trucks, trailer sign-in locations, daily trails</span>
          {liveDrivers.length > 0 && (
            <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full ml-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {liveDrivers.length} live
            </span>
          )}
        </div>
        <div className="flex gap-2 ml-auto flex-wrap items-center">
          <label className="flex items-center gap-1.5 text-xs text-slate-300">
            <input type="checkbox" checked={showTrails} onChange={(e) => setShowTrails(e.target.checked)} />
            Trails
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-300">
            <input type="checkbox" checked={showTrailers} onChange={(e) => setShowTrailers(e.target.checked)} />
            Trailers
          </label>
          <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none">
            <option value="all">All colors ({vehicles.length})</option>
            {Object.entries(MAP_COLOR_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label} ({colorCounts[key] || 0})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {liveDrivers.length} live · {parkedTrailers.length} parked trailers
            </p>
          </div>
          <div className="p-2 border-b border-slate-100">
            <SimulatorPanel />
          </div>

          <div className="overflow-y-auto flex-1">
            {liveDrivers.length === 0 ? (
              <div className="p-5 text-center text-slate-400 text-sm">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No live drivers on map.</p>
                <p className="text-xs mt-1">Drivers appear when clocked in with location sharing.</p>
              </div>
            ) : liveDrivers.map((d) => {
              const driverInfo = userMap[d.user_id];
              const shift = activeShiftByUser[d.user_id];
              const truck = d.vehicle_id ? vehicleMap[d.vehicle_id] : null;
              const trailer = d.trailer_id ? vehicleMap[d.trailer_id] : null;
              const colorKey = truck ? getVehicleMapColorKey(truck) : 'driveable';
              if (filterColor !== 'all' && truck && colorKey !== filterColor) return null;
              const age = Math.round((Date.now() - new Date(d.timestamp).getTime()) / 60000);
              const mph = mpsToMph(d.speed);
              return (
                <div key={d.user_id} onClick={() => setSelectedDriver(d)}
                  className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-amber-50 ${selectedDriver?.user_id === d.user_id ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${MAP_DOT[colorKey] || 'bg-slate-400'}`} />
                    <span className="font-black text-slate-800 text-sm truncate">{driverInfo?.full_name || d.user_name}</span>
                    <span className="text-xs text-slate-400 ml-auto">{age}m</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 ml-5">
                    {d.vehicle_unit_number === 'POV' ? '🚗 POV' : d.vehicle_unit_number ? `🚛 #${d.vehicle_unit_number}` : 'No truck'}
                    {d.trailer_unit_number && ` · 📦 #${d.trailer_unit_number}`}
                  </div>
                  <div className="text-xs text-slate-500 ml-5 mt-0.5">
                    {mph > 0 ? `${mph} mph` : 'Stopped'}
                    {shift && !shift.clock_out && <span className="text-emerald-600 font-bold ml-2">● On shift</span>}
                  </div>
                  {trailer && (
                    <div className="text-[10px] text-slate-400 ml-5 mt-0.5 capitalize">
                      Trailer: {MAP_COLOR_LABELS[getVehicleMapColorKey(trailer)] || 'Unknown'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {parkedTrailers.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 max-h-36 overflow-y-auto">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Parked Trailers</p>
              {parkedTrailers.map((t) => (
                <div key={t.id} className="text-xs text-slate-600 py-1 flex items-center gap-2">
                  <span className="w-3 h-2 rounded-sm flex-shrink-0" style={{ background: getVehicleMapColor(t) }} />
                  <span className="font-bold">#{t.unit_number}</span>
                  <span className="text-slate-400 truncate ml-auto">
                    {t.last_known_at ? new Date(t.last_known_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">Map Legend</p>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /> Circle = truck (live GPS)</div>
              <div className="flex items-center gap-2"><span className="w-4 h-2.5 rounded-sm bg-green-500" /> Rectangle = trailer</div>
              <div className="flex items-center gap-2"><Route className="w-3 h-3 text-blue-500" /> Line = today&apos;s trail</div>
              {Object.entries(MAP_COLOR_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${MAP_DOT[key]}`} style={{ background: MAP_COLOR_HEX[key] }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          {!MapComponents ? (
            <div className="flex items-center justify-center h-full bg-slate-100">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
              <MapComponents.MapContainer center={[39.5, -98.35]} zoom={4} style={{ height: '100%', width: '100%' }}>
                <MapComponents.TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {showTrails && Object.entries(todayTrails).map(([userId, coords]) => {
                  if (coords.length < 2) return null;
                  const shift = activeShiftByUser[userId];
                  const isActive = !!shift;
                  const driverInfo = userMap[userId];
                  return (
                    <MapComponents.Polyline
                      key={`trail-${userId}`}
                      positions={coords}
                      pathOptions={{
                        color: isActive ? '#3b82f6' : '#94a3b8',
                        weight: 3,
                        opacity: isActive ? 0.85 : 0.5,
                        dashArray: isActive ? null : '6 8',
                      }}
                    >
                      <MapComponents.Popup>
                        <div className="text-sm font-bold">{driverInfo?.full_name || userId}</div>
                        <div className="text-xs text-gray-600">Today&apos;s route trail ({coords.length} points)</div>
                        {!isActive && <div className="text-xs text-gray-500">Shift completed</div>}
                      </MapComponents.Popup>
                    </MapComponents.Polyline>
                  );
                })}

                {showDrivers && liveDrivers.map((d) => {
                  const truck = d.vehicle_id ? vehicleMap[d.vehicle_id] : null;
                  const colorKey = truck ? getVehicleMapColorKey(truck) : 'driveable';
                  if (filterColor !== 'all' && truck && colorKey !== filterColor) return null;

                  const color = truck ? getVehicleMapColor(truck) : '#22c55e';
                  const isSim = d.user_id?.startsWith('sim_driver_');
                  const truckIcon = truckCircleIcon(MapComponents.L, isSim ? '#f59e0b' : color, {
                    speedMps: d.speed,
                    label: d.vehicle_unit_number && d.vehicle_unit_number !== 'POV' ? `#${d.vehicle_unit_number}` : null,
                    pulse: true,
                  });

                  const markers = [
                    <MapComponents.Marker key={`truck-${d.user_id}`} position={[d.lat, d.lng]} icon={truckIcon}
                      eventHandlers={{ click: () => setSelectedDriver(d) }}>
                      <MapComponents.Popup>
                        <div className="text-sm font-bold">👤 {userMap[d.user_id]?.full_name || d.user_name}</div>
                        {d.vehicle_unit_number && (
                          <div className="text-xs font-semibold text-slate-700">
                            🚛 {d.vehicle_unit_number === 'POV' ? 'POV' : `Unit #${d.vehicle_unit_number}`}
                          </div>
                        )}
                        <div className="text-xs text-gray-600">{new Date(d.timestamp).toLocaleTimeString()}</div>
                        <div className="text-xs font-bold mt-1">{mpsToMph(d.speed) > 0 ? `${mpsToMph(d.speed)} mph` : 'Stopped'}</div>
                        {truck && (
                          <div className="text-xs capitalize mt-1" style={{ color }}>
                            {MAP_COLOR_LABELS[getVehicleMapColorKey(truck)]}
                          </div>
                        )}
                      </MapComponents.Popup>
                    </MapComponents.Marker>,
                  ];

                  if (showTrailers && d.trailer_id && vehicleMap[d.trailer_id]) {
                    const trailer = vehicleMap[d.trailer_id];
                    const tColor = getVehicleMapColor(trailer);
                    const [tLat, tLng] = offsetTrailerCoords(d.lat, d.lng);
                    markers.push(
                      <MapComponents.Marker key={`trailer-live-${d.trailer_id}`} position={[tLat, tLng]}
                        icon={trailerRectIcon(MapComponents.L, tColor, { label: trailer.unit_number })}>
                        <MapComponents.Popup>
                          <div className="text-sm font-bold">📦 Trailer #{trailer.unit_number}</div>
                          <div className="text-xs text-gray-600">Hooked — follows truck GPS</div>
                          <div className="text-xs capitalize mt-1" style={{ color: tColor }}>
                            {MAP_COLOR_LABELS[getVehicleMapColorKey(trailer)]}
                          </div>
                        </MapComponents.Popup>
                      </MapComponents.Marker>,
                    );
                  }

                  return markers;
                })}

                {showTrailers && parkedTrailers.map((t) => {
                  if (filterColor !== 'all' && getVehicleMapColorKey(t) !== filterColor) return null;
                  const stale = t.last_known_at && (Date.now() - new Date(t.last_known_at).getTime() > 24 * 60 * 60 * 1000);
                  const color = getVehicleMapColor(t);
                  return (
                    <MapComponents.Marker key={`trailer-parked-${t.id}`}
                      position={[t.last_known_lat, t.last_known_lng]}
                      icon={trailerRectIcon(MapComponents.L, color, { label: t.unit_number, stale })}>
                      <MapComponents.Popup>
                        <div className="text-sm font-bold">📦 Trailer #{t.unit_number}</div>
                        <div className="text-xs text-gray-600">Last signed out location</div>
                        {t.last_driver_name && <div className="text-xs">Driver: {t.last_driver_name}</div>}
                        {t.last_known_at && (
                          <div className="text-xs text-gray-500">{new Date(t.last_known_at).toLocaleString()}</div>
                        )}
                        <div className="text-xs capitalize mt-1" style={{ color }}>
                          {MAP_COLOR_LABELS[getVehicleMapColorKey(t)]}
                        </div>
                      </MapComponents.Popup>
                    </MapComponents.Marker>
                  );
                })}
              </MapComponents.MapContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

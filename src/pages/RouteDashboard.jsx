import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { Route, MapPin, Truck, User, Clock, TrendingUp, AlertCircle, Navigation } from 'lucide-react';
import { isDeliveryStopComplete } from '@/lib/roles';

const STATUS_COLORS = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-600',
  completed: 'bg-green-100 text-green-600',
  cancelled: 'bg-red-100 text-red-600',
};

export default function RouteDashboard() {
  const [user, setUser] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stops, setStops] = useState([]);
  const [driverLocations, setDriverLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    api.auth.me().then(async u => {
      setUser(u);
      const [rs, ds, vs, ss, locs] = await Promise.all([
        api.entities.DeliveryRoute.list('-route_date', 100),
        api.entities.User.list(),
        api.entities.Vehicle.list(),
        api.entities.DeliveryStop.list('-sequence', 500),
        api.entities.DriverLocation.list('-timestamp', 200),
      ]);
      setRoutes(rs);
      setDrivers(ds);
      setVehicles(vs);
      setStops(ss);
      setDriverLocations(locs || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    const unsubscribe = api.entities.DriverLocation.subscribe((event) => {
      if (event.type === 'create') {
        setDriverLocations(prev => [...prev, event.data]);
      }
    });

    return () => unsubscribe();
  }, []);

  const userMap = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d])), [drivers]);
  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(v => [v.id, v])), [vehicles]);

  // Get latest location per driver
  const liveDrivers = useMemo(() => {
    const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
    const recent = (driverLocations || []).filter(l => new Date(l.timestamp).getTime() > eightHoursAgo);
    const latest = {};
    recent.forEach(l => {
      if (!latest[l.user_id] || new Date(l.timestamp) > new Date(latest[l.user_id].timestamp)) {
        latest[l.user_id] = l;
      }
    });
    return Object.values(latest);
  }, [driverLocations]);

  // Enrich routes with driver, vehicle, and stop info
  const enrichedRoutes = useMemo(() => {
    return routes.map(r => {
      const driver = userMap[r.driver_id];
      const vehicle = vehicleMap[r.vehicle_id];
      const routeStops = (stops || []).filter(s => s.route_id === r.id);
      const completedStops = routeStops.filter(s => isDeliveryStopComplete(s.status)).length;
      const driverLocation = liveDrivers.find(l => l.user_id === r.driver_id);

      return {
        ...r,
        driver,
        vehicle,
        stops: routeStops,
        completedStops,
        progress: r.total_stops > 0 ? Math.round((completedStops / r.total_stops) * 100) : 0,
        driverLocation,
      };
    });
  }, [routes, userMap, vehicleMap, stops, liveDrivers]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayRoutes = enrichedRoutes.filter(r => r.route_date === today);
    return {
      total: enrichedRoutes.length,
      today: todayRoutes.length,
      inProgress: todayRoutes.filter(r => r.status === 'in_progress').length,
      completed: todayRoutes.filter(r => r.status === 'completed').length,
      totalStops: enrichedRoutes.reduce((s, r) => s + (r.total_stops || 0), 0),
      completedStops: enrichedRoutes.reduce((s, r) => s + (r.completed_stops || 0), 0),
    };
  }, [enrichedRoutes]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Route className="w-6 h-6 text-amber-500" /> Route Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Monitor delivery routes, driver progress, and live locations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Total Routes</div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">{stats.today} today</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">In Progress</div>
          <div className="text-2xl font-black text-blue-600">{stats.inProgress}</div>
          <div className="text-xs text-blue-500 mt-1 animate-pulse">● Active now</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Completed Today</div>
          <div className="text-2xl font-black text-green-600">{stats.completed}</div>
          <div className="text-xs text-green-500 mt-1">✓ Done</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Stop Progress</div>
          <div className="text-2xl font-black text-amber-600">
            {stats.completedStops}/{stats.totalStops}
          </div>
          <div className="text-xs text-amber-500 mt-1">
            {stats.totalStops > 0 ? Math.round((stats.completedStops / stats.totalStops) * 100) : 0}% complete
          </div>
        </div>
      </div>

      {/* Live Drivers */}
      {liveDrivers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            <div className="font-black text-blue-800 text-sm">Live Driver Locations ({liveDrivers.length})</div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveDrivers.map(d => {
              const driverInfo = userMap[d.user_id];
              const age = Math.round((Date.now() - new Date(d.timestamp).getTime()) / 60000);
              const speed = d.speed > 0 ? (d.speed * 2.237).toFixed(0) : 0;
              return (
                <div key={d.user_id} className="bg-white rounded-lg border border-blue-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <div className="font-bold text-slate-800 text-sm truncate">{driverInfo?.full_name || d.user_name}</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {d.vehicle_unit_number === 'POV' ? '🚗 POV' : d.vehicle_unit_number ? `🚛 Unit #${d.vehicle_unit_number}` : ''}
                    {d.trailer_unit_number && ` + 📦 #${d.trailer_unit_number}`}
                  </div>
                  {speed > 0 && (
                    <div className="text-xs text-blue-600 font-bold mt-1">
                      🚀 {speed} mph
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-1">Updated {age}m ago</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Routes List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-black text-slate-900">All Routes ({enrichedRoutes.length})</div>
        <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
          {enrichedRoutes.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">No routes yet</div>
          )}
          {enrichedRoutes.map(route => (
            <div key={route.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${STATUS_COLORS[route.status] || 'bg-slate-100'}`}>
                  <Route className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-black text-slate-900">{route.route_name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[route.status]}`}>
                      {route.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    📅 {route.route_date}
                    {route.driver && <span className="ml-2">👤 {route.driver.full_name}</span>}
                    {route.vehicle && <span className="ml-2">🚛 Unit #{route.vehicle.unit_number}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-bold text-slate-700">{route.completedStops}/{route.total_stops} stops</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                          style={{ width: `${route.progress}%` }}
                        />
                      </div>
                    </div>
                    {route.driverLocation && (
                      <div className="text-xs text-blue-600 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        Live • {route.driverLocation.speed > 0 ? `${(route.driverLocation.speed * 2.237).toFixed(0)} mph` : 'Stopped'}
                      </div>
                    )}
                  </div>
                  {route.stops?.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <div className="text-xs text-slate-400">Next:</div>
                      {route.stops.filter(s => !isDeliveryStopComplete(s.status)).slice(0, 3).map((stop, i) => (
                        <div key={stop.id} className="text-xs bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                          <span className="font-bold text-slate-600">#{stop.sequence}</span>
                          <span className="text-slate-500 truncate max-w-[150px]">{stop.recipient_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {selectedRoute?.id === route.id ? '▲' : '▼'}
                </button>
              </div>

              {/* Expanded Details */}
              {selectedRoute?.id === route.id && (
                <div className="mt-4 ml-14 border-t border-slate-100 pt-4">
                  <div className="text-sm font-black text-slate-700 mb-2">All Stops ({route.stops?.length || 0})</div>
                  <div className="space-y-2">
                    {(route.stops || []).map((stop, i) => (
                      <div key={stop.id} className="flex items-center gap-3 text-sm">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isDeliveryStopComplete(stop.status) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {stop.sequence}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-800">{stop.recipient_name}</div>
                          <div className="text-xs text-slate-500">{stop.address}</div>
                        </div>
                        <div className="text-xs capitalize">
                          {isDeliveryStopComplete(stop.status) ? (
                            <span className="text-green-600 font-bold">✓ Done</span>
                          ) : stop.status === 'failed' ? (
                            <span className="text-red-600 font-bold">✗ Failed</span>
                          ) : (
                            <span className="text-slate-500">Pending</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
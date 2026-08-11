import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { MapPin, CheckCircle2, Clock, AlertTriangle, Camera, ChevronDown, ChevronUp, Navigation, Phone, ScanLine, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StopPODModal from '@/components/delivery/StopPODModal';
import DriverRouteMap from '@/components/delivery/DriverRouteMap';
import { buildNavigationUrl } from '@/lib/fleetMaps';
import { cacheDriverRoute, getCachedDriverRoute, mergeServerRouteWithCache } from '@/lib/offline/offlineCache';
import { isOfflineMode } from '@/lib/offline/offlineSync';

const STATUS_STYLES = {
  pending: { color: 'bg-slate-100 text-slate-600', icon: Clock },
  delivered: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  failed: { color: 'bg-red-100 text-red-600', icon: AlertTriangle },
  attempted: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
};

export default function MyDeliveryRoute() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [podStop, setPodStop] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState({});
  const [fromCache, setFromCache] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    setFromCache(false);
    const u = await api.auth.me().catch(() => null);
    setUser(u);
    const settings = u ? {
      require_pod_signature: !!u.require_pod_signature,
      allow_virtual_pod: u.allow_virtual_pod !== false,
      max_stops_per_route: u.max_stops_per_route || 200,
    } : {};
    if (u) setDeliverySettings(settings);
    if (!u) { setLoading(false); return; }

    try {
      const routes = await api.entities.DeliveryRoute.filter({ driver_id: u.id });
      const todayRoute = routes.find((r) => r.route_date === today && r.status !== 'cancelled');
      if (todayRoute) {
        let routeData = todayRoute;
        const ss = await api.entities.DeliveryStop.filter({ route_id: todayRoute.id });
        let stopList = ss.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        const cached = await getCachedDriverRoute(u.id, today);
        if (cached?.stops?.length) {
          stopList = mergeServerRouteWithCache(stopList, cached.stops);
        }
        setRoute(routeData);
        setStops(stopList);
        await cacheDriverRoute(u.id, today, { route: routeData, stops: stopList, settings });
        if (todayRoute.status === 'pending') {
          const updated = await api.entities.DeliveryRoute.update(todayRoute.id, { status: 'in_progress' });
          setRoute(updated._offlineQueued ? { ...routeData, status: 'in_progress' } : updated);
        }
      } else {
        const cached = await getCachedDriverRoute(u.id, today);
        if (cached?.route) {
          setRoute(cached.route);
          setStops(cached.stops || []);
          setDeliverySettings(cached.settings || settings);
          setFromCache(true);
        }
      }
    } catch {
      const cached = await getCachedDriverRoute(u.id, today);
      if (cached?.route) {
        setRoute(cached.route);
        setStops(cached.stops || []);
        setDeliverySettings(cached.settings || settings);
        setFromCache(true);
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const onSync = () => { if (!isOfflineMode()) load(); };
    window.addEventListener('fleetco:offline-sync-complete', onSync);
    return () => window.removeEventListener('fleetco:offline-sync-complete', onSync);
  }, []);

  useEffect(() => {
    const podStopId = location.state?.podStopId;
    if (podStopId && stops.length) {
      const stop = stops.find((s) => s.id === podStopId);
      if (stop) {
        setPodStop(stop);
        setExpanded(stop.id);
      }
    }
  }, [location.state?.podStopId, stops]);

  const optimizeRoute = async () => {
    if (!route) return;
    setOptimizing(true);
    try {
      let lat;
      let lng;
      try {
        const pos = await (await import('@/lib/nativeBridge')).getCurrentPosition();
        lat = pos.lat;
        lng = pos.lng;
      } catch { /* ok */ }
      if (stops.filter((s) => s.lat == null).length > 0) {
        setGeocoding(true);
        try {
          const geo = await api.functions.invoke('geocodeDeliveryRoute', { routeId: route.id });
          if (geo.stops) setStops(geo.stops.sort((a, b) => a.sequence - b.sequence));
        } finally {
          setGeocoding(false);
        }
      }
      const result = await api.functions.invoke('optimizeDeliveryRoute', {
        routeId: route.id,
        startLat: lat,
        startLng: lng,
      });
      if (result.stops) setStops(result.stops.sort((a, b) => a.sequence - b.sequence));
    } finally {
      setOptimizing(false);
    }
  };

  const handlePODSaved = async (stopId, podData) => {
    const deliveredAt = new Date().toISOString();
    let updated = await api.entities.DeliveryStop.update(stopId, {
      ...podData,
      delivered_at: deliveredAt,
    });
    if (updated._offlineQueued) {
      updated = { ...stops.find((s) => s.id === stopId), ...podData, delivered_at: deliveredAt, _offlineQueued: true };
    }
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, ...updated } : s)));
    setPodStop(null);

    const newStops = stops.map((s) => (s.id === stopId ? { ...s, ...updated } : s));
    const done = newStops.filter((s) => s.status === 'delivered' || s.status === 'failed').length;
    const routeStatus = done >= newStops.length ? 'completed' : 'in_progress';
    let updatedRoute = await api.entities.DeliveryRoute.update(route.id, {
      completed_stops: done,
      status: routeStatus,
    });
    if (updatedRoute._offlineQueued) {
      updatedRoute = { ...route, completed_stops: done, status: routeStatus, _offlineQueued: true };
    }
    setRoute(updatedRoute);
    if (user?.id) {
      await cacheDriverRoute(user.id, today, {
        route: updatedRoute,
        stops: newStops.map((s) => (s.id === stopId ? { ...s, ...updated } : s)),
        settings: deliverySettings,
      });
    }
  };

  const completed = stops.filter(s => s.status === 'delivered').length;
  const failed = stops.filter(s => s.status === 'failed').length;
  const remaining = stops.filter(s => s.status === 'pending' || s.status === 'attempted').length;
  const progress = stops.length > 0 ? Math.round(((completed + failed) / stops.length) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="flex items-center justify-center h-64 text-slate-400">Please log in to view your route.</div>
  );

  if (!route) return (
    <div className="p-6 text-center py-20 text-slate-400">
      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="font-semibold text-lg">No route assigned for today</p>
      <p className="text-sm mt-1">Scan packages in the driver app to build a route, or wait for dispatch.</p>
      <Link to="/driver/scan" className="inline-block mt-4 text-amber-600 font-bold text-sm">Open Scanner →</Link>
    </div>
  );

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white">
        {fromCache && (
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-amber-300 bg-amber-900/40 rounded-lg px-2 py-1 inline-block">
            Cached route — updates when back online
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-amber-400 text-xs font-bold uppercase tracking-wider">Today's Route</div>
            <div className="text-xl font-black mt-0.5">{route.route_name}</div>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-bold capitalize ${
            route.status === 'completed' ? 'bg-green-500 text-white' :
            route.status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-200'
          }`}>
            {route.status?.replace('_', ' ')}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{completed} delivered · {failed} failed · {remaining} remaining</span>
            <span className="font-bold text-amber-400">{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Link to="/driver/scan" className="flex-1">
            <Button size="sm" variant="outline" className="w-full border-slate-600 text-slate-200 hover:bg-slate-800">
              <ScanLine className="w-3.5 h-3.5 mr-1" /> Scan Package
            </Button>
          </Link>
          {remaining > 1 && (
            <Button size="sm" variant="outline" disabled={optimizing} onClick={optimizeRoute}
              className="flex-1 border-amber-500/50 text-amber-300 hover:bg-slate-800">
              <ListOrdered className="w-3.5 h-3.5 mr-1" /> {optimizing || geocoding ? 'Working…' : 'Optimize'}
            </Button>
          )}
        </div>
      </div>

      <DriverRouteMap stops={stops} className="mb-2" />

      {/* Stops */}
      <div className="space-y-3">
        {stops.map((stop, idx) => {
          const style = STATUS_STYLES[stop.status] || STATUS_STYLES.pending;
          const StatusIcon = style.icon;
          const isExpanded = expanded === stop.id;
          const isDone = stop.status === 'delivered' || stop.status === 'failed';
          const fullAddress = [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ');

          return (
            <div
              key={stop.id}
              className={`bg-white rounded-xl border-2 transition-all ${
                isDone ? 'border-slate-100 opacity-70' : 'border-slate-200 shadow-sm'
              }`}
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : stop.id)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm ${
                  isDone ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isDone ? <StatusIcon className="w-4 h-4" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 truncate">{stop.recipient_name}</div>
                  <div className="text-xs text-slate-500 truncate">{fullAddress}</div>
                  {stop.tracking_number && (
                    <div className="text-[10px] font-mono text-amber-700 mt-0.5">#{stop.tracking_number}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${style.color}`}>
                    {stop.status}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                  {stop.package_description && (
                    <div className="text-sm text-slate-600"><span className="font-semibold">Package:</span> {stop.package_description}</div>
                  )}
                  {stop.notes && (
                    <div className="text-sm bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-amber-800">
                      📋 {stop.notes}
                    </div>
                  )}
                  {stop.pod_notes && (
                    <div className="text-sm text-slate-500 italic">POD Note: {stop.pod_notes}</div>
                  )}
                  {stop.pod_signature_url && (
                    <div className="text-xs text-slate-500">Signed by {stop.pod_recipient_name || stop.recipient_name}</div>
                  )}
                  {stop.pod_photo_url && (
                    <img src={stop.pod_photo_url} alt="POD" className="rounded-lg w-full max-h-40 object-cover border border-slate-200" />
                  )}
                  <div className="flex gap-2 mt-1">
                    {stop.recipient_phone && (
                      <a href={`tel:${stop.recipient_phone}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <Phone className="w-3.5 h-3.5 mr-1" /> Call
                        </Button>
                      </a>
                    )}
                    <a
                      href={buildNavigationUrl({
                        lat: stop.lat,
                        lng: stop.lng,
                        address: stop.address,
                        city: stop.city,
                        state: stop.state,
                        zip: stop.zip,
                        label: stop.recipient_name,
                      }).href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" variant="outline" className="w-full">
                        <Navigation className="w-3.5 h-3.5 mr-1" /> Navigate
                      </Button>
                    </a>
                    {!isDone && (
                      <Button
                        size="sm"
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                        onClick={() => setPodStop(stop)}
                      >
                        <Camera className="w-3.5 h-3.5 mr-1" /> Record POD
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {route.status === 'completed' && (
        <div className="text-center py-8 bg-green-50 rounded-2xl border border-green-200">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <div className="font-black text-green-700 text-lg">Route Complete!</div>
          <div className="text-sm text-green-600 mt-1">{completed} delivered · {failed} failed</div>
        </div>
      )}

      {podStop && (
        <StopPODModal
          stop={podStop}
          deliverySettings={deliverySettings}
          onSave={(data) => handlePODSaved(podStop.id, data)}
          onClose={() => setPodStop(null)}
        />
      )}
    </div>
  );
}
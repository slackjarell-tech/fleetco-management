import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { MapPin, Navigation as NavIcon, ExternalLink, Package, Calendar, Truck, AlertCircle, User } from 'lucide-react';

const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  assigned: 'bg-amber-100 text-amber-700',
  in_transit: 'bg-blue-100 text-blue-700',
  delivered: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
};

function openGoogleMaps(origin, destination) {
  const url = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
  window.open(url, '_blank');
}

function openGoogleMapsNavigation(destination) {
  // Deep link to Google Maps navigation (works on mobile too)
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  window.open(url, '_blank');
}

function openGoogleMapsRoute(origin, destination) {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  window.open(url, '_blank');
}

export default function Navigation() {
  const [user, setUser] = useState(null);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [activeDrivers, setActiveDrivers] = useState([]);

  useEffect(() => {
    const init = async () => {
      const u = await api.auth.me();
      setUser(u);
      const [allLoads, locs] = await Promise.all([
        api.entities.Load.list('-created_date', 100),
        api.entities.DriverLocation.list('-timestamp', 500),
      ]);
      const myLoads = u?.role === 'driver'
        ? allLoads.filter(l => l.assigned_driver_id === u.id && ['assigned', 'in_transit'].includes(l.status))
        : allLoads.filter(l => ['assigned', 'in_transit'].includes(l.status));
      setLoads(myLoads);
      if (myLoads.length > 0) setSelectedLoad(myLoads[0]);

      // Latest driver locations (last 8 hours)
      const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
      const recent = (locs || []).filter(l => new Date(l.timestamp).getTime() > eightHoursAgo);
      const latest = {};
      recent.forEach(l => {
        if (!latest[l.user_id] || new Date(l.timestamp) > new Date(latest[l.user_id].timestamp)) {
          latest[l.user_id] = l;
        }
      });
      setActiveDrivers(Object.values(latest));
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isDriver = user?.role === 'driver';

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <NavIcon className="w-6 h-6 text-amber-500" /> Navigation
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {isDriver ? 'Your active loads with turn-by-turn navigation' : 'All active & in-transit loads'}
        </p>
      </div>

      {loads.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No active loads</p>
          <p className="text-sm mt-1">{isDriver ? 'You have no assigned or in-transit loads.' : 'No loads are currently active.'}</p>
        </div>
      )}

      <div className="grid gap-4">
        {loads.map(load => {
          const isSelected = selectedLoad?.id === load.id;
          return (
            <div
              key={load.id}
              onClick={() => setSelectedLoad(load)}
              className={`bg-white border-2 rounded-2xl p-5 cursor-pointer transition-all ${isSelected ? 'border-amber-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
            >
              {/* Load Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-xl">
                    <Truck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900">Load #{load.load_number}</div>
                    {load.commodity && <div className="text-xs text-slate-500">{load.commodity}</div>}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[load.status]}`}>
                  {load.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="w-0.5 h-8 bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Origin</div>
                    <div className="text-sm font-semibold text-slate-800">{load.origin || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Destination</div>
                    <div className="text-sm font-semibold text-slate-800">{load.destination || '—'}</div>
                  </div>
                </div>
                {load.miles && (
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">{load.miles}</div>
                    <div className="text-xs text-slate-400">miles</div>
                  </div>
                )}
              </div>

              {/* Dates */}
              {(load.pickup_date || load.delivery_date) && (
                <div className="flex gap-4 text-xs text-slate-500 mb-4">
                  {load.pickup_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Pickup: {load.pickup_date}
                    </span>
                  )}
                  {load.delivery_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Delivery: {load.delivery_date}
                    </span>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {load.origin && load.destination && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openGoogleMapsRoute(load.origin, load.destination); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <NavIcon className="w-4 h-4" />
                    Full Route Navigation
                  </button>
                )}
                {load.origin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openGoogleMapsNavigation(load.origin); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Navigate to Pickup
                  </button>
                )}
                {load.destination && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openGoogleMapsNavigation(load.destination); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Navigate to Delivery
                  </button>
                )}
              </div>

              {/* Google Maps embed preview for selected load */}
              {isSelected && load.origin && load.destination && (
                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
                  <iframe
                    title={`Map for Load #${load.load_number}`}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(load.origin + ' to ' + load.destination)}&output=embed&t=r`}
                  />
                  <div className="bg-slate-50 px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Map preview · Tap navigation buttons above for turn-by-turn</span>
                    <a
                      href={`https://www.google.com/maps/dir/${encodeURIComponent(load.origin)}/${encodeURIComponent(load.destination)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Open in Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Drivers */}
      {activeDrivers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-blue-50 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="font-black text-slate-800 text-sm">Live Drivers</span>
            <span className="bg-blue-200 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{activeDrivers.length}</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
            {activeDrivers.map(d => {
              const loc = `${d.lat?.toFixed(4)}, ${d.lng?.toFixed(4)}`;
              const age = Math.round((Date.now() - new Date(d.timestamp).getTime()) / 60000);
              const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}&travelmode=driving`;
              return (
                <div key={d.user_id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{d.user_name}</div>
                    <div className="text-xs text-slate-500">{loc} · {age}m ago</div>
                    {d.speed > 0 && <div className="text-xs text-slate-400">{(d.speed * 2.237).toFixed(0)} mph</div>}
                  </div>
                  <a href={navUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors">
                    <NavIcon className="w-3 h-3" /> Nav
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>Tapping any navigation button opens <strong>Google Maps</strong> with turn-by-turn directions. On mobile, this will launch the Google Maps app if installed.</p>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/apiClient";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Map, List, Plus, Search, Fuel, Droplets, Flame,
  Navigation, Phone, Clock, Store, AlertCircle, TrendingUp, User
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import FuelStationModal from "@/components/fuel/FuelStationModal";
import FuelPredictionChart from "@/components/fuel/FuelPredictionChart";
import moment from "moment";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const fuelIcon = (price) => {
  const color = price && price < 3.50 ? "#16a34a" : price && price < 4.00 ? "#d97706" : "#dc2626";
  return L.divIcon({
    className: "fuel-marker",
    html: `<div style="background:${color};color:#fff;padding:4px 8px;border-radius:6px;font-weight:700;font-size:12px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff">$${price || '--'}</div>`,
    iconSize: [60, 28],
    iconAnchor: [30, 14],
    popupAnchor: [0, -16],
  });
};

export default function FuelStations() {
  const [view, setView] = useState("map");
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeDrivers, setActiveDrivers] = useState([]);

  const loadStations = useCallback(async () => {
    const [data, locs] = await Promise.all([
      api.entities.FuelStation.filter({}),
      api.entities.DriverLocation.list('-timestamp', 500),
    ]);
    setStations(data);
    // Latest per driver (last 8 hours)
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
  }, []);

  useEffect(() => {
    loadStations();
    api.auth.me().then(setUser).catch(() => {});

    const unsubscribe = api.entities.FuelStation.subscribe((event) => {
      if (event.type === "create") {
        setStations(prev => [...prev, event.data]);
      } else if (event.type === "update") {
        setStations(prev => prev.map(s => s.id === event.id ? event.data : s));
      } else if (event.type === "delete") {
        setStations(prev => prev.filter(s => s.id !== event.id));
      }
    });

    return () => unsubscribe();
  }, [loadStations]);

  const filtered = stations.filter(s =>
    s.status === "active" &&
    (!search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
     s.city?.toLowerCase().includes(search.toLowerCase()) ||
     s.state?.toLowerCase().includes(search.toLowerCase()) ||
     s.brand?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    setEditingStation(null);
    setModalOpen(true);
  };

  const handleEdit = (station) => {
    setEditingStation(station);
    setModalOpen(true);
  };

  const getFreshness = (date) => {
    if (!date) return { label: "No data", color: "bg-gray-100 text-gray-600" };
    const hours = moment().diff(moment(date), "hours");
    if (hours < 1) return { label: "Just now", color: "bg-green-100 text-green-700" };
    if (hours < 6) return { label: `${hours}h ago`, color: "bg-green-100 text-green-700" };
    if (hours < 24) return { label: `${hours}h ago`, color: "bg-yellow-100 text-yellow-700" };
    return { label: `${Math.floor(hours / 24)}d ago`, color: "bg-red-100 text-red-700" };
  };

  const center = filtered.length > 0
    ? [filtered.reduce((s, c) => s + (c.lat || 39.8), 0) / filtered.length,
       filtered.reduce((s, c) => s + (c.lng || -98.5), 0) / filtered.length]
    : [39.8283, -98.5795];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fuel Stations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live fuel pricing across all station locations
            {activeDrivers.length > 0 && (
              <span className="inline-flex items-center gap-1 ml-3 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                {activeDrivers.length} live driver{activeDrivers.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView("map")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "map" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Map className="w-4 h-4 inline mr-1" /> Map
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "list" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              <List className="w-4 h-4 inline mr-1" /> List
            </button>
            <button
              onClick={() => setView("predictions")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "predictions" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" /> Predictions
            </button>
          </div>
          <Button onClick={handleAdd} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Add Station
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name, city, state, or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Map View */}
      {view === "map" && (
        <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 500 }}>
          <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map(station => (
              <Marker
                key={station.id}
                position={[station.lat || 0, station.lng || 0]}
                icon={fuelIcon(station.diesel_price)}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-sm text-slate-900">{station.name}</h3>
                    <p className="text-xs text-slate-500">{station.city}, {station.state}</p>
                    <div className="mt-2 space-y-1">
                      {station.diesel_price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 flex items-center gap-1"><Fuel className="w-3.5 h-3.5" /> Diesel</span>
                          <span className="font-semibold text-slate-900">${station.diesel_price.toFixed(3)}</span>
                        </div>
                      )}
                      {station.gasoline_price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> Gasoline</span>
                          <span className="font-semibold text-slate-900">${station.gasoline_price.toFixed(3)}</span>
                        </div>
                      )}
                      {station.def_price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> DEF</span>
                          <span className="font-semibold text-slate-900">${station.def_price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Updated {moment(station.last_updated_date).fromNow()}
                    </div>
                    <button
                      onClick={() => handleEdit(station)}
                      className="mt-2 text-xs text-amber-600 hover:text-amber-500 font-medium"
                    >
                      Update Prices
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Live Driver Locations */}
            {activeDrivers.map(d => {
              const driverIcon = L.divIcon({
                html: `<div style="background:#3b82f6;width:15px;height:15px;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.6)"></div>`,
                className: '',
                iconSize: [15, 15],
                iconAnchor: [7, 7],
              });
              const age = Math.round((Date.now() - new Date(d.timestamp).getTime()) / 60000);
              return (
                <Marker key={`driver-${d.user_id}`} position={[d.lat, d.lng]} icon={driverIcon}>
                  <Popup>
                    <div className="text-sm font-bold">👤 {d.user_name}</div>
                    <div className="text-xs text-blue-600 mt-1">📍 Lat: {d.lat?.toFixed(4)}, Lng: {d.lng?.toFixed(4)}</div>
                    {d.speed > 0 && <div className="text-xs text-gray-500">Speed: {(d.speed * 2.237).toFixed(0)} mph</div>}
                    <div className="text-xs text-gray-500 mt-1">Updated {age}m ago</div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(station => {
            const fresh = getFreshness(station.last_updated_date);
            return (
              <div
                key={station.id}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEdit(station)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{station.name}</h3>
                    <p className="text-sm text-slate-500">{station.city}, {station.state}</p>
                    {station.brand && <p className="text-xs text-slate-400">{station.brand}</p>}
                  </div>
                  <Badge className={fresh.color}>{fresh.label}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-amber-50 rounded-lg p-2 text-center">
                    <Fuel className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-slate-900">
                      ${station.diesel_price?.toFixed(2) || "--"}
                    </div>
                    <div className="text-[10px] text-slate-500">Diesel</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2 text-center">
                    <Flame className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-slate-900">
                      ${station.gasoline_price?.toFixed(2) || "--"}
                    </div>
                    <div className="text-[10px] text-slate-500">Gasoline</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <Droplets className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-slate-900">
                      ${station.def_price?.toFixed(2) || "--"}
                    </div>
                    <div className="text-[10px] text-slate-500">DEF</div>
                  </div>
                </div>

                {station.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {station.amenities.slice(0, 4).map(a => (
                      <span key={a} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{a}</span>
                    ))}
                    {station.amenities.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">+{station.amenities.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Predictions View */}
      {view === "predictions" && (
        <FuelPredictionChart />
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <p className="text-lg font-medium">No fuel stations found</p>
          <p className="text-sm mt-1">Add your first station or adjust your search</p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add Station
          </Button>
        </div>
      )}

      <FuelStationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingStation(null); }}
        station={editingStation}
        currentUser={user}
      />
    </div>
  );
}
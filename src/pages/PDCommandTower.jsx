import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Map, CheckCircle2, Clock, AlertTriangle, XCircle, Truck, Users, Eye, ListOrdered } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import RouteCard from '@/components/delivery/RouteCard';
import RouteModal from '@/components/delivery/RouteModal';
import RouteStopsPanel from '@/components/delivery/RouteStopsPanel';

const STATUS_COLORS = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function PDCommandTower() {
  const [user, setUser] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoute, setEditRoute] = useState(null);
  const [viewRoute, setViewRoute] = useState(null);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);

  const load = async () => {
    const u = await api.auth.me().catch(() => null);
    setUser(u);
    const [rs, ss, us, vs] = await Promise.all([
      api.entities.DeliveryRoute.list('-route_date', 200),
      api.entities.DeliveryStop.list('-created_date', 1000),
      api.entities.User.list(),
      api.entities.Vehicle.filter({ unit_type: 'truck' }),
    ]);
    setRoutes(rs);
    setStops(ss);
    setUsers(us);
    setVehicles(vs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSaveRoute = async (data) => {
    if (editRoute) {
      const updated = await api.entities.DeliveryRoute.update(editRoute.id, data);
      setRoutes(prev => prev.map(r => r.id === editRoute.id ? updated : r));
    } else {
      const created = await api.entities.DeliveryRoute.create(data);
      setRoutes(prev => [created, ...prev]);
    }
    setShowModal(false);
    setEditRoute(null);
  };

  const handleDeleteRoute = async (id) => {
    if (!confirm('Delete this route and all its stops?')) return;
    await api.entities.DeliveryRoute.delete(id);
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  const getDriver = (id) => users.find(u => u.id === id);
  const getVehicle = (id) => vehicles.find(v => v.id === id);
  const getRouteStops = (routeId) => stops.filter(s => s.route_id === routeId);

  const filteredRoutes = routes.filter(r => !filterDate || r.route_date === filterDate);

  const statCounts = {
    total: filteredRoutes.length,
    in_progress: filteredRoutes.filter(r => r.status === 'in_progress').length,
    completed: filteredRoutes.filter(r => r.status === 'completed').length,
    pending: filteredRoutes.filter(r => r.status === 'pending').length,
  };

  const totalStopsToday = filteredRoutes.reduce((s, r) => s + getRouteStops(r.id).length, 0);
  const completedStopsToday = filteredRoutes.reduce((s, r) => s + getRouteStops(r.id).filter(st => st.status === 'delivered').length, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Map className="w-6 h-6 text-amber-500" /> PD Command Tower
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Final mile dispatch — create routes, assign drivers, track deliveries</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <Link to="/portal/route-builder">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              <ListOrdered className="w-4 h-4 mr-1" /> Route Builder
            </Button>
          </Link>
          <Button onClick={() => { setEditRoute(null); setShowModal(true); }} variant="outline">
            <Plus className="w-4 h-4 mr-1" /> Quick Route
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Routes Today', value: statCounts.total, icon: Map, color: 'text-slate-700' },
          { label: 'In Progress', value: statCounts.in_progress, icon: Truck, color: 'text-blue-600' },
          { label: 'Completed', value: statCounts.completed, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Stops Progress', value: `${completedStopsToday}/${totalStopsToday}`, icon: Clock, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
            </div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Routes Grid */}
      {filteredRoutes.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No routes for this date</p>
          <p className="text-sm mt-1">Click "New Route" to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRoutes.map(route => (
            <RouteCard
              key={route.id}
              route={route}
              stops={getRouteStops(route.id)}
              driver={getDriver(route.driver_id)}
              vehicle={getVehicle(route.vehicle_id)}
              onView={() => setViewRoute(route)}
              onEdit={() => { setEditRoute(route); setShowModal(true); }}
              onDelete={() => handleDeleteRoute(route.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <RouteModal
          route={editRoute}
          users={users}
          vehicles={vehicles}
          onSave={handleSaveRoute}
          onClose={() => { setShowModal(false); setEditRoute(null); }}
        />
      )}

      {viewRoute && (
        <RouteStopsPanel
          route={viewRoute}
          stops={getRouteStops(viewRoute.id)}
          driver={getDriver(viewRoute.driver_id)}
          onClose={() => { setViewRoute(null); load(); }}
          onStopsChanged={load}
        />
      )}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, Edit, Trash2, MapPin, Calendar, Package, Bell, Navigation, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import LoadModal from '@/components/fleet/LoadModal';
import WeightScaleModal from '@/components/loadboard/WeightScaleModal';

const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  assigned: 'bg-amber-100 text-amber-700',
  in_transit: 'bg-blue-100 text-blue-700',
  delivered: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
};

export default function LoadBoard() {
  const [user, setUser] = useState(null);
  const [loads, setLoads] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editLoad, setEditLoad] = useState(null);
  const [scaleLoad, setScaleLoad] = useState(null);

  useEffect(() => {
    api.auth.me().then(async (u) => {
      setUser(u);
      await fetchData(u);
    });
  }, []);

  const fetchData = async (u) => {
    setLoading(true);
    const [ls, vs, us] = await Promise.all([
      api.entities.Load.list('-created_date', 200),
      api.entities.Vehicle.list(),
      api.entities.User.list(),
    ]);
    const filtered = u?.role === 'driver' ? ls.filter(l => l.assigned_driver_id === u.id) :
                     u?.role === 'customer' ? ls.filter(l => l.customer_id === u.id) :
                     ls; // admin, executive, employee see all
    setLoads(filtered);
    setVehicles(vs);
    setUsers(us);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this load?')) return;
    await api.entities.Load.delete(id);
    setLoads(prev => prev.filter(l => l.id !== id));
  };

  const handleSave = async (data) => {
    if (editLoad) {
      const updated = await api.entities.Load.update(editLoad.id, data);
      setLoads(prev => prev.map(l => l.id === editLoad.id ? updated : l));
    } else {
      const created = await api.entities.Load.create(data);
      setLoads(prev => [created, ...prev]);
    }
    setShowModal(false);
    setEditLoad(null);
  };

  const handleNotifyDriver = async (load) => {
    await api.functions.invoke('sendNotification', { type: 'load_assigned', entityId: load.id });
    alert(`Email notification sent to driver for Load #${load.load_number}`);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'executive';
  const canWeigh = isAdmin || user?.role === 'driver';

  const SCALE_STATUS_STYLE = {
    pass: 'bg-green-100 text-green-700',
    overweight: 'bg-red-100 text-red-700 animate-pulse',
    reweigh_needed: 'bg-amber-100 text-amber-700',
    not_weighed: 'bg-slate-100 text-slate-500',
  };

  const filtered = loads.filter(l => {
    const matchSearch = !search || l.load_number?.toLowerCase().includes(search.toLowerCase()) ||
      l.origin?.toLowerCase().includes(search.toLowerCase()) ||
      l.destination?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getDriverName = (id) => users.find(u => u.id === id)?.full_name || '—';
  const getVehicle = (id) => vehicles.find(v => v.id === id)?.unit_number || '—';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Load Board</h1>
          <p className="text-slate-500 text-sm">{filtered.length} loads</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditLoad(null); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
            <Plus className="w-4 h-4 mr-2" /> New Load
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search loads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filtered.map(load => (
          <Card key={load.id} className="border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-900 text-lg">#{load.load_number}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[load.status]}`}>
                      {load.status?.replace('_', ' ')}
                    </span>
                    {load.commodity && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{load.commodity}</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />{load.origin} → {load.destination}
                    </span>
                    {load.origin && load.destination && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(load.origin)}&destination=${encodeURIComponent(load.destination)}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold underline"
                      >
                        <Navigation className="w-3 h-3" /> Navigate
                      </a>
                    )}
                    {load.pickup_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />Pickup: {load.pickup_date}</span>}
                    {load.delivery_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />Delivery: {load.delivery_date}</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-1">
                    {load.miles && <span>{load.miles} mi</span>}
                    {load.weight && <span>{load.weight}</span>}
                    {load.scale_weight_lbs && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${SCALE_STATUS_STYLE[load.scale_status] || SCALE_STATUS_STYLE.not_weighed}`}>
                        <Scale className="w-3 h-3" />
                        {load.scale_weight_lbs.toLocaleString()} lbs — {load.scale_status === 'pass' ? 'PASS' : load.scale_status === 'overweight' ? 'OVERWEIGHT' : load.scale_status}
                      </span>
                    )}
                    {load.broker && <span>Broker: {load.broker}</span>}
                    {isAdmin && load.assigned_driver_id && <span>Driver: {getDriverName(load.assigned_driver_id)}</span>}
                    {isAdmin && load.assigned_vehicle_id && <span>Unit: #{getVehicle(load.assigned_vehicle_id)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {load.rate && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-900">${load.rate?.toLocaleString()}</div>
                      {load.miles && <div className="text-xs text-slate-400">${(load.rate / load.miles).toFixed(2)}/mi</div>}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {canWeigh && (
                      <Button size="icon" variant="ghost" title="Weight Scale Report" onClick={() => setScaleLoad(load)}>
                        <Scale className={`w-4 h-4 ${load.scale_status === 'pass' ? 'text-green-500' : load.scale_status === 'overweight' ? 'text-red-500' : 'text-slate-400'}`} />
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        {load.assigned_driver_id && (
                          <Button size="icon" variant="ghost" title="Notify driver" onClick={() => handleNotifyDriver(load)}>
                            <Bell className="w-4 h-4 text-blue-500" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => { setEditLoad(load); setShowModal(true); }}>
                          <Edit className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(load.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No loads found</p>
          </div>
        )}
      </div>

      {scaleLoad && (
        <WeightScaleModal
          load={scaleLoad}
          onClose={() => setScaleLoad(null)}
          onSaved={() => fetchData(user)}
        />
      )}

      {showModal && (
        <LoadModal
          load={editLoad}
          vehicles={vehicles}
          users={users}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditLoad(null); }}
        />
      )}
    </div>
  );
}
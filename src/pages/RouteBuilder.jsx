import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Trash2, MapPin, Truck, User, ArrowLeft, CheckCircle2, GripVertical, Calendar, Upload, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import BulkStopUpload from '@/components/delivery/BulkStopUpload';
import RouteMapView from '@/components/delivery/RouteMapView';

const EMPTY_STOP = {
  recipient_name: '',
  recipient_phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  package_description: '',
  notes: '',
};

export default function RouteBuilder() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Route header
  const [routeName, setRouteName] = useState('');
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [routeNotes, setRouteNotes] = useState('');

  // Stops
  const [stops, setStops] = useState([{ ...EMPTY_STOP, _key: Date.now() }]);

  // Modals
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    Promise.all([
      api.entities.User.list(),
      api.entities.Vehicle.filter({ unit_type: 'truck' }),
    ]).then(([us, vs]) => {
      setUsers(us);
      setVehicles(vs);
      setLoading(false);
    });
  }, []);

  const drivers = users.filter(u => ['driver', 'employee'].includes(u.role));

  const addStop = () => {
    setStops(prev => [...prev, { ...EMPTY_STOP, _key: Date.now() + Math.random() }]);
  };

  const handleBulkImport = (rows) => {
    const newStops = rows.map(row => ({
      ...EMPTY_STOP,
      recipient_name: row.recipient_name || '',
      recipient_phone: row.recipient_phone || row.phone || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      zip: row.zip || '',
      package_description: row.package_description || '',
      notes: row.notes || '',
      _key: row._key || Date.now() + Math.random(),
    }));
    setStops(prev => {
      // Replace blank placeholder if still empty
      const hasBlank = prev.length === 1 && !prev[0].recipient_name && !prev[0].address;
      return hasBlank ? newStops : [...prev, ...newStops];
    });
  };

  const removeStop = (key) => {
    setStops(prev => prev.filter(s => s._key !== key));
  };

  const updateStop = (key, field, value) => {
    setStops(prev => prev.map(s => s._key === key ? { ...s, [field]: value } : s));
  };

  const moveStop = (idx, direction) => {
    const next = [...stops];
    const target = idx + direction;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setStops(next);
  };

  const isValid = routeName && routeDate && stops.length > 0 && stops.every(s => s.recipient_name && s.address);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    const route = await api.entities.DeliveryRoute.create({
      route_name: routeName,
      route_date: routeDate,
      driver_id: driverId || null,
      vehicle_id: vehicleId || null,
      status: 'pending',
      total_stops: stops.length,
      completed_stops: 0,
      notes: routeNotes,
    });
    await Promise.all(
      stops.map((stop, idx) =>
        api.entities.DeliveryStop.create({
          route_id: route.id,
          sequence: idx + 1,
          recipient_name: stop.recipient_name,
          recipient_phone: stop.recipient_phone,
          address: stop.address,
          city: stop.city,
          state: stop.state,
          zip: stop.zip,
          package_description: stop.package_description,
          notes: stop.notes,
          status: 'pending',
        })
      )
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate('/portal/pd-command'), 1500);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (saved) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <CheckCircle2 className="w-16 h-16 text-green-500" />
      <div className="text-xl font-black text-slate-800">Route Created!</div>
      <p className="text-slate-500 text-sm">Redirecting to Command Tower…</p>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/portal/pd-command">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Route Builder</h1>
          <p className="text-slate-500 text-sm">Build a complete delivery route with all stops in one step</p>
        </div>
      </div>

      {/* Route Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-5 bg-amber-500 rounded-full" />
          <h2 className="font-black text-slate-800 text-base">Route Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Route Name *</label>
            <Input
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
              placeholder="e.g. Zone A — Morning Run"
              className="text-base font-semibold"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type="date" value={routeDate} onChange={e => setRouteDate(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
              <User className="inline w-3 h-3 mr-1" />Assign Driver
            </label>
            <select
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">— Unassigned —</option>
              {drivers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
              {users.filter(u => !['driver','employee'].includes(u.role)).map(u => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
              <Truck className="inline w-3 h-3 mr-1" />Assign Truck
            </label>
            <select
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">— No truck yet —</option>
              {vehicles.filter(v => v.status === 'active').map(v => (
                <option key={v.id} value={v.id}>Unit #{v.unit_number} — {v.make} {v.model}</option>
              ))}
              {vehicles.filter(v => v.status !== 'active').map(v => (
                <option key={v.id} value={v.id} disabled>Unit #{v.unit_number} — ({v.status})</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Route Notes</label>
            <Input value={routeNotes} onChange={e => setRouteNotes(e.target.value)} placeholder="Priority instructions, time windows, etc." />
          </div>
        </div>
      </div>

      {/* Stops */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 bg-blue-500 rounded-full" />
            <h2 className="font-black text-slate-800 text-base">Delivery Stops</h2>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{stops.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBulkUpload(true)} className="text-xs gap-1">
              <Upload className="w-3.5 h-3.5" /> Bulk Upload
            </Button>
            {stops.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => setShowMap(true)} className="text-xs gap-1">
                <Map className="w-3.5 h-3.5" /> View Map
              </Button>
            )}
            <Button onClick={addStop} size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Stop
            </Button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {stops.map((stop, idx) => (
            <div key={stop._key} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveStop(idx, -1)} disabled={idx === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-20 text-xs leading-none">▲</button>
                  <button onClick={() => moveStop(idx, 1)} disabled={idx === stops.length - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-20 text-xs leading-none">▼</button>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-black flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 font-semibold text-slate-700 text-sm truncate">
                  {stop.recipient_name || <span className="text-slate-400 font-normal">Stop #{idx + 1}</span>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeStop(stop._key)} disabled={stops.length === 1}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ml-11">
                <Input
                  placeholder="Recipient Name *"
                  value={stop.recipient_name}
                  onChange={e => updateStop(stop._key, 'recipient_name', e.target.value)}
                  className="col-span-2 sm:col-span-2"
                />
                <Input
                  placeholder="Phone"
                  value={stop.recipient_phone}
                  onChange={e => updateStop(stop._key, 'recipient_phone', e.target.value)}
                />
                <Input
                  placeholder="Address *"
                  value={stop.address}
                  onChange={e => updateStop(stop._key, 'address', e.target.value)}
                  className="col-span-2 sm:col-span-3"
                />
                <Input
                  placeholder="City"
                  value={stop.city}
                  onChange={e => updateStop(stop._key, 'city', e.target.value)}
                />
                <Input
                  placeholder="State"
                  value={stop.state}
                  onChange={e => updateStop(stop._key, 'state', e.target.value)}
                />
                <Input
                  placeholder="ZIP"
                  value={stop.zip}
                  onChange={e => updateStop(stop._key, 'zip', e.target.value)}
                />
                <Input
                  placeholder="Package / freight description"
                  value={stop.package_description}
                  onChange={e => updateStop(stop._key, 'package_description', e.target.value)}
                  className="col-span-2 sm:col-span-2"
                />
                <Input
                  placeholder="Access notes / gate code"
                  value={stop.notes}
                  onChange={e => updateStop(stop._key, 'notes', e.target.value)}
                  className="col-span-2 sm:col-span-3"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            onClick={addStop}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm font-semibold text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Another Stop
          </button>
        </div>
      </div>

      {/* Validation hint */}
      {!isValid && stops.some(s => !s.recipient_name || !s.address) && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
          <MapPin className="w-3 h-3" /> All stops require a recipient name and address.
        </p>
      )}

      {showBulkUpload && (
        <BulkStopUpload onImport={handleBulkImport} onClose={() => setShowBulkUpload(false)} />
      )}

      {showMap && (
        <RouteMapView
          route={{ route_name: routeName || 'New Route', route_date: routeDate }}
          stops={stops}
          driver={users.find(u => u.id === driverId) || null}
          onClose={() => setShowMap(false)}
        />
      )}

      {/* Save */}
      <div className="flex gap-3 pb-8">
        <Link to="/portal/pd-command" className="flex-1">
          <Button variant="outline" className="w-full">Cancel</Button>
        </Link>
        <Button
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-base h-11"
          onClick={handleSave}
          disabled={!isValid || saving}
        >
          {saving ? 'Creating Route…' : `Create Route with ${stops.length} Stop${stops.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}
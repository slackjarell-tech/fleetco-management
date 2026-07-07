import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { X, Plus, MapPin, CheckCircle2, Clock, AlertTriangle, Trash2, GripVertical, Camera, Navigation, Phone, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StopPODModal from './StopPODModal';
import RouteMapView from './RouteMapView';

const STATUS_STYLES = {
  pending: 'bg-slate-100 text-slate-600',
  delivered: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  attempted: 'bg-yellow-100 text-yellow-700',
};

const EMPTY_STOP = { recipient_name: '', recipient_phone: '', address: '', city: '', state: '', zip: '', package_description: '', notes: '', sequence: 1 };

export default function RouteStopsPanel({ route, stops: initialStops, driver, onClose, onStopsChanged }) {
  const [stops, setStops] = useState([...initialStops].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)));
  const [adding, setAdding] = useState(false);
  const [newStop, setNewStop] = useState({ ...EMPTY_STOP, sequence: initialStops.length + 1 });
  const [podStop, setPodStop] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const setNS = (k, v) => setNewStop(p => ({ ...p, [k]: v }));

  const handleAddStop = async () => {
    if (!newStop.recipient_name || !newStop.address) return;
    setSaving(true);
    const created = await api.entities.DeliveryStop.create({ ...newStop, route_id: route.id });
    setStops(prev => [...prev, created]);
    setNewStop({ ...EMPTY_STOP, sequence: stops.length + 2 });
    setAdding(false);
    setSaving(false);
    onStopsChanged?.();
  };

  const handleDeleteStop = async (id) => {
    if (!confirm('Remove this stop?')) return;
    await api.entities.DeliveryStop.delete(id);
    setStops(prev => prev.filter(s => s.id !== id));
    onStopsChanged?.();
  };

  const handlePODSaved = async (stopId, podData) => {
    const updated = await api.entities.DeliveryStop.update(stopId, {
      ...podData,
      delivered_at: new Date().toISOString(),
    });
    setStops(prev => prev.map(s => s.id === stopId ? updated : s));
    setPodStop(null);
    onStopsChanged?.();
  };

  const completed = stops.filter(s => s.status === 'delivered').length;
  const failed = stops.filter(s => s.status === 'failed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl">
          <div>
            <div className="text-white font-black text-base">{route.route_name}</div>
            <div className="text-slate-400 text-xs mt-0.5">
              {route.route_date} · {driver?.full_name || 'Unassigned'} · {stops.length} stops · {completed} ✓ {failed > 0 && `· ${failed} ✗`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowMap(true)} className="text-slate-400 hover:text-amber-400 text-xs gap-1">
              <Map className="w-3.5 h-3.5" /> Map
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {stops.length > 0 && (
          <div className="px-6 py-3 bg-slate-800">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{completed + failed} of {stops.length} completed</span>
              <span className="text-amber-400 font-bold">{Math.round(((completed + failed) / stops.length) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${Math.round(((completed + failed) / stops.length) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Stops List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {stops.length === 0 && !adding && (
            <div className="text-center py-10 text-slate-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No stops yet. Add your first stop below.</p>
            </div>
          )}

          {stops.map((stop, idx) => {
            const isDone = stop.status === 'delivered' || stop.status === 'failed';
            const fullAddress = [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ');
            return (
              <div key={stop.id} className={`rounded-xl border p-4 transition-all ${isDone ? 'border-slate-100 bg-slate-50 opacity-75' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${isDone ? 'bg-slate-200 text-slate-400' : 'bg-amber-100 text-amber-700'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{stop.recipient_name}</span>
                      {stop.recipient_phone && <span className="text-xs text-slate-400">{stop.recipient_phone}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ml-auto ${STATUS_STYLES[stop.status] || STATUS_STYLES.pending}`}>
                        {stop.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{fullAddress}</div>
                    {stop.package_description && <div className="text-xs text-slate-400 mt-0.5">📦 {stop.package_description}</div>}
                    {stop.notes && <div className="text-xs bg-amber-50 text-amber-700 rounded px-2 py-1 mt-1">📋 {stop.notes}</div>}
                    {stop.pod_notes && <div className="text-xs text-slate-500 mt-1 italic">POD: {stop.pod_notes}</div>}
                    {stop.pod_photo_url && <img src={stop.pod_photo_url} alt="POD" className="mt-2 rounded-lg max-h-24 object-cover border border-slate-200" />}
                    {stop.delivered_at && <div className="text-xs text-green-600 mt-1">✓ {new Date(stop.delivered_at).toLocaleTimeString()}</div>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-xs"><Navigation className="w-3 h-3 mr-1" /> Nav</Button>
                  </a>
                  {!isDone && (
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs" onClick={() => setPodStop(stop)}>
                      <Camera className="w-3 h-3 mr-1" /> Record POD
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => handleDeleteStop(stop.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Add Stop Form */}
          {adding && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
              <div className="text-xs font-black text-amber-700 uppercase">New Stop</div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Recipient Name *" value={newStop.recipient_name} onChange={e => setNS('recipient_name', e.target.value)} className="col-span-2" />
                <Input placeholder="Phone" value={newStop.recipient_phone} onChange={e => setNS('recipient_phone', e.target.value)} />
                <Input placeholder="Sequence #" type="number" value={newStop.sequence} onChange={e => setNS('sequence', parseInt(e.target.value))} />
                <Input placeholder="Address *" value={newStop.address} onChange={e => setNS('address', e.target.value)} className="col-span-2" />
                <Input placeholder="City" value={newStop.city} onChange={e => setNS('city', e.target.value)} />
                <Input placeholder="State" value={newStop.state} onChange={e => setNS('state', e.target.value)} />
                <Input placeholder="ZIP" value={newStop.zip} onChange={e => setNS('zip', e.target.value)} />
                <Input placeholder="Package desc." value={newStop.package_description} onChange={e => setNS('package_description', e.target.value)} />
                <Input placeholder="Gate code / access notes" value={newStop.notes} onChange={e => setNS('notes', e.target.value)} className="col-span-2" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" onClick={handleAddStop} disabled={saving || !newStop.recipient_name || !newStop.address}>
                  {saving ? 'Adding…' : 'Add Stop'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Stop
          </Button>
        </div>
      </div>

      {showMap && (
        <RouteMapView
          route={route}
          stops={stops}
          driver={driver}
          onClose={() => setShowMap(false)}
        />
      )}

      {podStop && (
        <StopPODModal
          stop={podStop}
          onSave={(data) => handlePODSaved(podStop.id, data)}
          onClose={() => setPodStop(null)}
        />
      )}
    </div>
  );
}
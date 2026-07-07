import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, MapPin, List, Phone, User, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import VendorModal from '@/components/vendors/VendorModal';
import VendorCard from '@/components/vendors/VendorCard';

// Fix default leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_ICON_COLOR = {
  'Repair Shop': '#3b82f6',
  'Parts Supplier': '#8b5cf6',
  'Tire Shop': '#f59e0b',
  'Towing': '#ef4444',
  'Fuel': '#10b981',
  'Body Shop': '#6366f1',
  'DEF/Emissions': '#14b8a6',
  'Other': '#94a3b8',
};

function colorIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:rotate(-45deg);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 10, { duration: 1.2 }); }, [position]);
  return null;
}

const TYPE_FILTERS = ['All', 'Repair Shop', 'Parts Supplier', 'Tire Shop', 'Towing', 'Fuel', 'Body Shop', 'DEF/Emissions', 'Weigh Scale'];

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('split'); // 'list' | 'map' | 'split'

  const loadData = async () => {
    const v = await api.entities.Vendor.list('-created_date');
    setVendors(v);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (data) => {
    if (editVendor) {
      const updated = await api.entities.Vendor.update(editVendor.id, data);
      setVendors(prev => prev.map(v => v.id === editVendor.id ? updated : v));
    } else {
      const created = await api.entities.Vendor.create(data);
      setVendors(prev => [created, ...prev]);
    }
    setShowModal(false);
    setEditVendor(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    await api.entities.Vendor.delete(id);
    setVendors(prev => prev.filter(v => v.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = useMemo(() => vendors.filter(v => {
    const matchSearch = !search ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.city?.toLowerCase().includes(search.toLowerCase()) ||
      v.state?.toLowerCase().includes(search.toLowerCase()) ||
      v.poc_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || v.type === typeFilter;
    return matchSearch && matchType;
  }), [vendors, search, typeFilter]);

  const mappable = filtered.filter(v => v.lat && v.lng);
  const flyTarget = selected?.lat && selected?.lng ? [selected.lat, selected.lng] : null;

  const counts = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'active').length,
    mapped: vendors.filter(v => v.lat && v.lng).length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors & Contracts</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {counts.total} vendors · {counts.active} active · {counts.mapped} on map
          </p>
        </div>
        <Button onClick={() => { setEditVendor(null); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Vendor
        </Button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search name, city, state, POC..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('list')} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${view === 'list' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <List className="w-4 h-4" /> List
          </button>
          <button onClick={() => setView('split')} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${view === 'split' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Navigation className="w-4 h-4" /> Split
          </button>
          <button onClick={() => setView('map')} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${view === 'map' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <MapPin className="w-4 h-4" /> Map
          </button>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        {TYPE_FILTERS.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${typeFilter === t ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0" style={{ height: '600px' }}>
        {/* List panel */}
        {(view === 'list' || view === 'split') && (
          <div className={`${view === 'split' ? 'w-80 flex-shrink-0' : 'w-full'} flex flex-col`}>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filtered.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No vendors found</p>
                  <p className="text-xs mt-1">Add your first vendor or shop</p>
                </div>
              )}
              {filtered.map(v => (
                <VendorCard
                  key={v.id}
                  vendor={v}
                  selected={selected?.id === v.id}
                  onSelect={setSelected}
                  onEdit={v => { setEditVendor(v); setShowModal(true); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Map panel */}
        {(view === 'map' || view === 'split') && (
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm min-w-0">
            {mappable.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <MapPin className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No vendors with coordinates yet</p>
                <p className="text-xs mt-1">Add a vendor and use "Auto-detect coordinates" to pin them on the map</p>
              </div>
            ) : (
              <MapContainer
                center={[39.5, -98.35]}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {flyTarget && <FlyTo position={flyTarget} />}
                {mappable.map(v => (
                  <Marker
                    key={v.id}
                    position={[v.lat, v.lng]}
                    icon={colorIcon(TYPE_ICON_COLOR[v.type] || '#94a3b8')}
                    eventHandlers={{ click: () => setSelected(v) }}
                  >
                    <Popup>
                      <div className="min-w-[180px]">
                        <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                        <div className="text-xs text-slate-500 mb-2">{v.type}</div>
                        {v.poc_name && <div className="text-xs flex items-center gap-1"><User className="w-3 h-3" />{v.poc_name}</div>}
                        {v.phone && <div className="text-xs flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /><a href={`tel:${v.phone}`} className="text-blue-600">{v.phone}</a></div>}
                        {(v.city || v.state) && <div className="text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{[v.city, v.state].filter(Boolean).join(', ')}</div>}
                        {v.contract_number && <div className="text-xs text-amber-700 font-medium mt-1">Contract: {v.contract_number}</div>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <VendorModal
          vendor={editVendor}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditVendor(null); }}
        />
      )}
    </div>
  );
}
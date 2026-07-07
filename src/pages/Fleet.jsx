import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, Edit, Trash2, Truck, FolderOpen, History, Container, BookOpen } from 'lucide-react';
import RepairManualsPanel from '@/components/fleet/RepairManualsPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import VehicleModal from '@/components/fleet/VehicleModal';
import VehicleDocuments from '@/components/fleet/VehicleDocuments';
import VehicleHistory from '@/components/fleet/VehicleHistory';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-500',
  in_shop: 'bg-red-100 text-red-600',
  waiting_for_parts: 'bg-orange-100 text-orange-700',
  out_of_service: 'bg-red-200 text-red-800',
  pending_inspection: 'bg-yellow-100 text-yellow-700',
  leased_out: 'bg-blue-100 text-blue-700',
  retired: 'bg-purple-100 text-purple-700',
  sold: 'bg-slate-200 text-slate-600',
};

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  in_shop: 'In Shop',
  waiting_for_parts: 'Waiting for Parts',
  out_of_service: 'Out of Service',
  pending_inspection: 'Pending Inspection',
  leased_out: 'Leased Out',
  retired: 'Retired',
  sold: 'Sold',
};

export default function Fleet() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('vehicles');
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [defaultUnitType, setDefaultUnitType] = useState('truck');
  const [docsVehicle, setDocsVehicle] = useState(null);
  const [historyVehicle, setHistoryVehicle] = useState(null);
  const [manualsVehicle, setManualsVehicle] = useState(null);

  useEffect(() => {
    api.auth.me().then(async (u) => {
      setUser(u);
      const [vs, us] = await Promise.all([
        api.entities.Vehicle.list('-created_date'),
        api.entities.User.list(),
      ]);
      const filtered = u?.role === 'customer' ? vs.filter(v => v.assigned_customer_id === u.id) :
                       u?.role === 'driver' ? vs.filter(v => v.assigned_driver_id === u.id) : vs;
      setVehicles(filtered);
      setUsers(us);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return;
    await api.entities.Vehicle.delete(id);
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const handleSave = async (data) => {
    if (editVehicle) {
      const updated = await api.entities.Vehicle.update(editVehicle.id, data);
      setVehicles(prev => prev.map(v => v.id === editVehicle.id ? updated : v));
    } else {
      const created = await api.entities.Vehicle.create(data);
      setVehicles(prev => [created, ...prev]);
    }
    setShowModal(false);
    setEditVehicle(null);
  };

  const isAdmin = ['admin', 'tech', 'executive'].includes(user?.role);
  const canViewManuals = ['admin', 'tech', 'employee'].includes(user?.role);
  const getName = (id) => users.find(u => u.id === id)?.full_name || '—';

  const powerUnits = vehicles.filter(v => !v.unit_type || v.unit_type === 'truck');
  const trailers = vehicles.filter(v => v.unit_type === 'trailer');
  const currentList = activeTab === 'vehicles' ? powerUnits : trailers;

  const filtered = currentList.filter(v =>
    !search || v.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
    v.make?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.vin?.toLowerCase().includes(search.toLowerCase()) ||
    v.trailer_type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet</h1>
          <p className="text-slate-500 text-sm">{powerUnits.length} vehicles · {trailers.length} trailers</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => { setEditVehicle(null); setDefaultUnitType('trailer'); setShowModal(true); }} variant="outline" className="font-bold">
              <Plus className="w-4 h-4 mr-1" /> Add Trailer
            </Button>
            <Button onClick={() => { setEditVehicle(null); setDefaultUnitType('truck'); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              <Plus className="w-4 h-4 mr-1" /> Add Vehicle
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'vehicles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Truck className="w-4 h-4" /> Vehicles
          <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-bold">{powerUnits.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('trailers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'trailers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Container className="w-4 h-4" /> Trailers
          <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-bold">{trailers.length}</span>
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder={activeTab === 'vehicles' ? 'Search by unit #, make, model, VIN...' : 'Search by unit #, type, VIN...'} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(v => (
          <Card key={v.id} className="border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${v.unit_type === 'trailer' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                    {v.unit_type === 'trailer'
                      ? <Container className="w-5 h-5 text-blue-600" />
                      : <Truck className="w-5 h-5 text-amber-600" />
                    }
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg">Unit #{v.unit_number}</div>
                    <div className="text-sm text-slate-500">{[v.year, v.make, v.model].filter(Boolean).join(' ')}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[v.status] || 'bg-slate-100 text-slate-500'}`}>
                  {STATUS_LABELS[v.status] || v.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                {v.vin && <div className="flex justify-between"><span className="text-slate-400">VIN</span><span className="text-slate-700 font-mono text-xs">{v.vin}</span></div>}
                {v.license_plate && <div className="flex justify-between"><span className="text-slate-400">Plate</span><span className="text-slate-700">{v.license_plate}</span></div>}
                {v.unit_type === 'trailer' && v.trailer_type && <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="text-slate-700">{v.trailer_type}</span></div>}
                {v.unit_type === 'trailer' && v.trailer_length && <div className="flex justify-between"><span className="text-slate-400">Length</span><span className="text-slate-700">{v.trailer_length} ft</span></div>}
                {v.odometer && <div className="flex justify-between"><span className="text-slate-400">Odometer</span><span className="text-slate-700">{v.odometer?.toLocaleString()} mi</span></div>}
                {v.purchase_price && <div className="flex justify-between"><span className="text-slate-400">Purchase</span><span className="text-slate-700 font-semibold">${v.purchase_price?.toLocaleString()}</span></div>}
                {v.purchase_price && (() => {
                  const age = v.purchase_date
                    ? (Date.now() - new Date(v.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
                    : v.year ? new Date().getFullYear() - v.year : null;
                  if (age === null) return null;
                  let val = v.purchase_price;
                  for (let y = 0; y < age; y++) {
                    val *= y === 0 ? (v.unit_type === 'trailer' ? 0.85 : 0.75) : y < 5 ? (v.unit_type === 'trailer' ? 0.88 : 0.85) : (v.unit_type === 'trailer' ? 0.91 : 0.90);
                    val = Math.max(val, v.purchase_price * 0.05);
                  }
                  val = Math.round(Math.max(val, v.purchase_price * 0.05));
                  const pct = Math.round((val / v.purchase_price) * 100);
                  return (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Est. Value</span>
                      <span className="text-amber-600 font-bold">${val.toLocaleString()} <span className="text-xs font-normal text-slate-400">({pct}%)</span></span>
                    </div>
                  );
                })()}
                {isAdmin && v.assigned_driver_id && <div className="flex justify-between"><span className="text-slate-400">Driver</span><span className="text-slate-700">{getName(v.assigned_driver_id)}</span></div>}
                {isAdmin && v.assigned_customer_id && <div className="flex justify-between"><span className="text-slate-400">Customer</span><span className="text-slate-700">{getName(v.assigned_customer_id)}</span></div>}
              </div>

              {v.notes && <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">{v.notes}</p>}

              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setHistoryVehicle(v)}>
                  <History className="w-3.5 h-3.5 mr-1" /> History
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setDocsVehicle(v)}>
                  <FolderOpen className="w-3.5 h-3.5 mr-1" /> Docs
                </Button>
                {canViewManuals && (
                  <Button size="sm" variant="outline" className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => setManualsVehicle(v)}>
                    <BookOpen className="w-3.5 h-3.5 mr-1" /> Manuals
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { setEditVehicle(v); setDefaultUnitType(v.unit_type || 'truck'); setShowModal(true); }}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            {activeTab === 'trailers' ? <Container className="w-12 h-12 mx-auto mb-3 opacity-30" /> : <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />}
            <p>No {activeTab === 'trailers' ? 'trailers' : 'vehicles'} found</p>
          </div>
        )}
      </div>

      {historyVehicle && (
        <VehicleHistory vehicle={historyVehicle} onClose={() => setHistoryVehicle(null)} />
      )}

      {manualsVehicle && (
        <RepairManualsPanel vehicle={manualsVehicle} onClose={() => setManualsVehicle(null)} />
      )}

      {docsVehicle && (
        <VehicleDocuments vehicle={docsVehicle} onClose={() => setDocsVehicle(null)} />
      )}

      {showModal && (
        <VehicleModal
          vehicle={editVehicle || { unit_type: defaultUnitType }}
          users={users}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditVehicle(null); }}
        />
      )}
    </div>
  );
}
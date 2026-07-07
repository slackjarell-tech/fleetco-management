import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Search, Edit, Trash2, Fuel, TrendingDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FuelLogModal from '@/components/fleet/FuelLogModal';
import IFTAReport from '@/components/fuel/IFTAReport';

export default function FuelAudits() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    api.auth.me().then(async (u) => {
      setUser(u);
      await fetchData(u);
    });
  }, []);

  const fetchData = async (u) => {
    setLoading(true);
    const [ls, vs, us] = await Promise.all([
      api.entities.FuelLog.list('-date', 500),
      api.entities.Vehicle.list(),
      api.entities.User.list(),
    ]);
    let filtered = ls;
    if (u?.role === 'driver') filtered = filtered.filter(l => l.driver_id === u.id);
    if (u?.customer_id) {
      const customerVehicleIds = vs.filter(v => v.assigned_customer_id === u.customer_id).map(v => v.id);
      filtered = filtered.filter(l => customerVehicleIds.includes(l.vehicle_id));
    }
    setLogs(filtered);
    setVehicles(vs);
    setUsers(us);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this fuel log?')) return;
    await api.entities.FuelLog.delete(id);
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleSave = async (data) => {
    if (editLog) {
      const updated = await api.entities.FuelLog.update(editLog.id, data);
      setLogs(prev => prev.map(l => l.id === editLog.id ? updated : l));
    } else {
      const created = await api.entities.FuelLog.create(data);
      setLogs(prev => [created, ...prev]);
    }
    setShowModal(false);
    setEditLog(null);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'executive';
  const isDriver = user?.role === 'driver';
  const canAdd = isAdmin || isDriver;

  const getVehicle = (id) => vehicles.find(v => v.id === id);
  const getDriver = (id) => users.find(u => u.id === id)?.full_name || '—';

  const filtered = logs.filter(l => {
    const v = getVehicle(l.vehicle_id);
    const driverName = getDriver(l.driver_id).toLowerCase();
    const matchSearch = !search ||
      v?.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
      l.location?.toLowerCase().includes(search.toLowerCase()) ||
      driverName.includes(search.toLowerCase());
    const matchVehicle = vehicleFilter === 'all' || l.vehicle_id === vehicleFilter;
    const matchDriver = driverFilter === 'all' || l.driver_id === driverFilter;
    return matchSearch && matchVehicle && matchDriver;
  });

  const totalSpend = filtered.reduce((s, l) => s + (l.total_cost || 0), 0);
  const totalGallons = filtered.reduce((s, l) => s + (l.gallons || 0), 0);
  const avgPPG = totalGallons > 0 ? totalSpend / totalGallons : 0;

  // MPG per vehicle
  const mpgByVehicle = vehicles.map(v => {
    const vLogs = logs.filter(l => l.vehicle_id === v.id).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (vLogs.length < 2) return null;
    const miles = (vLogs[vLogs.length - 1].odometer_reading || 0) - (vLogs[0].odometer_reading || 0);
    const gallons = vLogs.slice(1).reduce((s, l) => s + (l.gallons || 0), 0);
    const mpg = gallons > 0 ? miles / gallons : 0;
    return { vehicle: v, mpg: mpg.toFixed(1), logs: vLogs.length };
  }).filter(Boolean);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fuel Audits & IFTA</h1>
          <p className="text-slate-500 text-sm">{filtered.length} fuel logs</p>
        </div>
        {canAdd && activeTab === 'logs' && (
          <Button onClick={() => { setEditLog(null); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
            <Plus className="w-4 h-4 mr-2" /> Log Fuel
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Fuel className="w-4 h-4" /> Fuel Logs
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('ifta')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ifta' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Globe className="w-4 h-4" /> IFTA Reporting
          </button>
        )}
      </div>

      {activeTab === 'ifta' && isAdmin && (
        <IFTAReport logs={logs} vehicles={vehicles} />
      )}

      {activeTab === 'logs' && <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-xs text-purple-600 font-medium mb-1">Total Fuel Spend</div>
            <div className="text-2xl font-bold text-purple-700">${totalSpend.toLocaleString('en-US', {minimumFractionDigits:2})}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-xs text-blue-600 font-medium mb-1">Total Gallons</div>
            <div className="text-2xl font-bold text-blue-700">{totalGallons.toFixed(1)} gal</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="text-xs text-amber-600 font-medium mb-1">Avg Price/Gallon</div>
            <div className="text-2xl font-bold text-amber-700">${avgPPG.toFixed(3)}</div>
          </CardContent>
        </Card>
      </div>

      {isAdmin && mpgByVehicle.length > 0 && (
        <Card className="mb-6 border-slate-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="w-4 h-4 text-amber-500" />MPG by Vehicle</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {mpgByVehicle.map(({ vehicle, mpg, logs: logCount }) => (
                <div key={vehicle.id} className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="font-bold text-slate-900 text-lg">{mpg}</div>
                  <div className="text-xs text-slate-500">MPG</div>
                  <div className="text-xs font-medium text-slate-700 mt-1">Unit #{vehicle.unit_number}</div>
                  <div className="text-xs text-slate-400">{logCount} logs</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by unit #, driver, or location..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {isAdmin && (
          <>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Vehicles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {vehicles.map(v => <SelectItem key={v.id} value={v.id}>Unit #{v.unit_number}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Drivers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {users.filter(u => u.role === 'driver').map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Vehicle</th>
              {isAdmin && <th className="text-left px-4 py-3 font-semibold text-slate-600">Driver</th>}
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Location</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Gallons</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">PPG</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Odometer</th>
              {canAdd && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => {
              const v = getVehicle(log.vehicle_id);
              return (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{log.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">Unit #{v?.unit_number || '—'}</td>
                  {isAdmin && <td className="px-4 py-3 text-slate-600">{getDriver(log.driver_id)}</td>}
                  <td className="px-4 py-3 text-slate-600">{log.location || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{log.gallons?.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">${log.price_per_gallon?.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">${log.total_cost?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{log.odometer_reading?.toLocaleString() || '—'}</td>
                  {canAdd && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditLog(log); setShowModal(true); }}>
                          <Edit className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                        {isAdmin && (
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(log.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Fuel className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No fuel logs found</p>
          </div>
        )}
      </div>

      </>}

      {showModal && (
        <FuelLogModal
          log={editLog}
          vehicles={vehicles}
          users={users}
          currentUser={user}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditLog(null); }}
        />
      )}
    </div>
  );
}
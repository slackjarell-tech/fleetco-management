import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/api/apiClient';
import { Search, Shield, Users, Truck, UserCheck, UserPlus } from 'lucide-react';
import DriverCard from '@/components/drivers/DriverCard';
import DriverDetailPanel from '@/components/drivers/DriverDetailPanel';
import DriverDocuments from '@/components/drivers/DriverDocuments';
import CreateDriverModal from '@/components/team/CreateDriverModal';
import ScreeningTab from '@/components/drivers/ScreeningTab';
import { canManageCustomerTeam } from '@/lib/customerRoles';

export default function Drivers() {
  const [user, setUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loads, setLoads] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [docsDriver, setDocsDriver] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('drivers');

  const reloadDrivers = useCallback(async () => {
    const [u, users] = await Promise.all([
      api.auth.me().catch(() => null),
      api.entities.User.list(),
    ]);
    let driverList = users.filter(x => x.role === 'driver');
    if (u?.customer_id) driverList = driverList.filter(d => d.customer_id === u.customer_id);
    setDrivers(driverList);
    return driverList;
  }, []);

  useEffect(() => {
    Promise.all([
      api.auth.me().catch(() => null),
      api.entities.User.list(),
      api.entities.Vehicle.list('-created_date', 200),
      api.entities.FuelLog.list('-date', 500),
      api.entities.Load.list('-created_date', 500),
      api.entities.WorkOrder.list('-created_date', 500),
      api.entities.Inspection.list('-inspection_date', 500),
    ]).then(([u, users, vehs, fuel, lds, wos, insp]) => {
      setUser(u);
      let driverList = users.filter(u => u.role === 'driver');
      if (u?.customer_id) driverList = driverList.filter(d => d.customer_id === u.customer_id);
      setDrivers(driverList);
      setVehicles(vehs);
      setFuelLogs(fuel);
      setLoads(lds);
      setWorkOrders(wos);
      setInspections(insp);
      setLoading(false);
    });
  }, []);

  const vehiclesByDriver = useMemo(() => {
    const map = {};
    vehicles.forEach(v => {
      if (v.assigned_driver_id) {
        if (!map[v.assigned_driver_id]) map[v.assigned_driver_id] = [];
        map[v.assigned_driver_id].push(v);
      }
    });
    return map;
  }, [vehicles]);

  // Build per-driver stats
  const driverStats = useMemo(() => {
    const stats = {};
    drivers.forEach(d => {
      const driverVehicleIds = (vehiclesByDriver[d.id] || []).map(v => v.id);
      const driverLoads = loads.filter(l => l.assigned_driver_id === d.id);
      const driverFuel = fuelLogs.filter(f => f.driver_id === d.id);
      const driverWOs = workOrders.filter(w => driverVehicleIds.includes(w.vehicle_id));
      const driverInsp = inspections.filter(i => i.vehicle_id && driverVehicleIds.includes(i.vehicle_id));

      stats[d.id] = {
        loads: driverLoads.filter(l => l.status === 'delivered').length,
        revenue: driverLoads.filter(l => l.status === 'delivered').reduce((s, l) => s + (l.rate || 0), 0),
        fuelSpend: driverFuel.reduce((s, f) => s + (f.total_cost || 0), 0),
        gallons: driverFuel.reduce((s, f) => s + (f.gallons || 0), 0),
        fuelLogs: driverFuel.length,
        workOrders: driverWOs.length,
        inspections: driverInsp.length,
        // per-driver data for panel
        _loads: driverLoads,
        _fuel: driverFuel,
        _workOrders: driverWOs,
        _inspections: driverInsp,
      };
    });
    return stats;
  }, [drivers, loads, fuelLogs, workOrders, inspections, vehiclesByDriver]);

  const filtered = useMemo(() =>
    drivers.filter(d =>
      !search ||
      (d.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.email || '').toLowerCase().includes(search.toLowerCase())
    ), [drivers, search]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const assigned = Object.keys(vehiclesByDriver).length;
  const canAddDriver = user && (canManageCustomerTeam(user.role) || ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(user.role));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Driver Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Contact details, documents, assignments, performance & screening</p>
        </div>
        {canAddDriver && activeTab === 'drivers' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-4 py-2.5 rounded-lg text-sm"
          >
            <UserPlus className="w-4 h-4" /> Add Driver
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[{ id: 'drivers', label: 'Drivers' }, { id: 'screening', label: '🛡 Background & MVR' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'screening' && <ScreeningTab drivers={drivers} />}

      {activeTab === 'drivers' && <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Drivers', value: drivers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Assigned', value: assigned, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Unassigned', value: drivers.length - assigned, icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`${s.bg} p-2.5 rounded-lg hidden sm:flex`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Driver Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(driver => (
          <DriverCard
            key={driver.id}
            driver={driver}
            assignedVehicles={vehiclesByDriver[driver.id] || []}
            stats={driverStats[driver.id] || { loads: 0, fuelSpend: 0, gallons: 0, fuelLogs: 0, workOrders: 0, inspections: 0, revenue: 0 }}
            onClick={() => setSelectedDriver(driver)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-14 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
            No drivers found. Invite drivers from Team & Access.
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedDriver && (() => {
        const s = driverStats[selectedDriver.id] || {};
        return (
          <DriverDetailPanel
            driver={selectedDriver}
            assignedVehicles={vehiclesByDriver[selectedDriver.id] || []}
            stats={s}
            fuelLogs={s._fuel || []}
            loads={s._loads || []}
            workOrders={s._workOrders || []}
            inspections={s._inspections || []}
            onClose={() => setSelectedDriver(null)}
            onOpenDocuments={() => setDocsDriver(selectedDriver)}
          />
        );
      })()}

      {docsDriver && (
        <DriverDocuments
          driver={docsDriver}
          customerId={user?.customer_id}
          onClose={() => setDocsDriver(null)}
        />
      )}

      {showCreateModal && (
        <CreateDriverModal
          currentUser={user}
          onClose={() => setShowCreateModal(false)}
          onCreated={async () => {
            await reloadDrivers();
            setShowCreateModal(false);
          }}
        />
      )}
      </>}
    </div>
  );
}
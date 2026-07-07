import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import DriverDashboard from '@/components/dashboard/DriverDashboard';
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      const u = await api.auth.me().catch(() => null);
      setUser(u);

      const role = u?.role || 'customer';

      if (role === 'executive') {
        const [loads, invoices, fuel, vehicles, workOrders, customers] = await Promise.all([
          api.entities.Load.list('-created_date', 200),
          api.entities.Invoice.list('-created_date', 200),
          api.entities.FuelLog.list('-created_date', 200),
          api.entities.Vehicle.list('-created_date', 200),
          api.entities.WorkOrder.list('-created_date', 200),
          api.entities.Customer.list('-created_date', 200),
        ]);
        setData({ loads, invoices, fuel, vehicles, workOrders, customers });
      } else if (role === 'driver') {
        const [loads, fuel] = await Promise.all([
          api.entities.Load.filter({ assigned_driver_id: u.id }),
          api.entities.FuelLog.filter({ driver_id: u.id }),
        ]);
        setData({ loads, fuel, invoices: [], vehicles: [], workOrders: [], customers: [] });
      } else if (role === 'employee') {
        const [customers, invoices] = await Promise.all([
          api.entities.Customer.filter({ assigned_employee_id: u.id }),
          api.entities.Invoice.list('-created_date', 100),
        ]);
        setData({ customers, invoices, loads: [], fuel: [], vehicles: [], workOrders: [] });
      } else {
        // customer role
        const [invoices, vehicles] = await Promise.all([
          api.entities.Invoice.list('-created_date', 100),
          api.entities.Vehicle.list('-created_date', 100),
        ]);
        setData({ invoices, vehicles, loads: [], fuel: [], workOrders: [], customers: [] });
      }

      setLoading(false);
    };

    load().catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900 min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-slate-400 text-sm">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900 min-h-screen">
        <div className="text-center text-red-400">
          <div className="text-lg font-bold mb-2">Failed to load dashboard</div>
          <div className="text-sm text-slate-400">{error}</div>
        </div>
      </div>
    );
  }

  const role = user?.role || 'customer';

  if (role === 'executive') return <AdminDashboard data={data} />;
  if (role === 'driver') return <DriverDashboard user={user} data={data} />;
  if (role === 'employee') return <EmployeeDashboard user={user} data={data} />;
  return <CustomerDashboard user={user} data={data} />;
}
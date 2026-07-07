import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/apiClient';
import DriverDashboard from '@/components/dashboard/DriverDashboard';

export default function DriverMobileHome() {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.entities.Load.filter({ assigned_driver_id: user.id }),
      api.entities.FuelLog.filter({ driver_id: user.id }),
    ]).then(([loads, fuel]) => {
      setData({ loads, fuel, invoices: [], vehicles: [], workOrders: [], customers: [] });
    });
  }, [user?.id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <DriverDashboard user={user} data={data} />;
}

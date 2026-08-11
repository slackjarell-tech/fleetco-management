import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/apiClient';
import DriverDashboard from '@/components/dashboard/DriverDashboard';

export default function DriverMobileHome() {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  const [delivery, setDelivery] = useState(null);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    Promise.all([
      api.entities.Load.filter({ assigned_driver_id: user.id }),
      api.entities.FuelLog.filter({ driver_id: user.id }),
      api.entities.DeliveryRoute.filter({ driver_id: user.id }),
    ]).then(async ([loads, fuel, routes]) => {
      const todayRoute = routes.find((r) => r.route_date === today && r.status !== 'cancelled');
      let deliveryInfo = null;
      if (todayRoute) {
        const stops = await api.entities.DeliveryStop.filter({ route_id: todayRoute.id });
        const sorted = stops.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        const pendingStops = sorted.filter((s) => !['delivered', 'failed'].includes(s.status)).length;
        deliveryInfo = { route: todayRoute, stops: sorted, pendingStops };
      }
      setDelivery(deliveryInfo);
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

  return <DriverDashboard user={user} data={data} delivery={delivery} />;
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Truck, Users, Fuel, Package, X } from 'lucide-react';
import { api } from '@/api/apiClient';
import { canManageCustomerTeam } from '@/lib/customerRoles';
import DriverAppDownload from '@/components/shared/DriverAppDownload';

const STORAGE_KEY = 'fleetco_getting_started_dismissed';

export default function GettingStartedChecklist({ user }) {
  const [steps, setSteps] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  useEffect(() => {
    if (!user?.customer_id || dismissed) return;

    const cid = user.customer_id;
    Promise.all([
      api.entities.Vehicle.list('-created_date', 200),
      api.entities.User.list(),
      api.entities.FuelLog.list('-date', 50),
      api.entities.Load.list('-created_date', 50),
    ]).then(([vehicles, users, fuel, loads]) => {
      const fleet = vehicles.filter(v => v.customer_id === cid || v.assigned_customer_id === cid);
      const drivers = users.filter(u => u.role === 'driver' && u.customer_id === cid);
      const fleetIds = new Set(fleet.map(v => v.id));
      const fuelForFleet = fuel.filter(f => fleetIds.has(f.vehicle_id));
      const loadsForCustomer = loads.filter(l => l.customer_id === cid);

      setSteps([
        { id: 'vehicle', label: 'Add your first truck or trailer', done: fleet.length > 0, path: '/portal/fleet', icon: Truck },
        { id: 'driver', label: 'Invite a driver', done: drivers.length > 0, path: '/portal/drivers', icon: Users, skip: !canManageCustomerTeam(user.role) },
        { id: 'fuel', label: 'Log a fuel fill-up', done: fuelForFleet.length > 0, path: '/portal/fuel', icon: Fuel },
        { id: 'load', label: 'Create your first load', done: loadsForCustomer.length > 0, path: '/portal/loads', icon: Package },
      ].filter(s => !s.skip));
    }).catch(() => setSteps([]));
  }, [user, dismissed]);

  if (dismissed || !steps || steps.length === 0) return null;

  const completed = steps.filter(s => s.done).length;
  if (completed >= steps.length) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-slate-800 rounded-xl border border-amber-500/30 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-white font-black text-lg">Getting Started</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {completed} of {steps.length} complete — set up your fleet in a few minutes
          </p>
        </div>
        <button onClick={dismiss} className="text-slate-500 hover:text-slate-300 p-1" aria-label="Dismiss checklist">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {steps.map(step => {
          const Icon = step.icon;
          return (
            <Link
              key={step.id}
              to={step.path}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 border transition-colors ${
                step.done
                  ? 'bg-emerald-900/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 hover:border-amber-500/50 text-white'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
              )}
              <Icon className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className={`text-sm font-semibold ${step.done ? 'line-through opacity-70' : ''}`}>{step.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        <DriverAppDownload variant="compact" />
        <p className="text-xs text-slate-500">
          Need help? Open the <Link to="/manual" className="text-amber-400 hover:underline">Customer Manual</Link> or email support@fleetcomanagement.org
        </p>
      </div>
    </div>
  );
}

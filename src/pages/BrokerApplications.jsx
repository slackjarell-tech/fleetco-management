import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { isSLT } from '@/lib/roles';

export default function BrokerApplications() {
  const [user, setUser] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then(async (u) => {
      setUser(u);
      if (isSLT(u?.role)) {
        const res = await api.functions.invoke('listBrokerApplications', {});
        setApps(res.applications || []);
      }
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id, status) => {
    await api.functions.invoke('updateBrokerApplicationStatus', { id, status });
    const res = await api.functions.invoke('listBrokerApplications', {});
    setApps(res.applications || []);
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" /></div>;
  if (!isSLT(user?.role)) return <div className="p-8 text-center text-slate-500">SLT access required</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Broker Applications</h1>
      <p className="text-slate-500 text-sm mb-6">Review freight broker load board access requests.</p>
      <div className="space-y-4">
        {apps.length === 0 && <p className="text-slate-400">No applications yet.</p>}
        {apps.map((app) => (
          <div key={app.id} className="border border-slate-200 rounded-xl p-5 bg-white">
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              <div>
                <span className="font-bold text-slate-900">{app.company_name}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${app.status === 'approved' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                  {app.status}
                </span>
              </div>
              <span className="text-xs text-slate-400">{app.created_date?.slice(0, 10)}</span>
            </div>
            <div className="text-sm text-slate-600 grid sm:grid-cols-2 gap-1">
              <div>{app.contact_name} · {app.email}</div>
              <div>MC: {app.mc_number || '—'} · DOT: {app.dot_number || '—'}</div>
              <div>Loads/wk: {app.loads_per_week || '—'}</div>
              <div>Equipment: {app.equipment_types || '—'}</div>
            </div>
            {app.message && <p className="text-sm text-slate-500 mt-2">{app.message}</p>}
            {app.status === 'pending' && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(app.id, 'approved')}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateStatus(app.id, 'rejected')}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

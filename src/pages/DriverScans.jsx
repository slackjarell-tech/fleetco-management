import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { ScanLine, User, MapPin, Package, Archive } from 'lucide-react';
import { filterByCustomerId } from '@/lib/roles';

export default function DriverScans() {
  const [user, setUser] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then(async (u) => {
      setUser(u);
      const all = await api.entities.BarcodeScan.list('-scanned_at', 200);
      const internal = ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(u?.role);
      setScans(internal ? all : filterByCustomerId(all, u));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <ScanLine className="w-7 h-7 text-amber-500" /> Driver Barcode Scans
        </h1>
        <p className="text-slate-500 text-sm mt-1">Live scans from the FleetCo Driver app — same data your drivers capture in the field.</p>
      </div>

      {scans.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
          <ScanLine className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No scans yet. Drivers scan from the mobile app under Scan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {scans.map((s) => (
            <div key={s.id} className="px-4 py-3 flex flex-wrap gap-3 items-start">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                s.scan_type === 'load' ? 'bg-blue-100 text-blue-700' : s.scan_type === 'part' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {s.scan_type === 'load' ? <Package className="w-4 h-4" /> : s.scan_type === 'part' ? <Archive className="w-4 h-4" /> : <ScanLine className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm font-mono">{s.barcode}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {s.driver_name}</span>
                  <span>{new Date(s.scanned_at).toLocaleString()}</span>
                  {s.lat && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> GPS</span>}
                </div>
              </div>
              <span className="text-xs font-bold capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s.scan_type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

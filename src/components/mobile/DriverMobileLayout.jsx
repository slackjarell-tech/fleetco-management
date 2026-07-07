import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { api } from '@/api/apiClient';
import {
  LayoutDashboard, Clock, Route, ScanLine, Menu, LogOut, Package,
  MessageCircle, Navigation, ClipboardCheck, Fuel, AlertTriangle, MapPin,
  X, ChevronRight,
} from 'lucide-react';
import FleetcoLogo from '@/components/home/FleetcoLogo';
import CustomerPausedOverlay from '@/components/billing/CustomerPausedOverlay';
import { isNativeApp } from '@/lib/platform';

const TABS = [
  { path: '/driver', label: 'Home', icon: LayoutDashboard, end: true },
  { path: '/driver/clock', label: 'Clock', icon: Clock },
  { path: '/driver/route', label: 'Route', icon: Route },
  { path: '/driver/scan', label: 'Scan', icon: ScanLine },
];

const MORE_LINKS = [
  { path: '/driver/loads', label: 'My Loads', icon: Package },
  { path: '/driver/navigation', label: 'Navigation', icon: Navigation },
  { path: '/driver/messages', label: 'Messages', icon: MessageCircle },
  { path: '/driver/hos', label: 'HOS Logs', icon: ClipboardCheck },
  { path: '/driver/inspections', label: 'Inspections', icon: ClipboardCheck },
  { path: '/driver/fuel', label: 'Fuel Logs', icon: Fuel },
  { path: '/driver/incidents', label: 'Incidents', icon: AlertTriangle },
  { path: '/portal/change-password', label: 'Change Password', icon: MapPin },
];

export default function DriverMobileLayout() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    api.auth.me()
      .then((u) => {
        setUser(u);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login?app=driver" replace />;
  if (user.role !== 'driver') return <Navigate to="/portal" replace />;

  const tabActive = (tab) => (tab.end ? location.pathname === tab.path : location.pathname.startsWith(tab.path));

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-lg mx-auto shadow-xl">
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <FleetcoLogo size={32} variant="icon" />
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm truncate">FleetCo Driver</div>
          <div className="text-xs text-slate-400 truncate">{user.full_name}</div>
        </div>
        {isNativeApp() && (
          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">LIVE</span>
        )}
        <button type="button" onClick={() => setMoreOpen(true)} className="p-2 text-slate-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 pb-20 relative overflow-y-auto">
        <CustomerPausedOverlay user={user} billing={user.billing} />
        <Outlet context={{ user }} />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-slate-900 border-t border-slate-800 px-2 py-1.5 flex justify-around z-40 safe-area-pb">
        {TABS.map((tab) => {
          const active = tabActive(tab);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[64px] ${active ? 'text-amber-400' : 'text-slate-500'}`}
            >
              <tab.icon className={`w-5 h-5 ${active ? 'text-amber-400' : ''}`} />
              <span className="text-[10px] font-bold">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end max-w-lg mx-auto">
          <div className="bg-white w-full rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-slate-900">Driver Menu</h2>
              <button type="button" onClick={() => setMoreOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-1">
              {MORE_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50"
                >
                  <link.icon className="w-5 h-5 text-amber-600" />
                  <span className="flex-1 font-semibold text-slate-800 text-sm">{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              ))}
              <button
                type="button"
                onClick={() => api.auth.logout()}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 mt-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

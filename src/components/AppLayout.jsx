import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { api } from '@/api/apiClient';
import {
  LayoutDashboard, Package, FileText, Fuel, Truck, LogOut, Menu, X, ChevronRight,
  BarChart2, ClipboardList, Building2, Users, ClipboardCheck, Wrench, UserCheck,
  Archive, Calendar, Cpu, Store, Bot, Crown, MessageCircle, Navigation, TrendingUp,
  Map, Route, DollarSign, Globe, Clock, ShieldCheck, AlertTriangle, Award, Lightbulb,
  MapPin, Megaphone, Zap, Mail,
  ChevronDown, KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import FleetcoLogo from '@/components/home/FleetcoLogo';

const isInternalRole = (role) => {
  return ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(role);
};

const isFleetCoAdmin = (role) => ['owner', 'executive', 'fleet_manager'].includes(role);

const NAV_GROUPS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { label: 'Admin Dashboard', icon: LayoutDashboard, path: '/portal' },
      { label: 'Executive View', icon: Crown, path: '/portal/executive' },
    ]
  },
  {
    label: 'Operations',
    icon: Package,
    items: [
      { label: 'Load Board', icon: Package, path: '/portal/loads' },
      { label: 'PD Command Tower', icon: Map, path: '/portal/pd-command' },
      { label: 'Route Builder', icon: Route, path: '/portal/route-builder' },
      { label: 'Route Dashboard', icon: Route, path: '/portal/route-dashboard' },
      { label: 'My Delivery Route', icon: Route, path: '/portal/my-route' },
      { label: 'Navigation', icon: Navigation, path: '/portal/navigation' },
      { label: 'Fleet Map', icon: Map, path: '/portal/fleet-map' },
    ]
  },
  {
    label: 'Fleet',
    icon: Truck,
    items: [
      { label: 'Fleet Units', icon: Truck, path: '/portal/fleet' },
      { label: 'Fleet P&L', icon: TrendingUp, path: '/portal/fleetpnl' },
      { label: 'Vehicle TCO', icon: TrendingUp, path: '/portal/tco' },
      { label: 'Repairs Dashboard', icon: Wrench, path: '/portal/repairs' },
      { label: 'Work Orders', icon: ClipboardList, path: '/portal/workorders' },
      { label: 'Diagnostics', icon: Cpu, path: '/portal/diagnostics' },
    ]
  },
  {
    label: 'Maintenance',
    icon: Wrench,
    items: [
      { label: 'Preventive Maint.', icon: Wrench, path: '/portal/maintenance' },
      { label: 'Maint. Calendar', icon: Calendar, path: '/portal/calendar' },
      { label: 'Pre-Trip Checklist', icon: ClipboardCheck, path: '/portal/pretrip' },
      { label: 'Inspections', icon: ClipboardCheck, path: '/portal/inspections' },
      { label: 'Service Templates', icon: ClipboardList, path: '/portal/service-templates' },
      { label: 'Parts Inventory', icon: Archive, path: '/portal/parts' },
      { label: 'Vendors & Contracts', icon: Store, path: '/portal/vendors' },
    ]
  },
  {
    label: 'Drivers & Payroll',
    icon: Users,
    items: [
      { label: 'Drivers', icon: UserCheck, path: '/portal/drivers' },
      { label: 'Driver Scorecards', icon: Award, path: '/portal/scorecard' },
      { label: 'Driver Payroll', icon: DollarSign, path: '/portal/driver-payroll' },
      { label: 'Payroll', icon: DollarSign, path: '/portal/payroll' },
      { label: 'Time Clock', icon: Clock, path: '/portal/timeclock' },
    ]
  },
  {
    label: 'Compliance',
    icon: ShieldCheck,
    items: [
      { label: 'ELD Portal', icon: ShieldCheck, path: '/portal/eld' },
      { label: 'HOS / ELD Logs', icon: FileText, path: '/portal/hos' },
      { label: 'Compliance Tracker', icon: ShieldCheck, path: '/portal/compliance' },
      { label: 'IFTA Dashboard', icon: Globe, path: '/portal/ifta' },
      { label: 'Incident Reports', icon: AlertTriangle, path: '/portal/incidents' },
    ]
  },
  {
    label: 'Finance',
    icon: DollarSign,
    items: [
      { label: 'Invoices', icon: FileText, path: '/portal/invoices' },
      { label: 'Fuel Stations', icon: MapPin, path: '/portal/fuel-stations' },
      { label: 'Fuel Audits', icon: Fuel, path: '/portal/fuel' },
      { label: 'Reports', icon: BarChart2, path: '/portal/reports' },
    ]
  },
  {
    label: 'Other',
    icon: Building2,
    items: [
      { label: 'Customers & Team', icon: Building2, path: '/portal/customers' },
      { label: 'Company Emails', icon: Mail, path: '/portal/domain-emails', sltOnly: true },
      { label: 'Messages', icon: MessageCircle, path: '/portal/messages' },
      { label: 'Site Commander AI', icon: Bot, path: '/portal/assistant' },
      { label: 'Revan', icon: Zap, path: '/portal/revan' },
      { label: 'Advertisement', icon: Megaphone, path: '/portal/advertisement' },
      { label: 'Marketing Gallery', icon: Megaphone, path: '/portal/marketing-gallery' },
      { label: 'AI Dev Feedback', icon: Lightbulb, path: '/portal/dev-feedback' },
      { label: 'Competitive Analysis', icon: Globe, path: '/portal/competitive-analysis' },
    ]
  },
];

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState(() => ({}));

  useEffect(() => {
    api.auth.me().catch(() => null).then(u => {
      setUser(u);
      setAuthChecked(true);
    });
  }, []);

  // Auto-expand groups that contain the active route
  useEffect(() => {
    if (!user) return;
    const newExpanded = { ...expandedGroups };
    let changed = false;
    NAV_GROUPS.forEach(g => {
      const hasActive = g.items.some(item => location.pathname === item.path);
      if (hasActive && !newExpanded[g.label]) {
        newExpanded[g.label] = true;
        changed = true;
      }
    });
    if (changed) setExpandedGroups(newExpanded);
  }, [location.pathname, user]);

  const toggleGroup = (label) => {
    setExpandedGroups(p => ({ ...p, [label]: !p[label] }));
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 flex flex-col transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <Link to="/portal">
            <FleetcoLogo size={36} variant="icon" />
          </Link>
          <div>
            <div className="text-white font-bold text-sm leading-none">FLEETCO</div>
            <div className="text-amber-400 text-xs tracking-widest">
              {user && isInternalRole(user.role) ? 'PORTAL' : 'CUSTOMER'}
            </div>
          </div>
          <Button size="icon" variant="ghost" className="ml-auto lg:hidden text-slate-400" onClick={() => setOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User */}
        {user && (
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="text-white text-sm font-medium truncate">{user.full_name}</div>
            <div className="text-slate-400 text-xs capitalize">{user.role || 'user'}</div>
          </div>
        )}

        {/* Nav Groups */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_GROUPS.map(group => {
            // Filter groups based on user's sidebar_modules preference
            const modules = user?.sidebar_modules;
            if (modules && modules.length > 0 && !modules.includes(group.label)) return null;

            // Filter items based on user role
            const visibleItems = group.items.filter(item => {
              if (item.sltOnly && !['owner', 'executive', 'fleet_manager'].includes(user?.role)) return false;
              if (item.ownerOnly && user?.role !== 'owner') return false;
              if (isFleetCoAdmin(user?.role)) return true;
              if (user?.role === 'fleet_coordinator') {
                if (item.path === '/portal/executive') return false;
                if (item.path === '/portal/advertisement') return false;
                if (item.path === '/portal/dev-feedback') return false;
                return true;
              }
              // Customer users cannot see internal-only pages
              if (item.path === '/portal/executive') return false;
              if (item.path === '/portal/advertisement') return false;
              if (item.path === '/portal/customers') return false;
              if (item.path === '/portal/team') return false;
              if (item.path === '/portal/dev-feedback') return false;
              if (item.path === '/portal/revan') return false;
              return true;
            });
            if (visibleItems.length === 0) return null;
            const anyActive = visibleItems.some(item => location.pathname === item.path);
            const isExpanded = expandedGroups[group.label] !== false; // default open

            return (
              <div key={group.label}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    anyActive ? 'text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <group.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left text-xs font-black tracking-wider uppercase">{group.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                </button>

                {/* Group items */}
                {isExpanded && (
                  <div className="ml-3 mt-0.5 mb-1 border-l border-slate-800 space-y-0.5">
                    {visibleItems.map(item => {
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-lg text-sm transition-colors ${
                            active
                              ? 'bg-amber-500/10 text-amber-400 font-medium border-r-2 border-amber-500'
                              : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                          }`}
                        >
                          <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            ← Back to Website
          </Link>
          <Link to="/portal/module-preferences" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Module Preferences
          </Link>
          <Link to="/portal/change-password" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            <KeyRound className="w-4 h-4" /> Change Password
          </Link>
          <button
            onClick={() => api.auth.logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FleetcoLogo size={28} variant="icon" />
            <span className="font-bold text-slate-900 text-sm">Fleetco Portal</span>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { api } from '@/api/apiClient';
import {
  LayoutDashboard, Package, FileText, Fuel, Truck, LogOut, Menu, X, ChevronRight,
  BarChart2, ClipboardList, Building2, Users, ClipboardCheck, Wrench, UserCheck,
  Archive, Calendar, Cpu, Store, Bot, Crown, MessageCircle, Navigation, TrendingUp,
  Map, Route, DollarSign, Globe, Clock, ShieldCheck, AlertTriangle, Award, Lightbulb,
  MapPin, Megaphone, Zap, Mail, ScanLine, Video, Upload, Warehouse, Search,
  ChevronDown, KeyRound, Bell, Database, Calculator, Smartphone, CreditCard,
} from 'lucide-react';
import { DRIVER_APP } from '@/lib/platform';
import { Button } from '@/components/ui/button';
import FleetcoLogo from '@/components/home/FleetcoLogo';
import PaymentDueBanner from '@/components/billing/PaymentDueBanner';
import CustomerPausedOverlay from '@/components/billing/CustomerPausedOverlay';
import BulkCsvImport from '@/components/shared/BulkCsvImport';
import { getBulkImportConfig } from '@/lib/bulkImportConfigs';
import { CustomerProvider, useCustomerContext } from '@/lib/CustomerContext';
import { defaultSidebarModulesForRole } from '@/lib/customerRoles';
import { sectionForPath, isCustomerFacingPath } from '@/lib/portalSections';
import { isPortalFullBleedPath } from '@/lib/portalLayout';

const isInternalRole = (role) => {
  return ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(role);
};

import { canManageCustomerTeam, isCustomerPortalUser } from '@/lib/customerRoles';

const isFleetCoAdmin = (role) => ['owner', 'executive', 'fleet_manager'].includes(role);

const NAV_GROUPS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { label: 'Admin Dashboard', icon: LayoutDashboard, path: '/portal' },
      { label: 'Executive View', icon: Crown, path: '/portal/executive' },
      { label: 'FleetCo Payroll', icon: DollarSign, path: '/portal/fleetco-payroll' },
      { label: 'Customer Insights', icon: BarChart2, path: '/portal/customer-insights', internalOnly: true },
    ]
  },
  {
    label: 'Operations',
    icon: Package,
    items: [
      { label: 'Load Board', icon: Package, path: '/portal/loads' },
      { label: 'PD Command Tower', icon: Map, path: '/portal/pd-command', advancedOnly: true },
      { label: 'Route Builder', icon: Route, path: '/portal/route-builder', advancedOnly: true },
      { label: 'Route Dashboard', icon: Route, path: '/portal/route-dashboard', advancedOnly: true },
      { label: 'My Delivery Route', icon: Route, path: '/portal/my-route' },
      { label: 'Navigation', icon: Navigation, path: '/portal/navigation', advancedOnly: true },
      { label: 'Fleet Map', icon: Map, path: '/portal/fleet-map', advancedOnly: true },
      { label: 'Yard Management', icon: Warehouse, path: '/portal/yard-management' },
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
      { label: 'Vehicle Parts Research', icon: Search, path: '/portal/vehicle-lookup' },
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
      { label: 'Accounting', icon: Calculator, path: '/portal/accounting' },
      { label: 'Fuel Stations', icon: MapPin, path: '/portal/fuel-stations' },
      { label: 'Fuel Audits', icon: Fuel, path: '/portal/fuel' },
      { label: 'Driver Scans', icon: ScanLine, path: '/portal/driver-scans' },
      { label: 'Driver Media', icon: Video, path: '/portal/driver-media' },
      { label: 'Reports', icon: BarChart2, path: '/portal/reports' },
      { label: 'Customer Payments', icon: CreditCard, path: '/portal/slt-billing', sltOnly: true },
      { label: 'Subscription', icon: CreditCard, path: '/portal/billing', customerBilling: true },
    ]
  },
  {
    label: 'Other',
    icon: Building2,
    items: [
      { label: 'Customers & Team', icon: Building2, path: '/portal/customers' },
      { label: 'Company Emails', icon: Mail, path: '/portal/domain-emails', sltOnly: true },
      { label: 'Data Backup', icon: Database, path: '/portal/data-backup', sltOnly: true },
      { label: 'Messages', icon: MessageCircle, path: '/portal/messages' },
      { label: 'Site Commander AI', icon: Bot, path: '/portal/assistant' },
      { label: 'Revan', icon: Zap, path: '/portal/revan', advancedOnly: true },
      { label: 'FleetCo Marketing AI', icon: Megaphone, path: '/portal/slt-marketing', sltOnly: true },
      { label: 'Advertisement', icon: Megaphone, path: '/portal/advertisement', advancedOnly: true },
      { label: 'Marketing Gallery', icon: Megaphone, path: '/portal/marketing-gallery', advancedOnly: true },
      { label: 'AI Dev Feedback', icon: Lightbulb, path: '/portal/dev-feedback', advancedOnly: true },
      { label: 'Competitive Analysis', icon: Globe, path: '/portal/competitive-analysis', advancedOnly: true },
    ]
  },
];

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const location = useLocation();
  const bulkConfig = getBulkImportConfig(location.pathname);

  useEffect(() => {
    api.auth.me().catch(() => null).then(u => {
      setUser(u);
      setAuthChecked(true);
      if (u?.must_change_password && !window.location.pathname.startsWith('/set-password')) {
        window.location.href = '/set-password';
      }
    });
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <CustomerProvider user={user}>
      <AppLayoutShell
        user={user}
        open={open}
        setOpen={setOpen}
        showBulkImport={showBulkImport}
        setShowBulkImport={setShowBulkImport}
        location={location}
        bulkConfig={bulkConfig}
      />
    </CustomerProvider>
  );
}

function AppLayoutShell({ user, open, setOpen, showBulkImport, setShowBulkImport, location, bulkConfig }) {
  const {
    customers,
    loadingCustomers,
    viewAsCustomerId,
    viewAsCustomer,
    selectCustomer,
    clearCustomerView,
    isViewingAsCustomer,
    isInternal,
  } = useCustomerContext();

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState(() => ({}));
  const [viewCustomerModules, setViewCustomerModules] = useState(null);

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

  useEffect(() => {
    if (!isViewingAsCustomer || !viewAsCustomerId) {
      setViewCustomerModules(null);
      return;
    }
    api.entities.User.list()
      .then((users) => {
        const modules = new Set();
        users.forEach((u) => {
          const mods = u.sidebar_modules?.length
            ? u.sidebar_modules
            : defaultSidebarModulesForRole(u.role);
          mods.forEach((m) => modules.add(m));
        });
        setViewCustomerModules(
          modules.size ? [...modules] : defaultSidebarModulesForRole('customer_owner'),
        );
      })
      .catch(() => {
        setViewCustomerModules(defaultSidebarModulesForRole('customer_owner'));
      });
  }, [isViewingAsCustomer, viewAsCustomerId]);

  useEffect(() => {
    if (!user || !location.pathname.startsWith('/portal')) return;
    const customerId = user.customer_id || (isViewingAsCustomer ? viewAsCustomerId : null);
    if (!customerId) return;
    api.customerAnalytics.track({
      path: location.pathname,
      section: sectionForPath(location.pathname),
      customer_id: customerId,
    }).catch(() => {});
  }, [location.pathname, user?.id, viewAsCustomerId, isViewingAsCustomer]);

  const toggleGroup = (label) => {
    setExpandedGroups(p => ({ ...p, [label]: !p[label] }));
  };

  const fullBleedMain = isPortalFullBleedPath(location.pathname);

  const handleCustomerSwitch = (e) => {
    const value = e.target.value;
    if (!value) {
      clearCustomerView();
    } else {
      selectCustomer(value);
    }
    window.dispatchEvent(new CustomEvent('fleetco:customer-context-changed'));
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:h-screen lg:max-h-screen lg:overflow-hidden">
      {/* Sidebar — drawer on mobile; grid column on desktop (never overlapped by main) */}
      <aside
        className={`max-lg:fixed max-lg:inset-y-0 max-lg:left-0 z-50 w-64 bg-slate-900 flex flex-col max-lg:transform max-lg:transition-transform max-lg:duration-200 ${
          open ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
        } lg:relative lg:translate-x-0 lg:z-auto lg:col-start-1 lg:row-start-1 lg:h-screen lg:max-h-screen lg:overflow-y-auto lg:overscroll-contain`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <Link to="/portal" className="flex-shrink-0">
            <FleetcoLogo size={40} variant="full" />
          </Link>
          <div className="min-w-0">
            <div className="text-amber-400 text-xs tracking-widest font-bold uppercase">
              {user && isInternalRole(user.role) ? 'Portal' : 'Customer'}
            </div>
          </div>
          <Button size="icon" variant="ghost" className="ml-auto lg:hidden text-slate-400" onClick={() => setOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User */}
        {user && (
          <div className="px-4 py-3 border-b border-slate-800 space-y-2">
            <div className="text-white text-sm font-medium truncate">{user.full_name}</div>
            <div className="text-slate-400 text-xs capitalize">{user.role || 'user'}</div>
            {isInternal && (
              <div className="pt-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Customer view
                </label>
                <select
                  value={viewAsCustomerId || ''}
                  onChange={handleCustomerSwitch}
                  disabled={loadingCustomers}
                  className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">All customers (FleetCo)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.contact_name || c.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Nav Groups */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_GROUPS.map(group => {
            const modules = user?.sidebar_modules;
            const activeModuleFilter = isViewingAsCustomer
              ? viewCustomerModules
              : (modules && modules.length > 0 ? modules : null);

            if (activeModuleFilter && !activeModuleFilter.includes(group.label)) return null;

            const visibleItems = group.items.filter(item => {
              if (item.internalOnly && !isInternal) return false;
              if (item.sltOnly && !['owner', 'executive', 'fleet_manager'].includes(user?.role)) return false;
              if (item.path === '/portal/fleetco-payroll' && !['owner', 'executive', 'fleet_manager'].includes(user?.role)) return false;
              if (item.ownerOnly && user?.role !== 'owner') return false;
              if (item.customerBilling && !user?.customer_id) return false;
              if (item.advancedOnly && isCustomerPortalUser(user) && !isInternal) return false;

              if (isViewingAsCustomer) {
                if (item.internalOnly || !isCustomerFacingPath(item.path)) return false;
                if (item.path === '/portal/customers') return true;
                return true;
              }

              if (isFleetCoAdmin(user?.role)) return true;
              if (user?.role === 'fleet_coordinator') {
                if (item.path === '/portal/executive') return false;
                if (item.path === '/portal/advertisement') return false;
                if (item.path === '/portal/dev-feedback') return false;
                return true;
              }
              if (item.path === '/portal/customers' && canManageCustomerTeam(user?.role) && user?.customer_id) {
                return true;
              }
              if (item.path === '/portal/executive') return false;
              if (item.path === '/portal/advertisement') return false;
              if (item.path === '/portal/customers') return false;
              if (item.path === '/portal/team') return false;
              if (item.path === '/portal/dev-feedback') return false;
              if (item.path === '/portal/revan') return false;
              if (item.internalOnly) return false;
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
                          {item.path === '/portal/customers' && (
                            (canManageCustomerTeam(user?.role) && user?.customer_id) || isViewingAsCustomer
                          )
                            ? (isViewingAsCustomer ? 'Customer Team' : 'My Team')
                            : item.label}
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
          <a
            href={DRIVER_APP.android}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-amber-400 text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Smartphone className="w-4 h-4" /> Download Driver App
          </a>
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            ← Back to Website
          </Link>
          <Link to="/portal/module-preferences" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Module Preferences
          </Link>
          <Link to="/portal/notification-preferences" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            <Bell className="w-4 h-4" /> Notification Preferences
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
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main column — minmax(0,1fr) prevents horizontal bleed into sidebar */}
      <div
        className={`flex flex-col min-h-screen min-w-0 w-full lg:col-start-2 lg:row-start-1 lg:min-h-0 ${
          fullBleedMain ? 'lg:h-screen lg:max-h-screen lg:overflow-hidden' : 'lg:overflow-y-auto'
        }`}
      >
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FleetcoLogo size={36} variant="icon" />
            <span className="font-bold text-slate-900 text-sm">FleetCo</span>
          </div>
        </header>
        <PaymentDueBanner user={user} />
        {isViewingAsCustomer && (
          <div className="bg-amber-500 text-slate-900 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              <strong>Customer view:</strong> {viewAsCustomer?.company_name || viewAsCustomerId}
              <span className="hidden sm:inline text-slate-800/80"> — same tabs as this customer · edits save to their account</span>
            </span>
            <button
              type="button"
              onClick={() => { clearCustomerView(); window.dispatchEvent(new CustomEvent('fleetco:customer-context-changed')); }}
              className="font-bold underline hover:no-underline text-xs sm:text-sm"
            >
              Exit customer view
            </button>
          </div>
        )}
        {bulkConfig && !fullBleedMain && (
          <div className="hidden lg:flex absolute top-4 right-6 z-20">
            <Button
              size="sm"
              variant="outline"
              className="bg-white shadow-sm border-slate-200 text-xs gap-1.5 font-semibold"
              onClick={() => setShowBulkImport(true)}
            >
              <Upload className="w-3.5 h-3.5" /> Bulk Upload
            </Button>
          </div>
        )}
        <main
          className={`relative flex flex-col flex-1 min-h-0 min-w-0 w-full ${
            fullBleedMain ? 'overflow-hidden p-0' : 'overflow-x-hidden'
          }`}
        >
          <CustomerPausedOverlay user={user} billing={user?.billing} />
          {bulkConfig && !fullBleedMain && (
            <div className="lg:hidden px-4 pt-3 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs gap-1.5 font-semibold"
                onClick={() => setShowBulkImport(true)}
              >
                <Upload className="w-3.5 h-3.5" /> Bulk Upload CSV
              </Button>
            </div>
          )}
          <div
            className={`flex flex-col flex-1 min-h-0 min-w-0 w-full ${
              fullBleedMain ? 'h-full overflow-hidden' : ''
            }`}
          >
            <Outlet key={viewAsCustomerId || 'all-customers'} />
          </div>
        </main>
        {showBulkImport && bulkConfig && (
          <BulkCsvImport
            config={bulkConfig}
            onClose={() => setShowBulkImport(false)}
            onSuccess={() => {
              window.dispatchEvent(new CustomEvent('fleetco:bulk-import'));
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}
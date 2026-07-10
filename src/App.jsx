import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
// Add page imports here
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LoadBoard from './pages/LoadBoard';
import Invoices from './pages/Invoices';
import FuelAudits from './pages/FuelAudits';
import FuelStations from './pages/FuelStations';
import Fleet from './pages/Fleet';
import Reports from './pages/Reports';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';

import FleetOwnerLanding from './pages/FleetOwnerLanding';
import WorkOrders from './pages/WorkOrders';
import Customers from './pages/Customers';
import Team from './pages/Team';
import Inspections from './pages/Inspections';
import Maintenance from './pages/Maintenance';
import Drivers from './pages/Drivers.jsx';
import RepairsDashboard from './pages/RepairsDashboard';
import PartInventory from './pages/PartInventory';
import MaintenanceCalendar from './pages/MaintenanceCalendar';
import PreTripChecklist from './pages/PreTripChecklist';
import HOSReport from './pages/HOSReport';
import Diagnostics from './pages/Diagnostics';
import Vendors from './pages/Vendors';
import Assistant from './pages/Assistant';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import Messages from './pages/Messages';
import Navigation from './pages/Navigation';
import FleetPnL from './pages/FleetPnL';
import PDCommandTower from './pages/PDCommandTower';
import MyDeliveryRoute from './pages/MyDeliveryRoute';
import Payroll from './pages/Payroll';
import RouteBuilder from './pages/RouteBuilder';
import InvestorOverview from './pages/InvestorOverview';
import IFTADashboard from './pages/IFTADashboard';
import TimeClock from './pages/TimeClock';
import DriverPayrollSummary from './pages/DriverPayrollSummary';
import ComplianceTracker from './pages/ComplianceTracker';
import IncidentReports from './pages/IncidentReports';
import FleetMap from './pages/FleetMap';
import YardManagement from './pages/YardManagement';
import DriverScorecard from './pages/DriverScorecard';
import VehicleTCO from './pages/VehicleTCO';
import DevFeedbackDashboard from './pages/DevFeedbackDashboard';
import CustomerManual from './pages/CustomerManual';
import SystemManual from './pages/SystemManual';
import MarketingMaterials from './pages/MarketingMaterials';
import ChangePassword from './pages/ChangePassword';
import SetPassword from './pages/SetPassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ServiceTemplates from './pages/ServiceTemplates';
import ModulePreferences from './pages/ModulePreferences';
import NotificationPreferences from './pages/NotificationPreferences';
import Advertisement from './pages/Advertisement';
import MarketingGallery from './pages/MarketingGallery';
import CompetitiveAnalysis from './pages/CompetitiveAnalysis';
import Revan from './pages/Revan';
import EldPortal from './pages/EldPortal';
import RouteDashboard from './pages/RouteDashboard';
import DomainEmails from './pages/DomainEmails';
import DriverMobileLayout from './components/mobile/DriverMobileLayout';
import DriverMobileHome from './pages/driver/DriverMobileHome';
import DriverScan from './pages/driver/DriverScan';
import DriverDashcam from './pages/driver/DriverDashcam';
import DriverScans from './pages/DriverScans';
import DriverMedia from './pages/DriverMedia';
import About from './pages/About';
import Contact from './pages/Contact';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/set-password" element={<SetPassword />} />

      {/* FleetCo Driver mobile app — iOS / Android + mobile web */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?app=driver" replace />} />}>
        <Route path="/driver" element={<DriverMobileLayout />}>
          <Route index element={<DriverMobileHome />} />
          <Route path="clock" element={<TimeClock />} />
          <Route path="route" element={<MyDeliveryRoute />} />
          <Route path="scan" element={<DriverScan />} />
          <Route path="dashcam" element={<DriverDashcam />} />
          <Route path="loads" element={<LoadBoard />} />
          <Route path="navigation" element={<Navigation />} />
          <Route path="messages" element={<Messages />} />
          <Route path="hos" element={<HOSReport />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="fuel" element={<FuelAudits />} />
          <Route path="incidents" element={<IncidentReports />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/portal" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="loads" element={<LoadBoard />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="fuel" element={<FuelAudits />} />
          <Route path="fuel-stations" element={<FuelStations />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="reports" element={<Reports />} />
          <Route path="repairs" element={<RepairsDashboard />} />
          <Route path="workorders" element={<WorkOrders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="team" element={<Navigate to="/portal/customers" replace />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="parts" element={<PartInventory />} />
          <Route path="calendar" element={<MaintenanceCalendar />} />
          <Route path="pretrip" element={<PreTripChecklist />} />
          <Route path="hos" element={<HOSReport />} />
          <Route path="diagnostics" element={<Diagnostics />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="executive" element={<ExecutiveDashboard />} />
          <Route path="messages" element={<Messages />} />
          <Route path="navigation" element={<Navigation />} />
          <Route path="fleetpnl" element={<FleetPnL />} />
          <Route path="pd-command" element={<PDCommandTower />} />
          <Route path="my-route" element={<MyDeliveryRoute />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="route-builder" element={<RouteBuilder />} />
          <Route path="route-dashboard" element={<RouteDashboard />} />
          <Route path="ifta" element={<IFTADashboard />} />
          <Route path="timeclock" element={<TimeClock />} />
          <Route path="driver-payroll" element={<DriverPayrollSummary />} />
          <Route path="compliance" element={<ComplianceTracker />} />
          <Route path="incidents" element={<IncidentReports />} />
          <Route path="fleet-map" element={<FleetMap />} />
          <Route path="yard-management" element={<YardManagement />} />
          <Route path="scorecard" element={<DriverScorecard />} />
          <Route path="tco" element={<VehicleTCO />} />
          <Route path="dev-feedback" element={<DevFeedbackDashboard />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="service-templates" element={<ServiceTemplates />} />
          <Route path="module-preferences" element={<ModulePreferences />} />
          <Route path="notification-preferences" element={<NotificationPreferences />} />
          <Route path="advertisement" element={<Advertisement />} />
          <Route path="marketing-gallery" element={<MarketingGallery />} />
          <Route path="competitive-analysis" element={<CompetitiveAnalysis />} />
          <Route path="revan" element={<Revan />} />
          <Route path="eld" element={<EldPortal />} />
          <Route path="domain-emails" element={<DomainEmails />} />
          <Route path="driver-scans" element={<DriverScans />} />
          <Route path="driver-media" element={<DriverMedia />} />
        </Route>
      </Route>
      <Route path="/fleet-owners" element={<FleetOwnerLanding />} />
      <Route path="/manual" element={<CustomerManual />} />
      <Route path="/system-manual" element={<SystemManual />} />
      <Route path="/materials" element={<MarketingMaterials />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/overview" element={<InvestorOverview />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
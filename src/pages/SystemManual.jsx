import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, FileText, Fuel, Wrench, Users, DollarSign, ShieldCheck, Package, BarChart2, MessageCircle, Navigation, Map, Clock, ChevronDown, Printer, Download, Archive, ClipboardList, Building2, Route } from 'lucide-react';

const Section = ({ icon: Icon, title, children }) => {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden print:shadow-none print:border-slate-300">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-4 bg-slate-50 hover:bg-slate-100 print:bg-white">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-amber-600" />
        </div>
        <span className="font-black text-slate-900 text-left flex-1">{title}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform print:hidden ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-5 py-4 text-sm text-slate-600 space-y-3">{children}</div>}
    </div>
  );
};

export default function SystemManual() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Print Header */}
      <div className="hidden print:block text-center py-4 border-b-2 border-slate-800 mb-4">
        <h1 className="text-2xl font-black text-slate-900">FleetCo Management — System Manual</h1>
        <p className="text-xs text-slate-500 mt-1">Confidential — For Authorized Users Only</p>
      </div>

      {/* Top Bar */}
      <div className="bg-slate-900 text-white print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">System Manual</h1>
            <p className="text-slate-400 text-xs">Complete guide to the FleetCo Management Platform</p>
          </div>
          <div className="flex gap-2">
            <Link to="/materials" className="px-4 py-2 text-sm font-bold bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400">
              ← Materials Hub
            </Link>
            <button onClick={() => window.print()} className="px-4 py-2 text-sm font-bold border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Introduction */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm print:shadow-none">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome to FleetCo Management</h2>
          <p className="text-slate-600 leading-relaxed">
            FleetCo Management is a comprehensive fleet operations platform designed to streamline every aspect of running a trucking 
            business. From vehicle tracking and maintenance scheduling to driver management, fuel optimization, load dispatching, 
            IFTA compliance, and financial reporting — FleetCo brings it all into one unified dashboard.
          </p>
          <p className="text-slate-600 mt-3 leading-relaxed">
            This manual covers every module in the platform. Use the table of contents below to jump to any section, or browse 
            sequentially for a complete walkthrough.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm print:shadow-none print:hidden">
          <h2 className="text-lg font-black text-slate-900 mb-3">Table of Contents</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              'Dashboard & Analytics', 'Fleet Units & Vehicles', 'Maintenance & Work Orders',
              'Parts Inventory & Vendors', 'Load Board & Dispatch', 'Fuel Management & IFTA',
              'Drivers & Payroll', 'HOS / ELD Compliance', 'Inspections & DVIR',
              'Route Builder & Navigation', 'Route Dashboard', 'Customer Management',
              'Reports & Exports', 'Messaging System', 'User Accounts & Roles', 'Service Templates',
              'Live Driver Tracking',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-600">
                <div className="w-5 h-5 bg-amber-100 rounded flex items-center justify-center text-[10px] font-black text-amber-700">{i + 1}</div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <Section icon={BarChart2} title="1. Dashboard & Analytics">
          <p>The Admin Dashboard is your home screen after login. It provides at-a-glance KPIs including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Active Vehicles</strong> — count of currently active power units and trailers</li>
            <li><strong>Open Loads</strong> — loads currently in transit or assigned</li>
            <li><strong>Fuel Spend</strong> — total fuel costs for the current period</li>
            <li><strong>Maintenance Due</strong> — upcoming and overdue service items</li>
            <li><strong>Pending Inspections</strong> — DVIR reports awaiting manager sign-off</li>
            <li><strong>Driver HOS Violations</strong> — recent hours-of-service compliance issues</li>
            <li><strong>Net Savings</strong> — calculated cost savings from fuel optimization and vendor contracts</li>
          </ul>
          <p className="mt-2">The <strong>Executive Dashboard</strong> provides aggregate P&L data across all customers, including revenue trends, expense breakdowns, and fleet-wide utilization rates. This view is restricted to executive-level users.</p>
          <p>The <strong>Fleet P&L</strong> page offers vehicle-level profitability analysis with revenue vs. cost per unit.</p>
        </Section>

        <Section icon={Truck} title="2. Fleet Units & Vehicles">
          <p>The Fleet Units page manages your entire vehicle inventory — both trucks (power units) and trailers.</p>
          <h4 className="font-bold text-slate-800 mt-2">Adding a Vehicle</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Click <strong>Add Vehicle</strong> and fill in unit number, type (truck/trailer), make, model, year</li>
            <li>Enter the <strong>VIN</strong> and click <strong>Decode</strong> to auto-fill specs from the NHTSA database</li>
            <li>Add purchase price and date for depreciation tracking</li>
            <li>Assign a driver and/or customer owner</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">Vehicle Statuses</h4>
          <p>Active, Inactive, In Shop, Waiting for Parts, Out of Service, Pending Inspection, Leased Out, Retired, Sold</p>
          <h4 className="font-bold text-slate-800 mt-2">Key Features</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Vehicle TCO</strong> — total cost of ownership analysis per unit</li>
            <li><strong>Depreciation Tracking</strong> — straight-line valuation over asset life</li>
            <li><strong>Vehicle History</strong> — complete maintenance and repair timeline</li>
            <li><strong>Repair Manuals</strong> — linked resources for mechanics</li>
          </ul>
        </Section>

        <Section icon={Wrench} title="3. Maintenance & Work Orders">
          <h4 className="font-bold text-slate-800">Preventive Maintenance</h4>
          <p>Schedule recurring service items by mileage or date intervals. The system tracks due/overdue status and sends notifications for upcoming service.</p>
          <h4 className="font-bold text-slate-800 mt-2">Work Orders</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create work orders with repair type, priority, and vehicle assignment</li>
            <li>Assign technicians and track status: Open → In Progress → Parts Ordered → Completed</li>
            <li>Add service task checklists with estimated labor times</li>
            <li>Record parts used, labor hours, and total costs</li>
            <li>Apply <strong>Service Templates</strong> for common jobs (brake job, PM service, etc.)</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">Maintenance Calendar</h4>
          <p>Visual calendar view of all scheduled and completed maintenance across your fleet.</p>
          <h4 className="font-bold text-slate-800 mt-2">Diagnostics</h4>
          <p>Log diagnostic trouble codes (DTCs) by vehicle with severity tracking and resolution workflow. Supports OBD-II and J1939 codes.</p>
        </Section>

        <Section icon={Archive} title="4. Parts Inventory & Vendors">
          <h4 className="font-bold text-slate-800">Parts Inventory</h4>
          <p>Track parts on hand with part numbers, quantities, cost, and supplier info. Link parts to work orders for cost tracking.</p>
          <h4 className="font-bold text-slate-800 mt-2">Vendors & Contracts</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Manage repair shops, parts suppliers, tire shops, towing services, fuel vendors, and weigh scales</li>
            <li>Track contract terms, labor rates, parts discounts, and expiration dates</li>
            <li>Weigh scale vendors include certification status and capacity</li>
          </ul>
        </Section>

        <Section icon={Package} title="5. Load Board & Dispatch">
          <p>The Load Board is the central hub for managing freight movements.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Creating Loads</strong> — enter load number, origin, destination, pickup/delivery dates, rate, miles, weight, commodity</li>
            <li><strong>Assigning</strong> — assign a driver, truck, and trailer to each load</li>
            <li><strong>Status Tracking</strong> — Available → Assigned → In Transit → Delivered → Cancelled</li>
            <li><strong>Weigh Scale</strong> — record scale weights, axle weights, and scale ticket info per load</li>
            <li><strong>Google Maps</strong> — click to navigate directly from loads</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">PD Command Tower</h4>
          <p>Visual map-based dispatch view showing all active loads and their current locations.</p>
        </Section>

        <Section icon={Fuel} title="6. Fuel Management & IFTA">
          <h4 className="font-bold text-slate-800">Fuel Logs</h4>
          <p>Record every fuel purchase: date, gallons, price per gallon, total cost, odometer, location, and fuel type (diesel, gasoline, DEF). Upload receipts for audit trail.</p>
          <h4 className="font-bold text-slate-800 mt-2">Fuel Stations</h4>
          <p>Interactive map of truck stops and fuel stations across North America with live diesel, gasoline, and DEF pricing. Prices refresh automatically every 30 minutes. Includes 14-day AI price prediction charts.</p>
          <h4 className="font-bold text-slate-800 mt-2">Fuel Audits</h4>
          <p>Review fuel spend by vehicle, driver, or date range. Compare actual costs against industry benchmarks.</p>
          <h4 className="font-bold text-slate-800 mt-2">IFTA Dashboard</h4>
          <p>Quarterly IFTA fuel tax reporting with state-by-state mileage and fuel breakdowns. Generate FMCSA-ready reports for filing.</p>
        </Section>

        <Section icon={Users} title="7. Drivers & Payroll">
          <h4 className="font-bold text-slate-800">Driver Management</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>View all drivers with status, assigned vehicles, and contact info</li>
            <li><strong>Driver Scorecards</strong> — performance metrics: on-time delivery, fuel efficiency, safety record, violations</li>
            <li><strong>Screening Records</strong> — track background checks, MVR reports, drug tests with expiration dates</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">Payroll</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Support for W2, 1099, Per Mile, Per Stop, Salary, and Hourly pay structures</li>
            <li><strong>Driver Payroll Summary</strong> — automated pay calculations based on miles, stops, and hours</li>
            <li>Pay periods, bonuses, deductions, and net pay tracking</li>
            <li>Payment method tracking (Direct Deposit, Check, Zelle, etc.)</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">Time Clock</h4>
          <p>Mechanics and technicians can clock in/out with time tracking entries linked to work orders.</p>
        </Section>

        <Section icon={ShieldCheck} title="8. HOS / ELD Compliance">
          <p>Hours of Service logs for FMCSA compliance:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Record daily duty status segments: Off Duty, Sleeper Berth, Driving, On Duty Not Driving</li>
            <li>Automatic violation detection for 11-hour, 14-hour, and 70-hour rules</li>
            <li>Driver certification with electronic signature</li>
            <li>Status workflow: Draft → Submitted → Reviewed</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">Compliance Tracker</h4>
          <p>Monitor document expirations: CDL, medical cards, drug tests, background checks, annual inspections.</p>
          <h4 className="font-bold text-slate-800 mt-2">Incident Reports</h4>
          <p>Log accidents, near misses, roadside inspections, CSA violations, cargo damage, and theft. Track severity, CSA points, insurance claims, and corrective actions.</p>
        </Section>

        <Section icon={ClipboardList} title="9. Inspections & DVIR">
          <p>Driver Vehicle Inspection Reports per FMCSA §396.11 and §396.13:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pre-Trip Checklist</strong> — standardized checklist covering all required inspection points</li>
            <li><strong>Inspection Types</strong> — Pre-Trip, Post-Trip, Annual DOT, Brake Inspection, Tire Inspection, Safety Check, Emissions</li>
            <li><strong>Defect Reporting</strong> — flag issues as OK, Defect, or N/A with notes</li>
            <li><strong>Digital Signatures</strong> — driver and manager sign-off with signature pad capture and employee number</li>
            <li><strong>Manager Workflow</strong> — when defects are found, inspections require manager review and sign-off</li>
            <li><strong>PDF Export</strong> — generate combined pre/post-trip DVIR reports for records</li>
          </ul>
        </Section>

        <Section icon={Map} title="10. Route Builder & Navigation">
          <h4 className="font-bold text-slate-800">Route Builder</h4>
          <p>Create delivery routes with multiple stops, assign drivers and vehicles, and visualize routes on an interactive map.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Add stops with recipient name, address, and delivery instructions</li>
            <li>Bulk CSV import for stops</li>
            <li>Drag-and-drop stop reordering</li>
            <li>Google Maps integration for turn-by-turn navigation</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">My Delivery Route</h4>
          <p>Driver-facing view showing assigned route with stop-by-stop details, proof of delivery (photo/signature capture), and delivery status tracking.</p>
          <h4 className="font-bold text-slate-800 mt-2">Fleet Map</h4>
          <p>Visual map showing all vehicle locations for real-time fleet tracking. Shows vehicle positions based on active load origins and live driver GPS locations.</p>
        </Section>

        <Section icon={Route} title="11. Route Dashboard">
          <p>Centralized view for monitoring all delivery routes, driver progress, and stop completion status.</p>
          <h4 className="font-bold text-slate-800">Key Features</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Daily Route Summaries</strong> — view all routes organized by driver and assigned vehicle</li>
            <li><strong>Stop Completion Timeline</strong> — visual progress through each route's stops with status indicators</li>
            <li><strong>Live Driver Locations</strong> — see real-time GPS positions with speed data (updates every 30 seconds)</li>
            <li><strong>Progress Tracking</strong> — percentage complete, completed/pending/failed stops per route</li>
            <li><strong>Overall Stats</strong> — total routes, stops completed, average progress across all drivers</li>
            <li><strong>Date Filtering</strong> — select any date to review historical route performance</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">Live Driver Tracking</h4>
          <p>When drivers clock in via Time Clock, they share their location (if permission granted). The system records:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>GPS coordinates (latitude/longitude)</li>
            <li>Speed in mph (calculated from GPS data)</li>
            <li>Assigned vehicle and trailer unit numbers</li>
            <li>Timestamp of last update</li>
          </ul>
          <p className="mt-2 text-xs text-slate-500 italic">Note: Location updates occur every 30 seconds while clocked in. Blue dots = real drivers, Amber dots = simulated/test drivers.</p>
        </Section>

        <Section icon={Building2} title="12. Customer Management">
          <p>The Customers & Team page is your hub for managing client accounts and internal staff:</p>
          <h4 className="font-bold text-slate-800">Customers Tab</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Add customer companies with contact info, MC/DOT numbers, and fleet size</li>
            <li>Assign Fleet Managers and Fleet Coordinators to each account</li>
            <li>Create portal logins so customers can access their own fleet data</li>
            <li>Send password reset links directly</li>
            <li>Message customers through the built-in chat panel</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">Team & Access Tab</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create user accounts with email, temp password, role, and employee number</li>
            <li>Role hierarchy: Executive → Fleet Manager → Fleet Coordinator → User</li>
            <li>Toggle account suspension/reactivation</li>
            <li>Delete users permanently</li>
          </ul>
        </Section>

        <Section icon={FileText} title="13. Reports & Exports">
          <p>The Reports module provides centralized access to all platform data exports:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Browse reports by category: Fuel, Maintenance, Financial, Compliance, Operations</li>
            <li>Customize date ranges and select specific columns before export</li>
            <li>Download as Excel (.xlsx) for further analysis</li>
            <li>Print-ready formatting for physical record keeping</li>
          </ul>
          <p className="mt-2">Available reports include fuel summaries, maintenance history, inspection logs, payroll summaries, IFTA filings, incident reports, and fleet utilization metrics.</p>
        </Section>

        <Section icon={MessageCircle} title="14. Messaging System">
          <p>Built-in private messaging for team communication:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Direct messaging between drivers and fleet managers/coordinators</li>
            <li>Customer-to-account-rep messaging for portal users</li>
            <li>Read receipts and real-time message delivery</li>
          </ul>
        </Section>

        <Section icon={Users} title="15. User Accounts & Role Permissions">
          <h4 className="font-bold text-slate-800">Role Hierarchy</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-200 px-3 py-2 text-left">Role</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">Access Level</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-slate-200 px-3 py-2 font-bold">Executive</td><td className="border border-slate-200 px-3 py-2">Full platform access, all customers, team management, financials</td></tr>
                <tr><td className="border border-slate-200 px-3 py-2 font-bold">Fleet Manager</td><td className="border border-slate-200 px-3 py-2">Manage assigned customers, create accounts, full operational access</td></tr>
                <tr><td className="border border-slate-200 px-3 py-2 font-bold">Fleet Coordinator</td><td className="border border-slate-200 px-3 py-2">View/update assigned customer data, document review</td></tr>
                <tr><td className="border border-slate-200 px-3 py-2 font-bold">User</td><td className="border border-slate-200 px-3 py-2">Customer portal access — fleet data, operations, reports</td></tr>
              </tbody>
            </table>
          </div>
          <h4 className="font-bold text-slate-800 mt-3">Account Creation</h4>
          <p>Executives and Fleet Managers create accounts from the Team tab. New users receive a welcome email with their temporary password and must change it on first login.</p>
        </Section>

        <Section icon={ClipboardList} title="16. Service Templates">
          <p>Create reusable maintenance task checklists for common jobs:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Define template name and repair type category</li>
            <li>Add sequential task list with estimated time per task</li>
            <li>Total estimated labor hours calculated automatically</li>
            <li>Apply templates to work orders to instantly populate task checklists</li>
          </ul>
        </Section>

        <Section icon={Navigation} title="17. Live Driver Tracking & Vehicle Assignment">
          <h4 className="font-bold text-slate-800">Vehicle Assignment at Clock-In</h4>
          <p>Drivers must select their assigned vehicle before clocking in via the Time Clock page:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Vehicle Selection</strong> — choose from active fleet trucks or mark as "POV" (Personal Vehicle)</li>
            <li><strong>Trailer Assignment</strong> — optionally select a trailer to attach to the truck</li>
            <li><strong>Conflict Prevention</strong> — system blocks clock-in if another driver is already using the selected unit</li>
            <li><strong>Location Tracking</strong> — GPS coordinates, speed, and heading recorded every 30 seconds while clocked in</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">Where to See Live Data</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Fleet Map</strong> — shows all driver locations with vehicle/trailer info in popups</li>
            <li><strong>Route Dashboard</strong> — displays live driver status with speed indicators on assigned routes</li>
            <li><strong>Navigation Page</strong> — shows active drivers and their current coordinates</li>
          </ul>
          <h4 className="font-bold text-slate-800 mt-2">Privacy & Permissions</h4>
          <p>Drivers must grant location permission when prompted. Location sharing is automatic only while clocked in and stops when clocking out.</p>
        </Section>

        {/* Footer */}
        <div className="text-center py-8 text-slate-400 text-xs border-t border-slate-200 print:border-slate-400">
          <p>FleetCo Management Platform — System Manual</p>
          <p>© {new Date().getFullYear()} FleetCo Management. All rights reserved.</p>
          <p className="mt-1">For support, contact your Fleet Manager or account representative.</p>
        </div>

        {/* Print button fixed at bottom */}
        <div className="fixed bottom-6 right-6 print:hidden z-40">
          <button onClick={() => window.print()} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <Download className="w-5 h-5" /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
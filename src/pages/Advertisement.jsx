import React, { useState } from 'react';
import { Truck, Phone, Globe, Printer, Download, ChevronRight, Shield, Fuel, Wrench, FileText, BookOpen, CreditCard, Megaphone, Star, Users, BarChart3, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

const TABS = [
  { id: 'manual', icon: BookOpen, label: 'System Manual' },
  { id: 'brochure', icon: Megaphone, label: 'Brochure' },
  { id: 'cards', icon: CreditCard, label: 'Business Cards' },
];

export default function Advertisement() {
  const [activeTab, setActiveTab] = useState('manual');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Advertisement</h1>
          <p className="text-slate-500 text-sm mt-0.5">Marketing materials, system documentation, and business cards for leadership</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'manual' && <SystemManualTab />}
      {activeTab === 'brochure' && <BrochureTab />}
      {activeTab === 'cards' && <BusinessCardsTab />}
    </div>
  );
}

// ─── System Manual Tab ───
const MANUAL_SECTIONS = [
  {
    title: 'Dashboard & Analytics', icon: FileText,
    content: 'OVERVIEW\nThe Dashboard is your home screen after logging in. It shows real-time KPIs so you can assess fleet health in seconds.\n\nWHAT YOU SEE:\n• Active Vehicles — count of trucks and trailers currently in operation.\n• Open Loads — freight that is assigned or in transit.\n• Fuel Spend — total fuel costs for the current period.\n• Maintenance Due — upcoming and overdue service items by date or mileage.\n• Pending Inspections — DVIR reports awaiting manager sign-off.\n• Driver HOS Violations — recent hours-of-service compliance flags.\n• Net Savings — calculated from fuel optimization and vendor contract discounts.\n\nHOW TO USE:\n1. Log in to the portal at fleetcomanagement.org.\n2. After login, you land on the Admin Dashboard automatically.\n3. Scan the KPI cards at the top — each card shows a count or dollar amount.\n4. Click any card to drill into the linked module (e.g., click "Open Loads" to go to the Load Board).\n5. Below the KPIs, the Activity Feed shows recent platform events — new loads, completed work orders, signed DVIRs.\n\nEXECUTIVE DASHBOARD\nAvailable only to Executive users. Shows aggregate P&L across all customers:\n• Revenue trends over time.\n• Top expense categories.\n• Fleet-wide utilization rates.\n• Net margin per customer.\nAccess from sidebar: Executive View.\n\nFLEET P&L\nVehicle-level profitability analysis:\n1. Open Fleet P&L from the sidebar.\n2. Select a date range.\n3. View revenue vs. cost per unit.\n4. Export data to Excel for further analysis.'
  },
  {
    title: 'Fleet Units & Vehicles', icon: Truck,
    content: 'OVERVIEW\nThe Fleet Units page is your central vehicle inventory. It tracks every truck (power unit) and trailer in your operation.\n\nADDING A VEHICLE — STEP BY STEP:\n1. Navigate to Fleet Units from the sidebar.\n2. Click the "Add Vehicle" button at the top right.\n3. Fill in the form fields:\n   a. Unit Number — your internal identifier (e.g., "TRK-001").\n   b. Unit Type — select "truck" for power units or "trailer" for trailers.\n   c. Make, Model, Year — manufacturer details.\n   d. VIN — enter the 17-character VIN and click "Decode" to auto-fill specs from NHTSA.\n   e. License Plate — state plate number.\n   f. Purchase Price & Date — for depreciation tracking.\n   g. Odometer — current reading.\n   h. Status — set the current operational status.\n   i. Assigned Driver — select from your driver roster.\n   j. Assigned Customer — for customer-scoped fleets.\n   k. For trailers: select Trailer Type (Dry Van, Reefer, Flatbed, etc.) and Length.\n4. Click "Save" to add the vehicle.\n\nVEHICLE STATUSES:\n• Active — in service and available.\n• Inactive — temporarily out of rotation.\n• In Shop — at a repair facility.\n• Waiting for Parts — shop work paused awaiting components.\n• Out of Service — not roadworthy.\n• Pending Inspection — awaiting DOT or annual check.\n• Leased Out, Retired, Sold.\n\nEDITING A VEHICLE:\n1. Find the vehicle card on the Fleet page.\n2. Click the "Edit" button.\n3. Update any fields as needed.\n4. Click "Save".\n\nKEY FEATURES ON EACH VEHICLE CARD:\n• Vehicle TCO — total cost of ownership with depreciation curve and cost-per-mile.\n• Vehicle History — complete maintenance and repair timeline.\n• Repair Manuals — linked resources for mechanics.\n• Document Vault — upload and store registration, title, insurance.\n\nDELETING:\nOnly Executive and Fleet Manager roles can delete. Click the trash icon and confirm.'
  },
  {
    title: 'Maintenance & Work Orders', icon: Wrench,
    content: 'OVERVIEW\nThis module covers preventive maintenance scheduling, work order management, and vehicle diagnostic tracking.\n\nPREVENTIVE MAINTENANCE (PM)\n1. Navigate to Preventive Maint. from the sidebar.\n2. Click "Add Schedule" to create a new PM entry.\n3. Select the vehicle, service type (Oil Change, Brake Service, etc.).\n4. Set due date and/or due mileage.\n5. Optionally set recurring intervals (every X miles or X days) for auto-rescheduling.\n6. The system automatically flags overdue items in red.\n7. When service is completed, click the item and mark it "Completed".\n\nWORK ORDERS — STEP BY STEP:\n1. Navigate to Work Orders from the sidebar.\n2. Click "New Work Order".\n3. Fill in:\n   a. WO Number — auto-generated or custom.\n   b. Title — short description of the job.\n   c. Repair Type — category (Engine, Brakes, Electrical, etc.).\n   d. Priority — Low, Medium, High, Critical.\n   e. Vehicle — select the unit being serviced.\n   f. Assigned Tech — assign a mechanic.\n   g. Dates — opened date and due date.\n   h. Odometer — at time of service.\n   i. Complaint — what the driver reported.\n4. Click "Save" to create the work order.\n\nWORK ORDER WORKFLOW:\n• Open → In Progress → Parts Ordered (if needed) → Completed.\n• Add service tasks (checklist items) with estimated minutes each.\n• Mark tasks complete as the mechanic finishes them.\n• Add parts used: enter part number, description, quantity, unit cost.\n• Labor hours and total costs auto-calculate.\n• Apply a Service Template to instantly populate task checklists for common jobs.\n\nMAINTENANCE CALENDAR:\n1. Open Maint. Calendar from the sidebar.\n2. View all scheduled and completed maintenance on a monthly calendar.\n3. Click any event to see details or edit.\n\nDIAGNOSTICS:\n1. Open Diagnostics from the sidebar.\n2. Click "Add Diagnostic Code".\n3. Select vehicle, enter DTC code (e.g., P0301, SPN 100).\n4. Choose system (Engine, Transmission, Brakes/ABS, etc.).\n5. Set severity (Info, Warning, Critical).\n6. Choose connector type (OBD-II, J1939, J1708, or Manual Entry).\n7. Log scan date, odometer, and scanned-by.\n8. Link to a work order if repairs are needed.\n9. Update status when resolved: Active → Resolved or Monitoring.'
  },
  {
    title: 'Parts Inventory & Vendors', icon: FileText,
    content: 'PARTS INVENTORY\nTrack all parts across your shop and vehicles.\n\nADDING A PART:\n1. Navigate to Parts Inventory from the sidebar.\n2. Click "Add Part".\n3. Enter part number, description, category.\n4. Enter quantity on hand and minimum stock threshold.\n5. Set unit cost and supplier name.\n6. Optionally link to a vendor.\n7. Click "Save".\n\nMANAGING INVENTORY:\n• View all parts in a searchable table.\n• Filter by category, supplier, or low stock.\n• Low stock items highlight in amber/red.\n• Parts are automatically deducted when used on work orders.\n• Update quantities manually when restocking.\n\nVENDORS & CONTRACTS\nManage your network of service providers.\n\nADDING A VENDOR:\n1. Navigate to Vendors & Contracts from the sidebar.\n2. Click "Add Vendor".\n3. Select vendor type: Repair Shop, Parts Supplier, Tire Shop, Towing, Fuel, Body Shop, Weigh Scale, Other.\n4. Enter company name and contact details.\n5. Add point of contact (POC) name, title, phone, email.\n6. Enter address with city, state, zip.\n7. Upload or enter contract details:\n   a. Contract number.\n   b. Start and end dates.\n   c. Labor rate (hourly).\n   d. Parts discount percentage.\n8. For weigh scales: check "Scale Certified", enter max capacity, operating hours, and fee.\n9. Add specialties (makes or systems they excel at).\n10. Click "Save".\n\nUSING VENDORS:\n• Search and filter vendors by type, status, or location.\n• Click a vendor card to view full details.\n• Track contract expiration — vendors with expiring contracts highlight.\n• Link vendors to work orders when outsourcing repairs.'
  },
  {
    title: 'Load Board & Dispatch', icon: FileText,
    content: 'OVERVIEW\nThe Load Board is your freight management hub. Every shipment starts here.\n\nCREATING A LOAD — STEP BY STEP:\n1. Navigate to Load Board from the sidebar.\n2. Click "Add Load".\n3. Fill in the form:\n   a. Load Number — your tracking ID (e.g., "LD-001").\n   b. Origin — pickup city and state.\n   c. Destination — delivery city and state.\n   d. Pickup Date and Delivery Date.\n   e. Rate — the amount being paid for this load.\n   f. Miles — estimated trip distance.\n   g. Weight — cargo weight.\n   h. Commodity — type of freight.\n   i. Broker — if brokered, enter broker name.\n4. Click "Save". The load is created with status "Available".\n\nASSIGNING A LOAD:\n1. Find the load on the board.\n2. Click "Edit" or click directly on the load.\n3. Select:\n   a. Assigned Driver from the dropdown.\n   b. Assigned Vehicle (truck/power unit).\n   c. Assigned Trailer if needed.\n4. Change status to "Assigned".\n5. Click "Save".\n\nLOAD STATUS FLOW:\n• Available → unassigned, ready for dispatch.\n• Assigned → driver and equipment selected.\n• In Transit → driver is en route.\n• Delivered → freight arrived at destination.\n• Cancelled → load was dropped.\n\nWEIGH SCALE:\n1. On any load, click the scale icon.\n2. Enter actual scale weight in pounds.\n3. Optionally enter individual axle weights (steer, drive, trailer).\n4. Record scale location, ticket number, and date.\n5. Scale status automatically updates: Pass, Overweight, or Reweigh Needed.\n\nNAVIGATION:\n• Click the navigation icon on any load to open Google Maps with directions from origin to destination.\n\nPD COMMAND TOWER:\nVisual map-based dispatch view showing all active loads on a map with driver and vehicle assignments.\n\nCUSTOMER NOTES:\n• Customer-scoped users see only their own loads.\n• External portal users can view load status but cannot edit.'
  },
  {
    title: 'Fuel Management & IFTA', icon: Fuel,
    content: 'OVERVIEW\nTrack every gallon, optimize purchasing, and file IFTA reports — all from one module.\n\nFUEL LOGS — RECORDING A PURCHASE:\n1. Navigate to Fuel Audits from the sidebar.\n2. Click "Add Fuel Log".\n3. Enter:\n   a. Vehicle — which unit was fueled.\n   b. Driver — who made the purchase.\n   c. Date — purchase date.\n   d. Gallons — amount purchased.\n   e. Price per Gallon.\n   f. Total Cost — auto-calculates from gallons × price.\n   g. Odometer Reading — current odometer at time of fill.\n   h. Location — city and state of fuel stop.\n   i. Fuel Type — Diesel, Gasoline, or DEF.\n4. Optionally upload a receipt image.\n5. Click "Save".\n\nFUEL STATIONS:\n1. Navigate to Fuel Stations from the sidebar.\n2. View an interactive map with truck stops across North America.\n3. Each pin shows the station name, diesel price, gasoline price, and DEF price.\n4. Use the search bar to find stations by city or name.\n5. Switch between Map view, List view, and Predictions.\n6. Predictions tab shows 14-day AI price forecasts to help you decide when to fill.\n7. Prices auto-refresh every 30 minutes.\n8. Click any station to update pricing manually if you have current data.\n\nFUEL AUDITS:\n1. Navigate to Fuel Audits from the sidebar.\n2. Review all fuel purchases in a filterable table.\n3. Filter by vehicle, driver, date range, or fuel type.\n4. View total spend and gallons for the filtered period.\n5. Compare costs against industry benchmarks.\n\nIFTA DASHBOARD — QUARTERLY REPORTING:\n1. Navigate to IFTA Dashboard from the sidebar.\n2. Select the quarter and year.\n3. The system auto-generates:\n   a. Total miles driven per state.\n   b. Total gallons purchased per state.\n   c. Average MPG per state.\n   d. Tax liability summary.\n4. Review the summary and verify against your fuel logs.\n5. Click "Export" to download an FMCSA-ready report.\n6. File with your base jurisdiction.'
  },
  {
    title: 'Drivers & Payroll', icon: FileText,
    content: 'DRIVER MANAGEMENT\nView and manage your driver roster.\n\nVIEWING DRIVERS:\n1. Navigate to Drivers from the sidebar.\n2. See all drivers as profile cards with:\n   a. Name and status (active, suspended).\n   b. Assigned vehicle.\n   c. Contact information.\n   d. Employee number.\n3. Click any driver card to open their full profile.\n\nDRIVER SCORECARDS:\n1. Navigate to Driver Scorecards from the sidebar.\n2. View performance metrics per driver:\n   a. On-time delivery percentage.\n   b. Fuel efficiency (MPG).\n   c. Safety score.\n   d. Violations count.\n3. Compare drivers side-by-side.\n\nSCREENING RECORDS:\n1. From the Drivers page, click into a driver\'s profile.\n2. Switch to the Screening tab.\n3. View or add:\n   a. Background checks — provider, status, dates, report.\n   b. MVR reports — violations, expiration.\n   c. Drug tests — results, expiration.\n4. The system flags expired screenings in red.\n\nPAYROLL\nManage driver compensation.\n\nCREATING A PAYROLL RECORD:\n1. Navigate to Payroll from the sidebar.\n2. Click "Add Payroll Record".\n3. Select driver and pay type:\n   a. W2 — hourly with tax withholding.\n   b. 1099 — contractor basis.\n   c. Per Mile — rate × miles driven.\n   d. Per Stop — rate × stops completed.\n   e. Salary — fixed amount per period.\n   f. Hourly — rate × hours worked.\n4. Set pay period start and end dates.\n5. Enter relevant metrics (hours, miles, stops).\n6. Add bonuses and deductions.\n7. Net pay auto-calculates.\n8. Set status: Draft → Approved → Paid.\n9. Choose payment method (Direct Deposit, Check, Zelle, etc.).\n\nDRIVER PAYROLL SUMMARY:\n1. Navigate to Driver Payroll Summary from the sidebar.\n2. View auto-calculated pay per driver based on their pay type.\n3. Review per period before approving.\n\nTIME CLOCK (for mechanics):\n1. Navigate to Time Clock from the sidebar.\n2. Click "Clock In" at start of shift.\n3. Optionally link to a work order.\n4. Click "Clock Out" at end of shift.\n5. View time entries with total hours.'
  },
  {
    title: 'HOS / ELD Compliance', icon: Shield,
    content: 'OVERVIEW\nHours of Service logs per FMCSA regulations. Track driver duty status, detect violations, and maintain compliance records.\n\nCREATING AN HOS LOG — STEP BY STEP:\n1. Navigate to HOS / ELD Logs from the sidebar.\n2. Click "Add HOS Log".\n3. Fill in the log header:\n   a. Driver — select the driver.\n   b. Vehicle — select the truck.\n   c. Log Date — date of the record.\n   d. Carrier Name — your company name.\n   e. Main Office Address.\n   f. Starting and Ending Locations.\n   g. Odometer Start and End.\n   h. Total Miles — auto-calculates.\n4. Add duty segments for the 24-hour period:\n   a. For each segment, select status: Off Duty, Sleeper Berth, Driving, or On Duty (Not Driving).\n   b. Enter start time and end time (HH:MM format).\n   c. Enter location for each status change.\n   d. Add notes if needed.\n5. Hours per category auto-calculate.\n6. The system automatically checks for violations:\n   a. 11-hour driving limit.\n   b. 14-hour on-duty limit.\n   c. 70-hour/8-day limit.\n7. Any violations appear in the violations list.\n8. Optionally enter co-driver ID and shipping document numbers.\n\nDRIVER CERTIFICATION:\n1. Review the completed log.\n2. Check "Driver certifies this log is true and correct".\n3. Sign electronically (draw signature on the pad).\n4. The log status changes from Draft to Submitted.\n\nMANAGER REVIEW:\n1. Open logs from the HOS page.\n2. Filter by status "Submitted".\n3. Review each log for accuracy.\n4. Change status to "Reviewed" when approved.\n\nCOMPLIANCE TRACKER:\n1. Navigate to Compliance Tracker from the sidebar.\n2. Monitor expiration dates for:\n   a. CDL licenses.\n   b. Medical cards.\n   c. Drug tests.\n   d. Background checks.\n   e. Annual vehicle inspections.\n3. Expired or expiring items highlight for attention.\n\nINCIDENT REPORTS:\n1. Navigate to Incident Reports from the sidebar.\n2. Click "Add Incident".\n3. Select type: Accident, Near Miss, Roadside Inspection, CSA Violation, Cargo Damage, Theft, Weather.\n4. Enter date, time, location, driver, vehicle.\n5. Describe the incident in detail.\n6. Record police report number if applicable.\n7. Check "DOT Recordable" if it qualifies.\n8. Log any citations or CSA violations with point values.\n9. Enter insurance claim number and estimated damage cost.\n10. Track status: Open → Under Review → Closed.\n11. Add corrective actions to prevent recurrence.'
  },
  {
    title: 'Inspections & DVIR', icon: FileText,
    content: 'OVERVIEW\nDriver Vehicle Inspection Reports per FMCSA §396.11 and §396.13. All inspections support digital signatures and manager sign-off workflows.\n\nPRE-TRIP INSPECTION — STEP BY STEP:\n1. Navigate to Pre-Trip Checklist from the sidebar.\n2. Select your vehicle and inspection date.\n3. Work through the checklist items covering:\n   a. Engine compartment (fluids, belts, hoses).\n   b. Lights and reflectors.\n   c. Tires, wheels, and rims.\n   d. Brakes and air system.\n   e. Coupling devices.\n   f. Cargo securement.\n   g. Emergency equipment.\n4. For each item, mark: OK, Defect, or N/A.\n5. Add notes for any defects found.\n6. If defects are found, check "Defects Corrected" if fixed before departure.\n7. Check "Vehicle condition is satisfactory" to certify.\n8. Sign using the digital signature pad.\n9. Your employee number is recorded automatically.\n10. Click "Submit".\n\nFULL INSPECTIONS (from Inspections page):\n1. Navigate to Inspections from the sidebar.\n2. Click "Add Inspection".\n3. Select inspection type: Pre-Trip, Post-Trip, Annual DOT, Brake, Tire, Safety, Emissions, Custom.\n4. Select vehicle and date.\n5. Enter inspector name, odometer, trailer number if applicable.\n6. Populate items checked with results.\n7. If defects found: the system sets "Manager Signoff Required" to true.\n8. Driver signs digitally.\n9. Status becomes "Awaiting Signoff" for the manager.\n\nMANAGER SIGN-OFF WORKFLOW:\n1. A banner appears on the Dashboard when inspections await sign-off.\n2. Navigate to Inspections, filter by "Awaiting Signoff".\n3. Click the inspection to open the DVIR Signoff Modal.\n4. Review all defects and corrective actions.\n5. Enter manager notes.\n6. Sign using the digital signature pad with employee number.\n7. Click "Sign Off".\n8. Inspection status updates to "Passed".\n\nEXPORT PDF:\n1. From the Inspections page, click "Export PDF".\n2. The system generates a combined report of all inspections for the selected date range.\n3. Includes both pre-trip and post-trip records.\n4. Includes defect summaries and signature logs.\n5. Save or print the PDF.'
  },
  {
    title: 'Route Builder & Navigation', icon: FileText,
    content: 'OVERVIEW\nPlan and manage delivery routes with multiple stops, visual mapping, and driver tools.\n\nROUTE BUILDER — STEP BY STEP:\n1. Navigate to Route Builder from the sidebar.\n2. Click "New Route".\n3. Enter route name and scheduled date.\n4. Select driver and vehicle.\n5. Add stops one by one:\n   a. Click "Add Stop".\n   b. Enter recipient name, phone, and full address.\n   c. Add delivery notes (gate codes, access instructions).\n   d. Enter package description.\n   e. Stops auto-sequence in order added.\n6. Drag and drop stops to reorder.\n7. View the route on the interactive map.\n\nBULK CSV IMPORT:\n1. Click "Import CSV".\n2. Upload a CSV file with columns: recipient_name, address, city, state, zip, phone, notes, package.\n3. All stops are created automatically.\n4. Verify the map view for correct stop locations.\n\nMY DELIVERY ROUTE (Driver View):\n1. Drivers navigate to My Delivery Route from the sidebar.\n2. See their assigned route with all stops.\n3. Each stop shows: address, recipient, phone, notes, package.\n4. At each stop, the driver can:\n   a. Mark as "Delivered" or "Attempted".\n   b. Take a proof-of-delivery photo.\n   c. Capture recipient signature.\n   d. Add delivery notes.\n5. Route progress shows completed vs. total stops.\n\nFLEET MAP:\n1. Navigate to Fleet Map from the sidebar.\n2. View all vehicle locations on a map.\n3. Click vehicle pins to see details.\n\nNAVIGATION:\n1. Navigate to Navigation from the sidebar.\n2. Enter origin and destination.\n3. Click to open Google Maps with turn-by-turn directions.'
  },
  {
    title: 'Customer Management', icon: FileText,
    content: 'OVERVIEW\nThe Customers & Team page is your hub for managing client accounts and internal staff — now combined on one page.\n\nCUSTOMERS TAB:\n\nADDING A CUSTOMER:\n1. Navigate to Customers & Team from the sidebar.\n2. Ensure you are on the "Customers" tab.\n3. Click "Add Customer".\n4. Fill in company information:\n   a. Company Name, Contact Name, Email, Phone.\n   b. Address: street, city, state, zip.\n   c. MC Number and DOT Number (if applicable).\n   d. Fleet Size — number of vehicles they operate.\n   e. Status — Active, Inactive, or Prospect.\n   f. Notes — internal notes visible to your team only.\n5. Assign a Fleet Manager and/or Fleet Coordinator from the dropdowns.\n6. Optionally create a portal login:\n   a. Enter a temporary password.\n   b. Select the portal role (typically "user").\n   c. The system sends a welcome email with credentials.\n7. Click "Save".\n\nMANAGING CUSTOMERS:\n• View all customers as cards or filter by status/search.\n• Click "Edit" to update company details or assignments.\n• Click the message icon to open a chat panel with the customer.\n• Click the key icon to send a password reset link.\n• Click the trash icon to delete (Executive only).\n\nTEAM & ACCESS TAB:\n\nCREATING A USER ACCOUNT:\n1. Switch to the "Team & Access" tab.\n2. Scroll to the "Create New Account" section.\n3. Enter:\n   a. Email — the user\'s email address.\n   b. Temp Password — a temporary password they\'ll change on first login.\n   c. Role — User, Fleet Manager, or Fleet Coordinator.\n   d. Employee Number — optional internal ID.\n4. Click "Create Account".\n5. The user receives a welcome email with login instructions and their temporary password.\n6. On first login, the system prompts them to change their password.\n\nROLES REFERENCE:\n• User — customer portal access. Sees only their own fleet data.\n• Fleet Coordinator — internal. View/update assigned customer documents.\n• Fleet Manager — internal. Full access to assigned customers, can create accounts.\n• Executive — internal. Full platform access, all customers, team management, financials.\n\nMANAGING USERS:\n• View all users in a searchable table.\n• Change roles using the dropdown next to any user.\n• Toggle account status (Active/Suspended) with the power button.\n• Send password reset emails with the key icon.\n• Delete users permanently with the trash icon (Executive/Fleet Manager only).'
  },
  {
    title: 'Reports & Exports', icon: FileText,
    content: 'OVERVIEW\nCentralized data exports for every module. Download as Excel, print, or archive.\n\nUSING THE REPORTS MODULE:\n1. Navigate to Reports from the sidebar.\n2. Browse report cards grouped by category:\n   a. Fuel — fuel purchase summaries, cost-per-mile.\n   b. Maintenance — work order history, PM compliance.\n   c. Financial — revenue, expenses, P&L.\n   d. Compliance — inspections, HOS, incidents.\n   e. Operations — loads, routes, utilization.\n3. Click any report card to open its configuration modal.\n\nCONFIGURING A REPORT:\n1. After clicking a report, the Report Config Modal opens.\n2. Set your date range — use presets (Last 7 days, Last 30 days, This Quarter, etc.) or custom dates.\n3. Select which columns to include in the export.\n4. Click "Generate & Download".\n5. The report downloads as an Excel (.xlsx) file.\n\nAVAILABLE REPORTS:\n• Fuel Summary — all fuel purchases with cost analysis.\n• Maintenance History — completed work orders with costs.\n• Inspection Log — all DVIR records with defect summary.\n• Payroll Summary — driver pay with breakdowns.\n• IFTA Filing — quarterly state-by-state data.\n• Incident Log — all reported incidents with severity.\n• Fleet Utilization — vehicle usage metrics.\n\nPRINTING:\n• Use the browser print function (Ctrl+P / Cmd+P) on any page for a print-optimized view.\n• Reports pages include print-friendly CSS.'
  },
  {
    title: 'Messaging System', icon: FileText,
    content: 'OVERVIEW\nBuilt-in private messaging for team communication between drivers, managers, and customers.\n\nFOR INTERNAL USERS (Manager/Coordinator/Executive):\n1. Navigate to Messages from the sidebar.\n2. The left panel shows all drivers with active conversations.\n3. Click a driver to open the conversation.\n4. Type your message and press Enter or click Send.\n5. Messages are delivered in real time.\n6. Unread messages show a badge on the driver\'s name.\n\nFOR DRIVERS:\n1. Navigate to Messages from the sidebar.\n2. You see your conversation with fleet management.\n3. Send and receive messages in real time.\n\nFOR CUSTOMER PORTAL USERS:\n1. Navigate to Messages from the sidebar.\n2. You see a conversation panel with your assigned fleet manager and coordinator.\n3. Send messages directly to your account representatives.\n\nHOW IT WORKS:\n• Each conversation is grouped by conversation_id.\n• Read receipts track when messages are seen.\n• Messages persist indefinitely — full history is available.'
  },
  {
    title: 'User Accounts & Roles', icon: FileText,
    content: 'ROLE HIERARCHY\n\nEXECUTIVE:\n• Full platform access.\n• View all customers and their data.\n• Create and manage team accounts.\n• Access financials, P&L, executive dashboard.\n• Manage sidebar module preferences.\n• Access Advertisement and Dev Feedback.\n\nFLEET MANAGER:\n• Full operational access to assigned customers.\n• Create user accounts (User, Fleet Coordinator roles).\n• Manage vehicles, work orders, loads, inspections.\n• View reports and analytics for assigned customers.\n• Send password resets to assigned customers.\n\nFLEET COORDINATOR:\n• View and update assigned customer data.\n• Review documents, inspections, and reports.\n• Cannot create accounts or access executive views.\n\nUSER (Customer Portal):\n• Access only their own fleet data.\n• View vehicles, loads, fuel, maintenance, inspections.\n• Use messaging to contact account reps.\n• Cannot see internal team, executive, or other customer data.\n• Cannot create accounts.\n\nACCOUNT LIFECYCLE:\n1. An Executive or Fleet Manager creates the account from the Team tab.\n2. The system sends a welcome email with the user\'s email and temporary password.\n3. The user logs in for the first time using the temporary password.\n4. The system prompts them to change their password.\n5. Once changed, the account is fully activated.\n6. If a user forgets their password, they contact an admin who sends a reset link.\n\nCHANGING YOUR OWN PASSWORD:\n1. Click "Change Password" at the bottom of the sidebar.\n2. Enter your current password.\n3. Enter and confirm your new password.\n4. Click "Update Password".\n\nSIDEBAR MODULE PREFERENCES:\n1. Click "Module Preferences" at the bottom of the sidebar.\n2. Toggle which navigation groups appear in your sidebar.\n3. Preferences save automatically and persist across sessions.'
  },
  {
    title: 'Service Templates', icon: FileText,
    content: 'OVERVIEW\nCreate reusable maintenance task checklists that can be applied to work orders instantly.\n\nCREATING A SERVICE TEMPLATE:\n1. Navigate to Service Templates from the sidebar.\n2. Click "Add Template".\n3. Enter:\n   a. Template Name — e.g., "Brake Job — Standard" or "PM Service — 15K Mile".\n   b. Repair Type — category (Engine, Brakes, Preventive Maintenance, etc.).\n4. Add tasks to the checklist:\n   a. Click "Add Task".\n   b. Enter a sequence number (1, 2, 3...).\n   c. Enter the task description.\n   d. Enter estimated minutes for this task.\n   e. Repeat for each task in the procedure.\n5. The system auto-calculates total estimated labor hours.\n6. Add any notes about the template.\n7. Click "Save".\n\nUSING A TEMPLATE ON A WORK ORDER:\n1. When creating or editing a work order, find the "Apply Template" dropdown.\n2. Select the desired template.\n3. All tasks are instantly populated into the work order\'s service task list.\n4. Each task includes its estimated minutes.\n5. The mechanic checks off tasks as they are completed.\n6. The work order tracks who completed each task and when.\n\nMANAGING TEMPLATES:\n• Edit existing templates to refine task lists.\n• Delete outdated templates.\n• Templates are shared across all users — create once, use many times.'
  },
];

function SystemManualTab() {
  const [expandedSections, setExpandedSections] = useState(() => {
    const initial = {};
    MANUAL_SECTIONS.forEach((_, i) => { initial[i] = true; });
    return initial;
  });
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const toggleSection = (idx) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const generateManualPdf = async () => {
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const addPageIfNeeded = (needed) => {
        if (y + needed > 280) { doc.addPage(); y = 20; }
      };

      // Cover page
      doc.setFillColor(20, 20, 30);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, 210, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.text('FleetCo Management', 105, 120, { align: 'center' });
      doc.setFontSize(13);
      doc.setTextColor(245, 158, 11);
      doc.text('SYSTEM USER MANUAL', 105, 135, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(160, 160, 160);
      doc.text('Complete Platform Reference Guide', 105, 150, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 168, { align: 'center' });
      doc.addPage();
      y = 20;

      // Render each section
      MANUAL_SECTIONS.forEach((section, idx) => {
        addPageIfNeeded(35);
        // Section header bar
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 5, contentWidth, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text(`${idx + 1}. ${section.title}`, margin + 3, y + 2);
        y += 14;

        // Section content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(section.content, contentWidth - 4);
        for (const line of lines) {
          addPageIfNeeded(7);
          doc.text(line, margin + 2, y);
          y += 4.5;
        }
        y += 5;
      });

      // Page numbers
      doc.setTextColor(140, 140, 140);
      doc.setFontSize(7);
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`FleetCo Management — System Manual — Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }

      doc.save('FleetCo_System_Manual.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-2">FleetCo Management Platform Manual</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              A comprehensive operations platform covering fleet tracking, maintenance, dispatch, fuel optimization, 
              IFTA compliance, financial reporting, and driver management — all in one unified dashboard.
            </p>
            <p className="text-slate-500 text-xs mt-2">15 modules covered below. Expand each section to read details.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={generateManualPdf}
              disabled={generatingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-sm disabled:opacity-60"
            >
              {generatingPdf ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Download className="w-4 h-4" /> Download PDF</>}
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-lg text-sm hover:bg-slate-50">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {MANUAL_SECTIONS.map((section, idx) => {
          const Icon = section.icon;
          const isOpen = expandedSections[idx];
          return (
            <div key={idx} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection(idx)}
                className="w-full flex items-center gap-3 px-5 py-4 bg-slate-50 hover:bg-slate-100 text-left"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <span className="font-black text-slate-900">{idx + 1}. {section.title}</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-5 py-4 text-sm text-slate-600 whitespace-pre-line border-t border-slate-100">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Brochure Tab ───
function BrochureTab() {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const generateBrochurePdf = async () => {
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'landscape' });
      const w = 279; // landscape letter width
      const h = 216; // landscape letter height
      const panelW = w / 3;
      const m = 8; // margin

      // Helper: draw a panel
      const drawPanel = (x, color, content) => {
        doc.setFillColor(...color);
        doc.rect(x, 0, panelW, h, 'F');
        // Separator line between panels
        doc.setDrawColor(80, 80, 80);
        doc.setLineWidth(0.2);
        if (x > 0) doc.line(x, 5, x, h - 5);
      };

      // === PAGE 1: Outside panels (Cover, Back, Contact) ===
      // Panel 1 (right): Front Cover — dark bg
      drawPanel(panelW * 2, [20, 20, 30]);
      // Amber top stripe
      doc.setFillColor(245, 158, 11);
      doc.rect(panelW * 2, 0, panelW, 4, 'F');
      // Logo
      doc.setFillColor(245, 158, 11);
      doc.rect(panelW * 2 + m, 12, 6, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('FLEETCO', panelW * 2 + m + 9, 17);
      doc.setFontSize(5);
      doc.setTextColor(245, 158, 11);
      doc.text('MANAGEMENT', panelW * 2 + m + 9, 20.5);
      // Headline
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      const headline = 'Complete Fleet Operations. One Platform.';
      const headlineLines = doc.splitTextToSize(headline, panelW - m * 2);
      doc.text(headlineLines, panelW * 2 + m, 45);
      // Body
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      const body = 'From dispatch to maintenance, fuel tracking to IFTA compliance — FleetCo Management brings your entire operation under one roof.';
      const bodyLines = doc.splitTextToSize(body, panelW - m * 2);
      doc.text(bodyLines, panelW * 2 + m, 62);
      // Tags
      doc.setFontSize(6);
      doc.setTextColor(245, 158, 11);
      doc.text('5-Star Service  •  FMCSA Compliant  •  24/7 Support', panelW * 2 + m, 82);
      // URL
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(5);
      doc.text('www.fleetcomanagement.org', panelW * 2 + m, h - 8);

      // Panel 2 (center): CTA — medium dark bg
      drawPanel(panelW, [30, 30, 40]);
      doc.setFillColor(245, 158, 11);
      doc.circle(panelW + panelW / 2, 55, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(20, 20, 30);
      doc.text('?', panelW + panelW / 2 - 3, 60);
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('Ready to Transform Your Fleet?', panelW + panelW / 2, 78, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(180, 180, 180);
      const cta = 'Schedule a demo today and see how FleetCo can save your operation time and money.';
      const ctaLines = doc.splitTextToSize(cta, panelW - m * 4);
      doc.text(ctaLines, panelW + panelW / 2, 88, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('(360) 952-1249', panelW + panelW / 2, 108, { align: 'center' });
      doc.setFontSize(5);
      doc.setTextColor(180, 180, 180);
      doc.text('fleetcomanagement.org', panelW + panelW / 2, 113, { align: 'center' });

      // Panel 3 (left): Contact — dark bg
      drawPanel(0, [20, 20, 30]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('Contact Us', m, 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('JaRell D. Slack', m, 30);
      doc.text('Desiree Slack', m, 36);
      doc.setFontSize(5);
      doc.setTextColor(180, 180, 180);
      doc.text('Owners', m, 40);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.3);
      doc.line(m, 47, m + 20, 47);
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.text('(360) 952-1249', m, 55);
      doc.setFontSize(5);
      doc.setTextColor(140, 140, 140);
      doc.text('Serving fleet operators nationwide', m, 64);
      doc.setFontSize(4);
      doc.text('www.fleetcomanagement.org', m, 72);
      // Amber bottom stripe
      doc.setFillColor(245, 158, 11);
      doc.rect(0, h - 4, panelW, 4, 'F');

      // === PAGE 2: Inside panels (Features, Why FleetCo, Plans) ===
      doc.addPage();

      // Panel 1 (left): Platform Features — white bg
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, panelW, h, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(20, 20, 30);
      doc.text('PLATFORM FEATURES', m, 14);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.5);
      doc.line(m, 17, m + 35, 17);

      const features = [
        { title: 'Fleet Management', desc: 'Track all vehicles, trailers, maintenance, and inspections in one place.' },
        { title: 'Fuel Optimization', desc: 'Live fuel station pricing, IFTA reporting, cost-per-mile analytics.' },
        { title: 'Dispatch & Loads', desc: 'Load board with driver assignment, weigh scale tracking, GPS navigation.' },
        { title: 'Compliance', desc: 'HOS/ELD logs, DVIR inspections, driver screening, FMCSA-ready reporting.' },
        { title: 'Work Orders', desc: 'Service templates, parts inventory, vendor contracts, repair cost tracking.' },
      ];
      let fy = 26;
      features.forEach((f) => {
        doc.setFillColor(255, 230, 150);
        doc.rect(m, fy, 3.5, 3.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(20, 20, 30);
        doc.text(f.title, m + 5.5, fy + 2.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(100, 100, 100);
        const dLines = doc.splitTextToSize(f.desc, panelW - m * 2 - 6);
        doc.text(dLines, m + 5.5, fy + 5.5);
        fy += 14;
      });

      // Panel 2 (center): Why FleetCo? — light bg
      doc.setFillColor(245, 245, 245);
      doc.rect(panelW, 0, panelW, h, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(20, 20, 30);
      doc.text('WHY FLEETCO?', panelW + m, 14);
      doc.setDrawColor(245, 158, 11);
      doc.line(panelW + m, 17, panelW + m + 35, 17);

      const benefits = [
        { stat: '30%', desc: 'Average fuel cost reduction through optimized purchasing' },
        { stat: '100%', desc: 'FMCSA-compliant electronic DVIR and HOS logging' },
        { stat: '24/7', desc: 'Real-time fleet visibility from any device, anywhere' },
        { stat: 'All-in-1', desc: 'No need for multiple software subscriptions' },
      ];
      let by = 26;
      benefits.forEach((b) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(245, 158, 11);
        doc.text(b.stat, panelW + m, by + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(100, 100, 100);
        const dLines = doc.splitTextToSize(b.desc, panelW - m * 2 - 14);
        doc.text(dLines, panelW + m, by + 10);
        by += 20;
      });

      // Testimonial
      doc.setFillColor(255, 245, 225);
      doc.rect(panelW + m, 110, panelW - m * 2, 22, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6);
      doc.setTextColor(80, 80, 80);
      const testLines = doc.splitTextToSize('"FleetCo transformed how we manage our 47 trucks. Everything from IFTA to maintenance is now in one place."', panelW - m * 4 - 2);
      doc.text(testLines, panelW + m + 2, 118);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(140, 140, 140);
      doc.text('— Regional Carrier, Midwest', panelW + m + 2, 128);

      // Panel 3 (right): Service Plans — white bg
      doc.setFillColor(255, 255, 255);
      doc.rect(panelW * 2, 0, panelW, h, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(20, 20, 30);
      doc.text('SERVICE PLANS', panelW * 2 + m, 14);
      doc.setDrawColor(245, 158, 11);
      doc.line(panelW * 2 + m, 17, panelW * 2 + m + 35, 17);

      const plans = [
        { name: 'Starter', price: '$299/mo', features: ['Up to 10 vehicles', 'Fuel tracking', 'Basic maintenance', 'Load board', 'Driver management'], border: false },
        { name: 'Growth', price: '$599/mo', features: ['Up to 50 vehicles', 'Advanced analytics', 'IFTA reporting', 'Vendor contracts', 'Parts inventory', 'DVIR inspections'], highlight: true },
        { name: 'Enterprise', price: '$999/mo', features: ['Unlimited vehicles', 'Full platform access', 'Custom integrations', 'Dedicated support', 'Multi-customer portal'], dark: true },
      ];
      let py = 24;
      plans.forEach((p) => {
        const px = panelW * 2 + m;
        const pw = panelW - m * 2;
        if (p.dark) {
          doc.setFillColor(20, 20, 30);
        } else if (p.highlight) {
          doc.setFillColor(255, 245, 225);
        } else {
          doc.setFillColor(248, 248, 248);
        }
        doc.rect(px, py, pw, 28, 'F');
        if (p.highlight || p.dark) {
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(1);
          doc.rect(px, py, pw, 28);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(p.dark ? 255 : 20);
        doc.text(p.name, px + 2, py + 6);
        doc.setTextColor(p.dark ? [245, 158, 11] : [245, 158, 11]);
        doc.text(p.price, px + pw - 2, py + 6, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        let fy2 = py + 11;
        p.features.forEach((f) => {
          doc.setTextColor(p.dark ? 180 : 100);
          doc.text(`• ${f}`, px + 2, fy2);
          fy2 += 4;
        });
        py += 34;
      });

      doc.setFontSize(5);
      doc.setTextColor(140, 140, 140);
      doc.text('Custom pricing available for large fleets.', panelW * 2 + panelW / 2, h - 8, { align: 'center' });

      // Page numbers
      doc.setTextColor(160, 160, 160);
      doc.setFontSize(5);
      doc.setPage(1);
      doc.text('FleetCo Management — Tri-Fold Brochure — Side 1', panelW * 2 + panelW / 2, h - 6, { align: 'center' });
      doc.setPage(2);
      doc.text('FleetCo Management — Tri-Fold Brochure — Side 2', panelW * 2 + panelW / 2, h - 6, { align: 'center' });

      doc.save('FleetCo_Brochure.pdf');
    } catch (err) {
      console.error('Brochure PDF generation failed:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro — hidden when printing */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm print:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-2">Tri-Fold Brochure</h2>
            <p className="text-slate-500 text-sm">Two-sided professional brochure for prospective fleet customers. Prints on standard letter paper (8.5"  x 11").</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={generateBrochurePdf}
              disabled={generatingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-sm disabled:opacity-60"
            >
              {generatingPdf ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Download className="w-4 h-4" /> Download PDF</>}
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-lg text-sm hover:bg-slate-50">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Rich Screen Preview — hidden when printing */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-5 py-4">
          <h3 className="font-black text-base">Brochure Preview</h3>
          <p className="text-slate-400 text-xs">Two-sided tri-fold — see all six panels below</p>
        </div>

        {/* Front Cover Panel */}
        <div className="p-5 border-b border-slate-100">
          <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-3">Front Cover</h4>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="bg-slate-900 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-amber-500 p-1.5 rounded"><Truck className="w-5 h-5 text-slate-900" /></div>
                <div><div className="font-black text-lg leading-none">FLEETCO</div><div className="text-amber-400 text-xs tracking-widest">MANAGEMENT</div></div>
              </div>
              <h3 className="text-xl font-black leading-tight mt-4">Complete Fleet Operations. One Platform.</h3>
              <p className="text-slate-300 text-sm mt-3 leading-relaxed">From dispatch to maintenance, fuel tracking to IFTA compliance — FleetCo brings your entire operation under one roof.</p>
              <div className="flex gap-3 mt-4 flex-wrap">
                {[{ icon: Star, label: '5-Star Service' }, { icon: Shield, label: 'FMCSA Compliant' }, { icon: Truck, label: '24/7 Support' }].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs text-amber-400"><Icon className="w-3.5 h-3.5" />{label}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden h-48">
              <img src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80" alt="Fleet truck" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="p-5 border-b border-slate-100">
          <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-3">Key Stats</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: '50+', label: 'Fleets Served', icon: Users },
              { value: '$2K+', label: 'Avg Savings/Unit/Yr', icon: BarChart3 },
              { value: '24/7', label: 'Emergency Support', icon: Phone },
              { value: '100%', label: 'Doc Accuracy', icon: CheckCircle },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
                <Icon className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-black text-slate-900">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Panel */}
        <div className="p-5 border-b border-slate-100">
          <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-3">Platform Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Truck, title: 'Fleet Management', desc: 'Track vehicles, trailers, maintenance & inspections in one place.' },
              { icon: Fuel, title: 'Fuel Optimization', desc: 'Live station pricing, IFTA reporting, cost-per-mile analytics.' },
              { icon: MapPin, title: 'Dispatch & Loads', desc: 'Load board with driver assignment, GPS navigation, weigh scales.' },
              { icon: Shield, title: 'Full Compliance', desc: 'HOS/ELD logs, DVIRs, driver screening, FMCSA-ready reports.' },
              { icon: Wrench, title: 'Work Orders', desc: 'Service templates, parts inventory, vendors, repair cost tracking.' },
              { icon: BarChart3, title: 'Analytics & Reports', desc: 'Fleet P&L, TCO per unit, customizable exports.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 p-3 bg-slate-50 rounded-lg hover:bg-amber-50 transition-colors">
                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-amber-600" /></div>
                <div><div className="font-bold text-sm text-slate-900">{title}</div><div className="text-xs text-slate-500 mt-0.5">{desc}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits + Plans Row */}
        <div className="p-5 border-b border-slate-100">
          <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-3">Why FleetCo?</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { stat: '30%', label: 'Avg fuel cost reduction' },
              { stat: '100%', label: 'FMCSA-compliant DVIR & HOS' },
              { stat: '24/7', label: 'Real-time fleet visibility' },
              { stat: 'All-in-1', label: 'No juggling multiple apps' },
            ].map(({ stat, label }) => (
              <div key={stat} className="bg-gradient-to-br from-amber-50 to-white rounded-lg p-3 border border-amber-100 text-center">
                <div className="font-black text-lg text-amber-600">{stat}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-3">Service Plans</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: 'Starter', price: '$299/mo', features: 'Up to 10 vehicles | Fuel tracking | Maintenance | Load board | Driver mgmt', color: 'border-slate-200' },
              { name: 'Growth', price: '$599/mo', features: 'Up to 50 vehicles | Advanced analytics | IFTA | Vendors | Parts | DVIRs', color: 'border-amber-300 bg-amber-50' },
              { name: 'Enterprise', price: '$999/mo', features: 'Unlimited vehicles | Full platform | Custom integrations | Dedicated support', color: 'border-slate-800 bg-slate-900 text-white' },
            ].map(({ name, price, features, color }) => (
              <div key={name} className={`rounded-xl p-4 border-2 ${color}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-black text-sm ${color.includes('bg-slate-900') ? 'text-white' : 'text-slate-900'}`}>{name}</span>
                  <span className={`font-black text-sm ${color.includes('bg-slate-900') ? 'text-amber-400' : 'text-amber-600'}`}>{price}</span>
                </div>
                <p className={`text-xs leading-relaxed ${color.includes('bg-slate-900') ? 'text-slate-300' : 'text-slate-500'}`}>{features}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Panel */}
        <div className="p-5">
          <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-3">Contact</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-900 rounded-xl p-5 text-white text-center">
              <div className="bg-amber-500 p-3 rounded-full inline-flex mb-3"><Truck className="w-6 h-6 text-slate-900" /></div>
              <h3 className="font-black text-sm mb-2">Ready to Transform Your Fleet?</h3>
              <p className="text-slate-400 text-xs mb-3">Schedule a demo today</p>
              <div className="text-amber-400 font-bold text-base">(360) 952-1249</div>
              <div className="text-slate-400 text-xs">fleetcomanagement.org</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 flex flex-col justify-center items-center text-center">
              <p className="font-bold text-slate-900 text-sm">JaRell D. Slack</p>
              <p className="font-bold text-slate-900 text-sm">Desiree Slack</p>
              <p className="text-xs text-slate-500 mb-3">Owners</p>
              <div className="w-16 h-px bg-amber-300 mb-3" />
              <div className="text-sm text-slate-700">(360) 952-1249</div>
              <p className="text-xs text-slate-400 mt-3">Serving fleet operators nationwide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print-optimized tri-fold layout (visible only when printing) */}
      <div className="hidden print:flex print:flex-col">
        {/* Page 1 — Outside panels */}
        <div className="print:flex print:flex-row print:h-[10.5in] print:page-break-after-always">
          {/* Panel 3: Contact (prints as left column when reading) */}
          <div className="print:w-1/3 bg-slate-900 text-white p-8 flex flex-col justify-between print:border-r print:border-slate-700">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-amber-500 p-2 rounded"><Truck className="w-5 h-5 text-slate-900" /></div>
                <div><div className="font-black text-base leading-none">FLEETCO</div><div className="text-amber-400 text-[10px] tracking-widest">MANAGEMENT</div></div>
              </div>
              <h3 className="font-black text-sm mt-6 mb-4">Contact Us</h3>
              <p className="font-bold text-xs">JaRell D. Slack</p>
              <p className="font-bold text-xs">Desiree Slack</p>
              <p className="text-slate-400 text-[9px]">Owners</p>
              <div className="w-16 h-px bg-amber-500 my-4" />
              <div className="flex items-center gap-2 text-xs mb-1.5"><Phone className="w-3 h-3 text-amber-400" /><span className="text-white font-bold">(360) 952-1249</span></div>
              <div className="flex items-center gap-2 text-xs"><Globe className="w-3 h-3 text-amber-400" /><span className="text-slate-300">fleetcomanagement.org</span></div>
            </div>
            <div className="text-[8px] text-slate-500">Serving fleet operators nationwide</div>
          </div>

          {/* Panel 2: CTA (center) */}
          <div className="print:w-1/3 bg-slate-800 text-white p-8 flex flex-col justify-center items-center text-center print:border-r print:border-slate-700">
            <div className="bg-amber-500 p-5 rounded-full mb-6"><Truck className="w-10 h-10 text-slate-900" /></div>
            <h2 className="font-black text-lg mb-3">Ready to Transform Your Fleet?</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">Schedule a demo today and see how FleetCo can save your operation time and money.</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 justify-center"><Phone className="w-4 h-4 text-amber-400" /><span className="text-white font-bold text-lg">(360) 952-1249</span></div>
              <div className="flex items-center gap-2 justify-center"><Globe className="w-4 h-4 text-amber-400" /><span className="text-slate-300">fleetcomanagement.org</span></div>
            </div>
          </div>

          {/* Panel 1: Front Cover (prints as right column when reading) */}
          <div className="print:w-1/3 bg-slate-900 text-white p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-amber-500 p-2 rounded"><Truck className="w-5 h-5 text-slate-900" /></div>
                <div><div className="font-black text-lg leading-none">FLEETCO</div><div className="text-amber-400 text-[10px] tracking-widest">MANAGEMENT</div></div>
              </div>
              <h1 className="text-2xl font-black leading-tight mt-8">Complete Fleet Operations. One Platform.</h1>
              <p className="text-slate-300 text-sm mt-4 leading-relaxed">From dispatch to maintenance, fuel tracking to IFTA compliance — FleetCo Management brings your entire operation under one roof.</p>
              <div className="flex gap-3 mt-6 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-amber-400"><Star className="w-3.5 h-3.5" />5-Star Service</span>
                <span className="flex items-center gap-1.5 text-xs text-amber-400"><Shield className="w-3.5 h-3.5" />FMCSA Compliant</span>
                <span className="flex items-center gap-1.5 text-xs text-amber-400"><Truck className="w-3.5 h-3.5" />24/7 Support</span>
              </div>
            </div>
            <div className="text-[9px] text-slate-500">www.fleetcomanagement.org</div>
          </div>
        </div>

        {/* Page 2 — Inside panels */}
        <div className="print:flex print:flex-row print:h-[10.5in]">
          {/* Features */}
          <div className="print:w-1/3 bg-white p-6 print:border-r print:border-slate-200">
            <h3 className="font-black text-xs text-slate-900 mb-4 uppercase tracking-widest">Platform Features</h3>
            <div className="space-y-4">
              {[
                { icon: Truck, title: 'Fleet Management', desc: 'Track all vehicles, trailers, maintenance, and inspections in one place.' },
                { icon: Fuel, title: 'Fuel Optimization', desc: 'Live fuel station pricing, IFTA reporting, and cost-per-mile analytics.' },
                { icon: FileText, title: 'Dispatch & Loads', desc: 'Load board with driver assignment, weigh scale tracking, and GPS navigation.' },
                { icon: Shield, title: 'Compliance', desc: 'HOS/ELD logs, DVIR inspections, driver screening, and FMCSA-ready reporting.' },
                { icon: Wrench, title: 'Work Orders', desc: 'Service templates, parts inventory, vendor contracts, and repair cost tracking.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"><Icon className="w-4 h-4 text-amber-600" /></div>
                  <div><div className="font-bold text-xs text-slate-900">{title}</div><div className="text-[10px] text-slate-500 leading-relaxed">{desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          {/* Why FleetCo */}
          <div className="print:w-1/3 bg-slate-50 p-6 print:border-r print:border-slate-200">
            <h3 className="font-black text-xs text-slate-900 mb-4 uppercase tracking-widest">Why FleetCo?</h3>
            <div className="space-y-4">
              {[
                { stat: '30%', label: 'Average fuel cost reduction through optimized purchasing' },
                { stat: '100%', label: 'FMCSA-compliant electronic DVIR and HOS logging' },
                { stat: '24/7', label: 'Real-time fleet visibility from any device, anywhere' },
                { stat: 'All-in-One', label: 'No need for multiple software subscriptions' },
              ].map(({ stat, label }) => (
                <div key={stat} className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="font-black text-lg text-amber-600">{stat}</div>
                  <div className="text-[10px] text-slate-600 mt-1 leading-relaxed">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-slate-700 font-semibold">"FleetCo transformed how we manage our 47 trucks. Everything from IFTA to maintenance is now in one place."</p>
              <p className="text-[10px] text-slate-500 mt-1">— Regional Carrier, Midwest</p>
            </div>
          </div>

          {/* Service Plans */}
          <div className="print:w-1/3 bg-white p-6">
            <h3 className="font-black text-xs text-slate-900 mb-4 uppercase tracking-widest">Service Plans</h3>
            <div className="space-y-4">
              {[
                { name: 'Starter', price: '$299/mo', features: ['Up to 10 vehicles', 'Fuel tracking', 'Basic maintenance', 'Load board', 'Driver management'] },
                { name: 'Growth', price: '$599/mo', features: ['Up to 50 vehicles', 'Advanced analytics', 'IFTA reporting', 'Vendor contracts', 'Parts inventory', 'DVIR inspections'] },
                { name: 'Enterprise', price: '$999/mo', features: ['Unlimited vehicles', 'Full platform access', 'Custom integrations', 'Dedicated support', 'Multi-customer portal', 'Executive dashboard'] },
              ].map(({ name, price, features }) => (
                <div key={name} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-xs text-slate-900">{name}</span>
                    <span className="font-black text-xs text-amber-600">{price}</span>
                  </div>
                  <ul className="space-y-1">
                    {features.map(f => (<li key={f} className="text-[10px] text-slate-600 flex items-center gap-1"><span className="text-amber-500">•</span> {f}</li>))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 mt-4 text-center">Custom pricing available for large fleets. Contact us for a quote.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Business Cards Tab ───
function BusinessCardsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 mb-2">Business Cards</h2>
        <p className="text-slate-500 text-sm">Standard 3.5" x 2" business cards — prints 10 per sheet on standard letter paper.</p>
      </div>

      {/* Print-optimized grid (10 cards per sheet) */}
      <div className="hidden print:grid print:grid-cols-2 print:gap-4 print:p-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="border-2 border-slate-300 rounded-lg p-4 flex items-center gap-4" style={{ width: '3.5in', height: '2in' }}>
            <div className="w-1.5 self-stretch bg-amber-500 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="bg-amber-500 p-1 rounded"><Truck className="w-3.5 h-3.5 text-slate-900" /></div>
                <div className="font-black text-[11px] text-slate-900 leading-tight">FLEETCO<br /><span className="text-amber-600 text-[8px] tracking-widest">MANAGEMENT</span></div>
              </div>
              <div className="space-y-0.5 mt-2">
                <p className="font-black text-[9px] text-slate-900">JaRell D. Slack</p>
                <p className="font-black text-[9px] text-slate-900">Desiree Slack</p>
                <p className="text-[7px] text-slate-500">Owners</p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 space-y-0.5">
                <div className="flex items-center gap-1 text-[8px] text-slate-700"><Phone className="w-2.5 h-2.5 text-amber-600" /> (360) 952-1249</div>
                <div className="flex items-center gap-1 text-[8px] text-slate-500"><Globe className="w-2.5 h-2.5 text-amber-600" /> fleetcomanagement.org</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Screen preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-black text-base">Business Card Preview</h3>
            <p className="text-slate-800 text-xs">10 cards per sheet — 5 of each owner</p>
          </div>
          <button onClick={() => window.print()} className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Cards
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* JaRell's Card */}
          <div className="max-w-sm bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden">
            <div className="flex">
              <div className="w-2 bg-amber-500 flex-shrink-0" />
              <div className="p-5 flex items-center gap-4 flex-1">
                <div className="flex-shrink-0"><div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center"><div className="bg-amber-500 p-1 rounded"><Truck className="w-4 h-4 text-slate-900" /></div></div></div>
                <div>
                  <div className="font-black text-xs text-slate-900">FLEETCO <span className="text-amber-600 text-[9px] tracking-widest">MANAGEMENT</span></div>
                  <div className="mt-2"><p className="font-black text-sm text-slate-900">JaRell D. Slack</p><p className="text-[10px] text-slate-500">Owner</p></div>
                  <div className="mt-2 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-700"><Phone className="w-3 h-3 text-amber-600" /> (360) 952-1249</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Globe className="w-3 h-3 text-amber-600" /> fleetcomanagement.org</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desiree's Card */}
          <div className="max-w-sm bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden">
            <div className="flex">
              <div className="w-2 bg-amber-500 flex-shrink-0" />
              <div className="p-5 flex items-center gap-4 flex-1">
                <div className="flex-shrink-0"><div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center"><div className="bg-amber-500 p-1 rounded"><Truck className="w-4 h-4 text-slate-900" /></div></div></div>
                <div>
                  <div className="font-black text-xs text-slate-900">FLEETCO <span className="text-amber-600 text-[9px] tracking-widest">MANAGEMENT</span></div>
                  <div className="mt-2"><p className="font-black text-sm text-slate-900">Desiree Slack</p><p className="text-[10px] text-slate-500">Owner</p></div>
                  <div className="mt-2 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-700"><Phone className="w-3 h-3 text-amber-600" /> (360) 952-1249</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Globe className="w-3 h-3 text-amber-600" /> fleetcomanagement.org</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
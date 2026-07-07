import React, { useState } from 'react';
import {
  Truck, LayoutDashboard, Package, FileText, Fuel, Wrench, ClipboardList,
  ClipboardCheck, Users, UserCheck, Archive, Calendar, Cpu, Store, Bot,
  MessageCircle, Navigation, TrendingUp, Map, Route, DollarSign, Globe,
  Clock, ShieldCheck, AlertTriangle, Award, BarChart2, ChevronDown, ChevronUp,
  Printer, BookOpen, Phone, Info, CheckCircle2, AlertCircle, Lightbulb
} from 'lucide-react';

const TIP = ({ children }) => (
  <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 print:border print:border-amber-200">
    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
    <p className="text-xs text-amber-800 leading-relaxed">{children}</p>
  </div>
);

const NOTE = ({ children }) => (
  <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-3 print:border print:border-blue-200">
    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
    <p className="text-xs text-blue-800 leading-relaxed">{children}</p>
  </div>
);

const WARN = ({ children }) => (
  <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3 print:border print:border-red-200">
    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
    <p className="text-xs text-red-800 leading-relaxed">{children}</p>
  </div>
);

const Steps = ({ steps }) => (
  <ol className="mt-2 space-y-1.5 pl-1">
    {steps.map((s, i) => (
      <li key={i} className="flex gap-2 text-sm text-slate-600">
        <span className="bg-slate-200 text-slate-700 font-black text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
        <span className="leading-relaxed">{s}</span>
      </li>
    ))}
  </ol>
);

const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: LayoutDashboard,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    content: [
      {
        heading: 'Logging In for the First Time',
        body: 'Your fleet administrator will send you an email invitation with a temporary password. Click the link in the email, then enter your email address and the temporary password on the login screen. You will be prompted to set a new secure password on your first login. If you did not receive an invitation email, check your spam folder or contact your admin.',
        steps: [
          'Open your invitation email and click the "Accept Invitation" link.',
          'On the login screen, enter your email address and temporary password.',
          'Set a new password that is at least 8 characters long.',
          'You will be redirected to the main portal dashboard.'
        ],
        extra: <TIP>Use a strong password combining letters, numbers, and symbols. Your account controls access to sensitive fleet and financial data.</TIP>
      },
      {
        heading: 'Resetting a Forgotten Password',
        body: 'On the login screen, click "Forgot Password?" and enter your email address. You will receive a password reset link within a few minutes. Click the link and follow the prompts to create a new password. Reset links expire after 24 hours.',
        extra: <NOTE>If you do not receive the reset email after a few minutes, check your spam/junk folder. If the issue persists, contact your fleet administrator to resend an invitation.</NOTE>
      },
      {
        heading: 'Navigating the Portal',
        body: 'The FleetCo portal has two main areas: the left sidebar navigation and the main content area. The sidebar lists all modules you have access to based on your role. Click any item to navigate to that module. On mobile devices, tap the hamburger menu (☰) in the top-left corner to open the sidebar. The portal is fully responsive and works on phones, tablets, and desktops.',
        extra: <TIP>Bookmark your portal URL in your browser for fast access. On mobile, you can also "Add to Home Screen" for an app-like experience.</TIP>
      },
      {
        heading: 'Understanding Your Role & Access Level',
        body: 'Your role determines which modules you can see and what actions you can take. Roles cannot be self-assigned — only administrators can change your role.',
        extra: (
          <div className="mt-3 space-y-2">
            {[
              { role: 'Admin', desc: 'Full access to all modules, user management, financial data, reports, and settings.' },
              { role: 'Executive', desc: 'Full read/write access across all modules — same as Admin but cannot manage user invitations.' },
              { role: 'Employee', desc: 'Operations and dispatch access: loads, customers, payroll, PD command, route builder, AI assistant.' },
              { role: 'Driver', desc: 'Load board, pre-trip checklist, HOS logs, inspections, navigation, my delivery route, messages, fuel.' },
              { role: 'Tech / Mechanic', desc: 'Work orders, diagnostics, time clock, AI assistant. Cannot access financial or payroll data.' },
              { role: 'Customer', desc: 'View-only access to their assigned fleet units, invoices, and the load board.' },
            ].map(r => (
              <div key={r.role} className="flex gap-2 text-xs">
                <span className="font-black text-slate-700 w-24 flex-shrink-0">{r.role}</span>
                <span className="text-slate-600">{r.desc}</span>
              </div>
            ))}
          </div>
        )
      }
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    icon: BarChart2,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    content: [
      {
        heading: 'Admin Dashboard',
        body: 'The admin dashboard provides a real-time snapshot of fleet health across nine key performance areas: active loads, fleet status breakdown, open work orders, monthly revenue, fuel spend, outstanding invoices, maintenance alerts, HOS compliance, and repair costs. Each KPI card is color-coded — green indicates normal, amber means attention needed, red signals a critical issue requiring immediate action.',
        extra: <TIP>Check the dashboard every morning before dispatching. The compliance alert banner at the top will surface any expiring documents or overdue maintenance items that could put you out of compliance.</TIP>
      },
      {
        heading: 'Today\'s Activity Feed',
        body: 'Below the KPI cards, the Activity Feed shows a real-time log of everything that happened today: new HOS logs submitted, inspections completed, work orders opened or closed, loads delivered, and incidents reported. Each entry is time-stamped and links directly to the relevant record.',
      },
      {
        heading: 'Compliance Alert Banner',
        body: 'When any vehicle document (insurance, registration, DOT inspection sticker, etc.) is expiring within 30 days, a yellow warning banner appears at the top of the dashboard listing the affected vehicles and document types. Click the banner to jump directly to the Compliance Tracker. Expired documents show a red banner.',
        extra: <WARN>Operating a vehicle with an expired DOT inspection sticker or insurance can result in out-of-service orders, fines, and liability exposure. Address compliance alerts immediately.</WARN>
      },
      {
        heading: 'Role-Specific Dashboards',
        body: 'Drivers see a driver-focused dashboard showing their assigned vehicle, current load, recent HOS hours, and pending inspections. Customers see a customer dashboard showing their assigned fleet units, active loads, and invoice balances. Each view is tailored to surface only the information relevant to that role.'
      }
    ]
  },
  {
    id: 'load-board',
    title: 'Load Board',
    icon: Package,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    content: [
      {
        heading: 'Understanding the Load Board',
        body: 'The Load Board is the central hub for all freight assignments. Every load has a lifecycle: Available → Assigned → In Transit → Delivered (or Cancelled). Loads move through this status flow as drivers pick up and deliver freight. All users with load board access can see loads, but only admins and employees can create and edit them.',
      },
      {
        heading: 'Creating a New Load',
        body: 'Click "New Load" in the top-right corner to open the load creation form.',
        steps: [
          'Enter a unique Load Number (e.g., LD-2024-0451). This is your internal reference ID.',
          'Set Origin and Destination addresses (city, state, or full address).',
          'Select Pickup Date and Delivery Date.',
          'Enter the Rate (total revenue for this load in USD) and estimated Miles.',
          'Add Commodity type and Weight if required.',
          'Assign a Driver from the dropdown — only active drivers appear.',
          'Assign a Vehicle (power unit/truck) and optionally a Trailer.',
          'Link a Customer and/or Broker name if applicable.',
          'Add any special Notes (hazmat, liftgate required, appointment times, etc.).',
          'Click Save. The load will appear on the board with "Available" status.'
        ],
        extra: <TIP>Always enter the rate accurately — this data feeds directly into your Fleet P&L, driver payroll calculations, and revenue reports. Missing rates will cause gaps in financial reporting.</TIP>
      },
      {
        heading: 'Updating Load Status',
        body: 'Open any load card and use the Status dropdown to advance it through the workflow. Change to "Assigned" when a driver is confirmed, "In Transit" when the driver departs, and "Delivered" upon confirmed delivery. The delivered timestamp and mileage data feed into driver performance scorecards and revenue reports automatically.',
        extra: <NOTE>Only mark a load "Delivered" after you have confirmed delivery with the customer or driver. Delivered loads are counted in revenue and performance calculations and cannot easily be reversed.</NOTE>
      },
      {
        heading: 'Weigh Scale Tickets',
        body: 'For loads that require weigh-in documentation, open the load and click the scale icon to open the Weight Scale modal.',
        steps: [
          'Enter the Scale Location (name/address of the weigh station).',
          'Enter the Scale Ticket Number from the printed receipt.',
          'Select the Scale Date.',
          'Enter Gross Weight in pounds.',
          'Enter individual Axle Weights (steer, drive, trailer) if available.',
          'Set Scale Status: Pass, Overweight, or Reweigh Needed.',
          'Add any Scale Notes and save.'
        ],
        extra: <WARN>Federal bridge law limits gross vehicle weight to 80,000 lbs and individual axle weights to 20,000 lbs (steer) and 34,000 lbs (tandem). Overweight violations can result in significant fines and CSA points.</WARN>
      },
      {
        heading: 'Filtering and Searching Loads',
        body: 'Use the search bar to find loads by load number, origin, destination, driver name, or commodity. Use the status filter tabs (All, Available, Assigned, In Transit, Delivered, Cancelled) to narrow the view. Loads are sorted by most recent pickup date by default.',
      }
    ]
  },
  {
    id: 'fleet',
    title: 'Fleet Management',
    icon: Truck,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    content: [
      {
        heading: 'Adding a New Unit',
        body: 'Go to Fleet and click "Add Unit". Complete all fields for accurate tracking.',
        steps: [
          'Select Unit Type: Truck (power unit) or Trailer.',
          'Enter the Unit Number — this is your internal fleet ID (e.g., T-101, TR-22).',
          'Enter Year, Make, Model, VIN, and License Plate.',
          'For trailers: select Trailer Type (Dry Van, Reefer, Flatbed, etc.) and enter trailer length in feet.',
          'Enter Purchase Price and Purchase Date — required for depreciation and TCO calculations.',
          'Set current Status (Active by default).',
          'Assign a Driver if the unit has a dedicated operator.',
          'Add any Notes (e.g., known issues, GPS unit ID, ELD device ID).',
          'Click Save.'
        ],
        extra: <TIP>Enter the purchase price and purchase date for every unit. The system uses these to calculate straight-line depreciation over a 10-year useful life, showing the estimated current book value on each vehicle card.</TIP>
      },
      {
        heading: 'Vehicle Status Codes — Full Reference',
        body: 'Each unit has a status that reflects its current operational state. Status affects dispatch availability and compliance reporting.',
        extra: (
          <div className="mt-3 space-y-2">
            {[
              { status: 'Active', color: 'text-green-700 bg-green-50', desc: 'Fully operational and available for dispatch.' },
              { status: 'In Shop', color: 'text-orange-700 bg-orange-50', desc: 'Currently undergoing repair at your shop or an external vendor. Not available for dispatch.' },
              { status: 'Waiting for Parts', color: 'text-amber-700 bg-amber-50', desc: 'Repair is paused pending parts delivery. Unit remains unavailable.' },
              { status: 'Out of Service', color: 'text-red-700 bg-red-50', desc: 'Unsafe to operate or placed OOS by a DOT officer. Must be repaired and re-inspected before returning to service.' },
              { status: 'Pending Inspection', color: 'text-blue-700 bg-blue-50', desc: 'Annual DOT inspection or state inspection is due. Schedule immediately.' },
              { status: 'Leased Out', color: 'text-purple-700 bg-purple-50', desc: 'Unit is deployed to another carrier under a lease agreement.' },
              { status: 'Retired', color: 'text-slate-700 bg-slate-100', desc: 'Unit is decommissioned and removed from active fleet but kept for records.' },
              { status: 'Sold', color: 'text-slate-700 bg-slate-100', desc: 'Unit has been sold. Kept in records for historical data.' },
            ].map(s => (
              <div key={s.status} className="flex gap-2 text-xs items-start">
                <span className={`font-black px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.status}</span>
                <span className="text-slate-600">{s.desc}</span>
              </div>
            ))}
          </div>
        )
      },
      {
        heading: 'Compliance Documents',
        body: 'Every vehicle should have its compliance documents uploaded and tracked. Open any vehicle, go to the Documents tab, and click "Add Document".',
        steps: [
          'Select Document Type (Insurance, Registration, DOT Inspection Sticker, Title, IFTA Permit, etc.).',
          'Enter a display name for the document.',
          'Upload the file (PDF, image, or scan).',
          'Set the Expiration Date — this is critical for compliance alerts.',
          'Click Save.'
        ],
        extra: <WARN>The system alerts you 30 days before any document expires. However, you are responsible for ensuring documents are renewed on time. Set calendar reminders as a backup — DOT fines for operating with expired documents can reach thousands of dollars per violation.</WARN>
      },
      {
        heading: 'Vehicle History & Repair Records',
        body: 'The History tab on each vehicle shows a complete timeline of all work orders, inspections, fuel logs, and diagnostic codes associated with that unit. This provides a full maintenance record for resale, warranty claims, or DOT audits.',
      },
      {
        heading: 'Depreciation & Asset Valuation',
        body: 'Each vehicle card displays an estimated current book value calculated using straight-line depreciation over a 10-year useful life. The formula is: Current Value = Purchase Price × (1 - Years Owned / 10). This is a simplified book value — actual market value may differ. Use this as a reference for fleet replacement planning.',
        extra: <NOTE>Trailers typically have a longer useful life (15-20 years) than power units (7-10 years). The system uses a standard 10-year rate for all units. Consult your accountant for formal depreciation schedules used in tax filings.</NOTE>
      },
      {
        heading: 'Vehicle TCO (Total Cost of Ownership)',
        body: 'Navigate to Vehicle TCO in the sidebar to see a full cost breakdown per unit. The TCO report stacks fuel costs, repair costs, and depreciation for each vehicle and calculates a cost-per-mile figure. A red warning flag appears when total repair costs exceed 50% of the original purchase price — this is a strong signal to evaluate replacing the unit.',
        extra: <TIP>Review the TCO report quarterly during fleet planning meetings. Units with high cost-per-mile and low revenue are candidates for redeployment or sale.</TIP>
      },
      {
        heading: 'Repair Manuals & Technical Resources',
        body: 'The Repair Manuals tab on each vehicle card provides links to manufacturer repair resources, TSBs (Technical Service Bulletins), and diagnostic guides organized by make (Ford, RAM, Kenworth, Peterbilt, etc.). These are external reference links for your mechanics and are accessible to Admin, Tech, and Employee roles.'
      }
    ]
  },
  {
    id: 'work-orders',
    title: 'Work Orders & Repairs',
    icon: Wrench,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    content: [
      {
        heading: 'Creating a Work Order',
        body: 'Work orders are the official record of every repair or maintenance job performed on a vehicle. Go to Work Orders and click "New Work Order".',
        steps: [
          'Enter a WO Number (e.g., WO-2024-0112). Keep a consistent numbering system.',
          'Enter a Title — a short description of the job (e.g., "Replace front brake pads - Unit 101").',
          'Select Repair Type (Engine, Transmission, Brakes, Tires, Electrical, HVAC, Suspension, etc.).',
          'Set Priority: Low, Medium, High, or Critical.',
          'Select the Vehicle being serviced.',
          'Assign a Technician from the dropdown.',
          'Enter the Opened Date, Due Date, and current Odometer reading.',
          'Enter the Driver Complaint — what the driver reported (e.g., "pulling left on braking").',
          'Enter the Tech Diagnosis — root cause after inspection.',
          'Enter Repair Notes — detailed description of work performed.',
          'Add Parts used: part number, description, quantity, unit cost, and source (in stock, ordered, warranty).',
          'Enter Labor Hours and Labor Rate — labor cost calculates automatically.',
          'If outsourced, enter the external Shop Name.',
          'Check Warranty Repair if parts/labor are covered under warranty.',
          'Click Save.'
        ],
        extra: <TIP>Fill out the Driver Complaint and Tech Diagnosis fields thoroughly. These fields create a searchable repair history that helps diagnose recurring issues and supports warranty claims.</TIP>
      },
      {
        heading: 'Work Order Status Workflow',
        body: 'Work orders move through a defined status flow. Update the status as work progresses so dispatch and management have accurate visibility.',
        extra: (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {['Open', 'In Progress', 'Parts Ordered', 'Awaiting Parts', 'Completed', 'Cancelled'].map((s, i, arr) => (
              <React.Fragment key={s}>
                <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded">{s}</span>
                {i < arr.length - 1 && <span className="text-slate-400 self-center">→</span>}
              </React.Fragment>
            ))}
          </div>
        )
      },
      {
        heading: 'Repairs Dashboard',
        body: 'The Repairs Dashboard (sidebar: Repairs Dashboard) gives a bird\'s-eye view of all active work. It shows open work orders grouped by status and priority, total repair costs for the current month, cost-per-vehicle breakdowns, and vehicle downtime metrics. Use this during your morning operations briefing to prioritize the shop schedule.',
        extra: <NOTE>Only work orders with status "Completed" are included in TCO and Fleet P&L cost calculations. Ensure techs mark jobs complete promptly to keep financial reporting accurate.</NOTE>
      },
      {
        heading: 'Diagnostics (DTC Codes)',
        body: 'The Diagnostics module (sidebar: Diagnostics) stores all fault codes retrieved from vehicles via OBD-II, J1939, or J1708 scanners. Log a new DTC by selecting the vehicle, entering the code (e.g., P0301, SPN 100), system affected, severity, and scan date. The AI Assistant can help you interpret any DTC code — just paste the code into the chat.',
        extra: <TIP>Log diagnostic codes even when the repair is not immediate. The history helps identify patterns — a code that appears repeatedly may indicate a deeper systemic issue.</TIP>
      }
    ]
  },
  {
    id: 'maintenance',
    title: 'Preventive Maintenance',
    icon: Calendar,
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    content: [
      {
        heading: 'Why Preventive Maintenance Matters',
        body: 'Unplanned breakdowns cost 3-5x more than scheduled maintenance and create compliance risk if a vehicle fails a roadside inspection due to a neglected service item. The FleetCo PM module helps you stay ahead of scheduled services so vehicles never go overdue.',
      },
      {
        heading: 'Creating a Maintenance Schedule',
        body: 'Go to Preventive Maintenance and click "Add Schedule".',
        steps: [
          'Select the Vehicle.',
          'Choose the Service Type (Oil Change, Tire Rotation, Brake Service, DPF Filter, Annual Inspection, etc.). Select "Custom" for non-standard services.',
          'Set the Due Date and/or Due Mileage — whichever comes first triggers the alert.',
          'Set Interval Miles (e.g., 15,000 for oil changes) and/or Interval Days (e.g., 365 for annual inspection) to create a recurring schedule.',
          'Enter Last Service Date and Last Service Mileage if the service has been performed before.',
          'Assign a Technician and enter an Estimated Cost for budgeting.',
          'Click Save.'
        ],
        extra: <TIP>Set both a mileage interval AND a date interval for time-sensitive items like annual DOT inspections. The system will alert on whichever threshold is reached first.</TIP>
      },
      {
        heading: 'Maintenance Statuses',
        body: 'Scheduled — future service planned. Upcoming — due within 14 days or 1,000 miles. Overdue — past due date or mileage. Completed — service was performed and logged.',
        extra: <WARN>Overdue items appear in red on the Maintenance Calendar and dashboard. Address overdue DOT annual inspections immediately — operating a vehicle with an expired inspection sticker is an automatic out-of-service violation during roadside inspections.</WARN>
      },
      {
        heading: 'Maintenance Calendar',
        body: 'The Maintenance Calendar (sidebar: Maint. Calendar) shows all scheduled services in a month-view calendar. Click any event to view details or mark it complete. Use the vehicle and service type filters to focus on specific units or service categories. Print the calendar view for shop planning or driver briefings.',
      }
    ]
  },
  {
    id: 'inspections',
    title: 'Inspections & DVIRs',
    icon: ClipboardCheck,
    color: 'text-green-700',
    bg: 'bg-green-50',
    content: [
      {
        heading: 'DVIR Requirements Under FMCSA',
        body: 'Federal Motor Carrier Safety Regulations (49 CFR Part 396.11) require drivers to complete a written Driver Vehicle Inspection Report (DVIR) at the end of every driving day. The report must cover specific vehicle systems and be signed by the driver. If defects are found, a qualified mechanic must certify the vehicle is safe before it returns to service.',
        extra: <WARN>Failing to complete required DVIRs can result in CSA violations, fines, and out-of-service orders during roadside inspections. Every driver must complete a DVIR at the end of every operating day — no exceptions.</WARN>
      },
      {
        heading: 'Completing a Pre-Trip Checklist',
        body: 'Drivers access the Pre-Trip Checklist from the sidebar before every shift. The checklist covers all FMCSA-required inspection items.',
        steps: [
          'Open Pre-Trip Checklist from the sidebar.',
          'Select the vehicle and enter the current odometer reading.',
          'Work through each item: Service Brakes, Parking Brake, Steering, Lights (headlights, taillights, turn signals, hazards), Horn, Windshield & Wipers, Mirrors, Tires & Wheels, Fuel Tanks, Coupling Devices, Emergency Equipment, and more.',
          'Mark each item OK, Defect, or N/A. Add notes on any defect items.',
          'If defects are found, check "Defects Found" and indicate whether they were corrected before departure.',
          'Sign digitally at the bottom by drawing your signature in the signature pad.',
          'Submit the form. A record is created in the Inspections module.'
        ],
        extra: <TIP>Even if no defects are found, the DVIR must still be completed and signed. "No defects found" is a valid and required certification.</TIP>
      },
      {
        heading: 'Manager Sign-Off Workflow',
        body: 'When a driver marks defects on a DVIR, the record is automatically flagged with "Awaiting Sign-Off" status and a manager is notified. The manager must review the defect notes, confirm the vehicle is safe (or that repairs were made), add their notes, and provide a digital signature.',
        steps: [
          'Navigate to Inspections in the sidebar.',
          'Filter by status "Awaiting Sign-Off" to find records needing review.',
          'Open the inspection record and review the driver\'s defect notes.',
          'Verify that defects were corrected or are acceptable for continued operation.',
          'Add Manager Notes documenting the decision.',
          'Provide a digital signature in the signature pad.',
          'Click "Sign Off". The status changes to "Passed" or "Failed" based on your determination.'
        ],
        extra: <WARN>Never sign off on a DVIR for a vehicle that has uncorrected safety-critical defects (brakes, steering, tires, lights). Doing so creates significant liability exposure for the carrier.</WARN>
      },
      {
        heading: 'Exporting DVIRs as PDF',
        body: 'Open any inspection record and click "Export PDF" to download a DOT-compliant DVIR document showing the full checklist, defect notes, driver signature, and manager sign-off (if applicable). This PDF can be printed and kept in the vehicle for 90 days as required by FMCSA regulations, or stored digitally.',
        extra: <NOTE>FMCSA requires DVIRs to be retained for a minimum of 3 months. The FleetCo system stores all records indefinitely — use the export function to produce physical copies for roadside presentation or DOT audits.</NOTE>
      }
    ]
  },
  {
    id: 'hos',
    title: 'HOS / ELD Logs',
    icon: FileText,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    content: [
      {
        heading: 'Hours of Service Regulations Overview',
        body: 'FMCSA Hours of Service rules (49 CFR Part 395) limit how many hours a commercial driver can operate a CMV. The key limits are: 11 hours driving after 10 consecutive off-duty hours; 14-hour on-duty window after coming on duty; 30-minute rest break after 8 hours of driving; and 60/70 hours on duty in 7/8 consecutive days. FleetCo automatically checks logs against these rules.',
        extra: <NOTE>FleetCo\'s HOS module is a manual log entry system for record-keeping and compliance tracking. If your fleet uses ELD hardware (as required for most CMV operations), you should still log hours here for backup documentation and management reporting.</NOTE>
      },
      {
        heading: 'Creating an HOS Log',
        body: 'Go to HOS / ELD Logs and click "New Log".',
        steps: [
          'Select the Driver and Log Date.',
          'Select the Vehicle driven.',
          'Enter the Carrier Name and Main Office Address.',
          'Enter Starting Location and Ending Location for the day.',
          'Enter Odometer Start and Odometer End readings.',
          'Add Duty Segments: click "Add Segment" for each status change throughout the day.',
          'For each segment: select duty status (Off Duty, Sleeper Berth, Driving, On Duty Not Driving), enter Start Time and End Time (HH:MM format), location, and any notes.',
          'The system automatically totals hours in each duty category.',
          'Enter Shipping Documents (bill of lading numbers, manifest numbers).',
          'Add any Remarks (e.g., "Adverse weather conditions", "Emergency conditions exception").',
          'Check "Signature Confirmed" to certify the log is true and correct.',
          'Save as Draft or Submit.'
        ],
        extra: <TIP>Log duty segments in real time or at the end of each shift. Logs submitted more than 24 hours after the driving day should include a note explaining the delay.</TIP>
      },
      {
        heading: 'HOS Violations — What Gets Flagged',
        body: 'The system automatically detects and flags these common violations:',
        extra: (
          <div className="mt-3 space-y-2">
            {[
              { v: '11-Hour Rule', d: 'More than 11 hours of driving time logged in a single day.' },
              { v: '14-Hour Window', d: 'On-duty time extends beyond 14 hours from the start of the first on-duty period.' },
              { v: '30-Minute Break', d: 'No 30-minute break taken after 8 consecutive hours of driving.' },
              { v: '10-Hour Rest', d: 'Less than 10 consecutive off-duty/sleeper hours before next driving period.' },
              { v: '70-Hour Rule', d: 'More than 70 cumulative on-duty hours in the past 8 days (or 60 in 7 days).' },
            ].map(r => (
              <div key={r.v} className="flex gap-2 text-xs">
                <span className="font-black text-red-700 w-28 flex-shrink-0">{r.v}</span>
                <span className="text-slate-600">{r.d}</span>
              </div>
            ))}
          </div>
        )
      },
      {
        heading: 'Log Status Workflow',
        body: 'Draft → Submitted → Reviewed. Drivers create logs in Draft status. After completing and certifying the log, they submit it. Managers/dispatchers review submitted logs and mark them Reviewed. Reviewed logs are locked and archived.',
        extra: <WARN>Unreviewed logs are not officially audited. Managers should review all submitted logs within 24 hours of submission to maintain compliance records.</WARN>
      }
    ]
  },
  {
    id: 'fuel',
    title: 'Fuel Logs & IFTA',
    icon: Fuel,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    content: [
      {
        heading: 'Logging a Fuel Purchase',
        body: 'Accurate fuel logging is essential for IFTA compliance, cost tracking, and MPG analysis. Go to Fuel Audits and click "Add Fuel Log".',
        steps: [
          'Select the Vehicle.',
          'Select the Driver who fueled up.',
          'Enter the Date of the fuel purchase.',
          'Enter the Location (city and state — this is used for IFTA jurisdiction tracking).',
          'Select Fuel Type: Diesel, Gasoline, or DEF.',
          'Enter Gallons purchased.',
          'Enter Price Per Gallon — Total Cost calculates automatically.',
          'Enter the current Odometer Reading.',
          'Optionally upload a Receipt photo or scan.',
          'Add any Notes (e.g., reefer fuel purchase, emergency fill-up).',
          'Click Save.'
        ],
        extra: <TIP>Always enter the full state name or abbreviation in the Location field (e.g., "Dallas, TX" or "Chicago, IL"). The IFTA report extracts the state code from this field to build your tax-by-jurisdiction breakdown. Incomplete locations will not be captured in IFTA reporting.</TIP>
      },
      {
        heading: 'IFTA Reporting',
        body: 'The International Fuel Tax Agreement (IFTA) requires carriers operating in multiple states/provinces to file quarterly fuel tax returns. FleetCo\'s IFTA Dashboard automatically aggregates fuel purchases by state, calculates estimated tax owed based on current state tax rates, and generates a filing-ready report.',
        steps: [
          'Go to IFTA Dashboard in the sidebar.',
          'Select the quarter (Q1–Q4) and year.',
          'Review the state-by-state breakdown of gallons purchased and estimated tax owed.',
          'Cross-reference with your mileage data by state (from loads and HOS logs).',
          'Click "Export CSV" to download the report formatted for your tax preparer or direct filing.',
          'Repeat for all four quarters annually.'
        ],
        extra: <WARN>IFTA filing deadlines are April 30 (Q1), July 31 (Q2), October 31 (Q3), and January 31 (Q4). Late filings incur penalties and interest. The FleetCo IFTA report provides estimated data — always verify with your licensed tax professional before filing.</WARN>
      },
      {
        heading: 'Fuel Cost Analysis',
        body: 'The Fuel Audits page shows total fuel spend by vehicle, average price per gallon, gallons consumed, and estimated MPG per unit. High fuel costs or poor MPG on a specific vehicle may indicate tire under-inflation, engine issues, or driver behavior problems worth investigating.',
      }
    ]
  },
  {
    id: 'drivers',
    title: 'Driver Management',
    icon: UserCheck,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    content: [
      {
        heading: 'Driver Profiles',
        body: 'The Drivers page shows all drivers with their assigned vehicle, recent activity summary (loads completed, miles driven, revenue generated), and compliance status. Click any driver card to open their full profile. The profile consolidates all activity linked to that driver across loads, HOS logs, inspections, fuel logs, work orders, and screening records.',
      },
      {
        heading: 'Creating a Driver Account',
        body: 'Go to Team & Access in the sidebar and click "Create Driver Account". Enter the driver\'s name, email address, and a temporary password. The system creates the account and sends an invitation email. The driver will be prompted to change their password on first login.',
        extra: <NOTE>Drivers are assigned the "driver" role automatically. This limits their access to only the modules relevant to their work: load board, pre-trip checklist, HOS logs, navigation, delivery routes, messages, and fuel logs. They cannot see financial data, payroll, or other drivers\' information.</NOTE>
      },
      {
        heading: 'Background Checks & MVR Tracking',
        body: 'The Screening tab on the Drivers page lets you track all compliance checks per driver. Click "Add Screening Record" and complete the form.',
        steps: [
          'Select the driver.',
          'Choose Check Type: Background Check, MVR, Drug Test, Employment Verification, Criminal History, or Full Package.',
          'Select the Provider (Checkr, Sterling, HireRight, Manual/Internal, Other).',
          'Enter the Ordered Date.',
          'Set Status: Pending, In Progress, Clear, Flagged, or Failed.',
          'Enter the Completed Date once results are received.',
          'Set an Expiration Date (e.g., MVRs typically need annual renewal).',
          'Upload the Report (PDF).',
          'Enter any Violations noted in the report.',
          'Save the record.'
        ],
        extra: <TIP>Set expiration dates on all screening records. The Compliance Tracker will alert you 30 days before any record expires so you can order renewals before drivers go out of compliance.</TIP>
      },
      {
        heading: 'Driver Scorecards',
        body: 'The Driver Scorecards page provides performance metrics for each driver: total loads completed, total miles driven, on-time delivery rate, HOS violation count, incident history, and fuel efficiency. Use scorecards during quarterly reviews, for bonus evaluations, or to identify drivers who may need additional coaching.',
      },
      {
        heading: 'Deactivating a Driver',
        body: 'Go to Team & Access, find the driver, and use the Status toggle to deactivate their account. Deactivated users cannot log in but their records are preserved for compliance and reporting purposes. Never delete a driver account — always deactivate.',
        extra: <WARN>Delete a driver\'s access immediately upon termination. A terminated driver with active portal credentials is a significant security and liability risk.</WARN>
      }
    ]
  },
  {
    id: 'payroll',
    title: 'Payroll',
    icon: DollarSign,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    content: [
      {
        heading: 'Pay Structure Types',
        body: 'FleetCo supports six compensation structures. Select the correct pay type when running payroll to ensure accurate calculations.',
        extra: (
          <div className="mt-3 space-y-2">
            {[
              { type: 'W2', desc: 'Standard employee wages with tax withholding. Enter hours worked and hourly rate, or salary amount per period.' },
              { type: '1099', desc: 'Independent contractor pay. No tax withholding. Enter gross amount agreed upon.' },
              { type: 'Per Mile', desc: 'Driver is paid a set rate per mile driven. Enter miles driven and rate per mile — gross pay calculates automatically.' },
              { type: 'Per Stop', desc: 'Driver is paid per completed delivery stop. Enter stops completed and rate per stop.' },
              { type: 'Salary', desc: 'Fixed pay per period regardless of hours or miles. Enter the agreed salary amount.' },
              { type: 'Hourly', desc: 'Pay based on hours worked at an agreed rate. Enter hours worked and hourly rate.' },
            ].map(r => (
              <div key={r.type} className="flex gap-2 text-xs">
                <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full w-20 flex-shrink-0 text-center">{r.type}</span>
                <span className="text-slate-600">{r.desc}</span>
              </div>
            ))}
          </div>
        )
      },
      {
        heading: 'Running Payroll',
        body: 'Go to Payroll and click "Run Payroll".',
        steps: [
          'Select the Driver from the dropdown.',
          'Choose the Pay Type.',
          'Set Pay Period Start and End dates.',
          'Enter the relevant metrics (hours, miles, stops, or salary) — gross pay calculates automatically.',
          'Add Bonuses (safety bonus, performance bonus, etc.) if applicable.',
          'Add Deductions (health insurance, garnishment, advances, etc.) if applicable.',
          'Net Pay = Gross Pay + Bonuses − Deductions.',
          'Set Status to Draft initially.',
          'Select Payment Method (Direct Deposit, Check, Zelle, etc.).',
          'Add any Notes for record-keeping.',
          'Save the record.'
        ],
        extra: <TIP>Run payroll after pulling the Driver Payroll Summary report, which auto-calculates route and stop counts from completed delivery records. This eliminates manual counting errors.</TIP>
      },
      {
        heading: 'Approving and Marking Paid',
        body: 'Once you\'ve reviewed the payroll record, change the status from Draft to Approved. After disbursement (direct deposit, check issuance, etc.), mark the record as Paid. This creates an audit trail showing when and how each driver was compensated.',
        extra: <NOTE>For 1099 contractors, retain all paid payroll records. At year-end, you\'ll need cumulative payment totals per contractor to prepare 1099-NEC forms for the IRS. The Payroll Summary Excel report in the Reports Center makes this easy to export.</NOTE>
      },
      {
        heading: 'Driver Payroll Summary',
        body: 'The Driver Payroll Summary page (sidebar: Driver Payroll) automatically calculates driver earnings from completed delivery routes and stops. Set your custom rates for pay-per-stop and pay-per-route, choose a date range, and the system totals each driver\'s earnings. Export to Excel for payroll processing or record-keeping.',
      }
    ]
  },
  {
    id: 'delivery',
    title: 'Final Mile Delivery',
    icon: Route,
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    content: [
      {
        heading: 'Overview of the Delivery System',
        body: 'FleetCo\'s final mile delivery system manages the full workflow from route creation to proof-of-delivery capture. It consists of three interconnected tools: Route Builder (create routes and add stops), PD Command Tower (dispatch and monitor all routes), and My Delivery Route (driver-facing view for executing deliveries).',
      },
      {
        heading: 'Building a Route',
        body: 'Go to Route Builder and click "New Route".',
        steps: [
          'Enter a Route Name (e.g., "North Dallas — June 12").',
          'Select the Route Date.',
          'Assign a Driver and Vehicle.',
          'Add delivery stops manually by clicking "Add Stop": enter recipient name, phone, full address (street, city, state, zip), package description, and access notes (gate codes, apartment numbers, etc.).',
          'Drag stops to reorder them in the desired delivery sequence.',
          'Alternatively, click "Bulk Import" to upload a CSV file with hundreds of stops at once.',
          'Review the route map to confirm stop order and geography make sense.',
          'Click "Save & Dispatch" to finalize and assign to the driver.'
        ],
        extra: <TIP>Organize stops geographically when building routes manually — work in loops rather than back-and-forth to minimize drive time. The bulk CSV import is ideal for high-volume routes (50+ stops) downloaded from your order management system.</TIP>
      },
      {
        heading: 'PD Command Tower — Dispatch View',
        body: 'The PD Command Tower is the real-time dispatch hub for all delivery operations. It shows all routes for the selected date with stop completion progress (e.g., "12 / 28 stops completed"). Click any route card to expand it and see individual stop statuses, driver notes, and proof-of-delivery photos.',
        extra: <NOTE>The Command Tower does not automatically update in real-time — click the refresh button or reload the page to see the latest driver updates from the field.</NOTE>
      },
      {
        heading: 'My Delivery Route — Driver View',
        body: 'Drivers access their assigned route from "My Delivery Route" in the sidebar. Stops are listed in dispatch sequence with recipient name, address, and delivery notes.',
        steps: [
          'Tap the stop to expand its details and access notes.',
          'Use the navigation button to open the address in Google Maps for turn-by-turn directions.',
          'Upon arrival, tap "Mark Delivered" to update the stop status.',
          'Optionally upload a Proof of Delivery photo (package at door, mailbox, etc.).',
          'Optionally capture a Recipient Signature using the digital signature pad.',
          'Add Driver Notes (e.g., "Left at back door", "Handed to receptionist").',
          'If unable to deliver, tap "Failed" and select a reason (Nobody Home, Wrong Address, Refused, Damaged, Other).',
          'Continue to the next stop.'
        ],
        extra: <TIP>Always capture proof of delivery for high-value packages or deliveries to businesses. POD photos are time-stamped and stored permanently — they are your defense against "I never received it" disputes.</TIP>
      }
    ]
  },
  {
    id: 'compliance',
    title: 'Compliance & Safety',
    icon: ShieldCheck,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    content: [
      {
        heading: 'Compliance Tracker',
        body: 'The Compliance Tracker is a centralized dashboard showing all expiration dates across vehicle documents and driver screening records. Items are color-coded: green (valid), amber (expiring within 30 days), red (expired). Click any item to jump directly to the document or screening record to take action.',
        extra: <TIP>Make the Compliance Tracker part of your weekly safety review process. A 5-minute check every Monday can prevent costly last-minute renewals and DOT violations.</TIP>
      },
      {
        heading: 'Incident Reports',
        body: 'Log any safety-related event using the Incident Reports module (sidebar: Incident Reports). This covers accidents, near-misses, roadside inspections, CSA violations, cargo damage, theft, and weather events.',
        steps: [
          'Click "New Incident".',
          'Select Incident Type and Severity (Minor, Moderate, Serious, Critical).',
          'Enter the Incident Date, Time, and Location.',
          'Select the Driver and Vehicle involved.',
          'Write a detailed Description of what happened.',
          'Enter Police Report Number if applicable.',
          'Check DOT Recordable if this meets the FMCSA recordable accident criteria.',
          'Check Injuries and describe if applicable.',
          'Check Tow Required if the vehicle had to be towed.',
          'Enter Citations Issued and CSA Points assessed.',
          'Enter Insurance Claim Number if a claim was filed.',
          'Enter Estimated Damage Cost.',
          'Upload Photos or documents (police report, insurance form, etc.).',
          'Enter Corrective Action taken to prevent recurrence.',
          'Save. Status starts as Open.'
        ],
        extra: <WARN>A DOT Recordable Accident is defined as an accident involving a fatality, an injury requiring immediate medical treatment away from the scene, or a vehicle towed from the scene. All recordable accidents must be tracked in your carrier safety records for a minimum of 3 years.</WARN>
      },
      {
        heading: 'CSA Score Awareness',
        body: 'The Compliance, Safety, Accountability (CSA) program tracks carrier safety performance across 7 BASICs: Unsafe Driving, HOS Compliance, Driver Fitness, Controlled Substances/Alcohol, Vehicle Maintenance, Hazardous Materials, and Crash Indicator. Each roadside violation and recordable accident adds CSA points. High CSA scores can trigger FMCSA interventions, loss of insurance, and customer contract loss.',
        extra: <NOTE>Use the Incident Reports module to track all CSA points. This allows you to monitor your score proactively and dispute incorrect violations through the DataQs system before they impact your safety rating.</NOTE>
      }
    ]
  },
  {
    id: 'financials',
    title: 'Invoices & Financial Reporting',
    icon: TrendingUp,
    color: 'text-green-700',
    bg: 'bg-green-50',
    content: [
      {
        heading: 'Creating an Invoice',
        body: 'Go to Invoices and click "New Invoice".',
        steps: [
          'Enter an Invoice Number (e.g., INV-2024-0089). Use a consistent numbering system.',
          'Select Invoice Type: Labor, Parts, Labor & Parts, Fuel, or Other.',
          'Select the Customer.',
          'Optionally link a Vehicle.',
          'Set the Issue Date and Due Date (typically Net 30).',
          'Add Line Items: enter a description, quantity, unit price, and type (labor/parts/other) for each item. Line totals calculate automatically.',
          'Review the Subtotal.',
          'Add Tax if applicable.',
          'Add Notes (payment instructions, references, etc.).',
          'Save as Draft to review, or change status to Sent when emailing to the customer.'
        ],
        extra: <TIP>Mark invoices as Paid promptly when payment is received. Unpaid invoices past their due date automatically appear as "Overdue" in the Invoice Aging Report, which helps you identify accounts requiring follow-up.</TIP>
      },
      {
        heading: 'Fleet P&L (Profit & Loss)',
        body: 'The Fleet P&L page (sidebar: Fleet P&L) shows revenue vs. costs per vehicle and in aggregate. Revenue is pulled from delivered loads. Costs are pulled from fuel logs and completed work orders. Net P&L = Revenue − Fuel Cost − Repair Cost. Green vehicles are profitable; red units are operating at a loss.',
        extra: <NOTE>Fleet P&L data is only as accurate as your data entry. If fuel logs or work order costs are missing, the P&L will understate costs. Ensure drivers log every fuel purchase and techs close work orders with accurate cost totals.</NOTE>
      },
      {
        heading: 'Reports Center',
        body: 'The Reports page (admin/executive only) provides 20+ downloadable Excel reports. Each report supports date range filtering and custom column selection.',
        extra: (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
            {[
              'Revenue Summary', 'Invoice Aging Report', 'Fuel Cost Report', 'Fuel Cost Per Vehicle',
              'Payroll Summary', 'Load Summary', 'Load Revenue by Driver', 'Driver Performance',
              'Fleet Status Report', 'Vehicle Downtime', 'Maintenance Schedule', 'Work Orders',
              'Parts Inventory', 'Inspection & DVIR', 'HOS / ELD Logs', 'IFTA Fuel Tax',
              'Customer List', 'Vendor & Contracts', 'Driver Screening Records', 'Fleet P&L Summary'
            ].map(r => (
              <div key={r} className="flex items-center gap-1.5 text-slate-600">
                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />{r}
              </div>
            ))}
          </div>
        )
      }
    ]
  },
  {
    id: 'vendors',
    title: 'Vendors & Contracts',
    icon: Store,
    color: 'text-lime-700',
    bg: 'bg-lime-50',
    content: [
      {
        heading: 'Managing Vendors',
        body: 'The Vendors module (sidebar: Vendors & Contracts) stores all your shop vendors, parts suppliers, tire dealers, towing companies, fuel cards, weigh scales, and other fleet service providers. Centralizing this information saves time during breakdowns and ensures contract terms are accessible to everyone on the team.',
      },
      {
        heading: 'Adding a Vendor',
        body: 'Click "Add Vendor" and complete the profile.',
        steps: [
          'Enter the Vendor Name and Type (Repair Shop, Parts Supplier, Tire Shop, Towing, Fuel, Body Shop, DEF/Emissions, Weigh Scale, Other).',
          'Enter the Point of Contact name, title, and phone numbers.',
          'Enter the full address and geolocation (lat/lng) for map integration.',
          'Enter contract details: Contract Number, Start Date, End Date.',
          'Enter Contracted Labor Rate ($/hr) and Parts Discount %.',
          'List Specialties (e.g., "Cummins certified", "Freightliner dealer").',
          'For weigh scale vendors: check "Scale Certified", enter max capacity, hours, and fee per weigh-in.',
          'Add Notes for any additional context.',
          'Save.'
        ],
        extra: <TIP>Add all breakdown vendors (towing, tire, roadside repair) before they\'re needed. A driver stranded at 2am can pull up vendor contacts from the portal in seconds rather than searching through contacts or calling dispatch.</TIP>
      }
    ]
  },
  {
    id: 'parts',
    title: 'Parts Inventory',
    icon: Archive,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    content: [
      {
        heading: 'Managing Parts Inventory',
        body: 'The Parts Inventory module tracks all shop stock. Accurate inventory management reduces repair delays caused by unexpected parts shortages.',
        steps: [
          'Go to Parts Inventory and click "Add Part".',
          'Enter Part Number and Description.',
          'Select Category (Engine, Transmission, Brakes, Tires, Electrical, etc.).',
          'Enter Quantity on Hand and Reorder Point.',
          'Enter Unit Cost and Supplier name.',
          'Enter Shelf/Bin Location for easy retrieval.',
          'Add Notes if needed.',
          'Save.'
        ],
        extra: <TIP>Set your reorder point conservatively — it should be high enough to cover the lead time for reordering. For critical parts (brake chambers, air filters, belts), keep at least a 2-week supply on hand.</TIP>
      },
      {
        heading: 'Parts and Work Orders',
        body: 'When creating or editing a Work Order, you can add parts directly from the Parts section. Enter the part number, description, quantity used, unit cost, and source (In Stock, Ordered, Warranty). Parts marked "In Stock" will decrease your inventory count when the work order is saved.',
        extra: <NOTE>The Parts Inventory report in the Reports Center shows all parts with their current quantity, value, and reorder status. Run this report monthly to identify low-stock items before they cause repair delays.</NOTE>
      }
    ]
  },
  {
    id: 'timeclock',
    title: 'Mechanic Time Clock',
    icon: Clock,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    content: [
      {
        heading: 'Overview',
        body: 'The Time Clock module (sidebar: Time Clock) allows mechanics and technicians to clock into general shifts or specific work orders. This provides accurate labor tracking for payroll processing, work order billing, and shop productivity analysis.',
      },
      {
        heading: 'Clocking In',
        body: 'Mechanics access the Time Clock page and select their clock-in type.',
        steps: [
          'Go to Time Clock in the sidebar.',
          'Select Entry Type: "Shift" (general shop time) or "Work Order" (time tied to a specific repair job).',
          'If Work Order: select the WO number from the dropdown.',
          'Add optional Notes (e.g., "Starting engine diagnosis on Unit 103").',
          'Click "Clock In". A timer starts immediately.',
          'The current clock-in status is displayed at the top of the page.'
        ],
        extra: <NOTE>Only one active clock-in is allowed per user at a time. If you need to switch from one work order to another, clock out of the current entry first before clocking into the new one.</NOTE>
      },
      {
        heading: 'Clocking Out',
        body: 'When the task is complete, go to Time Clock and click "Clock Out". Duration is calculated automatically in minutes and hours. Add notes summarizing what was accomplished. The entry is saved and visible in your history log.',
      },
      {
        heading: 'Admin Time Tracking View',
        body: 'Admins and executives see an additional "Admin View" tab on the Time Clock page showing all team members\' time entries for the current day. This includes who is currently clocked in, which work order they are on, and elapsed time. A summary shows total hours by technician for payroll calculations.',
        extra: <TIP>Export time clock data to the Reports Center (Work Orders report includes labor hours) at the end of each pay period to cross-reference tech-reported hours against work order labor entries.</TIP>
      }
    ]
  },
  {
    id: 'messaging',
    title: 'Messages & Communication',
    icon: MessageCircle,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    content: [
      {
        heading: 'Driver Messaging',
        body: 'The Messages module provides a private, logged communication channel between dispatchers/managers and individual drivers. All messages are stored in the system with timestamps, creating an audit trail for any communication-related disputes.',
        steps: [
          'Go to Messages in the sidebar.',
          'Select a driver from the contact list on the left.',
          'Type your message in the text field at the bottom.',
          'Press Send or hit Enter to send.',
          'The driver will see the message the next time they open the Messages page.'
        ],
        extra: <TIP>Use the Messages module for dispatch-related communications (load updates, route changes, policy reminders). Keep communications professional and on-topic — all messages are stored and accessible to administrators.</TIP>
      },
      {
        heading: 'AI Assistant',
        body: 'The FleetCo AI Assistant (sidebar: AI Assistant) is a conversational AI available to all portal users. It can answer questions about platform features, help interpret data, provide fleet management guidance, and offer DOT compliance advice. Ask it anything fleet-related in plain language.',
        extra: <NOTE>The AI Assistant is designed specifically for fleet management topics. It will not help with personal questions, legal advice, or topics unrelated to fleet operations. For platform technical issues, contact your fleet administrator.</NOTE>
      }
    ]
  },
];

export default function CustomerManual() {
  const [expanded, setExpanded] = useState(() => Object.fromEntries(SECTIONS.map(s => [s.id, true])));
  const [search, setSearch] = useState('');

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const filtered = SECTIONS.filter(s =>
    !search ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.content.some(c =>
      c.heading.toLowerCase().includes(search.toLowerCase()) ||
      c.body.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Nav */}
      <div className="print:hidden bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-1.5 rounded">
            <Truck className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <div className="font-black text-sm">FLEETCO MANAGEMENT</div>
            <div className="text-amber-400 text-xs tracking-widest">USER MANUAL</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search manual..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-48"
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-1.5 rounded-lg text-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 print:px-0 print:py-4">

        {/* Cover */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-8 text-white print:rounded-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Truck className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="text-2xl font-black">FleetCo Management</div>
              <div className="text-amber-400 text-sm tracking-widest uppercase">Complete Portal User Manual</div>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            This comprehensive guide covers every module in the FleetCo portal with step-by-step instructions, compliance guidance, best practices, and tips for getting the most out of the platform. Whether you are a fleet administrator, driver, mechanic, or customer — this manual has everything you need.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-amber-400" /> {SECTIONS.length} modules covered</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Step-by-step instructions</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> FMCSA compliance guidance included</span>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 print:break-after-page">
          <h2 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" /> Table of Contents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SECTIONS.map((s, i) => (
              <a key={s.id} href={`#${s.id}`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600 transition-colors py-1">
                <span className="text-slate-400 text-xs w-6 flex-shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                <s.icon className={`w-3.5 h-3.5 ${s.color} flex-shrink-0`} />
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        {filtered.map((section, idx) => (
          <div key={section.id} id={section.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden print:break-inside-avoid">
            <div
              className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors print:cursor-default"
              onClick={() => toggle(section.id)}
            >
              <div className={`${section.bg} p-2 rounded-lg`}>
                <section.icon className={`w-5 h-5 ${section.color}`} />
              </div>
              <div className="flex-1">
                <div className="font-black text-slate-800 text-base">
                  <span className="text-slate-400 mr-2 text-sm">{String(idx + 1).padStart(2, '0')}.</span>
                  {section.title}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{section.content.length} topic{section.content.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="print:hidden">
                {expanded[section.id]
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />
                }
              </div>
            </div>

            {(expanded[section.id] || !!search) && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {section.content.map((item, i) => (
                  <div key={i} className="px-6 py-5">
                    <h4 className="font-black text-slate-800 text-sm mb-2 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: 'currentColor', opacity: 0.5 }} />
                      {item.heading}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.body}</p>
                    {item.steps && <Steps steps={item.steps} />}
                    {item.extra}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white text-center print:rounded-none">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-amber-400" />
            <span className="font-black text-sm">FleetCo Management LLC</span>
          </div>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            For technical support, contact your fleet administrator or use the AI Assistant inside the portal sidebar. For compliance-related questions, always consult a licensed DOT compliance specialist.
          </p>
          <p className="text-slate-600 text-xs mt-2">Manual version: June 2024 · FleetCo Portal</p>
        </div>
      </div>
    </div>
  );
}
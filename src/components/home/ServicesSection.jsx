import React from 'react';
import { MapPin, Route, Shield, DollarSign, Smartphone, Bot, Fuel, Wrench, BarChart3 } from 'lucide-react';

const modules = [
  {
    icon: MapPin,
    title: 'Live Fleet Map',
    description: 'Track vehicles and drivers on one map with real-time status and assignments.',
  },
  {
    icon: Route,
    title: 'Dispatch & Loads',
    description: 'Create loads, assign drivers, and monitor pickup and delivery milestones.',
  },
  {
    icon: Wrench,
    title: 'Maintenance & PM',
    description: 'Work orders, preventive maintenance schedules, and shop documentation.',
  },
  {
    icon: Fuel,
    title: 'Fuel & Audits',
    description: 'Fuel logs with receipt photos, station maps, and audit reports.',
  },
  {
    icon: Shield,
    title: 'Compliance Hub',
    description: 'HOS logs, DVIR inspections, IFTA reporting, and incident tracking.',
  },
  {
    icon: DollarSign,
    title: 'Payroll & Finance',
    description: 'Time clock, driver payroll, invoicing, and fleet P&L in one place.',
  },
  {
    icon: Smartphone,
    title: 'Driver App',
    description: 'Mobile clock-in, routes, fuel, dashcam, and messaging synced to the portal.',
  },
  {
    icon: Bot,
    title: 'FleetCo AI',
    description: 'Ask questions about your fleet and get help navigating the portal faster.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Scorecards',
    description: 'Executive dashboards, driver scorecards, and exportable fleet reports.',
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Platform modules</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">Everything in one subscription</h2>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
            FleetCo is software — portal plus driver app — built for carriers who want one system instead of a patchwork of tools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-amber-200 transition-all group"
            >
              <div className="bg-amber-50 group-hover:bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors">
                <Icon className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { Wrench, MapPin, Fuel, FileText, ShieldCheck, Truck, Search, BarChart3 } from 'lucide-react';

const services = [
  {
    icon: Search,
    title: 'Parts Sourcing',
    description: 'We locate OEM and aftermarket parts for national back-order items fast, so your rig gets back on the road.',
  },
  {
    icon: Fuel,
    title: 'Fuel Optimization',
    description: 'We find the best fuel prices along your routes to help you cut one of your biggest operating costs.',
  },
  {
    icon: MapPin,
    title: 'Towing & Repair',
    description: 'When your unit goes down, we coordinate the nearest tow and qualified repair shop — warranty or out-of-pocket.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety Coordination',
    description: 'Our Safety Coordinators keep your fleet compliant with federal and state regulations to avoid costly violations.',
  },
  {
    icon: FileText,
    title: 'Tax Documentation',
    description: 'Full documentation of all invoices and expenses per unit for year-end tax prep and budget planning.',
  },
  {
    icon: Wrench,
    title: 'Preventive Maintenance',
    description: 'Custom maintenance schedules and guides to reduce breakdowns and extend the life of your vehicles.',
  },
  {
    icon: BarChart3,
    title: 'Fleet Analytics',
    description: 'Track total cost per unit and get insights to help you budget and optimize your fleet for the coming year.',
  },
  {
    icon: Truck,
    title: 'Full Fleet Management',
    description: 'End-to-end management so you can focus on driving — we handle the details from parts to paperwork.',
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">What We Do</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">Services Built for Your Fleet</h2>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
            From finding back-ordered parts to optimizing fuel costs, FleetCo handles everything so you can keep moving.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(({ icon: Icon, title, description }) => (
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
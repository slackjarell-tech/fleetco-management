import React from 'react';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import { Truck, Shield, DollarSign, Users, Globe, Award } from 'lucide-react';

const VALUES = [
  { icon: Shield, label: 'Safety First', desc: 'We prioritize DOT compliance and driver well-being above all else.' },
  { icon: DollarSign, label: 'Cost Efficiency', desc: 'We save our clients an average of 18% on fleet operating costs through strategic sourcing and optimization.' },
  { icon: Users, label: 'Partnership', desc: 'We treat every owner-operator and small fleet as a true partner, not just a number.' },
  { icon: Globe, label: 'Nationwide Reach', desc: 'Headquartered in Dallas, TX, we serve carriers from coast to coast with local-market expertise.' },
  { icon: Award, label: 'Proven Results', desc: 'Founded in 2022, we have helped dozens of fleets improve compliance, cut costs, and grow revenue.' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      
      {/* Hero */}
      <section className="pt-24 pb-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-6">
            <Truck className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-6">About FleetCo Management</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Empowering owner-operators and small fleet owners with enterprise-grade management tools at a fraction of the cost.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
          <p>
            FleetCo Management LLC is a Dallas, Texas-based fleet management services company founded in 2022 by JaRell D. Slack and Desiree M. Clark. We are dedicated to providing quality, low-cost fleet management solutions to owner-operators and small fleet owners across the United States. Our mission is to level the playing field by giving independent carriers access to the same tools, data, and operational support that large enterprise fleets enjoy — without the enterprise price tag.
          </p>
          
          <p>
            Our platform covers every aspect of fleet operations: from vehicle maintenance scheduling and parts sourcing to fuel optimization, safety coordination, towing and repair dispatch, and comprehensive tax documentation. We handle the back-office complexity so our clients can focus on what they do best — keeping their trucks moving and their businesses growing. Whether you run a single truck or a fleet of fifty vehicles, FleetCo adapts to your needs.
          </p>

          <p>
            At the heart of FleetCo is a powerful, custom-built management portal that gives fleet owners real-time visibility into their operations. Track fuel expenses and IFTA compliance, manage preventive maintenance schedules, monitor driver hours of service and DVIR inspections, process payroll, and generate financial reports — all from a single dashboard. Our technology automates the tedious tasks that eat up hours of a fleet manager's week, reducing errors and uncovering cost savings that directly impact the bottom line.
          </p>

          <p>
            We serve a diverse range of clients, including dry van carriers, refrigerated fleets, flatbed operators, and final-mile delivery services. Our team brings decades of combined experience in transportation logistics, DOT compliance, diesel mechanics, and financial management. We understand the unique challenges that small and mid-size carriers face because we have lived them — from rising fuel costs and driver shortages to ever-changing federal regulations.
          </p>

          <p>
            FleetCo Management is more than a software platform — we are a strategic partner invested in the success of every carrier we serve. Our clients consistently report improved safety scores, reduced downtime, lower per-mile operating costs, and greater peace of mind knowing that compliance and paperwork are handled by professionals. We are proud to be based in Dallas, Texas, and to support the backbone of the American economy: the men and women who move freight across this country every day.
          </p>
        </div>

        {/* Values */}
        <div className="mt-16">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-10">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.label} className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{v.label}</h3>
                <p className="text-sm text-slate-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
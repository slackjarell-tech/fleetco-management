import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Mail, MapPin, Facebook, Linkedin, Youtube } from 'lucide-react';

export default function FooterSection() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-amber-500 p-1.5 rounded">
                <Truck className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <span className="text-white font-bold text-lg leading-none">FLEETCO</span>
                <span className="block text-amber-400 text-xs font-medium tracking-widest">MANAGEMENT LLC</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Quality, low-cost fleet management services for owner operators and small fleet owners across the nation.
            </p>
            <div className="flex gap-3">
              {[Facebook, Linkedin, Youtube].map((Icon, i) => (
                <div key={i} className="bg-slate-800 hover:bg-amber-500 w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-colors group">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link to="/about" className="hover:text-amber-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition-colors">Contact</Link></li>
              <li><Link to="/overview" className="hover:text-amber-400 transition-colors">Investors</Link></li>
              <li><Link to="/manual" className="hover:text-amber-400 transition-colors">Customer Manual</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold mb-4">Our Services</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              {['Fleet Management', 'Parts Sourcing', 'Fuel Optimization', 'Safety Coordination', 'Towing & Repair', 'Tax Documentation'].map((s) => (
                <li key={s} className="hover:text-amber-400 cursor-pointer transition-colors">{s}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Dallas, TX — Serving Nationwide</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a href="mailto:support@fleetcomanagement.org" className="hover:text-amber-400 transition-colors">
                  support@fleetcomanagement.org
                </a>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-slate-500 text-xs mb-1 font-semibold uppercase tracking-wider">Principal Members</div>
              <div className="text-slate-300 text-sm">JaRell D. Slack — Owner, Director of Fleet Management</div>
              <div className="text-slate-300 text-sm">Desiree M. Clark — Co-Owner, Director of Operations</div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">© 2024 FleetCo Management LLC. All rights reserved.</p>
          <p className="text-slate-600 text-xs">Dallas, TX | Founded 2022 | Licensed LLC</p>
        </div>
      </div>
    </footer>
  );
}
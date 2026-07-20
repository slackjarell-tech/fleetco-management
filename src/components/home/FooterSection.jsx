import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Facebook, Linkedin, Youtube } from 'lucide-react';
import SiteLegalNotice from '@/components/home/SiteLegalNotice';
import FleetcoLogo from '@/components/home/FleetcoLogo';
import { BRAND, SOCIAL, USER_MANUAL_PDF } from '@/lib/brand';

const SERVICE_LINKS = [
  { label: 'Fleet Management', href: '/#services' },
  { label: 'Parts Sourcing', href: '/#services' },
  { label: 'Fuel Optimization', href: '/#services' },
  { label: 'Safety Coordination', href: '/#services' },
  { label: 'Towing & Repair', href: '/#services' },
  { label: 'Tax Documentation', href: '/#services' },
];

const SOCIAL_ICONS = [
  { Icon: Facebook, label: 'Facebook', href: SOCIAL.facebook },
  { Icon: Linkedin, label: 'LinkedIn', href: SOCIAL.linkedin },
  { Icon: Youtube, label: 'YouTube', href: SOCIAL.youtube },
];

export default function FooterSection() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <FleetcoLogo size={56} variant="full" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Quality, low-cost fleet management services for owner operators and small fleet owners across the nation.
            </p>
            <div className="flex gap-3">
              {SOCIAL_ICONS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="bg-slate-800 hover:bg-amber-500 w-8 h-8 rounded flex items-center justify-center transition-colors group"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link to="/about" className="hover:text-amber-400 transition-colors">About Us</Link></li>
              <li><Link to="/#pricing" className="hover:text-amber-400 transition-colors">Pricing</Link></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition-colors">Contact</Link></li>
              <li><Link to="/login" className="hover:text-amber-400 transition-colors">Client Portal</Link></li>
              <li><Link to="/driver" className="hover:text-amber-400 transition-colors">Driver App</Link></li>
              <li><Link to="/manual" className="hover:text-amber-400 transition-colors">Customer Manual</Link></li>
              <li><a href={USER_MANUAL_PDF} className="hover:text-amber-400 transition-colors">Download User Guide (PDF)</a></li>
              <li><Link to="/overview" className="hover:text-amber-400 transition-colors">Investors</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold mb-4">Our Services</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              {SERVICE_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="hover:text-amber-400 transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{BRAND.location} — Serving Nationwide</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a href={`tel:${BRAND.phoneTel}`} className="hover:text-amber-400 transition-colors">{BRAND.phone}</a>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a href={`mailto:${BRAND.email}`} className="hover:text-amber-400 transition-colors">{BRAND.email}</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <SiteLegalNotice className="text-slate-500 text-sm" />
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
              <Link to="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
          <p className="text-slate-600 text-xs text-center sm:text-right">{BRAND.location} | Founded 2022 | Licensed LLC</p>
        </div>
      </div>
    </footer>
  );
}

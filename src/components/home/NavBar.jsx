import React, { useState } from 'react';
import { Menu, X, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import FleetcoLogo from '@/components/home/FleetcoLogo';

const NAV_LINKS = [
  { label: 'For Fleets', to: '/for-fleets' },
  { label: 'Load Board', to: '/load-board' },
  { label: 'For Brokers', to: '/for-brokers' },
  { label: 'Features', to: '/features' },
  { label: 'Compare', to: '/compare' },
  { label: 'Platform Tour', hash: 'platform-tour', onHome: true },
  { label: 'Yard Management', to: '/yard-management' },
  { label: 'Driver App', to: '/driver-app' },
  { label: 'Services', hash: 'services', onHome: true },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const onHome = location.pathname === '/';

  const navHref = (item) => {
    if (item.to) return item.to;
    if (item.hash) return onHome ? `#${item.hash}` : `/#${item.hash}`;
    return '/';
  };

  const handleNavClick = (item) => {
    if (item.hash && onHome) {
      document.getElementById(item.hash)?.scrollIntoView({ behavior: 'smooth' });
      setOpen(false);
      return;
    }
    setOpen(false);
  };

  const linkClass = 'text-slate-300 hover:text-amber-400 text-sm font-medium transition-colors';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0" onClick={() => setOpen(false)}>
            <FleetcoLogo size={44} />
          </Link>

          <div className="hidden lg:flex items-center gap-5">
            {NAV_LINKS.map((item) =>
              item.hash && onHome ? (
                <button key={item.label} type="button" onClick={() => handleNavClick(item)} className={linkClass}>
                  {item.label}
                </button>
              ) : (
                <Link key={item.label} to={navHref(item)} className={linkClass}>
                  {item.label}
                </Link>
              ),
            )}
            <Link to="/overview" className={linkClass}>Investors</Link>
            <Link
              to="/pricing"
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm px-4 py-2 rounded transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-1.5 border border-slate-600 hover:border-amber-400 text-slate-300 hover:text-amber-400 text-sm font-medium px-4 py-2 rounded transition-colors"
            >
              <LogIn className="w-4 h-4" /> Portal
            </Link>
          </div>

          <button type="button" className="lg:hidden text-white" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-700 px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {NAV_LINKS.map((item) =>
            item.hash && onHome ? (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item)}
                className="block w-full text-left text-slate-300 hover:text-amber-400 text-sm font-medium py-2"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                to={navHref(item)}
                className="block text-slate-300 hover:text-amber-400 text-sm font-medium py-2"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
          <Link to="/overview" className="block text-slate-300 hover:text-amber-400 text-sm font-medium py-2" onClick={() => setOpen(false)}>
            Investors
          </Link>
          <Link to="/pricing" className="block w-full text-center bg-amber-500 text-slate-900 font-bold text-sm px-4 py-2 rounded mt-2" onClick={() => setOpen(false)}>
            Get Started
          </Link>
          <Link to="/login" className="w-full flex items-center justify-center gap-2 border border-slate-600 text-slate-300 text-sm font-medium px-4 py-2 rounded mt-2" onClick={() => setOpen(false)}>
            <LogIn className="w-4 h-4" /> Client Portal
          </Link>
        </div>
      )}
    </nav>
  );
}

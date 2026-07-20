import React, { useState } from 'react';
import { Menu, X, LogIn, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '@/api/apiClient';
import FleetcoLogo from '@/components/home/FleetcoLogo';

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const onHome = location.pathname === '/';

  const scrollTo = (id) => {
    if (!onHome) {
      window.location.href = `/#${id}`;
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setOpen(false);
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data } = await api.functions.invoke('createCheckout', {
        priceId: 'price_1TeONARdSUUW62RaxuR5Q5RA',
        planName: 'Starter'
      });
      if (data.url) {
        // Block iframe checkout
        if (window.self !== window.top) {
          alert('Checkout works only from the published app. Please open in a full browser tab.');
          return;
        }
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0">
            <FleetcoLogo size={44} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollTo('platform-tour')}
              className="text-slate-300 hover:text-amber-400 text-sm font-medium capitalize transition-colors"
            >
              Platform Tour
            </button>
            <button
              onClick={() => scrollTo('yard-management')}
              className="text-slate-300 hover:text-amber-400 text-sm font-medium capitalize transition-colors"
            >
              Yard Management
            </button>
            <button
              onClick={() => scrollTo('services')}
              className="text-slate-300 hover:text-amber-400 text-sm font-medium capitalize transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              className="text-slate-300 hover:text-amber-400 text-sm font-medium transition-colors"
            >
              Pricing
            </button>
            <Link to="/about" className="text-slate-300 hover:text-amber-400 text-sm font-medium capitalize transition-colors">About</Link>
            <Link to="/contact" className="text-slate-300 hover:text-amber-400 text-sm font-medium transition-colors">Contact</Link>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm px-4 py-2 rounded transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Started'}
            </button>
            <Link
              to="/login"
              className="flex items-center gap-1.5 border border-slate-600 hover:border-amber-400 text-slate-300 hover:text-amber-400 text-sm font-medium px-4 py-2 rounded transition-colors"
            >
              <LogIn className="w-4 h-4" /> Client Portal
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-slate-900 border-t border-slate-700 px-4 py-4 space-y-3">
          <button onClick={() => scrollTo('platform-tour')} className="block w-full text-left text-slate-300 hover:text-amber-400 text-sm font-medium capitalize py-2">Platform Tour</button>
          <button onClick={() => scrollTo('yard-management')} className="block w-full text-left text-slate-300 hover:text-amber-400 text-sm font-medium capitalize py-2">Yard Management</button>
          <button onClick={() => scrollTo('services')} className="block w-full text-left text-slate-300 hover:text-amber-400 text-sm font-medium capitalize py-2">Services</button>
          <button onClick={() => scrollTo('pricing')} className="block w-full text-left text-slate-300 hover:text-amber-400 text-sm font-medium py-2">Pricing</button>
          <Link to="/about" className="block w-full text-left text-slate-300 hover:text-amber-400 text-sm font-medium capitalize py-2" onClick={() => setOpen(false)}>About</Link>
          <Link to="/contact" className="block w-full text-left text-slate-300 hover:text-amber-400 text-sm font-medium py-2" onClick={() => setOpen(false)}>Contact</Link>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-amber-500 text-slate-900 font-bold text-sm px-4 py-2 rounded disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Get Started'}
          </button>
          <Link to="/overview" className="block w-full text-left text-slate-300 hover:text-amber-400 text-sm font-medium py-2" onClick={() => setOpen(false)}>
            Investors
          </Link>
          <Link to="/login" className="w-full flex items-center justify-center gap-2 border border-slate-600 text-slate-300 text-sm font-medium px-4 py-2 rounded">
            <LogIn className="w-4 h-4" /> Client Portal
          </Link>
        </div>
      )}
    </nav>
  );
}
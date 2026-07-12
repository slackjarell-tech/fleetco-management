import React, { useState, useEffect } from 'react';
import { ChevronDown, Shield, Truck, Star, ArrowRight, Loader2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import PortalLoginForm from '@/components/auth/PortalLoginForm';

const DEFAULTS = {
  hero_badge: 'Dallas, TX — Serving Owner Operators Nationwide',
  hero_title_line1: 'Keep Your Fleet',
  hero_title_highlight: 'Running Strong.',
  hero_description:
    'FleetCo Management LLC helps owner operators and small fleet owners cut costs, find parts, optimize fuel, and stay compliant — so you can focus on moving freight, not managing breakdowns.',
};

export default function HeroSection() {
  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState(DEFAULTS);

  useEffect(() => {
    fetch('/api/public-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.public_settings?.site) setSite({ ...DEFAULTS, ...data.public_settings.site });
      })
      .catch(() => {});
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data } = await api.functions.invoke('createCheckout', {
        priceId: 'price_1TeONARdSUUW62RaxuR5Q5RA',
        planName: 'Starter'
      });
      if (data.url) {
        const appUrl = window.location.origin;
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
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1800&q=85")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-800/90" />

      {/* Decorative amber line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-amber-300 text-sm font-medium">{site.hero_badge}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              {site.hero_title_line1}
              <span className="block text-amber-400 mt-1">{site.hero_title_highlight}</span>
            </h1>

            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
              {site.hero_description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</> : <>Subscribe & Get Started <ArrowRight className="w-5 h-5" /></>}
              </button>
              <Link
                to="/login"
                className="border-2 border-slate-500 hover:border-amber-400 text-white hover:text-amber-400 font-semibold text-lg px-8 py-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Client Portal
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6">
              {[
                { icon: Star, label: '5-Star Rated Service' },
                { icon: Shield, label: 'Fully Licensed & Insured' },
                { icon: Truck, label: '24/7 Dispatch Support' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300 text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Client portal sign-in */}
          <div className="hidden lg:block">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-widest uppercase mb-2">
                <LogIn className="w-4 h-4" />
                Client Portal
              </div>
              <p className="text-slate-300 text-sm mb-6">
                Sign in with the email and temporary password from your welcome message. You'll set a new password on first login.
              </p>
              <PortalLoginForm variant="hero" compact submitLabel="Sign In" />
              <p className="text-xs text-slate-500 mt-4 text-center">
                <Link to="/forgot-password" className="text-amber-400/90 hover:underline">Forgot password?</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => scrollTo('services')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 hover:text-amber-400 transition-colors animate-bounce"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </section>
  );
}
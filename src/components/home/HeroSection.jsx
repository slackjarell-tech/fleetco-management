import React, { useState, useEffect } from 'react';
import { HOME_IMAGES } from '@/lib/homeImages';
import { ChevronDown, Shield, Truck, Star, ArrowRight, LogIn, Calendar, Package, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

import PortalLoginForm from '@/components/auth/PortalLoginForm';
import FleetcoLogo from '@/components/home/FleetcoLogo';

const DEFAULTS = {
  hero_badge: 'Dallas, TX — Fleet software for owner-operators',
  hero_title_line1: 'Run your fleet.',
  hero_title_highlight: 'One platform.',
  hero_description:
    'FleetCo Management gives owner-operators and small carriers dispatch, maintenance, fuel, payroll, compliance, and a driver app — in one portal from $299/mo. No spreadsheets. No juggling five apps.',
};

export default function HeroSection() {
  const [site, setSite] = useState(DEFAULTS);
  const [loginTab, setLoginTab] = useState('portal');

  useEffect(() => {
    fetch('/api/public-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.public_settings?.site) setSite({ ...DEFAULTS, ...data.public_settings.site });
      })
      .catch(() => {});
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${HOME_IMAGES.hero}")`,
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
              <Link
                to="/contact"
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" /> Book a Free Demo
              </Link>
              <Link
                to="/pricing"
                className="border-2 border-amber-400/80 hover:bg-amber-400/10 text-amber-300 hover:text-amber-200 font-semibold text-lg px-8 py-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                See Pricing <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/driver/login"
                className="border-2 border-emerald-500/80 hover:bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 font-semibold text-lg px-8 py-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5" /> Driver Sign In
              </Link>
              <Link
                to="/login"
                className="border-2 border-slate-500 hover:border-slate-400 text-white hover:text-slate-200 font-semibold text-lg px-8 py-4 rounded-lg transition-all flex items-center justify-center gap-2 lg:hidden"
              >
                Client Portal
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mb-6">
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

            <Link
              to="/load-board"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/15 px-4 py-2 rounded-lg transition-colors"
            >
              <Package className="w-4 h-4" />
              Freight Brokers — Post Loads Free, 1.5% When It Moves
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right: Dual sign-in — Client Portal & Driver App */}
          <div className="hidden lg:block">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="flex justify-center mb-4">
                <FleetcoLogo size={40} variant="full" />
              </div>

              <div className="flex rounded-xl bg-slate-900/50 p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setLoginTab('portal')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${loginTab === 'portal' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Client Portal
                </button>
                <button
                  type="button"
                  onClick={() => setLoginTab('driver')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${loginTab === 'driver' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Driver App
                </button>
              </div>

              {loginTab === 'portal' ? (
                <>
                  <p className="text-slate-300 text-sm mb-6">
                    Sign in with the email and temporary password from your welcome message. You&apos;ll set a new password on first login.
                  </p>
                  <PortalLoginForm variant="hero" compact submitLabel="Sign In to Portal" />
                  <p className="text-xs text-slate-500 mt-4 text-center">
                    <Link to="/forgot-password" className="text-amber-400/90 hover:underline">Forgot password?</Link>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-slate-300 text-sm mb-6">
                    Drivers — clock in, routes, fuel logs, and messaging. Use credentials from your fleet administrator.
                  </p>
                  <PortalLoginForm variant="hero" compact submitLabel="Sign In to Driver App" driverMode />
                  <p className="text-xs text-slate-500 mt-4 text-center">
                    <Link to="/driver/login" className="text-emerald-400/90 hover:underline">Open full driver app page</Link>
                    {' · '}
                    <Link to="/forgot-password" className="text-amber-400/90 hover:underline">Forgot password?</Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => scrollTo('platform-tour')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 hover:text-amber-400 transition-colors animate-bounce"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </section>
  );
}
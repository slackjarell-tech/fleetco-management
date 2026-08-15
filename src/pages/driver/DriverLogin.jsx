import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Smartphone, Truck, ArrowLeft } from 'lucide-react';
import FleetcoLogo from '@/components/home/FleetcoLogo';
import PortalLoginForm from '@/components/auth/PortalLoginForm';
import DriverAppDownload from '@/components/shared/DriverAppDownload';
import DriverAppBranding from '@/components/mobile/DriverAppBranding';
import PageMeta from '@/components/home/PageMeta';
import { initDriverBackgroundSupport } from '@/lib/driverBackground';

/**
 * Standalone FleetCo Driver web app entry — separate from the client portal login.
 * Works in mobile browsers until native iOS/Android builds are live.
 */
export default function DriverLogin() {
  useEffect(() => {
    initDriverBackgroundSupport();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <PageMeta
        title="FleetCo Driver — Sign In"
        description="Sign in to FleetCo Driver for routes, clock-in, fuel logs, dashcam, and fleet messaging."
        path="/driver/login"
      />

      <header className="px-4 py-4 flex items-center justify-between max-w-lg mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <FleetcoLogo size={36} variant="icon" />
        <Link to="/login" className="text-xs text-slate-500 hover:text-amber-400 font-semibold">
          Portal
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white">FleetCo Driver</h1>
          <p className="text-slate-400 text-sm mt-2">
            Routes, clock-in, fuel, dashcam &amp; messaging — synced with your fleet portal.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Smartphone className="w-4 h-4" /> Driver sign in
          </div>

          <PortalLoginForm
            variant="dark"
            submitLabel="Sign In to Driver App"
            driverMode
          />

          <p className="text-center text-xs text-slate-500 mt-4">
            Use credentials from your fleet administrator.
            {' '}
            <Link to="/forgot-password" className="text-amber-400 hover:underline">Forgot password?</Link>
          </p>
        </div>

        <div className="mt-8">
          <p className="text-center text-xs text-slate-500 mb-3">Native app coming to App Store &amp; Google Play</p>
          <DriverAppDownload variant="compact" className="justify-center" />
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Fleet manager or owner?{' '}
          <Link to="/login" className="text-amber-400 font-semibold hover:underline">
            Sign in to Client Portal
          </Link>
        </p>

        <DriverAppBranding variant="login" className="mt-8 border-t-0" />
      </main>
    </div>
  );
}

/** Legacy URL support */
export function DriverLoginRedirect() {
  return <Navigate to="/driver/login" replace />;
}

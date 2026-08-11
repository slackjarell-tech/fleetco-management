import React from 'react';
import { LEGAL } from '@/lib/brand';

/**
 * FleetCo Driver app signature — copyright + patent pending notice.
 * Shown on login, permission gate, and app footer while app store listing is pending.
 */
export default function DriverAppBranding({ className = '', variant = 'footer' }) {
  const year = new Date().getFullYear();
  const copyright = `© ${LEGAL.foundedYear}–${year} ${LEGAL.company}`;

  if (variant === 'gate') {
    return (
      <div className={`text-center space-y-1 ${className}`}>
        <p className="text-[10px] text-slate-500 tracking-wide uppercase font-bold">FleetCo Driver</p>
        <p className="text-[10px] text-slate-600">{copyright}. All rights reserved.</p>
        <p className="text-[10px] text-slate-600">{LEGAL.patentNotice}</p>
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <div className={`text-center pt-6 border-t border-slate-700/50 space-y-1 ${className}`}>
        <p className="text-[11px] text-slate-500 font-semibold">FleetCo Driver</p>
        <p className="text-[10px] text-slate-600">{copyright}. All rights reserved.</p>
        <p className="text-[10px] text-slate-600 leading-relaxed">{LEGAL.patentNotice}</p>
      </div>
    );
  }

  return (
    <footer className={`px-4 py-3 text-center border-t border-slate-200 bg-slate-50 ${className}`}>
      <p className="text-[10px] font-bold text-slate-500 tracking-wide">FleetCo Driver</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{copyright}. All rights reserved.</p>
      <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">{LEGAL.patentNotice}</p>
    </footer>
  );
}

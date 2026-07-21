import React from 'react';
import { Smartphone } from 'lucide-react';
import { DRIVER_APP } from '@/lib/platform';

function GooglePlayBadge({ className = '' }) {
  return (
    <svg viewBox="0 0 135 40" className={className} aria-hidden="true">
      <rect width="135" height="40" rx="5" fill="#000" />
      <path d="M9 7.8v24.4c0 .7.8 1.1 1.4.7l13.6-7.9-13.6-17.2c-.6-.4-1.4 0-1.4.7z" fill="#00D2FF" />
      <path d="M24 20 9.4 7.8l13.6 7.9L24 20z" fill="#00F076" />
      <path d="M24 20 9.4 32.2 24 20z" fill="#FF3A44" />
      <path d="M24 20 37.6 12.1 24 20z" fill="#FFB900" />
      <text x="46" y="14" fill="#fff" fontSize="7" fontFamily="system-ui,sans-serif">GET IT ON</text>
      <text x="46" y="28" fill="#fff" fontSize="13" fontWeight="600" fontFamily="system-ui,sans-serif">Google Play</text>
    </svg>
  );
}

function AppStoreBadge({ disabled = false, className = '' }) {
  return (
    <svg viewBox="0 0 135 40" className={className} aria-hidden="true">
      <rect width="135" height="40" rx="5" fill={disabled ? '#334155' : '#000'} />
      <path
        d="M22 28.5c-.3 0-.6-.1-.8-.3-.5-.4-.5-1.1-.1-1.6 1.2-1.5 2-3.5 2-5.6 0-2.1-.8-4.1-2-5.6-.4-.5-.4-1.2.1-1.6.5-.4 1.2-.4 1.6.1 1.5 1.8 2.3 4.1 2.3 6.5s-.8 4.7-2.3 6.5c-.2.3-.5.4-.8.4zM18.5 11.5c-.3 0-.6-.1-.8-.3-.5-.4-.5-1.1-.1-1.6 2.1-2.6 5.2-4.1 8.4-4.1s6.3 1.5 8.4 4.1c.4.5.4 1.2-.1 1.6-.5.4-1.2.4-1.6-.1-1.7-2.1-4.2-3.3-6.7-3.3s-5 1.2-6.7 3.3c-.2.3-.5.4-.8.4z"
        fill={disabled ? '#64748b' : '#fff'}
        transform="translate(0, 2)"
      />
      <text x="46" y="14" fill={disabled ? '#94a3b8' : '#fff'} fontSize="7" fontFamily="system-ui,sans-serif">
        {disabled ? 'COMING SOON' : 'Download on the'}
      </text>
      <text x="46" y="28" fill={disabled ? '#94a3b8' : '#fff'} fontSize="13" fontWeight="600" fontFamily="system-ui,sans-serif">
        App Store
      </text>
    </svg>
  );
}

export default function DriverAppDownload({ variant = 'default', className = '' }) {
  const badges = (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={DRIVER_APP.android}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-md ring-2 ring-transparent hover:ring-amber-500/60 focus:outline-none focus:ring-amber-500 transition-shadow"
        aria-label="Download FleetCo Driver on Google Play"
      >
        <GooglePlayBadge className="h-10 w-auto sm:h-11" />
      </a>
      {DRIVER_APP.ios ? (
        <a
          href={DRIVER_APP.ios}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-md ring-2 ring-transparent hover:ring-amber-500/60 focus:outline-none focus:ring-amber-500 transition-shadow"
          aria-label="Download FleetCo Driver on the App Store"
        >
          <AppStoreBadge className="h-10 w-auto sm:h-11" />
        </a>
      ) : (
        <span
          className="inline-block rounded-md cursor-not-allowed opacity-70"
          title="Coming soon to App Store"
          aria-label="FleetCo Driver — coming soon to App Store"
        >
          <AppStoreBadge disabled className="h-10 w-auto sm:h-11" />
        </span>
      )}
    </div>
  );

  if (variant === 'badges') {
    return <div className={className}>{badges}</div>;
  }

  if (variant === 'compact') {
    return (
      <div className={`rounded-xl border border-slate-700 bg-slate-800/80 p-4 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-amber-400 flex-shrink-0">
            <Smartphone className="w-5 h-5" />
            <span className="text-sm font-bold text-white">FleetCo Driver</span>
          </div>
          {badges}
        </div>
      </div>
    );
  }

  if (variant === 'light') {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-slate-900 font-black text-base">Download FleetCo Driver</h3>
            <p className="text-slate-500 text-sm mt-1">
              HOS logs, routes, fuel, inspections, and messaging — built for drivers in the field.
            </p>
          </div>
          {badges}
        </div>
      </div>
    );
  }

  return (
    <section className={`py-16 bg-slate-950 border-y border-slate-800 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-amber-400 font-bold text-sm tracking-widest uppercase">Mobile App</span>
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">Download FleetCo Driver</h2>
        <p className="text-slate-400 mt-3 max-w-xl mx-auto text-sm sm:text-base">
          Give your drivers a dedicated app for clock-in, routes, DVIR, fuel logs, and fleet messaging — synced with your portal in real time.
        </p>
        <div className="flex justify-center mt-8">{badges}</div>
        {DRIVER_APP.iosComingSoon && (
          <p className="text-slate-600 text-xs mt-4">iOS version coming soon to the App Store</p>
        )}
      </div>
    </section>
  );
}

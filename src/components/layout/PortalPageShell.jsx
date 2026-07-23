import React from 'react';

/**
 * Portal page wrapper — keeps content inside the main grid column (never overlaps sidebar).
 * @param {'default' | 'fullBleed' | 'wide'} variant
 */
export default function PortalPageShell({
  variant = 'default',
  className = '',
  children,
}) {
  if (variant === 'fullBleed') {
    return (
      <div
        className={`flex flex-col flex-1 h-full min-h-0 w-full max-w-full overflow-hidden isolate bg-slate-950 ${className}`}
      >
        {children}
      </div>
    );
  }

  if (variant === 'wide') {
    return (
      <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8 ${className}`}>
      {children}
    </div>
  );
}

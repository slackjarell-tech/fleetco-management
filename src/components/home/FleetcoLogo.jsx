import React from 'react';

const LOGO_FULL = '/assets/fleetco-logo.png';
const LOGO_ICON = '/assets/fleetco-icon.png';

/**
 * FleetCo Management brand logo (shield + wordmark).
 * @param {'full'|'icon'} variant - full wordmark or compact square for sidebars
 * @param {number} size - height in pixels (full) or box size (icon)
 */
export default function FleetcoLogo({ className = '', size = 40, variant = 'full' }) {
  const src = variant === 'icon' ? LOGO_ICON : LOGO_FULL;
  const alt = 'FleetCo Management';

  if (variant === 'icon') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg bg-white overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img src={src} alt={alt} className="object-contain w-full h-full p-[6%]" />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain flex-shrink-0 ${className}`}
      style={{ height: size, width: 'auto' }}
    />
  );
}

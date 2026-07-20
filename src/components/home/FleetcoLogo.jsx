import React from 'react';

const LOGO_FULL = '/assets/fleetco-logo.png';
const LOGO_ICON = '/assets/fleetco-icon.png';

/**
 * FleetCo Management brand logo (transparent PNG — shield + wordmark).
 * @param {'full'|'icon'} variant - full wordmark or shield-only mark
 * @param {number} size - height in pixels
 */
export default function FleetcoLogo({ className = '', size = 40, variant = 'full' }) {
  const src = variant === 'icon' ? LOGO_ICON : LOGO_FULL;
  const alt = 'FleetCo Management';

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain flex-shrink-0 ${className}`}
      style={{
        height: size,
        width: 'auto',
        maxWidth: variant === 'icon' ? size * 1.6 : size * 1.15,
      }}
    />
  );
}

import React from 'react';

/**
 * Fleetco Management brand logo.
 * @param {'full'|'icon'} variant - full horizontal wordmark or square icon
 * @param {number} size - height in pixels
 */
export default function FleetcoLogo({ className = '', size = 40, variant = 'full' }) {
  const src = variant === 'icon' ? '/assets/fleetco-icon.png' : '/assets/fleetco-logo.png';
  const alt = 'Fleetco Management';

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain ${className}`}
      style={{
        height: size,
        width: variant === 'icon' ? size : 'auto',
        maxWidth: variant === 'full' ? size * 3.2 : size,
      }}
    />
  );
}

import React from 'react';
import { LEGAL } from '@/lib/brand';

/** Copyright © and patent notice for public marketing pages */
export default function SiteLegalNotice({ className = '', compact = false }) {
  const year = new Date().getFullYear();
  const copyright = `© ${LEGAL.foundedYear}–${year} ${LEGAL.company}. All rights reserved.`;

  if (compact) {
    return (
      <p className={className}>
        {copyright} · {LEGAL.patentNotice}
      </p>
    );
  }

  return (
    <div className={className}>
      <p>{copyright}</p>
      <p className="text-xs mt-1 opacity-90">{LEGAL.patentNotice}</p>
    </div>
  );
}

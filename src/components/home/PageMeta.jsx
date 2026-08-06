import { useEffect } from 'react';
import { BRAND } from '@/lib/brand';

const DEFAULT = {
  title: 'FleetCo Management — Fleet Operations Portal',
  description:
    'FleetCo Management helps owner-operators and small fleets cut costs, stay DOT compliant, and manage vehicles, fuel, repairs, and payroll in one portal.',
  path: '/',
};

/** Sets document title and meta description for public marketing pages. */
export default function PageMeta({ title, description, path = '' }) {
  const fullTitle = title ? `${title} — FleetCo Management` : DEFAULT.title;
  const desc = description || DEFAULT.description;
  const url = `${BRAND.website}${path || ''}`;

  useEffect(() => {
    document.title = fullTitle;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = desc;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    return () => {
      document.title = DEFAULT.title;
    };
  }, [fullTitle, desc, url]);

  return null;
}

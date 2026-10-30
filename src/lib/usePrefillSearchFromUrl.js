import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Prefills a page-local search box from ?q= in the URL (portal global search). */
export function usePrefillSearchFromUrl(setSearch) {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams, setSearch]);
}

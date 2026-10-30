import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/api/apiClient';

const DEBOUNCE_MS = 280;

export default function PortalGlobalSearch({ className = '' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const runSearch = useCallback(async (q) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setData(null);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.portal.search(trimmed);
      setData(res);
    } catch (e) {
      setError(e.message || 'Search failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, open, runSearch]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const results = data?.results || [];
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    if (results.length === 1 && results[0].href) {
      navigate(results[0].href);
      setOpen(false);
      setQuery('');
      return;
    }
    runSearch(trimmed);
    setOpen(true);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={onSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search vehicles, drivers, parts, invoices, loads…"
          className="pl-9 pr-9 h-10 bg-white border-slate-200 text-sm"
          aria-label="Search fleet records"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            onClick={() => {
              setQuery('');
              setData(null);
              setOpen(false);
            }}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {open && (query.trim().length >= 2 || loading) && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[min(420px,70vh)] overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching…
            </div>
          )}
          {!loading && error && (
            <p className="px-4 py-3 text-sm text-red-600">{error}</p>
          )}
          {!loading && !error && results.length === 0 && query.trim().length >= 2 && (
            <p className="px-4 py-3 text-sm text-slate-500">No matches for &ldquo;{query.trim()}&rdquo;</p>
          )}
          {!loading && !error && Object.keys(grouped).map((category) => (
            <div key={category} className="border-b border-slate-100 last:border-0">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                {category}
              </div>
              {grouped[category].map((r) => (
                <Link
                  key={`${r.type}-${r.id}`}
                  to={r.href}
                  onClick={() => {
                    setOpen(false);
                    setQuery('');
                  }}
                  className="block px-4 py-2.5 hover:bg-amber-50 transition-colors"
                >
                  <div className="text-sm font-semibold text-slate-900 truncate">{r.title}</div>
                  {r.subtitle && (
                    <div className="text-xs text-slate-500 truncate mt-0.5">{r.subtitle}</div>
                  )}
                </Link>
              ))}
            </div>
          ))}
          {!loading && results.length > 0 && (
            <p className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100">
              {data.count} result{data.count === 1 ? '' : 's'} · scoped to your organization
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import PageMeta from '@/components/home/PageMeta';
import { api } from '@/api/apiClient';
import { Briefcase, MapPin, Loader2, Search, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function payLabel(job) {
  if (job.pay_description) return job.pay_description;
  if (job.pay_min != null && job.pay_max != null) return `$${job.pay_min} – $${job.pay_max}`;
  if (job.pay_min != null) return `From $${job.pay_min}`;
  return 'Competitive pay';
}

function locationLabel(job) {
  const parts = [job.location_city, job.location_state].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location flexible';
}

export default function JobsBoardPublic() {
  const [meta, setMeta] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [metaRes, listRes] = await Promise.all([
        api.jobBoard.getMeta(),
        api.jobBoard.listPublic({ q: q || undefined, category: category || undefined }),
      ]);
      setMeta(metaRes);
      setJobs(listRes.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [q, category]);

  useEffect(() => {
    load();
  }, [load]);

  const groupedCategories = useMemo(() => {
    const groups = {};
    for (const c of meta?.categories || []) {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    }
    return groups;
  }, [meta]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PageMeta
        title="Fleet Jobs Board"
        description="CDL drivers, dispatchers, mechanics, and fleet operations jobs posted by carriers on FleetCo Management."
        path="/jobs"
      />
      <NavBar />

      <section className="pt-24 pb-12 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold uppercase tracking-wide mb-3">
                <Briefcase className="w-4 h-4" />
                FleetCo Jobs
              </div>
              <h1 className="text-4xl sm:text-5xl font-black mb-3">Find your next fleet role</h1>
              <p className="text-slate-400 max-w-2xl">
                OTR and local CDL drivers, dispatchers, diesel techs, safety, warehouse, and office roles —
                posted directly by carriers using FleetCo.
              </p>
            </div>
            <Link
              to="/login"
              className="text-sm text-slate-400 hover:text-amber-400 underline underline-offset-4 shrink-0"
            >
              Carrier? Post jobs in your portal →
            </Link>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, city, state…"
                className="pl-10 bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-md bg-slate-900 border border-slate-700 px-3 text-sm text-white min-w-[200px]"
            >
              <option value="">All categories</option>
              {Object.entries(groupedCategories).map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <Button type="button" onClick={load} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold">
              Search
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
            <Briefcase className="w-12 h-12 mx-auto text-slate-700 mb-4" />
            <p className="text-slate-300 font-medium">No open positions right now</p>
            <p className="text-slate-500 text-sm mt-2">Check back soon — carriers publish new roles weekly.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.slug}`}
                className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">{job.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {job.company_name}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {locationLabel(job)}
                      </span>
                    </div>
                    <p className="text-amber-400/90 text-sm mt-2 font-medium">{job.category_label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-semibold">{payLabel(job)}</p>
                    <p className="text-slate-500 text-xs mt-1 capitalize">{(job.employment_type || '').replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <FooterSection />
    </div>
  );
}

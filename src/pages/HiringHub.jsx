import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/api/apiClient';
import PortalPageShell from '@/components/layout/PortalPageShell';
import { canManageCustomerTeam } from '@/lib/customerRoles';
import {
  Briefcase, Loader2, Plus, Users, Copy, Check, ExternalLink,
  RefreshCw, UserPlus, Pause, Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const INTERNAL_ROLES = ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'];
const STATUS_COLORS = {
  new: 'bg-cyan-500/20 text-cyan-300',
  reviewed: 'bg-blue-500/20 text-blue-300',
  interview: 'bg-violet-500/20 text-violet-300',
  offer: 'bg-amber-500/20 text-amber-300',
  hired: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-300',
  withdrawn: 'bg-slate-500/20 text-slate-400',
};

const EMPTY_POSTING = {
  title: '',
  job_category: 'cdl_driver_otr',
  employment_type: 'full_time',
  pay_type: 'per_mile',
  pay_description: '',
  location_city: '',
  location_state: '',
  description: '',
  requirements: '',
  cdl_class_required: '',
  home_time: '',
  equipment_type: '',
  contact_email: '',
  status: 'draft',
};

function canAccessHiring(user) {
  if (!user) return false;
  if (INTERNAL_ROLES.includes(user.role)) return true;
  return canManageCustomerTeam(user.role);
}

function PostingModal({ open, onClose, meta, initial, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_POSTING);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial || EMPTY_POSTING);
  }, [initial, open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-white mb-4">{initial?.id ? 'Edit job posting' : 'Post a new job'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <Input required placeholder="Job title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-slate-950 border-slate-700" />
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={form.job_category} onChange={(e) => setForm({ ...form, job_category: e.target.value })} className="h-10 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm text-white">
              {(meta?.categories || []).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} className="h-10 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm text-white">
              {(meta?.employment_types || []).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="City" value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} className="bg-slate-950 border-slate-700" />
            <Input placeholder="State" value={form.location_state} onChange={(e) => setForm({ ...form, location_state: e.target.value })} className="bg-slate-950 border-slate-700" />
          </div>
          <Input placeholder="Pay (e.g. $0.55–0.62/mi or $28/hr)" value={form.pay_description} onChange={(e) => setForm({ ...form, pay_description: e.target.value })} className="bg-slate-950 border-slate-700" />
          <Textarea placeholder="Job description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-950 border-slate-700" />
          <Textarea placeholder="Requirements (CDL, experience, endorsements…)" rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className="bg-slate-950 border-slate-700" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="CDL required (e.g. Class A)" value={form.cdl_class_required} onChange={(e) => setForm({ ...form, cdl_class_required: e.target.value })} className="bg-slate-950 border-slate-700" />
            <Input placeholder="Contact email for alerts" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="bg-slate-950 border-slate-700" />
          </div>
          <Input placeholder="Home time" value={form.home_time} onChange={(e) => setForm({ ...form, home_time: e.target.value })} className="bg-slate-950 border-slate-700" />
          <Input placeholder="Equipment (dry van, reefer, flatbed…)" value={form.equipment_type} onChange={(e) => setForm({ ...form, equipment_type: e.target.value })} className="bg-slate-950 border-slate-700" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-10 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm text-white w-full">
            {(meta?.posting_statuses || ['draft', 'open', 'paused', 'filled', 'closed']).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold">
              {saving ? 'Saving…' : 'Save posting'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-600 text-slate-300">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HiringHub() {
  const [user, setUser] = useState(null);
  const [meta, setMeta] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState('');
  const [selectedPosting, setSelectedPosting] = useState('');
  const [hiringId, setHiringId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, apps, metaRes] = await Promise.all([
        api.jobBoard.getDashboard(),
        api.jobBoard.listApplications(),
        api.jobBoard.getMeta(),
      ]);
      setDashboard(dash);
      setApplications(apps);
      setMeta(metaRes);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => setUser(null));
    api.jobBoard.getMeta().then(setMeta).catch(() => {});
  }, []);

  useEffect(() => {
    if (user && canAccessHiring(user)) load();
  }, [user, load]);

  const filteredApps = useMemo(() => {
    if (!selectedPosting) return applications;
    return applications.filter((a) => a.job_posting_id === selectedPosting);
  }, [applications, selectedPosting]);

  const copyLink = (slug) => {
    const url = `${window.location.origin}/jobs/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(''), 2000);
    });
  };

  const savePosting = async (form) => {
    if (editing?.id) {
      await api.jobBoard.updatePosting(editing.id, form);
    } else {
      await api.jobBoard.createPosting(form);
    }
    setEditing(null);
    await load();
  };

  const updateStatus = async (appId, application_status) => {
    await api.jobBoard.updateApplication(appId, { application_status });
    await load();
  };

  const hireApplicant = async (appId) => {
    setHiringId(appId);
    try {
      const result = await api.jobBoard.hireApplicant(appId, { role: 'driver', send_welcome_email: true });
      alert(result.message + (result.temp_password ? `\nTemp password: ${result.temp_password}` : ''));
      await load();
    } catch (err) {
      alert(err.message || 'Hire failed');
    } finally {
      setHiringId(null);
    }
  };

  if (!user) {
    return (
      <PortalPageShell variant="fullBleed" className="items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </PortalPageShell>
    );
  }

  if (!canAccessHiring(user)) {
    return (
      <PortalPageShell variant="fullBleed" className="items-center justify-center px-4">
        <Briefcase className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-slate-300">Hiring hub requires owner, HR, or fleet manager access.</p>
      </PortalPageShell>
    );
  }

  const summary = dashboard?.summary;

  return (
    <PortalPageShell variant="default" className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-400" />
            Hiring Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">Post jobs, share apply links, and manage applicants — like Indeed, built into your portal.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={load} className="border-slate-700 text-slate-300">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button type="button" onClick={() => { setEditing(null); setModalOpen(true); }} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Post job
          </Button>
        </div>
      </div>

      {loading && !dashboard ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Open jobs', value: summary?.open_postings ?? 0 },
              { label: 'Total applicants', value: summary?.total_applications ?? 0 },
              { label: 'New this week', value: summary?.new_applications ?? 0 },
              { label: 'In interview', value: summary?.pipeline?.interview ?? 0 },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Job postings</h2>
            <div className="space-y-3">
              {(dashboard?.postings || []).length === 0 ? (
                <p className="text-slate-500 text-sm">No postings yet — create your first job to get a shareable apply link.</p>
              ) : (
                dashboard.postings.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div>
                      <p className="font-semibold text-white">{p.title}</p>
                      <p className="text-slate-500 text-sm capitalize">{p.status} · {p.application_count || 0} applicants</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.status === 'open' && p.slug && (
                        <>
                          <Button type="button" size="sm" variant="outline" className="border-slate-700" onClick={() => copyLink(p.slug)}>
                            {copiedSlug === p.slug ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span className="ml-1">Copy link</span>
                          </Button>
                          <a href={`/jobs/${p.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-amber-400 hover:underline px-2">
                            <ExternalLink className="w-4 h-4" /> View public
                          </a>
                        </>
                      )}
                      <Button type="button" size="sm" variant="outline" className="border-slate-700" onClick={() => { setEditing(p); setModalOpen(true); }}>
                        Edit
                      </Button>
                      {p.status === 'open' ? (
                        <Button type="button" size="sm" variant="outline" className="border-slate-700" onClick={() => api.jobBoard.updatePosting(p.id, { status: 'paused' }).then(load)}>
                          <Pause className="w-4 h-4" />
                        </Button>
                      ) : p.status === 'paused' ? (
                        <Button type="button" size="sm" variant="outline" className="border-slate-700" onClick={() => api.jobBoard.updatePosting(p.id, { status: 'open' }).then(load)}>
                          <Play className="w-4 h-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Applicant inbox
              </h2>
              <select
                value={selectedPosting}
                onChange={(e) => setSelectedPosting(e.target.value)}
                className="h-9 rounded-md bg-slate-900 border border-slate-700 px-3 text-sm text-white max-w-xs"
              >
                <option value="">All postings</option>
                {(dashboard?.postings || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {filteredApps.length === 0 ? (
                <p className="text-slate-500 text-sm">Applicants appear here when someone applies on your public job page.</p>
              ) : (
                filteredApps.map((a) => (
                  <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{a.name}</p>
                        <p className="text-slate-400 text-sm">{a.email}{a.phone ? ` · ${a.phone}` : ''}</p>
                        <p className="text-slate-500 text-xs mt-1">Applied for {a.job_title || 'position'} · CDL {a.cdl_class || '—'}</p>
                        {a.message && <p className="text-slate-400 text-sm mt-2 whitespace-pre-wrap line-clamp-3">{a.message}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[a.application_status] || STATUS_COLORS.new}`}>
                          {a.application_status}
                        </span>
                        <select
                          value={a.application_status}
                          onChange={(e) => updateStatus(a.id, e.target.value)}
                          className="h-8 rounded-md bg-slate-950 border border-slate-700 px-2 text-xs text-white"
                        >
                          {(meta?.application_statuses || []).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {a.application_status !== 'hired' && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={hiringId === a.id}
                            onClick={() => hireApplicant(a.id)}
                            className="bg-green-600 hover:bg-green-500 text-white"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            {hiringId === a.id ? '…' : 'Hire'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      <PostingModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        meta={meta}
        initial={editing}
        onSave={savePosting}
      />
    </PortalPageShell>
  );
}

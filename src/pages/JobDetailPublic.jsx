import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NavBar from '@/components/home/NavBar';
import FooterSection from '@/components/home/FooterSection';
import PageMeta from '@/components/home/PageMeta';
import { api } from '@/api/apiClient';
import { ArrowLeft, Building2, MapPin, Loader2, CheckCircle, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const CDL_OPTIONS = ['', 'Class A', 'Class B', 'Class C', 'None required'];

export default function JobDetailPublic() {
  const { slug } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cdl_class: '',
    years_experience: '',
    location_city: '',
    location_state: '',
    message: '',
  });

  useEffect(() => {
    setLoading(true);
    api.jobBoard.getPublic(slug)
      .then(setJob)
      .catch(() => setError('This job is no longer available.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.jobBoard.apply(slug, {
        ...form,
        years_experience: form.years_experience ? Number(form.years_experience) : null,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <NavBar />
        <div className="pt-32 text-center px-4">
          <p className="text-slate-300">{error || 'Job not found'}</p>
          <Link to="/jobs" className="text-amber-400 mt-4 inline-block">← Back to jobs</Link>
        </div>
      </div>
    );
  }

  const location = [job.location_city, job.location_state].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PageMeta
        title={job.title}
        description={`Apply for ${job.title} at ${job.company_name}. ${job.category_label || ''}`}
        path={`/jobs/${slug}`}
      />
      <NavBar />

      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8">
          <ArrowLeft className="w-4 h-4" />
          All jobs
        </Link>

        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Briefcase className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black">{job.title}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-slate-400 text-sm">
                  <span className="inline-flex items-center gap-1"><Building2 className="w-4 h-4" />{job.company_name}</span>
                  {location && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{location}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-semibold">{job.category_label}</span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs capitalize">{(job.employment_type || '').replace(/_/g, ' ')}</span>
              {job.cdl_class_required && (
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs">CDL {job.cdl_class_required}</span>
              )}
            </div>

            {job.description && (
              <section className="mb-8">
                <h2 className="text-lg font-bold mb-3">About the role</h2>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </section>
            )}

            {job.requirements && (
              <section className="mb-8">
                <h2 className="text-lg font-bold mb-3">Requirements</h2>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
              </section>
            )}

            {(job.home_time || job.equipment_type) && (
              <section className="grid sm:grid-cols-2 gap-4">
                {job.home_time && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Home time</p>
                    <p className="text-white font-medium mt-1">{job.home_time}</p>
                  </div>
                )}
                {job.equipment_type && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Equipment</p>
                    <p className="text-white font-medium mt-1">{job.equipment_type}</p>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-1">Apply now</h2>
              <p className="text-slate-400 text-sm mb-6">One-minute application — confirmation email sent instantly.</p>

              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-300 font-semibold">Application submitted!</p>
                  <p className="text-slate-400 text-sm mt-2">Check your inbox for confirmation from the hiring team.</p>
                </div>
              ) : job.external_apply_url ? (
                <a
                  href={job.external_apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-lg"
                >
                  Apply on company site
                </a>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Input required placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-950 border-slate-700" />
                  <Input required type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-slate-950 border-slate-700" />
                  <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-slate-950 border-slate-700" />
                  <select
                    value={form.cdl_class}
                    onChange={(e) => setForm({ ...form, cdl_class: e.target.value })}
                    className="w-full h-10 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm"
                  >
                    {CDL_OPTIONS.map((o) => (
                      <option key={o || 'none'} value={o}>{o || 'CDL class (optional)'}</option>
                    ))}
                  </select>
                  <Input placeholder="Years experience" type="number" min="0" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} className="bg-slate-950 border-slate-700" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="City" value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} className="bg-slate-950 border-slate-700" />
                    <Input placeholder="State" value={form.location_state} onChange={(e) => setForm({ ...form, location_state: e.target.value })} className="bg-slate-950 border-slate-700" />
                  </div>
                  <Textarea placeholder="Cover note (optional)" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="bg-slate-950 border-slate-700" />
                  <Button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold">
                    {submitting ? 'Submitting…' : 'Submit application'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}

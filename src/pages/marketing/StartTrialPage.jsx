import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import MarketingShell, { MarketingHero } from '@/components/marketing/public/MarketingShell';
import { Loader2, CheckCircle2 } from 'lucide-react';

const FLEET_SIZES = ['1 (Owner Operator)', '2-5', '6-15', '16+'];

export default function StartTrialPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', fleet_size: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.functions.invoke('submitTrialRequest', { ...form, source: 'start-trial' });
      setDone(true);
    } catch {
      await api.functions.invoke('submitInquiry', {
        name: form.name,
        email: form.email,
        company: form.company,
        fleet_size: form.fleet_size,
        phone: form.phone,
        message: form.message || 'Trial / demo sandbox request',
        service_interest: 'FleetCo Platform Trial',
      }).catch(() => {});
      setDone(true);
    }
    setLoading(false);
  };

  return (
    <MarketingShell
      title="Start Free Trial"
      description="Request a 14-day FleetCo demo sandbox or guided trial for your fleet."
      path="/start-trial"
    >
      <MarketingHero
        badge="14-Day Trial"
        title="Try FleetCo Free"
        subtitle="We provision a guided demo portal with sample data — or walk you through your own fleet setup live. No credit card required."
      />

      <section className="py-16 max-w-lg mx-auto px-4">
        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-black">You&apos;re on the list</h2>
            <p className="text-slate-600 mt-2">We will email setup instructions within 1 business day.</p>
            <Link to="/pricing" className="inline-block mt-6 text-amber-600 font-bold">View pricing →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded-2xl p-8 shadow-sm">
            <input required placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <input required type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <select value={form.fleet_size} onChange={(e) => setForm({ ...form, fleet_size: e.target.value })} className="w-full border rounded-lg px-3 py-2">
              <option value="">Fleet size</option>
              {FLEET_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <textarea placeholder="What do you want to test first?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2" />
            <button type="submit" disabled={loading} className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-lg flex justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request trial access'}
            </button>
            <p className="text-xs text-slate-400 text-center">Prefer to subscribe now? <Link to="/pricing" className="text-amber-600 font-bold">See plans</Link></p>
          </form>
        )}
      </section>
    </MarketingShell>
  );
}

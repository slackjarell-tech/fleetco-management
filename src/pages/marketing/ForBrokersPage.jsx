import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import MarketingShell, { MarketingHero } from '@/components/marketing/public/MarketingShell';
import { LOAD_BOARD_MARKETPLACE } from '@/lib/marketingContent';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ForBrokersPage() {
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '', mc_number: '', dot_number: '',
    loads_per_week: '', equipment_types: '', message: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.functions.invoke('submitBrokerApplication', form);
      setDone(true);
    } catch {
      setError('Could not submit — email support@fleetcomanagement.org');
    }
    setLoading(false);
  };

  return (
    <MarketingShell
      title="Freight Broker Access"
      description="Apply for free FleetCo Load Board access. Post loads, attach BOLs, and connect with carriers."
      path="/for-brokers"
    >
      <MarketingHero
        badge="Broker Application"
        title="Post Loads Free on FleetCo"
        subtitle={`${LOAD_BOARD_MARKETPLACE.feeNote} Apply below — we review MC/DOT info and send portal credentials within 1–2 business days.`}
        dark
      />

      <section className="py-16 max-w-2xl mx-auto px-4">
        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-900">Application received</h2>
            <p className="text-slate-600 mt-2">We will email you at {form.email} with broker portal access instructions.</p>
            <Link to="/load-board" className="inline-block mt-6 text-amber-600 font-bold hover:underline">Back to load board info</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Company name *</label>
                <input required value={form.company_name} onChange={(e) => set('company_name', e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Contact name *</label>
                <input required value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Email *</label>
                <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Phone</label>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">MC number</label>
                <input value={form.mc_number} onChange={(e) => set('mc_number', e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">DOT number</label>
                <input value={form.dot_number} onChange={(e) => set('dot_number', e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Loads posted per week (estimate)</label>
              <input value={form.loads_per_week} onChange={(e) => set('loads_per_week', e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2" placeholder="e.g. 10–50" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Equipment types</label>
              <input value={form.equipment_types} onChange={(e) => set('equipment_types', e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2" placeholder="Dry van, reefer, flatbed…" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Notes</label>
              <textarea value={form.message} onChange={(e) => set('message', e.target.value)} rows={3} className="w-full mt-1 border rounded-lg px-3 py-2" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit broker application'}
            </button>
          </form>
        )}
      </section>
    </MarketingShell>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Package, Building2, MapPin, Truck } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import LoadBoardFeeAcknowledgment from '@/components/loadboard/LoadBoardFeeAcknowledgment';
import { LOAD_BOARD_TRANSACTION_FEE_PERCENT } from '@/lib/loadBoardFeeDisclosure';
import { validateBrokerRegistrationForm } from '@/lib/brokerRegistrationFields';

const LOADS_PER_WEEK_OPTIONS = ['1–5', '6–15', '16–30', '31–50', '50+'];

const EQUIPMENT_SUGGESTIONS = 'Dry van, reefer, flatbed, step deck, box truck, power only, hotshot…';

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2 pt-2 border-t border-slate-700/80 mt-2">
      <Icon className="w-4 h-4" />
      {children}
    </h2>
  );
}

export default function BrokerRegister() {
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    mc_number: '',
    dot_number: '',
    loads_per_week: '',
    equipment_types: '',
    business_notes: '',
    password: '',
    confirmPassword: '',
  });
  const [feeAcknowledged, setFeeAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!feeAcknowledged) {
      setError('Please agree to the load board platform fee and credit card on file terms');
      return;
    }
    try {
      validateBrokerRegistrationForm(form);
    } catch (err) {
      setError(err.message);
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await api.auth.registerBroker({
        ...payload,
        load_board_fee_acknowledged: true,
      });
      window.location.href = '/portal/billing?welcome=broker';
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'h-11 bg-slate-700 border-slate-600 text-white';
  const labelClass = 'text-slate-300 text-xs font-semibold uppercase tracking-wider';

  return (
    <AuthLayout
      title="Broker business registration"
      subtitle={`Complete your company profile to post loads. No monthly fee — ${LOAD_BOARD_TRANSACTION_FEE_PERCENT}% platform fee when freight moves.`}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="flex items-center gap-2 mb-4 text-amber-400">
        <Package className="w-5 h-5" />
        <span className="text-sm font-bold">All business fields required for FMCSA broker verification</span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <SectionTitle icon={Building2}>Company &amp; authority</SectionTitle>
        <div className="space-y-1.5">
          <Label className={labelClass}>Legal company name *</Label>
          <Input required value={form.company_name} onChange={(e) => set('company_name', e.target.value)} className={inputClass} placeholder="As registered with FMCSA" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Primary contact *</Label>
            <Input required value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Business phone *</Label>
            <Input required type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} placeholder="555-123-4567" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className={labelClass}>Business email *</Label>
            <Input required type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>MC number *</Label>
            <Input required value={form.mc_number} onChange={(e) => set('mc_number', e.target.value)} className={inputClass} placeholder="MC-123456" />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>DOT number *</Label>
            <Input required value={form.dot_number} onChange={(e) => set('dot_number', e.target.value)} className={inputClass} placeholder="1234567" />
          </div>
        </div>

        <SectionTitle icon={MapPin}>Business address</SectionTitle>
        <div className="space-y-1.5">
          <Label className={labelClass}>Street address *</Label>
          <Input required value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5 col-span-1">
            <Label className={labelClass}>City *</Label>
            <Input required value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>State *</Label>
            <Input required maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} className={inputClass} placeholder="TX" />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>ZIP *</Label>
            <Input required value={form.zip} onChange={(e) => set('zip', e.target.value)} className={inputClass} placeholder="75201" />
          </div>
        </div>

        <SectionTitle icon={Truck}>Load board profile</SectionTitle>
        <div className="space-y-1.5">
          <Label className={labelClass}>Loads posted per week (estimate) *</Label>
          <select
            required
            value={form.loads_per_week}
            onChange={(e) => set('loads_per_week', e.target.value)}
            className="w-full h-11 rounded-md bg-slate-700 border border-slate-600 text-white px-3 text-sm"
          >
            <option value="">Select range</option>
            {LOADS_PER_WEEK_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>Equipment types you broker *</Label>
          <textarea
            required
            rows={2}
            value={form.equipment_types}
            onChange={(e) => set('equipment_types', e.target.value)}
            placeholder={EQUIPMENT_SUGGESTIONS}
            className="w-full rounded-md bg-slate-700 border border-slate-600 text-white px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>Additional notes (optional)</Label>
          <textarea
            rows={2}
            value={form.business_notes}
            onChange={(e) => set('business_notes', e.target.value)}
            className="w-full rounded-md bg-slate-700 border border-slate-600 text-white px-3 py-2 text-sm"
            placeholder="Lanes, shippers served, special requirements…"
          />
        </div>

        <SectionTitle icon={Package}>Portal login</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Password *</Label>
            <Input type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Confirm password *</Label>
            <Input type="password" required autoComplete="new-password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} className={inputClass} />
          </div>
        </div>

        <LoadBoardFeeAcknowledgment variant="dark" checked={feeAcknowledged} onChange={setFeeAcknowledged} />

        <p className="text-xs text-slate-500">
          By registering you confirm this information is accurate for your broker authority. No monthly subscription — add a credit card after signup for load board transaction fees.
        </p>

        <Button
          type="submit"
          disabled={loading || !feeAcknowledged}
          className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold sticky bottom-0"
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : 'Complete broker registration'}
        </Button>
      </form>
    </AuthLayout>
  );
}

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/api/apiClient';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export default function VendorModal({ vendor, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', type: 'Repair Shop', poc_name: '', poc_title: '',
    phone: '', alt_phone: '', email: '',
    address: '', city: '', state: '', zip: '',
    contract_number: '', contract_start: '', contract_end: '',
    labor_rate: '', discount_pct: '', status: 'active', notes: '',
    lat: '', lng: '',
    scale_certified: false, scale_max_capacity_lbs: '', scale_hours: '', scale_fee: '',
    ...vendor,
  });
  const [geocoding, setGeocoding] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const geocodeAddress = async () => {
    if (!form.address || !form.city || !form.state) return;
    setGeocoding(true);
    const result = await api.integrations.Core.InvokeLLM({
      prompt: `Return the latitude and longitude for this address: "${form.address}, ${form.city}, ${form.state} ${form.zip}". Return only JSON: { lat: number, lng: number }`,
      response_json_schema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } } }
    });
    if (result?.lat) { set('lat', result.lat); set('lng', result.lng); }
    setGeocoding(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (data.labor_rate) data.labor_rate = Number(data.labor_rate); else delete data.labor_rate;
    if (data.discount_pct) data.discount_pct = Number(data.discount_pct); else delete data.discount_pct;
    if (data.lat) data.lat = Number(data.lat); else delete data.lat;
    if (data.lng) data.lng = Number(data.lng); else delete data.lng;
    if (data.scale_max_capacity_lbs) data.scale_max_capacity_lbs = Number(data.scale_max_capacity_lbs); else delete data.scale_max_capacity_lbs;
    if (data.scale_fee) data.scale_fee = Number(data.scale_fee); else delete data.scale_fee;
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-black text-slate-900">{vendor ? 'Edit Vendor' : 'Add Vendor / Shop'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Basic Info */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Basic Info</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Vendor / Shop Name *</label>
                <Input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Big Rig Repairs Inc." />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Type *</label>
                <select required value={form.type} onChange={e => set('type', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {['Repair Shop','Parts Supplier','Tire Shop','Towing','Fuel','Body Shop','DEF/Emissions','Weigh Scale','Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* POC */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Point of Contact</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Contact Name</label>
                <Input value={form.poc_name} onChange={e => set('poc_name', e.target.value)} placeholder="John Smith" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Title / Role</label>
                <Input value={form.poc_title} onChange={e => set('poc_title', e.target.value)} placeholder="Service Manager" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone</label>
                <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Alt / After-Hours Phone</label>
                <Input type="tel" value={form.alt_phone} onChange={e => set('alt_phone', e.target.value)} placeholder="(555) 000-0000" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Email</label>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@shop.com" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Address</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Street Address</label>
                <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Truck Stop Rd" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">City</label>
                <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Dallas" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">State</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">--</option>
                    {US_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">ZIP</label>
                  <Input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="75201" />
                </div>
              </div>
              <div className="col-span-2">
                <Button type="button" variant="outline" onClick={geocodeAddress} disabled={geocoding} className="w-full text-sm">
                  {geocoding ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Getting coordinates...</> : '📍 Auto-detect Map Coordinates from Address'}
                </Button>
                {form.lat && form.lng && (
                  <p className="text-xs text-green-600 mt-1">✓ Coordinates set: {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contract */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Contract Details (Optional)</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Contract #</label>
                <Input value={form.contract_number} onChange={e => set('contract_number', e.target.value)} placeholder="CNT-2024-001" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Labor Rate ($/hr)</label>
                <Input type="number" value={form.labor_rate} onChange={e => set('labor_rate', e.target.value)} placeholder="95" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Contract Start</label>
                <Input type="date" value={form.contract_start} onChange={e => set('contract_start', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Contract End</label>
                <Input type="date" value={form.contract_end} onChange={e => set('contract_end', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Parts Discount %</label>
                <Input type="number" value={form.discount_pct} onChange={e => set('discount_pct', e.target.value)} placeholder="10" />
              </div>
            </div>
          </div>

          {/* Weigh Scale Fields */}
          {form.type === 'Weigh Scale' && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Scale Details</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.scale_certified} onChange={e => set('scale_certified', e.target.checked)}
                      className="w-4 h-4 accent-amber-500" />
                    <span className="text-sm font-semibold text-slate-700">DOT Certified Scale</span>
                  </label>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Max Capacity (lbs)</label>
                  <Input type="number" value={form.scale_max_capacity_lbs} onChange={e => set('scale_max_capacity_lbs', e.target.value)} placeholder="e.g. 80000" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Fee per Weigh ($)</label>
                  <Input type="number" value={form.scale_fee} onChange={e => set('scale_fee', e.target.value)} placeholder="e.g. 10" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Operating Hours</label>
                  <Input value={form.scale_hours} onChange={e => set('scale_hours', e.target.value)} placeholder="e.g. 24/7 or Mon–Fri 6am–10pm" />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Notes / Specialties</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Specializes in Peterbilt, Freightliner... 24/7 availability..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              {vendor ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
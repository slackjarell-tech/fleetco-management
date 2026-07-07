import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Search, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function VehicleModal({ vehicle, users, onSave, onClose }) {
  const drivers = users.filter(u => u.role === 'driver');
  const customers = users.filter(u => u.role === 'customer');

  const isTrailer = vehicle?.unit_type === 'trailer';

  const [form, setForm] = useState({
    unit_number: vehicle?.unit_number || '',
    unit_type: vehicle?.unit_type || 'truck',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || '',
    vin: vehicle?.vin || '',
    license_plate: vehicle?.license_plate || '',
    status: vehicle?.status || 'active',
    odometer: vehicle?.odometer || '',
    purchase_price: vehicle?.purchase_price || '',
    purchase_date: vehicle?.purchase_date || '',
    trailer_type: vehicle?.trailer_type || '',
    trailer_length: vehicle?.trailer_length || '',
    assigned_driver_id: vehicle?.assigned_driver_id || '',
    assigned_customer_id: vehicle?.assigned_customer_id || '',
    notes: vehicle?.notes || '',
  });

  const [decoding, setDecoding] = useState(false);
  const [decodeResult, setDecodeResult] = useState(null);
  const [decodeError, setDecodeError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      year: form.year ? Number(form.year) : null,
      odometer: form.odometer ? Number(form.odometer) : null,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
      trailer_length: form.trailer_length ? Number(form.trailer_length) : null,
    });
  };

  const handleDecodeVin = async () => {
    if (!form.vin || form.vin.trim().length < 11) {
      setDecodeError('Please enter a valid VIN (at least 11 characters)');
      return;
    }
    setDecoding(true);
    setDecodeError('');
    setDecodeResult(null);
    try {
      const res = await api.functions.invoke('decodeVin', { vin: form.vin.trim() });
      const data = res.data;
      if (data.specs) {
        setDecodeResult(data);

        // Auto-fill form fields from decoded specs
        const specs = data.specs;
        const updates = {};
        if (specs.make && !form.make) updates.make = specs.make;
        if (specs.model && !form.model) updates.model = specs.model;
        if (specs.year && !form.year) updates.year = specs.year;
        setForm(p => ({ ...p, ...updates }));
      }
    } catch (err) {
      setDecodeError(err?.response?.data?.error || 'Failed to decode VIN');
    } finally {
      setDecoding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Unit Number *</Label>
              <Input value={form.unit_number} onChange={e => set('unit_number', e.target.value)} required className="mt-1" placeholder="e.g. 101" />
            </div>
            <div>
              <Label>Unit Type</Label>
              <Select value={form.unit_type} onValueChange={v => set('unit_type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck (Power Unit)</SelectItem>
                  <SelectItem value="trailer">Trailer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="in_shop">In Shop</SelectItem>
                  <SelectItem value="waiting_for_parts">Waiting for Parts</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                  <SelectItem value="pending_inspection">Pending Inspection</SelectItem>
                  <SelectItem value="leased_out">Leased Out</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Make</Label>
              <Input value={form.make} onChange={e => set('make', e.target.value)} className="mt-1" placeholder="e.g. Freightliner" />
            </div>
            <div>
              <Label>Model</Label>
              <Input value={form.model} onChange={e => set('model', e.target.value)} className="mt-1" placeholder="e.g. Cascadia" />
            </div>
            <div>
              <Label>Year</Label>
              <Input type="number" value={form.year} onChange={e => set('year', e.target.value)} className="mt-1" placeholder="2020" />
            </div>
            <div>
              <Label>Odometer (mi)</Label>
              <Input type="number" value={form.odometer} onChange={e => set('odometer', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Purchase Price ($)</Label>
              <Input type="number" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} className="mt-1" placeholder="e.g. 85000" />
            </div>
            <div>
              <Label>Purchase Date</Label>
              <Input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} className="mt-1" />
            </div>
            {form.unit_type === 'trailer' && (
              <>
                <div>
                  <Label>Trailer Type</Label>
                  <Select value={form.trailer_type} onValueChange={v => set('trailer_type', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {['Dry Van','Reefer','Flatbed','Step Deck','Lowboy','Tanker','Curtainside','Other'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Length (ft)</Label>
                  <Input type="number" value={form.trailer_length} onChange={e => set('trailer_length', e.target.value)} className="mt-1" placeholder="e.g. 53" />
                </div>
              </>
            )}
            <div className="col-span-2">
              <Label>VIN</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.vin} onChange={e => { set('vin', e.target.value); setDecodeResult(null); setDecodeError(''); }}
                  className="font-mono flex-1" placeholder="17-character VIN" />
                <Button type="button" variant="outline" size="sm" onClick={handleDecodeVin} disabled={decoding || !form.vin}
                  className="flex-shrink-0 gap-1">
                  {decoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Decode
                </Button>
              </div>
            </div>

            {/* Decoded specs summary */}
            {decodeResult && (
              <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  VIN Decoded Successfully
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {decodeResult.specs.make && <div><span className="text-slate-400">Make:</span> <strong>{decodeResult.specs.make}</strong></div>}
                  {decodeResult.specs.model && <div><span className="text-slate-400">Model:</span> <strong>{decodeResult.specs.model}</strong></div>}
                  {decodeResult.specs.year && <div><span className="text-slate-400">Year:</span> <strong>{decodeResult.specs.year}</strong></div>}
                  {decodeResult.specs.body_class && <div><span className="text-slate-400">Body:</span> <strong>{decodeResult.specs.body_class}</strong></div>}
                  {decodeResult.specs.engine_model && <div><span className="text-slate-400">Engine:</span> <strong>{decodeResult.specs.engine_model}</strong></div>}
                  {decodeResult.specs.fuel_type && <div><span className="text-slate-400">Fuel:</span> <strong>{decodeResult.specs.fuel_type}</strong></div>}
                  {decodeResult.specs.drive_type && <div><span className="text-slate-400">Drive:</span> <strong>{decodeResult.specs.drive_type}</strong></div>}
                  {decodeResult.specs.brake_system && <div><span className="text-slate-400">Brakes:</span> <strong>{decodeResult.specs.brake_system}</strong></div>}
                  {decodeResult.specs.gvwr && <div><span className="text-slate-400">GVWR:</span> <strong>{decodeResult.specs.gvwr}</strong></div>}
                  {decodeResult.specs.displacement && <div><span className="text-slate-400">Displacement:</span> <strong>{(decodeResult.specs.displacement / 1000).toFixed(1)}L</strong></div>}
                </div>

                {/* Recalls */}
                {decodeResult.recalls && decodeResult.recalls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {decodeResult.recalls.length} Open Recall{decodeResult.recalls.length > 1 ? 's' : ''}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {decodeResult.recalls.map((recall, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-xs">
                          <div className="font-bold text-red-700">{recall.component}</div>
                          <div className="text-red-600 text-[11px]">Campaign: {recall.nhtsa_campaign}</div>
                          <p className="text-slate-600 mt-1 line-clamp-3">{recall.summary}</p>
                          {recall.remedy && <p className="text-green-700 mt-1"><strong>Remedy:</strong> {recall.remedy}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {decodeError && (
              <div className="col-span-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {decodeError}
              </div>
            )}

            <div>
              <Label>License Plate</Label>
              <Input value={form.license_plate} onChange={e => set('license_plate', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Assigned Driver</Label>
              <Select value={form.assigned_driver_id} onValueChange={v => set('assigned_driver_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Assigned Customer</Label>
              <Select value={form.assigned_customer_id} onValueChange={v => set('assigned_customer_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="mt-1" rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              {vehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
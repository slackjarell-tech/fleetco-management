import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { filterDriverRoster } from '@/lib/driverAccess';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_ACCESSORIES } from '@/lib/equipmentTypes';
import { canDispatchLoad, isCustomerLoadPoster } from '@/lib/loadBoardAccess';
import { canUploadBol } from '@/lib/loadBol';
import LoadBolUpload from '@/components/loadboard/LoadBolUpload';

const CUSTOMER_STATUSES = ['available', 'cancelled'];
const DISPATCH_STATUSES = ['available', 'assigned', 'in_transit', 'delivered', 'cancelled'];

function generateLoadNumber() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `LD-${n}`;
}

export default function LoadModal({ load, vehicles, users, customers = [], currentUser, onSave, onClose }) {
  const drivers = filterDriverRoster(users);
  const customerPoster = isCustomerLoadPoster(currentUser);
  const showDispatch = canDispatchLoad(currentUser) && !customerPoster;
  const showBolUpload = canUploadBol(currentUser);

  const customerOptions = customers.length > 0
    ? customers.map((c) => ({ id: c.id, label: c.company_name || c.contact_name }))
    : users.filter((u) => u.customer_id).map((u) => ({ id: u.customer_id || u.id, label: u.full_name }));

  const [form, setForm] = useState({
    load_number: load?.load_number || generateLoadNumber(),
    status: load?.status || 'available',
    origin: load?.origin || '',
    destination: load?.destination || '',
    origin_city: load?.origin_city || '',
    origin_state: load?.origin_state || '',
    destination_city: load?.destination_city || '',
    destination_state: load?.destination_state || '',
    pickup_date: load?.pickup_date || '',
    delivery_date: load?.delivery_date || '',
    rate: load?.rate || '',
    miles: load?.miles || '',
    weight: load?.weight || '',
    commodity: load?.commodity || '',
    required_equipment_type: load?.required_equipment_type || '',
    equipment_accessories: load?.equipment_accessories || [],
    broker: load?.broker || '',
    assigned_driver_id: load?.assigned_driver_id || '',
    assigned_vehicle_id: load?.assigned_vehicle_id || '',
    customer_id: load?.customer_id || currentUser?.customer_id || '',
    posting_source: load?.posting_source || (customerPoster ? 'customer' : 'internal'),
    syndication_status: load?.syndication_status || 'draft',
    bol_file_url: load?.bol_file_url || '',
    bol_file_name: load?.bol_file_name || '',
    bol_uploaded_at: load?.bol_uploaded_at || '',
    bol_uploaded_by: load?.bol_uploaded_by || '',
    notes: load?.notes || '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleAccessory = (id) => {
    setForm((p) => {
      const has = p.equipment_accessories.includes(id);
      return {
        ...p,
        equipment_accessories: has
          ? p.equipment_accessories.filter((a) => a !== id)
          : [...p.equipment_accessories, id],
      };
    });
  };

  const handleBolChange = (bolFields) => {
    setForm((p) => ({
      ...p,
      ...bolFields,
      bol_uploaded_by: bolFields.bol_file_url ? (currentUser?.email || currentUser?.id) : null,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const origin = form.origin || (form.origin_city && form.origin_state ? `${form.origin_city}, ${form.origin_state}` : '');
    const destination = form.destination || (form.destination_city && form.destination_state ? `${form.destination_city}, ${form.destination_state}` : '');
    onSave({
      ...form,
      origin,
      destination,
      rate: form.rate ? Number(form.rate) : null,
      miles: form.miles ? Number(form.miles) : null,
      assigned_driver_id: showDispatch ? form.assigned_driver_id || null : load?.assigned_driver_id || null,
      assigned_vehicle_id: showDispatch ? form.assigned_vehicle_id || null : load?.assigned_vehicle_id || null,
      customer_id: form.customer_id || currentUser?.customer_id || null,
      marketplace_visible: customerPoster || showDispatch ? form.marketplace_visible !== false : true,
      booking_status: form.booking_status || load?.booking_status || 'open',
      bol_file_url: form.bol_file_url || null,
      bol_file_name: form.bol_file_name || null,
      bol_uploaded_at: form.bol_uploaded_at || null,
      bol_uploaded_by: form.bol_uploaded_by || null,
    });
  };

  const statusOptions = showDispatch ? DISPATCH_STATUSES : CUSTOMER_STATUSES;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {load ? (customerPoster ? 'Edit Posted Load' : 'Edit Load') : (customerPoster ? 'Post a Load' : 'New Load')}
            </h2>
            {customerPoster && (
              <p className="text-xs text-slate-500 mt-0.5">Your load will appear on the load board for carriers to view.</p>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Load Number *</Label>
              <Input value={form.load_number} onChange={(e) => set('load_number', e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Required Equipment *</Label>
              <Select value={form.required_equipment_type} onValueChange={(v) => set('required_equipment_type', v)} required>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select equipment type" /></SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_CATEGORIES.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>{eq.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.required_equipment_type && (
                <p className="text-xs text-slate-400 mt-1">
                  {EQUIPMENT_CATEGORIES.find((e) => e.id === form.required_equipment_type)?.description}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label className="mb-2 block">Load Requirements</Label>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_ACCESSORIES.map((acc) => {
                  const active = form.equipment_accessories.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => toggleAccessory(acc.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                        active
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {acc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Origin City *</Label>
              <Input value={form.origin_city || form.origin?.split(',')[0]?.trim() || ''} onChange={(e) => set('origin_city', e.target.value)} required className="mt-1" placeholder="Dallas" />
            </div>
            <div>
              <Label>Origin State *</Label>
              <Input value={form.origin_state || form.origin?.split(',')[1]?.trim() || ''} onChange={(e) => set('origin_state', e.target.value.toUpperCase().slice(0, 2))} required className="mt-1" placeholder="TX" maxLength={2} />
            </div>
            <div>
              <Label>Destination City *</Label>
              <Input value={form.destination_city || form.destination?.split(',')[0]?.trim() || ''} onChange={(e) => set('destination_city', e.target.value)} required className="mt-1" placeholder="Chicago" />
            </div>
            <div>
              <Label>Destination State *</Label>
              <Input value={form.destination_state || form.destination?.split(',')[1]?.trim() || ''} onChange={(e) => set('destination_state', e.target.value.toUpperCase().slice(0, 2))} required className="mt-1" placeholder="IL" maxLength={2} />
            </div>
            <div>
              <Label>Pickup Date</Label>
              <Input type="date" value={form.pickup_date} onChange={(e) => set('pickup_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Delivery Date</Label>
              <Input type="date" value={form.delivery_date} onChange={(e) => set('delivery_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Rate ($)</Label>
              <Input type="number" value={form.rate} onChange={(e) => set('rate', e.target.value)} className="mt-1" placeholder="0.00" />
            </div>
            <div>
              <Label>Miles</Label>
              <Input type="number" value={form.miles} onChange={(e) => set('miles', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Weight</Label>
              <Input value={form.weight} onChange={(e) => set('weight', e.target.value)} className="mt-1" placeholder="e.g. 44,000 lbs" />
            </div>
            <div>
              <Label>Commodity</Label>
              <Input value={form.commodity} onChange={(e) => set('commodity', e.target.value)} className="mt-1" />
            </div>

            {showDispatch && (
              <>
                <div>
                  <Label>Broker</Label>
                  <Input value={form.broker} onChange={(e) => set('broker', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Assigned Driver</Label>
                  <Select value={form.assigned_driver_id} onValueChange={(v) => set('assigned_driver_id', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select driver" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vehicle</Label>
                  <Select value={form.assigned_vehicle_id} onValueChange={(v) => set('assigned_vehicle_id', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>Unit #{v.unit_number} — {v.make} {v.model}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Customer</Label>
                  <Select value={form.customer_id} onValueChange={(v) => set('customer_id', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {customerOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Syndication Status</Label>
                  <Select value={form.syndication_status} onValueChange={(v) => set('syndication_status', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['draft', 'ready', 'posted', 'synced'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          {showBolUpload && (
            <LoadBolUpload
              load={load}
              bolFileUrl={form.bol_file_url}
              bolFileName={form.bol_file_name}
              onBolChange={handleBolChange}
            />
          )}
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="mt-1" rows={3} placeholder={customerPoster ? 'Special instructions, dock hours, contact info...' : ''} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              {load ? 'Update Load' : (customerPoster ? 'Post Load' : 'Create Load')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

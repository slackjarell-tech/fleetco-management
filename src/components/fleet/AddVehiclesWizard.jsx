import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Truck, Container, Trash2, Loader2, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipmentTypes';

const EMPTY_FORM = {
  unit_type: 'truck',
  equipment_class: '',
  make: '',
  model: '',
  year: '',
  vin: '',
  license_plate: '',
  trailer_type: '',
  trailer_length: '',
  unit_number: '',
};

function formSummary(entry) {
  const parts = [entry.year, entry.make, entry.model].filter(Boolean);
  const typeLabel = entry.unit_type === 'trailer' ? 'Trailer' : 'Vehicle';
  return parts.length ? `${typeLabel} · ${parts.join(' ')}` : typeLabel;
}

export default function AddVehiclesWizard({ user, existingVehicles = [], defaultUnitType = 'truck', onClose, onSubmitted }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, unit_type: defaultUnitType });
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState('');

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const existingAssetNumbers = new Set(
    [...existingVehicles, ...queue].map((v) => String(v.unit_number || '').trim().toLowerCase()).filter(Boolean),
  );

  const validateCurrent = () => {
    if (!form.equipment_class) return 'Select an equipment type.';
    if (!form.unit_number?.trim()) return 'Enter an asset number for this unit.';
    const assetKey = form.unit_number.trim().toLowerCase();
    if (existingAssetNumbers.has(assetKey)) return `Asset number "${form.unit_number.trim()}" is already in use.`;
    return null;
  };

  const buildRecord = () => ({
    unit_number: form.unit_number.trim(),
    unit_type: form.unit_type,
    equipment_class: form.equipment_class,
    make: form.make?.trim() || undefined,
    model: form.model?.trim() || undefined,
    year: form.year ? Number(form.year) : undefined,
    vin: form.vin?.trim() || undefined,
    license_plate: form.license_plate?.trim() || undefined,
    trailer_type: form.unit_type === 'trailer' ? form.trailer_type || undefined : undefined,
    trailer_length: form.unit_type === 'trailer' && form.trailer_length ? Number(form.trailer_length) : undefined,
    status: 'active',
    customer_id: user?.customer_id,
  });

  const handleAddAnother = () => {
    setError('');
    const validationError = validateCurrent();
    if (validationError) {
      setError(validationError);
      return;
    }
    setQueue((prev) => [...prev, buildRecord()]);
    setForm({ ...EMPTY_FORM, unit_type: form.unit_type });
    setDecodeError('');
  };

  const handleRemoveFromQueue = (index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAll = async () => {
    setError('');
    let records = [...queue];

    const validationError = validateCurrent();
    if (validationError && queue.length === 0) {
      setError(validationError);
      return;
    }

    if (!validationError && form.unit_number?.trim()) {
      records = [...records, buildRecord()];
    } else if (records.length === 0) {
      setError('Add at least one vehicle with an asset number before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.entities.Vehicle.bulkCreate(records);
      if (result.failed?.length) {
        const msg = result.failed.map((f) => `Row ${f.row}: ${f.error}`).join('; ');
        setError(result.created ? `Some units were not saved: ${msg}` : msg);
        if (result.items?.length) {
          onSubmitted?.(result.items);
        }
        return;
      }
      onSubmitted?.(result.items || []);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save vehicles. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecodeVin = async () => {
    if (!form.vin || form.vin.trim().length < 11) {
      setDecodeError('Enter a valid VIN (at least 11 characters).');
      return;
    }
    setDecoding(true);
    setDecodeError('');
    try {
      const res = await api.functions.invoke('decodeVin', { vin: form.vin.trim() });
      if (res?.specs) {
        const specs = res.specs;
        setForm((p) => ({
          ...p,
          make: p.make || specs.make || '',
          model: p.model || specs.model || '',
          year: p.year || specs.year || '',
        }));
      }
    } catch (err) {
      setDecodeError(err?.response?.data?.error || 'Failed to decode VIN');
    } finally {
      setDecoding(false);
    }
  };

  const hasValidCurrent =
    !!form.unit_number?.trim() &&
    !!form.equipment_class &&
    !existingAssetNumbers.has(form.unit_number.trim().toLowerCase());
  const totalToSubmit = queue.length + (hasValidCurrent ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Fleet Units</h2>
            <p className="text-sm text-slate-500 mt-0.5">Enter vehicle details, assign an asset number, then add more or submit.</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} disabled={submitting}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {queue.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                Ready to submit ({queue.length})
              </div>
              <ul className="space-y-2">
                {queue.map((entry, index) => (
                  <li key={`${entry.unit_number}-${index}`} className="flex items-center justify-between gap-3 bg-white rounded-lg border border-slate-100 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {entry.unit_type === 'trailer' ? (
                        <Container className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">Asset #{entry.unit_number}</div>
                        <div className="text-xs text-slate-500 truncate">{formSummary(entry)}</div>
                      </div>
                    </div>
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveFromQueue(index)} disabled={submitting}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-700">Vehicle details</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit type</Label>
                <Select value={form.unit_type} onValueChange={(v) => set('unit_type', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">Truck (power unit)</SelectItem>
                    <SelectItem value="trailer">Trailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Equipment type *</Label>
                <Select value={form.equipment_class} onValueChange={(v) => set('equipment_class', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>{eq.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Make</Label>
                <Input value={form.make} onChange={(e) => set('make', e.target.value)} className="mt-1" placeholder="e.g. Freightliner" />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={form.model} onChange={(e) => set('model', e.target.value)} className="mt-1" placeholder="e.g. Cascadia" />
              </div>
              <div>
                <Label>Year</Label>
                <Input type="number" value={form.year} onChange={(e) => set('year', e.target.value)} className="mt-1" placeholder="2020" />
              </div>
              <div>
                <Label>License plate</Label>
                <Input value={form.license_plate} onChange={(e) => set('license_plate', e.target.value)} className="mt-1" />
              </div>
              {form.unit_type === 'trailer' && (
                <>
                  <div>
                    <Label>Trailer type</Label>
                    <Select value={form.trailer_type} onValueChange={(v) => set('trailer_type', v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Lowboy', 'Tanker', 'Curtainside', 'Other'].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Length (ft)</Label>
                    <Input type="number" value={form.trailer_length} onChange={(e) => set('trailer_length', e.target.value)} className="mt-1" placeholder="53" />
                  </div>
                </>
              )}
              <div className="col-span-2">
                <Label>VIN</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={form.vin}
                    onChange={(e) => { set('vin', e.target.value); setDecodeError(''); }}
                    className="font-mono flex-1"
                    placeholder="17-character VIN"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleDecodeVin} disabled={decoding || !form.vin} className="shrink-0 gap-1">
                    {decoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Decode
                  </Button>
                </div>
                {decodeError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {decodeError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <CheckCircle className="w-4 h-4 text-amber-600" />
              Asset number
            </div>
            <p className="text-xs text-slate-600">Your internal ID for this unit (shown as Unit # on the fleet board).</p>
            <div>
              <Label>Asset number *</Label>
              <Input
                value={form.unit_number}
                onChange={(e) => set('unit_number', e.target.value)}
                className="mt-1 font-semibold"
                placeholder="e.g. TRK-101 or 101"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAnother}
              className="flex-1 border-amber-300 text-amber-800 hover:bg-amber-50"
              disabled={submitting}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add another
            </Button>
            <Button
              type="button"
              onClick={handleSubmitAll}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
              disabled={submitting || (queue.length === 0 && !form.unit_number?.trim())}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving…
                </>
              ) : (
                <>Submit{totalToSubmit > 0 ? ` (${totalToSubmit})` : ''}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

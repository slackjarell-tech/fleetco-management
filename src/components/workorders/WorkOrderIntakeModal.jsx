import React, { useEffect, useMemo, useState } from 'react';
import { X, MessageSquare, User, Truck } from 'lucide-react';
import { complaintToTitle } from '@/lib/workOrderWorkflow';

const REPAIR_TYPES = ['Engine', 'Transmission', 'Brakes', 'Tires', 'Electrical', 'HVAC', 'Suspension', 'Fuel System', 'Exhaust', 'Preventive Maintenance', 'Body & Frame', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const CONTACT_METHODS = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text/SMS' },
];
const FUEL_LEVELS = ['Full', '3/4', '1/2', '1/4', 'Empty', 'Unknown'];

export default function WorkOrderIntakeModal({
  wo,
  vehicles,
  techs,
  currentUser,
  isCustomerPortal = false,
  onSave,
  onClose,
}) {
  const isEdit = !!wo?.id;

  const [vehicleId, setVehicleId] = useState(wo?.vehicle_id || '');
  const [complaint, setComplaint] = useState(wo?.complaint || '');
  const [priority, setPriority] = useState(wo?.priority || 'medium');
  const [repairType, setRepairType] = useState(wo?.repair_type || 'Other');
  const [assignedTechId, setAssignedTechId] = useState(wo?.assigned_tech_id || '');
  const [odometer, setOdometer] = useState(wo?.odometer ?? '');
  const [customerName, setCustomerName] = useState(wo?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(wo?.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState(wo?.customer_email || '');
  const [contactMethod, setContactMethod] = useState(wo?.contact_method || 'phone');
  const [fuelLevel, setFuelLevel] = useState(wo?.fuel_level || '');
  const [dashWarnings, setDashWarnings] = useState(wo?.dash_warnings || '');
  const [bodyDamageNotes, setBodyDamageNotes] = useState(wo?.body_damage_notes || '');
  const [checkInNotes, setCheckInNotes] = useState(wo?.check_in_notes || '');
  const [requireCustomerAuth, setRequireCustomerAuth] = useState(
    wo?.require_customer_authorization !== false,
  );

  useEffect(() => {
    if (!isEdit && isCustomerPortal && currentUser) {
      if (!customerName) setCustomerName(currentUser.full_name || '');
      if (!customerEmail) setCustomerEmail(currentUser.email || '');
      if (!customerPhone && currentUser.phone) setCustomerPhone(currentUser.phone);
    }
  }, [isEdit, isCustomerPortal, currentUser, customerName, customerEmail, customerPhone]);

  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);

  const onVehicleChange = (id) => {
    setVehicleId(id);
    if (isEdit) return;
    const v = vehicles.find((x) => x.id === id);
    if (v?.odometer != null && v.odometer !== '') setOdometer(String(v.odometer));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = complaint.trim();
    if (!trimmed || !vehicleId) return;

    const intakeFields = {
      title: complaintToTitle(trimmed),
      complaint: trimmed,
      vehicle_id: vehicleId,
      assigned_tech_id: isCustomerPortal ? (wo?.assigned_tech_id || '') : assignedTechId,
      repair_type: repairType,
      priority,
      odometer,
      vin_at_checkin: vehicle?.vin || wo?.vin_at_checkin || '',
      license_plate_at_checkin: vehicle?.license_plate || wo?.license_plate_at_checkin || '',
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      contact_method: contactMethod,
      fuel_level: fuelLevel,
      dash_warnings: dashWarnings,
      body_damage_notes: bodyDamageNotes,
      check_in_notes: checkInNotes,
      require_customer_authorization: requireCustomerAuth,
    };

    if (isEdit) {
      onSave({ ...wo, ...intakeFields });
      return;
    }

    onSave({
      wo_number: `RO-${Date.now().toString().slice(-6)}`,
      ...intakeFields,
      customer_id: currentUser?.customer_id || '',
      created_by_user_id: currentUser?.id || '',
      status: 'awaiting_estimate',
      opened_date: new Date().toISOString().split('T')[0],
      check_in_at: new Date().toISOString(),
      service_tasks: [],
      parts: [],
      labor_hours: 0,
      labor_rate: 75,
      labor_cost: 0,
      parts_total: 0,
      tax_percent: 0,
      tax_amount: 0,
      total_cost: 0,
      intake_by: currentUser?.email || '',
      intake_at: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl">
          <div>
            <h2 className="text-white font-black text-lg">
              {isEdit ? `Edit ${wo.wo_number}` : 'New repair order'}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {isCustomerPortal
                ? 'Log a repair for your fleet — your shop or service partner adds the estimate'
                : 'Vehicle drop-off, customer concern word-for-word, condition notes'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <section>
            <h3 className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" /> Vehicle
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Unit *</label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => onVehicleChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      #{v.unit_number} — {v.year} {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              {vehicle && (
                <div className="sm:col-span-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  VIN: {vehicle.vin || '—'} · Plate: {vehicle.license_plate || '—'}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Odometer *</label>
                <input
                  required
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  placeholder="Current miles"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fuel level</label>
                <select
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">—</option>
                  {FUEL_LEVELS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Contact
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Preferred contact</label>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {CONTACT_METHODS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          <section>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              Concern (word-for-word) *
            </label>
            <textarea
              required
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={4}
              placeholder='e.g. "Front brakes squeak when stopping"'
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </section>

          <section className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dash warning lights</label>
              <input
                value={dashWarnings}
                onChange={(e) => setDashWarnings(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Visible body damage</label>
              <input
                value={bodyDamageNotes}
                onChange={(e) => setBodyDamageNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Additional notes</label>
              <textarea
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
          </section>

          <section className={`grid gap-3 ${isCustomerPortal ? 'grid-cols-2' : 'sm:grid-cols-3'}`}>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Repair type</label>
              <select
                value={repairType}
                onChange={(e) => setRepairType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {REPAIR_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white capitalize"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {!isCustomerPortal && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assign technician</label>
                <select
                  value={assignedTechId}
                  onChange={(e) => setAssignedTechId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Unassigned</option>
                  {techs.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {!isCustomerPortal && (
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={requireCustomerAuth}
                onChange={(e) => setRequireCustomerAuth(e.target.checked)}
                className="mt-1 accent-amber-500"
              />
              <span>Require customer authorization before starting repair</span>
            </label>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg">
              {isEdit ? 'Save repair order' : 'Create repair order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

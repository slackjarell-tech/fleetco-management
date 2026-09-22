import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ClipboardList, Send, MessageSquare, Package } from 'lucide-react';
import { normalizeWorkOrder, computeWorkOrderTotals } from '@/lib/workOrderWorkflow';
import { WorkOrderCommentsList } from '@/components/workorders/WorkOrderCommentPanel';

const emptyPart = {
  part_number: '',
  description: '',
  quantity: 1,
  unit_cost: 0,
  source: 'requested',
  total_cost: 0,
};
const emptyTask = {
  description: '',
  estimated_minutes: 30,
  completed: false,
  completed_by: '',
  completed_at: '',
  notes: '',
};

export default function MechanicWorkOrderModal({ wo, vehicles, currentUser, onSave, onClose }) {
  const [form, setForm] = useState(() => normalizeWorkOrder(wo));
  const [newNote, setNewNote] = useState('');
  const [qcNotes, setQcNotes] = useState('');
  const [actualHours, setActualHours] = useState('');

  useEffect(() => {
    setForm(normalizeWorkOrder(wo));
    setNewNote('');
  }, [wo?.id]);

  const vehicle = vehicles.find((v) => v.id === form.vehicle_id);
  const estimatePhase = form.status === 'awaiting_estimate';
  const activeJob = ['open', 'in_progress', 'parts_ordered', 'awaiting_parts'].includes(form.status);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const recalculate = (parts, laborHours, laborRate, taxPercent = form.tax_percent) => {
    return computeWorkOrderTotals({
      ...form,
      parts,
      labor_hours: laborHours,
      labor_rate: laborRate,
      tax_percent: taxPercent,
    });
  };

  const recalcLaborFromTasks = (tasks) => {
    const totalMin = tasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0);
    return Math.round(totalMin / 6) / 10;
  };

  const updatePart = (idx, field, val) => {
    const parts = [...form.parts];
    parts[idx] = { ...parts[idx], [field]: val };
    if (field === 'quantity' || field === 'unit_cost') {
      parts[idx].total_cost = (parts[idx].quantity || 0) * (parts[idx].unit_cost || 0);
    }
    setForm((f) => ({ ...f, ...recalculate(parts, f.labor_hours, f.labor_rate) }));
  };

  const addPartRequest = () => {
    setForm((f) => ({ ...f, parts: [...f.parts, { ...emptyPart }] }));
  };

  const removePart = (idx) => {
    const parts = form.parts.filter((_, i) => i !== idx);
    setForm((f) => ({ ...f, ...recalculate(parts, f.labor_hours, f.labor_rate) }));
  };

  const addTask = () => {
    const tasks = [...form.service_tasks, { ...emptyTask }];
    const laborHours = recalcLaborFromTasks(tasks);
    setForm((f) => ({
      ...f,
      service_tasks: tasks,
      ...recalculate(f.parts, laborHours, f.labor_rate),
      labor_hours: laborHours,
    }));
  };

  const updateTask = (idx, field, val) => {
    const tasks = [...form.service_tasks];
    tasks[idx] = { ...tasks[idx], [field]: val };
    const laborHours = recalcLaborFromTasks(tasks);
    setForm((f) => ({
      ...f,
      service_tasks: tasks,
      ...recalculate(f.parts, laborHours, f.labor_rate),
      labor_hours: laborHours,
    }));
  };

  const updateLabor = (field, val) => {
    const hours = field === 'labor_hours' ? parseFloat(val) || 0 : form.labor_hours;
    const rate = field === 'labor_rate' ? parseFloat(val) || 0 : form.labor_rate;
    setForm((f) => ({
      ...f,
      [field]: parseFloat(val) || 0,
      ...recalculate(f.parts, hours, rate),
      labor_hours: hours,
      labor_rate: rate,
    }));
  };

  const appendNote = () => {
    const text = newNote.trim();
    if (!text) return;
    const entry = {
      at: new Date().toISOString(),
      by: currentUser?.full_name || currentUser?.email || 'Mechanic',
      text,
    };
    setForm((f) => ({
      ...f,
      mechanic_notes_log: [...(f.mechanic_notes_log || []), entry],
      repair_notes: [f.repair_notes, text].filter(Boolean).join('\n\n'),
    }));
    setNewNote('');
  };

  const buildPayload = (extra = {}) => {
    let payload = { ...form, ...extra };
    if (!payload.assigned_tech_id && currentUser?.id) {
      payload.assigned_tech_id = currentUser.id;
    }
    return payload;
  };

  const saveDraft = (e) => {
    e.preventDefault();
    onSave(buildPayload());
  };

  const submitEstimate = () => {
    onSave(buildPayload({
      status: 'awaiting_approval',
      estimate_submitted_at: new Date().toISOString(),
      estimate_submitted_by: currentUser?.email || '',
    }));
  };

  const markInProgress = () => {
    onSave(buildPayload({ status: 'in_progress' }));
  };

  const requestParts = () => {
    onSave(buildPayload({ status: 'parts_ordered' }));
  };

  const completeWithQc = () => {
    onSave(buildPayload({
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
      qc_passed: true,
      qc_notes: qcNotes,
      qc_by: currentUser?.email || '',
      qc_at: new Date().toISOString(),
      actual_labor_hours: actualHours ? parseFloat(actualHours) : form.labor_hours,
      payment_status: 'pending',
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl">
          <div>
            <h2 className="text-white font-black text-lg">{form.wo_number} — Mechanic</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {vehicle ? `#${vehicle.unit_number} ${vehicle.make}` : 'Vehicle'} · {form.title}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={saveDraft} className="p-6 space-y-5">
          <WorkOrderCommentsList comments={form.work_order_comments} />

          {form.complaint && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-bold uppercase text-amber-800 mb-1">Customer complaint</div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{form.complaint}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Diagnosis / findings</label>
            <textarea
              value={form.diagnosis}
              onChange={(e) => set('diagnosis', e.target.value)}
              rows={3}
              placeholder="What you found on inspection…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> Shop notes
            </label>
            {(form.mechanic_notes_log || []).length > 0 && (
              <ul className="mb-2 space-y-1 max-h-28 overflow-y-auto text-xs text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100">
                {form.mechanic_notes_log.map((n, i) => (
                  <li key={i}>
                    <span className="text-slate-400">{n.at?.slice(0, 16).replace('T', ' ')}</span>
                    {' · '}
                    <strong>{n.by}:</strong> {n.text}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note for fleet manager…"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={appendNote}
                className="px-3 py-2 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Add note
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-amber-500" /> Parts (estimate / request)
              </h3>
              <button
                type="button"
                onClick={addPartRequest}
                className="text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded-lg"
              >
                <Plus className="w-3 h-3 inline mr-1" />
                Add part
              </button>
            </div>
            {form.parts.length === 0 ? (
              <p className="text-xs text-slate-400 border border-dashed rounded-lg py-4 text-center">
                List parts needed — use &quot;Requested&quot; if parts must be ordered.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs">
                    <tr>
                      <th className="text-left px-2 py-2">Description</th>
                      <th className="w-14 px-2 py-2">Qty</th>
                      <th className="w-20 px-2 py-2">Est. $</th>
                      <th className="w-24 px-2 py-2">Type</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form.parts.map((p, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">
                          <input
                            value={p.description}
                            onChange={(e) => updatePart(i, 'description', e.target.value)}
                            placeholder="Part description"
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="1"
                            value={p.quantity}
                            onChange={(e) => updatePart(i, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-200 rounded px-1 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="0"
                            value={p.unit_cost}
                            onChange={(e) => updatePart(i, 'unit_cost', parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-200 rounded px-1 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={p.source || 'requested'}
                            onChange={(e) => updatePart(i, 'source', e.target.value)}
                            className="w-full border border-slate-200 rounded px-1 py-1 text-xs bg-white"
                          >
                            <option value="requested">Requested</option>
                            <option value="ordered">Ordered</option>
                            <option value="in_stock">In stock</option>
                            <option value="warranty">Warranty</option>
                          </select>
                        </td>
                        <td className="px-1">
                          <button type="button" onClick={() => removePart(i)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-500" /> Labor tasks
              </h3>
              <button type="button" onClick={addTask} className="text-xs font-semibold text-amber-700 hover:underline">
                + Add task
              </button>
            </div>
            {form.service_tasks.map((task, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={task.description}
                  onChange={(e) => updateTask(i, 'description', e.target.value)}
                  placeholder="Repair step"
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                />
                <input
                  type="number"
                  min="1"
                  value={task.estimated_minutes}
                  onChange={(e) => updateTask(i, 'estimated_minutes', parseInt(e.target.value, 10) || 0)}
                  className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                  title="Minutes"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Labor hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.labor_hours}
                  onChange={(e) => updateLabor('labor_hours', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Rate ($/hr)</label>
                <input
                  type="number"
                  value={form.labor_rate}
                  onChange={(e) => updateLabor('labor_rate', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700">Estimate total</span>
            <span className="text-xl font-black text-amber-600">${(form.total_cost || 0).toFixed(2)}</span>
          </div>

          {activeJob && (
            <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold uppercase text-emerald-800">Quality check & complete</div>
              <textarea
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                rows={2}
                placeholder="Test drive / QC notes…"
                className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
              <input
                type="number"
                step="0.5"
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
                placeholder={`Actual labor hours (est. ${form.labor_hours})`}
                className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg">
              Close
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50">
              Save
            </button>
            {estimatePhase && (
              <button
                type="button"
                onClick={submitEstimate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-lg"
              >
                <Send className="w-4 h-4" />
                Send to fleet manager
              </button>
            )}
            {activeJob && form.status === 'open' && (
              <button
                type="button"
                onClick={markInProgress}
                className="px-4 py-2 text-sm font-bold bg-amber-500 text-slate-900 rounded-lg"
              >
                Start work
              </button>
            )}
            {activeJob && (
              <button
                type="button"
                onClick={requestParts}
                className="px-4 py-2 text-sm font-semibold bg-purple-100 text-purple-800 rounded-lg"
              >
                Flag parts ordered
              </button>
            )}
            {activeJob && (
              <button
                type="button"
                onClick={completeWithQc}
                className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
              >
                Complete RO (QC)
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

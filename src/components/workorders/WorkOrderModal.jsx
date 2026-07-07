import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ClipboardList, FileText, CheckCircle, Circle, Clock } from 'lucide-react';
import { api } from '@/api/apiClient';

const REPAIR_TYPES = ["Engine","Transmission","Brakes","Tires","Electrical","HVAC","Suspension","Fuel System","Exhaust","Preventive Maintenance","Body & Frame","Other"];
const STATUSES = ["open","in_progress","parts_ordered","awaiting_parts","completed","cancelled"];
const PRIORITIES = ["low","medium","high","critical"];

const emptyPart = { part_number: '', description: '', quantity: 1, unit_cost: 0, source: 'in_stock', total_cost: 0 };
const emptyTask = { description: '', estimated_minutes: 30, completed: false, completed_by: '', completed_at: '', notes: '' };

export default function WorkOrderModal({ wo, vehicles, techs, onSave, onClose }) {
  const [form, setForm] = useState(wo || {
    wo_number: `WO-${Date.now().toString().slice(-6)}`,
    title: '', repair_type: 'Engine', status: 'open', priority: 'medium',
    vehicle_id: '', assigned_tech_id: '', opened_date: new Date().toISOString().split('T')[0],
    due_date: '', odometer: '', complaint: '', diagnosis: '', repair_notes: '',
    service_tasks: [], parts: [], labor_hours: 0, labor_rate: 75, labor_cost: 0, parts_total: 0, total_cost: 0,
    warranty_repair: false, shop_name: ''
  });
  const [templates, setTemplates] = useState([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  useEffect(() => {
    if (!templatesLoaded) {
      api.entities.ServiceTemplate.list().then(t => { setTemplates(t); setTemplatesLoaded(true); });
    }
  }, [templatesLoaded]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const recalculate = (parts, laborHours, laborRate) => {
    const partsTotal = parts.reduce((s, p) => s + (p.total_cost || 0), 0);
    const laborCost = (laborHours || 0) * (laborRate || 0);
    return { partsTotal, laborCost, total: partsTotal + laborCost };
  };

  const recalcLaborFromTasks = (tasks) => {
    const totalMin = tasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0);
    return Math.round(totalMin / 6) / 10; // convert to hours with 1 decimal
  };

  const applyTemplate = (templateId) => {
    if (!templateId) return;
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    const tasks = (tpl.tasks || []).map(t => ({
      description: t.description,
      estimated_minutes: t.estimated_minutes || 30,
      completed: false,
      completed_by: '',
      completed_at: '',
      notes: ''
    }));
    const laborHours = recalcLaborFromTasks(tasks);
    const { partsTotal, laborCost, total } = recalculate(form.parts, laborHours, form.labor_rate);
    setForm(f => ({ ...f, service_tasks: tasks, labor_hours: laborHours, labor_cost: laborCost, parts_total: partsTotal, total_cost: total }));
  };

  const addTask = () => {
    const tasks = [...form.service_tasks, { ...emptyTask }];
    const laborHours = recalcLaborFromTasks(tasks);
    const { partsTotal, laborCost, total } = recalculate(form.parts, laborHours, form.labor_rate);
    setForm(f => ({ ...f, service_tasks: tasks, labor_hours: laborHours, labor_cost: laborCost, parts_total: partsTotal, total_cost: total }));
  };

  const removeTask = (idx) => {
    const tasks = form.service_tasks.filter((_, i) => i !== idx);
    const laborHours = recalcLaborFromTasks(tasks);
    const { partsTotal, laborCost, total } = recalculate(form.parts, laborHours, form.labor_rate);
    setForm(f => ({ ...f, service_tasks: tasks, labor_hours: laborHours, labor_cost: laborCost, parts_total: partsTotal, total_cost: total }));
  };

  const updateTask = (idx, field, val) => {
    const tasks = [...form.service_tasks];
    tasks[idx] = { ...tasks[idx], [field]: val };
    const laborHours = recalcLaborFromTasks(tasks);
    const { partsTotal, laborCost, total } = recalculate(form.parts, laborHours, form.labor_rate);
    setForm(f => ({ ...f, service_tasks: tasks, labor_hours: laborHours, labor_cost: laborCost, parts_total: partsTotal, total_cost: total }));
  };

  const updatePart = (idx, field, val) => {
    const parts = [...form.parts];
    parts[idx] = { ...parts[idx], [field]: val };
    if (field === 'quantity' || field === 'unit_cost') {
      parts[idx].total_cost = (parts[idx].quantity || 0) * (parts[idx].unit_cost || 0);
    }
    const { partsTotal, laborCost, total } = recalculate(parts, form.labor_hours, form.labor_rate);
    setForm(f => ({ ...f, parts, parts_total: partsTotal, labor_cost: laborCost, total_cost: total }));
  };

  const addPart = () => {
    setForm(f => ({ ...f, parts: [...f.parts, { ...emptyPart }] }));
  };

  const removePart = (idx) => {
    const parts = form.parts.filter((_, i) => i !== idx);
    const { partsTotal, laborCost, total } = recalculate(parts, form.labor_hours, form.labor_rate);
    setForm(f => ({ ...f, parts, parts_total: partsTotal, labor_cost: laborCost, total_cost: total }));
  };

  const updateLabor = (field, val) => {
    const hours = field === 'labor_hours' ? parseFloat(val) || 0 : form.labor_hours;
    const rate = field === 'labor_rate' ? parseFloat(val) || 0 : form.labor_rate;
    const { partsTotal, laborCost, total } = recalculate(form.parts, hours, rate);
    setForm(f => ({ ...f, [field]: parseFloat(val) || 0, labor_cost: laborCost, parts_total: partsTotal, total_cost: total }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl">
          <div>
            <h2 className="text-white font-black text-lg">{wo ? `Edit ${wo.wo_number}` : 'New Work Order'}</h2>
            <p className="text-slate-400 text-xs mt-0.5">Fill in repair details, assign parts and labor</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">WO Number</label>
              <input value={form.wo_number} onChange={e => set('wo_number', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Title / Job Description *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Replace front brake pads and rotors"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Repair Type</label>
              <select value={form.repair_type} onChange={e => set('repair_type', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                {REPAIR_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white capitalize">
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white capitalize">
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle *</label>
              <select required value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>#{v.unit_number} — {v.year} {v.make} {v.model}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Tech</label>
              <select value={form.assigned_tech_id} onChange={e => set('assigned_tech_id', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Unassigned</option>
                {techs.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Opened Date</label>
              <input type="date" value={form.opened_date} onChange={e => set('opened_date', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Odometer</label>
              <input type="number" value={form.odometer} onChange={e => set('odometer', e.target.value)}
                placeholder="Miles" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="warranty" checked={form.warranty_repair} onChange={e => set('warranty_repair', e.target.checked)}
                className="w-4 h-4 accent-amber-500" />
              <label htmlFor="warranty" className="text-sm font-medium text-slate-700">Warranty Repair</label>
            </div>
          </div>

          {/* Complaint / Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Complaint</label>
              <textarea value={form.complaint} onChange={e => set('complaint', e.target.value)}
                rows={3} placeholder="What did the driver report?"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tech Diagnosis</label>
              <textarea value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)}
                rows={3} placeholder="Root cause found..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Work Performed</label>
              <textarea value={form.repair_notes} onChange={e => set('repair_notes', e.target.value)}
                rows={3} placeholder="Describe work done..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
          </div>

          {/* Service Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-500" /> Service Tasks
              </h3>
              <div className="flex items-center gap-2">
                {templates.length > 0 && (
                  <select onChange={e => applyTemplate(e.target.value)} value=""
                    className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400">
                    <option value="">Load template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.repair_type} · {t.estimated_labor_hours}h)</option>
                    ))}
                  </select>
                )}
                <button type="button" onClick={addTask}
                  className="flex items-center gap-1 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded-lg">
                  <Plus className="w-3 h-3" /> Add Task
                </button>
              </div>
            </div>
            {form.service_tasks.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-6 border border-dashed border-slate-200 rounded-xl">
                No service tasks yet. Add individual tasks or load a template above.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Task Description</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 w-24">Est. Minutes</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 w-20">Status</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form.service_tasks.map((task, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <input value={task.description} onChange={e => updateTask(i, 'description', e.target.value)}
                            placeholder="e.g. Remove caliper and inspect pads"
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" value={task.estimated_minutes}
                            onChange={e => updateTask(i, 'estimated_minutes', parseInt(e.target.value) || 0)}
                            className="w-20 border border-slate-200 rounded px-2 py-1 text-xs text-center" />
                        </td>
                        <td className="px-3 py-2">
                          {task.completed
                            ? <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Done</span>
                            : <span className="flex items-center gap-1 text-slate-400 text-xs"><Circle className="w-3.5 h-3.5" /> Pending</span>
                          }
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removeTask(i)}
                            className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {form.service_tasks.length > 0 && (
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Total estimated: <strong>{recalcLaborFromTasks(form.service_tasks)} hours</strong>
                    &nbsp;· {form.service_tasks.length} task{form.service_tasks.length !== 1 ? 's' : ''}
                    &nbsp;· {form.service_tasks.filter(t => t.completed).length} completed
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Parts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-900">Parts Used</h3>
              <button type="button" onClick={addPart}
                className="flex items-center gap-1 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded-lg">
                <Plus className="w-3 h-3" /> Add Part
              </button>
            </div>
            {form.parts.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-6 border border-dashed border-slate-200 rounded-xl">
                No parts added yet. Click "Add Part" to begin.
              </div>
            )}
            {form.parts.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Part #</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Description</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Qty</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Unit Cost</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Source</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Total</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form.parts.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <input value={p.part_number} onChange={e => updatePart(i, 'part_number', e.target.value)}
                            placeholder="P/N" className="w-24 border border-slate-200 rounded px-2 py-1 text-xs" />
                        </td>
                        <td className="px-3 py-2">
                          <input value={p.description} onChange={e => updatePart(i, 'description', e.target.value)}
                            placeholder="Part description" className="w-full min-w-[140px] border border-slate-200 rounded px-2 py-1 text-xs" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" value={p.quantity} onChange={e => updatePart(i, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-14 border border-slate-200 rounded px-2 py-1 text-xs" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={p.unit_cost} onChange={e => updatePart(i, 'unit_cost', parseFloat(e.target.value) || 0)}
                            className="w-20 border border-slate-200 rounded px-2 py-1 text-xs" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={p.source} onChange={e => updatePart(i, 'source', e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 text-xs bg-white">
                            <option value="in_stock">In Stock</option>
                            <option value="ordered">Ordered</option>
                            <option value="warranty">Warranty</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">
                          ${(p.total_cost || 0).toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removePart(i)}
                            className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Labor & Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-black text-slate-900">Labor</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hours</label>
                  <input type="number" min="0" step="0.5" value={form.labor_hours}
                    onChange={e => updateLabor('labor_hours', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Rate ($/hr)</label>
                  <input type="number" min="0" value={form.labor_rate}
                    onChange={e => updateLabor('labor_rate', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <h3 className="font-black text-slate-900 mb-2">Cost Summary</h3>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Parts Total</span><span className="font-semibold">${(form.parts_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Labor ({form.labor_hours}h × ${form.labor_rate})</span>
                <span className="font-semibold">${(form.labor_cost || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between text-base font-black text-slate-900">
                <span>Total Cost</span><span className="text-amber-600">${(form.total_cost || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit"
              className="px-6 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg">
              {wo ? 'Save Changes' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
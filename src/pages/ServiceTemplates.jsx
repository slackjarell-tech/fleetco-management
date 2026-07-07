import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Trash2, Edit, Clock, ClipboardList, Save, X } from 'lucide-react';
import { toast } from "sonner";

const REPAIR_TYPES = ["Engine","Transmission","Brakes","Tires","Electrical","HVAC","Suspension","Fuel System","Exhaust","Preventive Maintenance","Body & Frame","Other"];

export default function ServiceTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadTemplates = async () => {
    const t = await api.entities.ServiceTemplate.list('-created_date');
    setTemplates(t);
    setLoading(false);
  };

  useEffect(() => { loadTemplates(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const form = e.target;
    const tasks = editing?.tasks?.map((t, i) => ({
      sequence: i + 1,
      description: document.getElementById(`task_desc_${i}`)?.value || t.description,
      estimated_minutes: parseInt(document.getElementById(`task_min_${i}`)?.value) || t.estimated_minutes || 30
    })) || [];

    const data = {
      name: form.templateName.value,
      repair_type: form.repairType.value,
      notes: form.notes.value,
      tasks,
      estimated_labor_hours: Math.round(tasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0) / 6) / 10
    };

    if (editing?.id) {
      await api.entities.ServiceTemplate.update(editing.id, data);
      toast.success("Template updated");
    } else {
      await api.entities.ServiceTemplate.create(data);
      toast.success("Template created");
    }
    setEditing(null);
    setShowForm(false);
    loadTemplates();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    await api.entities.ServiceTemplate.delete(id);
    loadTemplates();
    toast.success("Template deleted");
  };

  const startEdit = (tpl) => {
    setEditing(tpl);
    setShowForm(true);
  };

  const TaskField = ({ idx, task, onChange }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-slate-400 w-5">{idx + 1}.</span>
      <input id={`task_desc_${idx}`} defaultValue={task?.description || ''}
        placeholder="Task description"
        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
        onChange={onChange} />
      <input id={`task_min_${idx}`} type="number" min="1" defaultValue={task?.estimated_minutes || 30}
        className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center" />
      <span className="text-xs text-slate-400 w-10">min</span>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalLabor = templates.reduce((s, t) => s + (t.estimated_labor_hours || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Service Templates</h1>
          <p className="text-slate-500 text-sm mt-0.5">Reusable repair task checklists with labor time estimates</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2.5 rounded-lg text-sm">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mb-2">
            <ClipboardList className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{templates.length}</div>
          <div className="text-xs text-slate-500">Templates</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{totalLabor.toFixed(1)}h</div>
          <div className="text-xs text-slate-500">Total Est. Labor</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mb-2">
            <Trash2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{templates.reduce((s, t) => s + (t.tasks?.length || 0), 0)}</div>
          <div className="text-xs text-slate-500">Total Tasks</div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl">
              <h2 className="text-white font-black text-lg">{editing ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Template Name *</label>
                  <input name="templateName" required defaultValue={editing?.name || ''} placeholder="e.g. Brake Job - Standard"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Repair Type *</label>
                  <select name="repairType" required defaultValue={editing?.repair_type || 'Brakes'}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                    {REPAIR_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Est. Labor Hours</label>
                  <input type="text" disabled value={editing?.estimated_labor_hours || 'Auto-calculated'}
                    className="w-full border border-slate-100 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Task Checklist</label>
                {(editing?.tasks || [{ description: '', estimated_minutes: 30 }]).map((t, i) => (
                  <TaskField key={i} idx={i} task={t} onChange={() => {}} />
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea name="notes" defaultValue={editing?.notes || ''} rows={2} placeholder="Any special instructions..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  className="px-6 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  className="px-6 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg">
                  <Save className="w-4 h-4 inline mr-1" /> {editing ? 'Update' : 'Create'} Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No templates yet</p>
          <p className="text-sm mt-1">Create your first service template to speed up work order creation</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(tpl => (
            <div key={tpl.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-black text-slate-900 text-sm">{tpl.name}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mt-1 inline-block">{tpl.repair_type}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(tpl)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(tpl.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <Clock className="w-3.5 h-3.5" />
                <span><strong>{tpl.estimated_labor_hours}h</strong> estimated · {tpl.tasks?.length || 0} tasks</span>
              </div>

              {tpl.tasks?.length > 0 && (
                <div className="space-y-1.5">
                  {tpl.tasks.map((task, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-slate-300 font-mono">{i + 1}.</span>
                      <span className="text-slate-600 flex-1">{task.description}</span>
                      <span className="text-slate-400 flex-shrink-0">{task.estimated_minutes}m</span>
                    </div>
                  ))}
                </div>
              )}

              {tpl.notes && (
                <p className="text-xs text-slate-400 italic mt-3 pt-3 border-t border-slate-100">{tpl.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
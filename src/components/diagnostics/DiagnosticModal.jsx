import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/api/apiClient';

const COMMON_CODES = {
  'P0300': 'Random/Multiple Cylinder Misfire Detected',
  'P0301': 'Cylinder 1 Misfire Detected',
  'P0420': 'Catalyst System Efficiency Below Threshold',
  'P0401': 'Exhaust Gas Recirculation Insufficient Flow',
  'P0171': 'System Too Lean (Bank 1)',
  'P0174': 'System Too Lean (Bank 2)',
  'P0128': 'Coolant Thermostat Below Thermostat Regulating Temperature',
  'P0442': 'Evaporative Emission System Leak Detected (Small)',
  'P0455': 'Evaporative Emission System Leak Detected (Large)',
  'P0507': 'Idle Air Control System RPM High',
  'P0700': 'Transmission Control System Malfunction',
  'P0740': 'Torque Converter Clutch Circuit Malfunction',
  'P1101': 'Mass Air Flow Sensor Out of Self-Test Range',
  'SPN 100': 'Engine Oil Pressure Low',
  'SPN 110': 'Engine Coolant Temperature High',
  'SPN 190': 'Engine Speed',
  'SPN 412': 'Exhaust Gas Recirculation Temperature',
  'SPN 1569': 'Engine Protection Torque Derate - Condition Exists',
  'SPN 3031': 'DEF Tank Level Low',
  'SPN 3361': 'Aftertreatment 1 Diesel Exhaust Fluid Dosing Unit',
  'SPN 4094': 'Aftertreatment 1 SCR Conversion Efficiency',
};

export default function DiagnosticModal({ code, vehicles, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    vehicle_id: '',
    code: '',
    description: '',
    system: 'Engine',
    severity: 'warning',
    connector_type: 'Manual Entry',
    scan_date: today,
    scanned_by: '',
    odometer: '',
    status: 'active',
    resolution_notes: '',
    work_order_id: '',
    ...code,
  });
  const [looking, setLooking] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill known codes
  useEffect(() => {
    const upper = form.code?.toUpperCase();
    if (COMMON_CODES[upper] && !form.description) {
      setSuggestion(COMMON_CODES[upper]);
    } else {
      setSuggestion('');
    }
  }, [form.code]);

  const lookupCode = async () => {
    if (!form.code) return;
    setLooking(true);
    const upper = form.code.toUpperCase();
    if (COMMON_CODES[upper]) {
      set('description', COMMON_CODES[upper]);
      setLooking(false);
      return;
    }
    // AI lookup for unknown codes
    const result = await api.integrations.Core.InvokeLLM({
      prompt: `What does diagnostic trouble code "${form.code}" mean on a commercial truck or vehicle? Give a short 1-2 sentence plain English description of what it means, what system it affects, and the likely severity (info/warning/critical). Return JSON: { description: string, system: string, severity: "info"|"warning"|"critical" }`,
      response_json_schema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          system: { type: 'string' },
          severity: { type: 'string' },
        }
      }
    });
    if (result?.description) {
      setForm(f => ({
        ...f,
        description: result.description,
        system: result.system || f.system,
        severity: result.severity || f.severity,
      }));
    }
    setLooking(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (data.odometer) data.odometer = Number(data.odometer);
    else delete data.odometer;
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-black text-slate-900">{code ? 'Edit Diagnostic Code' : 'Log Diagnostic Code'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Vehicle */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Vehicle *</label>
            <select required value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">Select vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>Unit #{v.unit_number} — {[v.year, v.make, v.model].filter(Boolean).join(' ')}</option>
              ))}
            </select>
          </div>

          {/* Connector type */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Connector / Source</label>
            <select value={form.connector_type} onChange={e => set('connector_type', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option>OBD-II (16-pin)</option>
              <option>J1939 (9-pin)</option>
              <option>J1708</option>
              <option>Manual Entry</option>
            </select>
          </div>

          {/* Code + lookup */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">DTC Code *</label>
            <div className="flex gap-2">
              <Input required placeholder="e.g. P0301 or SPN 100" value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                className="font-mono uppercase" />
              <Button type="button" variant="outline" onClick={lookupCode} disabled={looking || !form.code} className="flex-shrink-0">
                {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Lookup
              </Button>
            </div>
            {suggestion && (
              <div className="mt-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 flex items-center justify-between">
                <span>{suggestion}</span>
                <button type="button" onClick={() => { set('description', suggestion); setSuggestion(''); }}
                  className="ml-2 text-amber-600 font-semibold underline flex-shrink-0">Use</button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Description</label>
            <Input placeholder="What this code means..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* System + Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">System</label>
              <select value={form.system} onChange={e => set('system', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {['Engine','Transmission','Brakes/ABS','Emissions/DEF','Electrical','Body','Chassis','HVAC','Other'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Severity</label>
              <select value={form.severity} onChange={e => set('severity', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Status + Scan Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="active">Active</option>
                <option value="monitoring">Monitoring</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Scan Date</label>
              <Input type="date" value={form.scan_date} onChange={e => set('scan_date', e.target.value)} />
            </div>
          </div>

          {/* Scanned by + Odometer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Scanned By</label>
              <Input placeholder="Tech name" value={form.scanned_by} onChange={e => set('scanned_by', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Odometer</label>
              <Input type="number" placeholder="Miles" value={form.odometer} onChange={e => set('odometer', e.target.value)} />
            </div>
          </div>

          {/* Resolution notes */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Resolution Notes</label>
            <textarea rows={2} placeholder="What was done to fix it..." value={form.resolution_notes}
              onChange={e => set('resolution_notes', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              {code ? 'Update' : 'Save Code'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
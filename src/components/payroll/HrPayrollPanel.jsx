import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/apiClient';
import { Users, FileText, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  US_STATES,
  FEDERAL_W4_FIELDS,
  STATE_W4_FIELDS,
  defaultStateFormData,
  getStateMeta,
} from '@/lib/payroll/usStateTaxForms';
import { canRunPayroll } from '@/lib/accounting/accountingRoles';

function FieldInput({ field, value, onChange }) {
  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }
  if (field.type === 'select') {
    return (
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{field.label}</label>
        <select
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={value || field.options[0]}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{field.label}</label>
      <Input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );
}

export default function HrPayrollPanel({ user, drivers, onEmployeeUpdated }) {
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [selectedId, setSelectedId] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [federal, setFederal] = useState({});
  const [states, setStates] = useState({});
  const [addState, setAddState] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hrOk = canRunPayroll(user);

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === selectedId),
    [drivers, selectedId],
  );

  useEffect(() => {
    if (!selectedId || !hrOk) return;
    setEmployeeNumber(selectedDriver?.employee_number || '');
    setLoading(true);
    setError('');
    api.payroll.getTaxProfile({ user_id: selectedId, tax_year: taxYear })
      .then((res) => {
        if (res.profile) {
          setFederal(res.profile.federal || {});
          setStates(res.profile.states || {});
        } else {
          setFederal({});
          setStates({});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedId, taxYear, selectedDriver?.employee_number, hrOk]);

  const saveProfile = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await api.payroll.saveTaxProfile({
        user_id: selectedId,
        tax_year: taxYear,
        employee_number: employeeNumber,
        federal,
        states,
      });
      setMessage('Saved employee number and tax documents.');
      onEmployeeUpdated?.(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addStateForm = () => {
    if (!addState || states[addState]) return;
    setStates((prev) => ({ ...prev, [addState]: defaultStateFormData(addState) }));
    setAddState('');
  };

  const removeState = (code) => {
    setStates((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
  };

  if (!hrOk) {
    return (
      <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
        HR payroll tools are available to Customer HR, owners, and fleet managers.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            HR — employee IDs & tax forms
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            FleetCo HR can assign employee numbers and capture federal W-4 plus withholding for all 50 states + DC.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Tax year</label>
          <input
            type="number"
            className="border rounded-lg px-2 py-1 w-24 text-sm"
            value={taxYear}
            onChange={(e) => setTaxYear(Number(e.target.value))}
          />
        </div>
      </div>

      {message && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{message}</p>}
      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-slate-200 rounded-xl p-4 bg-white">
          <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Employee</label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Select driver / employee…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name} {d.employee_number ? `(${d.employee_number})` : ''}
              </option>
            ))}
          </select>

          {selectedId && (
            <>
              <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Employee number</label>
              <Input
                placeholder="e.g. DRV-00042 or HR-102"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                className="mb-3 font-mono"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Used on payroll exports and tax reporting. Must be unique across your organization.
              </p>
            </>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!selectedId ? (
            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Select an employee to edit W-4 and state forms.
            </div>
          ) : loading ? (
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          ) : (
            <>
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-amber-500" /> Federal Form W-4
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {FEDERAL_W4_FIELDS.map((f) => (
                    <FieldInput
                      key={f.key}
                      field={f}
                      value={federal[f.key]}
                      onChange={(v) => setFederal((prev) => ({ ...prev, [f.key]: v }))}
                    />
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="font-bold text-slate-800">State withholding (all US states)</h3>
                  <div className="flex gap-2">
                    <select
                      className="border rounded-lg px-2 py-1 text-sm"
                      value={addState}
                      onChange={(e) => setAddState(e.target.value)}
                    >
                      <option value="">Add state…</option>
                      {US_STATES.filter((s) => !states[s.code]).map((s) => (
                        <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                      ))}
                    </select>
                    <Button type="button" size="sm" variant="outline" onClick={addStateForm} disabled={!addState}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {Object.keys(states).length === 0 ? (
                  <p className="text-sm text-slate-400">Add each state where this employee works or lives.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(states).map(([code, data]) => {
                      const meta = getStateMeta(code);
                      return (
                        <div key={code} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="font-black text-slate-800">{code}</span>
                              <span className="text-sm text-slate-500 ml-2">{meta?.name}</span>
                              <div className="text-xs text-amber-700 font-semibold mt-0.5">{meta?.form}</div>
                            </div>
                            <button type="button" onClick={() => removeState(code)} className="text-red-500 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {!meta?.hasIncomeTax ? (
                            <p className="text-xs text-slate-600">No state income tax withholding — record on file for compliance.</p>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-2">
                              {STATE_W4_FIELDS.map((f) => (
                                <FieldInput
                                  key={f.key}
                                  field={f}
                                  value={data[f.key]}
                                  onChange={(v) =>
                                    setStates((prev) => ({
                                      ...prev,
                                      [code]: { ...prev[code], [f.key]: v },
                                    }))
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button
                onClick={saveProfile}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save HR payroll & tax data
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

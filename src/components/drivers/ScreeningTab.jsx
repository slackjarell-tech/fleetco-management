import React, { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { Shield, Plus, CheckCircle2, AlertTriangle, Clock, XCircle, FileText, ExternalLink, Trash2, Edit, Upload, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CHECK_TYPES = ['Background Check', 'MVR', 'Drug Test', 'Employment Verification', 'Criminal History', 'Full Package'];
const PROVIDERS = ['Checkr', 'Sterling', 'HireRight', 'Manual / Internal', 'Other'];

const STATUS_STYLES = {
  pending:     { color: 'bg-slate-100 text-slate-600',   icon: Clock,          label: 'Pending' },
  in_progress: { color: 'bg-blue-100 text-blue-700',     icon: Clock,          label: 'In Progress' },
  clear:       { color: 'bg-green-100 text-green-700',   icon: CheckCircle2,   label: 'Clear' },
  flagged:     { color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle,  label: 'Flagged' },
  failed:      { color: 'bg-red-100 text-red-700',       icon: XCircle,        label: 'Failed' },
};

const PROVIDER_LINKS = {
  Checkr:    'https://dashboard.checkr.com',
  Sterling:  'https://www.sterlingcheck.com',
  HireRight: 'https://www.hireright.com',
};

const EMPTY_FORM = {
  check_type: 'Background Check',
  provider: 'Manual / Internal',
  status: 'pending',
  ordered_date: new Date().toISOString().split('T')[0],
  completed_date: '',
  expiration_date: '',
  report_url: '',
  reference_id: '',
  notes: '',
};

export default function ScreeningTab({ drivers }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, driver_id: '' });
  const [uploading, setUploading] = useState(false);
  const [filterDriver, setFilterDriver] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    api.entities.ScreeningRecord.list('-ordered_date', 500).then(rs => {
      setRecords(rs);
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => {
    setEditRecord(null);
    setForm({ ...EMPTY_FORM, driver_id: drivers[0]?.id || '' });
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditRecord(r);
    setForm({ ...r });
    setShowForm(true);
  };

  const handleSave = async () => {
    const driver = drivers.find(d => d.id === form.driver_id);
    const data = { ...form, driver_name: driver?.full_name || '' };
    if (editRecord) {
      const updated = await api.entities.ScreeningRecord.update(editRecord.id, data);
      setRecords(prev => prev.map(r => r.id === editRecord.id ? updated : r));
    } else {
      const created = await api.entities.ScreeningRecord.create(data);
      setRecords(prev => [created, ...prev]);
    }
    setShowForm(false);
    setEditRecord(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this screening record?')) return;
    await api.entities.ScreeningRecord.delete(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    set('report_url', file_url);
    setUploading(false);
  };

  const isExpiringSoon = (date) => {
    if (!date) return false;
    const days = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };
  const isExpired = (date) => date && new Date(date) < new Date();

  const filtered = records.filter(r => {
    if (filterDriver !== 'all' && r.driver_id !== filterDriver) return false;
    if (filterType !== 'all' && r.check_type !== filterType) return false;
    return true;
  });

  const clearCount = records.filter(r => r.status === 'clear').length;
  const flaggedCount = records.filter(r => r.status === 'flagged' || r.status === 'failed').length;
  const pendingCount = records.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-green-600 font-semibold"><CheckCircle2 className="w-4 h-4" /> {clearCount} Clear</span>
          <span className="flex items-center gap-1.5 text-yellow-600 font-semibold"><AlertTriangle className="w-4 h-4" /> {flaggedCount} Flagged</span>
          <span className="flex items-center gap-1.5 text-slate-500 font-semibold"><Clock className="w-4 h-4" /> {pendingCount} Pending</span>
        </div>
        <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Order Check
        </Button>
      </div>

      {/* API Integration Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-bold text-blue-800 text-sm">API Integration Available</div>
          <div className="text-xs text-blue-600 mt-0.5">Connect Checkr, Sterling, or HireRight to auto-order and receive results directly. Manual tracking is active now.</div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {Object.entries(PROVIDER_LINKS).map(([name, url]) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold transition-colors flex items-center gap-1">
              {name} <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterDriver} onChange={e => setFilterDriver(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="all">All Drivers</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="all">All Check Types</option>
          {CHECK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-slate-400 bg-white rounded-xl border border-slate-200">
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="font-semibold">No screening records yet</p>
          <p className="text-xs mt-1">Click "Order Check" to log a background or MVR check</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const style = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
            const StatusIcon = style.icon;
            const expWarn = isExpiringSoon(r.expiration_date);
            const expired = isExpired(r.expiration_date);
            const driver = drivers.find(d => d.id === r.driver_id);

            return (
              <div key={r.id} className={`bg-white rounded-xl border p-4 ${expired ? 'border-red-200' : expWarn ? 'border-yellow-200' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800">{driver?.full_name || r.driver_name || '—'}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{r.check_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${style.color}`}>
                        <StatusIcon className="w-3 h-3" /> {style.label}
                      </span>
                      {expired && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">⚠ Expired</span>}
                      {expWarn && !expired && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">Expires Soon</span>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>Provider: <strong className="text-slate-700">{r.provider}</strong></span>
                      {r.ordered_date && <span>Ordered: <strong className="text-slate-700">{r.ordered_date}</strong></span>}
                      {r.completed_date && <span>Completed: <strong className="text-slate-700">{r.completed_date}</strong></span>}
                      {r.expiration_date && <span>Expires: <strong className={expired ? 'text-red-600' : expWarn ? 'text-yellow-600' : 'text-slate-700'}>{r.expiration_date}</strong></span>}
                      {r.reference_id && <span>Ref: <strong className="text-slate-700 font-mono">{r.reference_id}</strong></span>}
                    </div>
                    {r.notes && <p className="text-xs text-slate-400 mt-1.5 italic">{r.notes}</p>}
                    {r.violations?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {r.violations.map((v, i) => <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{v}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {r.report_url && (
                      <a href={r.report_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="text-xs"><FileText className="w-3.5 h-3.5 mr-1" /> Report</Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit className="w-3.5 h-3.5 text-slate-400" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 rounded-t-2xl">
              <div className="text-white font-black">{editRecord ? 'Edit Screening Record' : 'Order Background / MVR Check'}</div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Driver *</label>
                <select value={form.driver_id} onChange={e => set('driver_id', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select driver —</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Check Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CHECK_TYPES.map(t => (
                    <button key={t} onClick={() => set('check_type', t)}
                      className={`py-2 px-3 rounded-lg border-2 text-xs font-bold transition-all text-left ${form.check_type === t ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-amber-200'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Provider</label>
                <select value={form.provider} onChange={e => set('provider', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STATUS_STYLES).map(([val, s]) => (
                    <button key={val} onClick={() => set('status', val)}
                      className={`py-1.5 px-2 rounded-lg border-2 text-xs font-bold transition-all ${form.status === val ? `border-amber-500 ${s.color}` : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Ordered</label>
                  <Input type="date" value={form.ordered_date} onChange={e => set('ordered_date', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Completed</label>
                  <Input type="date" value={form.completed_date} onChange={e => set('completed_date', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Expires</label>
                  <Input type="date" value={form.expiration_date} onChange={e => set('expiration_date', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Reference / Order ID</label>
                <Input placeholder="Provider order ID" value={form.reference_id} onChange={e => set('reference_id', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Upload Report</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="report-upload" onChange={handleUpload} />
                {form.report_url ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700 font-semibold flex-1 truncate">Report uploaded</span>
                    <button onClick={() => set('report_url', '')} className="text-slate-400 hover:text-red-500 text-xs">✕</button>
                  </div>
                ) : (
                  <label htmlFor="report-upload" className="flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-lg px-4 py-3 cursor-pointer hover:border-amber-400 transition-colors">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">{uploading ? 'Uploading…' : 'Upload PDF or image'}</span>
                  </label>
                )}
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                  placeholder="Violations, flags, or additional notes..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5 pt-3 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" onClick={handleSave} disabled={!form.driver_id}>
                {editRecord ? 'Save Changes' : 'Save Record'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
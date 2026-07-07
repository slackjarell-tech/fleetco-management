import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import { X, Upload, FileText, Trash2, ExternalLink, AlertTriangle, Plus, Calendar } from 'lucide-react';

const DOC_TYPES = [
  'Insurance', 'Registration', 'DOT Inspection Sticker', 'Annual Inspection Report',
  'Title', 'Lease Agreement', 'IFTA Permit', 'IRP Registration',
  'Oversize Permit', 'Hazmat Permit', 'Maintenance Record', 'Other',
];

const TYPE_COLORS = {
  'Insurance':                'bg-blue-50 text-blue-700 border-blue-200',
  'Registration':             'bg-emerald-50 text-emerald-700 border-emerald-200',
  'DOT Inspection Sticker':   'bg-amber-50 text-amber-700 border-amber-200',
  'Annual Inspection Report': 'bg-amber-50 text-amber-700 border-amber-200',
  'Title':                    'bg-purple-50 text-purple-700 border-purple-200',
  'Lease Agreement':          'bg-slate-50 text-slate-600 border-slate-200',
  'IFTA Permit':              'bg-cyan-50 text-cyan-700 border-cyan-200',
  'IRP Registration':         'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Oversize Permit':          'bg-orange-50 text-orange-700 border-orange-200',
  'Hazmat Permit':            'bg-red-50 text-red-700 border-red-200',
  'Maintenance Record':       'bg-slate-50 text-slate-600 border-slate-200',
  'Other':                    'bg-slate-50 text-slate-500 border-slate-200',
};

function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return diff <= 30 && diff >= 0;
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function VehicleDocuments({ vehicle, onClose }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ doc_type: 'Insurance', name: '', expiration_date: '', notes: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef();

  const loadDocs = async () => {
    const data = await api.entities.VehicleDocument.filter({ vehicle_id: vehicle.id }, '-created_date');
    setDocs(data);
    setLoading(false);
  };

  useEffect(() => { loadDocs(); }, [vehicle.id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (!form.name) setForm(f => ({ ...f, name: file.name.replace(/\.[^.]+$/, '') }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file: selectedFile });
    await api.entities.VehicleDocument.create({
      vehicle_id: vehicle.id,
      doc_type: form.doc_type,
      name: form.name || selectedFile.name,
      file_url,
      expiration_date: form.expiration_date || undefined,
      notes: form.notes || undefined,
    });
    setForm({ doc_type: 'Insurance', name: '', expiration_date: '', notes: '' });
    setSelectedFile(null);
    setShowForm(false);
    setUploading(false);
    loadDocs();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    await api.entities.VehicleDocument.delete(id);
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const expiredCount = docs.filter(d => isExpired(d.expiration_date)).length;
  const expiringSoonCount = docs.filter(d => isExpiringSoon(d.expiration_date)).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center py-6 px-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Unit #{vehicle.unit_number} — Documents
              </h2>
              <p className="text-xs text-slate-500">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.vin && <span className="ml-2 font-mono">{vehicle.vin}</span>}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alerts */}
          {(expiredCount > 0 || expiringSoonCount > 0) && (
            <div className="px-6 pt-4 space-y-2">
              {expiredCount > 0 && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {expiredCount} document{expiredCount > 1 ? 's' : ''} expired
                </div>
              )}
              {expiringSoonCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700 font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {expiringSoonCount} document{expiringSoonCount > 1 ? 's' : ''} expiring within 30 days
                </div>
              )}
            </div>
          )}

          {/* Upload form */}
          <div className="px-6 py-4">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 w-full border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-xl px-4 py-3 text-sm text-slate-500 hover:text-amber-600 font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Upload New Document
              </button>
            ) : (
              <form onSubmit={handleUpload} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="text-sm font-black text-slate-700">New Document</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Document Type *</label>
                    <select
                      value={form.doc_type}
                      onChange={e => setForm(f => ({ ...f, doc_type: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Display Name</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. 2025 Insurance Policy"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Expiration Date</label>
                    <input
                      type="date"
                      value={form.expiration_date}
                      onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">File *</label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                      className="w-full text-sm text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
                    <input
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Optional notes..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => { setShowForm(false); setSelectedFile(null); }}
                    className="flex-1 border border-slate-200 bg-white text-slate-600 font-bold py-2 rounded-lg text-sm hover:bg-slate-50">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-black py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Document list */}
          <div className="px-6 pb-6 space-y-2">
            {loading && (
              <div className="text-center py-8 text-slate-400 text-sm">Loading documents...</div>
            )}
            {!loading && docs.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No documents uploaded yet.</p>
              </div>
            )}
            {docs.map(doc => {
              const expired = isExpired(doc.expiration_date);
              const soon = !expired && isExpiringSoon(doc.expiration_date);
              return (
                <div key={doc.id}
                  className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 ${expired ? 'border-red-200 bg-red-50' : soon ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}`}>
                  <FileText className={`w-5 h-5 flex-shrink-0 ${expired ? 'text-red-400' : soon ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm truncate">{doc.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${TYPE_COLORS[doc.doc_type] || TYPE_COLORS['Other']}`}>
                        {doc.doc_type}
                      </span>
                    </div>
                    {doc.expiration_date && (
                      <div className={`flex items-center gap-1 text-xs mt-0.5 ${expired ? 'text-red-600 font-bold' : soon ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                        <Calendar className="w-3 h-3" />
                        {expired ? 'Expired' : 'Expires'} {new Date(doc.expiration_date).toLocaleDateString()}
                        {expired && ' ⚠️'}
                        {soon && ' (soon)'}
                      </div>
                    )}
                    {doc.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useRef, useState } from 'react';
import { Upload, Download, X, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CSV_HEADERS = ['recipient_name', 'recipient_phone', 'address', 'city', 'state', 'zip', 'package_description', 'notes'];

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('File must have a header row and at least one data row.');

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map((line, idx) => {
    // Handle quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });

    if (!row.recipient_name) throw new Error(`Row ${idx + 2}: recipient_name is required.`);
    if (!row.address) throw new Error(`Row ${idx + 2}: address is required.`);

    return { ...row, _key: Date.now() + idx + Math.random() };
  });
}

function downloadTemplate() {
  const header = CSV_HEADERS.join(',');
  const example = 'John Smith,555-123-4567,123 Main St,Dallas,TX,75201,2 boxes electronics,Gate code: 1234\nJane Doe,555-987-6543,456 Oak Ave,Plano,TX,75023,1 pallet,Leave at door';
  const blob = new Blob([header + '\n' + example], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'FleetCo_Stops_Template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkStopUpload({ onImport, onClose }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setError('Please upload a .csv file.'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target.result);
        setPreview(rows);
      } catch (err) {
        setError(err.message);
        setPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-black text-slate-900">Bulk Upload Stops</h2>
            <p className="text-xs text-slate-400 mt-0.5">Import multiple stops from a CSV file</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-4">
          {/* Template download */}
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="flex-1 text-sm text-blue-800">
              <span className="font-bold">Need a template?</span> Download the CSV template to fill in your stops.
            </div>
            <button onClick={downloadTemplate} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 flex-shrink-0">
              <Download className="w-3.5 h-3.5" /> Template
            </button>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-amber-400 bg-amber-50' : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Drop your CSV here, or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">Columns: recipient_name, address, city, state, zip, phone, package_description, notes</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => processFile(e.target.files[0])} />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-slate-700">{preview.length} stops ready to import</span>
              </div>
              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {preview.map((row, i) => (
                  <div key={row._key} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{row.recipient_name}</div>
                      <div className="text-xs text-slate-400 truncate">{[row.address, row.city, row.state, row.zip].filter(Boolean).join(', ')}</div>
                    </div>
                    {row.package_description && <span className="text-xs text-slate-400 truncate max-w-24">📦 {row.package_description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black"
            disabled={!preview || preview.length === 0}
            onClick={() => { onImport(preview); onClose(); }}
          >
            Import {preview ? preview.length : ''} Stops
          </Button>
        </div>
      </div>
    </div>
  );
}
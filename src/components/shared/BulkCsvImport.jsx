import React, { useRef, useState } from 'react';
import { Upload, Download, X, CheckCircle2, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseCSV, downloadCsvTemplate } from '@/lib/csvParse';
import { validateBulkRows } from '@/lib/bulkImportConfigs';
import { api } from '@/api/apiClient';

export default function BulkCsvImport({ config, onClose, onSuccess }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file.');
      return;
    }
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target.result);
        validateBulkRows(config, rows);
        setPreview(rows);
      } catch (err) {
        setError(err.message);
        setPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview?.length) return;
    setImporting(true);
    setError('');
    try {
      const records = validateBulkRows(config, preview);
      const response = await api.entities[config.entity].bulkCreate(records);
      setResult(response);
      onSuccess?.(response);
      setTimeout(() => onClose?.(), 1800);
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-black text-slate-900">Bulk Upload — {config.label}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Import multiple records from a CSV file</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} disabled={importing}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="flex-1 text-sm text-blue-800">
              <span className="font-bold">Need a template?</span> Download the CSV template with example rows.
            </div>
            <button
              type="button"
              onClick={() => downloadCsvTemplate({
                headers: config.headers,
                exampleRows: config.exampleRows,
                filename: `FleetCo_${config.entity}_Template.csv`,
              })}
              className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Template
            </button>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-amber-400 bg-amber-50' : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Drop your CSV here, or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">{config.columnHint}</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => processFile(e.target.files[0])} />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 whitespace-pre-line">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Imported {result.created} of {result.total} records
                {result.failed?.length ? ` (${result.failed.length} failed)` : ''}.
              </span>
            </div>
          )}

          {preview && !result && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-slate-700">{preview.length} records ready to import</span>
              </div>
              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {preview.map((row, i) => (
                  <div key={`${row._row}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="text-sm text-slate-800 truncate">{config.preview(row)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5 pt-2 border-t border-slate-100">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={importing}>Cancel</Button>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black"
            disabled={!preview || preview.length === 0 || importing || !!result}
            onClick={handleImport}
          >
            {importing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing…</>
            ) : (
              `Import ${preview ? preview.length : ''} Records`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

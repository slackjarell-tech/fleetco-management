import React, { useRef, useState } from 'react';
import { Upload, Download, X, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/api/apiClient';

const CSV_HEADERS = [
  'tracking_number', 'recipient_name', 'recipient_phone', 'address', 'city', 'state', 'zip', 'package_description', 'notes',
];

function parseCSV(text) {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new Error('File must have a header row and at least one data row.');

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map((line, idx) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else current += char;
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    if (!row.recipient_name) throw new Error(`Row ${idx + 2}: recipient_name is required.`);
    if (!row.address) throw new Error(`Row ${idx + 2}: address is required.`);
    if (!row.city) throw new Error(`Row ${idx + 2}: city is required.`);
    return row;
  });
}

function downloadTemplate() {
  const header = CSV_HEADERS.join(',');
  const example = 'PKG10001,Jane Smith,555-123-4567,1200 Commerce St,Dallas,TX,75201,Box — electronics,Gate 4\nPKG10002,John Doe,555-987-6543,4500 Industrial Blvd,Irving,TX,75061,2 parcels,';
  const blob = new Blob([`${header}\n${example}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fleetco-delivery-manifest-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkManifestImport({ driverId, routeDate, onImported, onClose }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [routeName, setRouteName] = useState(`Manifest ${routeDate || new Date().toISOString().split('T')[0]}`);

  const handleFile = async (e) => {
    setError('');
    setPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      let stops;
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        stops = Array.isArray(data) ? data : data.stops;
        if (!Array.isArray(stops)) throw new Error('JSON must be an array of stops or { stops: [...] }');
      } else {
        stops = parseCSV(text);
      }
      setPreview(stops);
    } catch (err) {
      setError(err.message || 'Could not parse file');
    }
  };

  const handleImport = async () => {
    if (!preview?.length) return;
    setImporting(true);
    setError('');
    try {
      const result = await api.functions.invoke('importDeliveryManifest', {
        routeName,
        routeDate: routeDate || new Date().toISOString().split('T')[0],
        driverId: driverId || undefined,
        stops: preview,
        geocode: true,
      });
      onImported?.(result);
      onClose?.();
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <div className="font-black text-slate-900">Import delivery manifest</div>
            <div className="text-xs text-slate-500">Warehouse CSV or JSON — geocodes stops for route maps</div>
          </div>
          <button type="button" onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Route name</label>
            <input value={routeName} onChange={(e) => setRouteName(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-1" /> CSV template
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> Upload CSV / JSON
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={handleFile} />
          </div>

          {error && (
            <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {preview && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> {preview.length} stop(s) ready
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                {preview.slice(0, 8).map((s, i) => (
                  <div key={i} className="px-3 py-2">
                    <div className="font-semibold text-slate-800">{s.recipient_name}</div>
                    <div className="text-slate-500">{s.address}, {s.city} {s.state} {s.zip}</div>
                  </div>
                ))}
                {preview.length > 8 && (
                  <div className="px-3 py-2 text-slate-400">+ {preview.length - 8} more…</div>
                )}
              </div>
            </div>
          )}

          <Button
            type="button"
            disabled={!preview?.length || importing}
            onClick={handleImport}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
          >
            {importing ? 'Importing & geocoding…' : 'Import manifest'}
          </Button>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Map data from OpenStreetMap contributors. Geocoding runs on import (about 1 address per second).
          </p>
        </div>
      </div>
    </div>
  );
}

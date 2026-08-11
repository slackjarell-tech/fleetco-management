import React, { useRef, useState } from 'react';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Upload, Loader2, Trash2, ExternalLink, Download } from 'lucide-react';
import { BOL_ACCEPT, BOL_MAX_MB, bolDisplayName, bolFileUrl, hasBol } from '@/lib/loadBol';

export default function LoadBolUpload({
  load,
  bolFileUrl: bolUrl,
  bolFileName,
  onBolChange,
  readOnly = false,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const currentUrl = bolUrl || load?.bol_file_url;
  const currentName = bolFileName || load?.bol_file_name;
  const attached = !!currentUrl;

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > BOL_MAX_MB * 1024 * 1024) {
      setError(`File must be under ${BOL_MAX_MB} MB`);
      return;
    }
    setError('');
    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      onBolChange({
        bol_file_url: file_url,
        bol_file_name: file.name,
        bol_uploaded_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    if (!confirm('Remove the bill of lading from this load?')) return;
    onBolChange({
      bol_file_url: null,
      bol_file_name: null,
      bol_uploaded_at: null,
      bol_uploaded_by: null,
    });
  };

  const viewLoad = load || { bol_file_url: currentUrl, bol_file_name: currentName };
  const href = bolFileUrl(viewLoad);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            Bill of Lading (BOL)
          </Label>
          <p className="text-xs text-slate-500 mt-1">
            Upload a PDF or image for drivers to download from the load board.
          </p>
        </div>
        {attached && !readOnly && (
          <Button type="button" size="sm" variant="ghost" className="text-red-500 hover:text-red-600 shrink-0" onClick={handleRemove}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {attached ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{bolDisplayName(viewLoad)}</div>
              <div className="text-xs text-green-600 font-medium">Attached — drivers can download</div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-50"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View
            </a>
            <a
              href={href}
              download={bolDisplayName(viewLoad)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        </div>
      ) : (
        !readOnly && (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg px-4 py-6 cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors">
            <input
              ref={inputRef}
              type="file"
              accept={BOL_ACCEPT}
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                <span className="text-sm text-slate-600">Uploading BOL…</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Upload Bill of Lading</span>
                <span className="text-xs text-slate-400">PDF, JPG, PNG, or Word — max {BOL_MAX_MB} MB</span>
              </>
            )}
          </label>
        )
      )}

      {attached && !readOnly && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={BOL_ACCEPT}
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Replace BOL
          </Button>
        </div>
      )}

      {!attached && readOnly && (
        <p className="text-xs text-slate-400 italic">No bill of lading attached yet.</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

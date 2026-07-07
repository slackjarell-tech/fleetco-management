import React, { useRef, useState } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';
import { api } from '@/api/apiClient';
import { takePhoto } from '@/lib/nativeBridge';

export default function CameraCapture({ onCapture, buttonLabel = 'Take Photo', className = '' }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleCapture = async () => {
    setUploading(true);
    try {
      const { file, previewUrl } = await takePhoto();
      setPreview(previewUrl);
      const res = await api.integrations.Core.UploadFile({ file });
      onCapture?.(res.file_url, file);
    } catch (err) {
      if (err?.message !== 'User cancelled photos app') {
        console.error('Camera capture failed', err);
      }
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setPreview(null);
  };

  return (
    <div className={className}>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            {uploading ? (
              <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Uploading...
              </div>
            ) : (
              <div className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-lg">Captured</div>
            )}
            <button type="button" onClick={clear} className="bg-black/60 hover:bg-black/80 text-white p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCapture}
          disabled={uploading}
          className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl py-4 px-4 text-slate-500 hover:text-amber-600 transition-colors disabled:opacity-60"
        >
          <Camera className="w-5 h-5" />
          <span className="text-sm font-medium">{uploading ? 'Opening camera…' : buttonLabel}</span>
        </button>
      )}
    </div>
  );
}
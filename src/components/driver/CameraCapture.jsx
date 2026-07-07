import React, { useRef, useState } from 'react';
import { Camera, X, Upload, RefreshCw } from 'lucide-react';
import { api } from '@/api/apiClient';

export default function CameraCapture({ onCapture, buttonLabel = 'Take Photo', className = '' }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Upload to server
    setUploading(true);
    try {
      const res = await api.integrations.Core.UploadFile({ file });
      const fileUrl = res.file_url;
      onCapture?.(fileUrl, file);
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

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
            <button onClick={clear} className="bg-black/60 hover:bg-black/80 text-white p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl py-4 px-4 text-slate-500 hover:text-amber-600 transition-colors"
        >
          <Camera className="w-5 h-5" />
          <span className="text-sm font-medium">{buttonLabel}</span>
        </button>
      )}
    </div>
  );
}
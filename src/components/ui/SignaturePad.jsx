import React, { useRef, useState, useEffect } from 'react';
import { Pen, Eraser, Check, X } from 'lucide-react';

export default function SignaturePad({ label, onSignatureChange, existingSignature = null, required = true, employeeNumber = null, signerName = null }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!existingSignature);
  const [signatureData, setSignatureData] = useState(existingSignature || null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if provided
    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = existingSignature;
    }
  }, [existingSignature]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL('image/png');
      setSignatureData(signatureData);
      setHasSignature(true);
      onSignatureChange?.(signatureData);
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
    setHasSignature(false);
    onSignatureChange?.(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-600">{label}</label>
        {hasSignature && (
          <button
            onClick={clearSignature}
            className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
          >
            <Eraser className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      <div className={`border-2 rounded-xl overflow-hidden ${hasSignature ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          className="w-full h-32 touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      {!hasSignature && required && (
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <Pen className="w-3 h-3" /> Sign above using mouse or finger
        </div>
      )}
      {hasSignature && (
        <div className="space-y-1.5">
          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <Check className="w-3 h-3" /> Signature captured
          </div>
          {(signerName || employeeNumber) && (
            <div className="flex items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-1.5">
              {signerName && <span className="font-semibold text-slate-700">{signerName}</span>}
              {employeeNumber && (
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px] font-bold text-slate-600">
                  EMP# {employeeNumber}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
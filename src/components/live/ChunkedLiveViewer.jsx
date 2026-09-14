import React, { useEffect, useRef, useState } from 'react';
import { api } from '@/api/apiClient';
import { getToken } from '@/api/apiClient';
import { liveChunkUrl, livePreviewUrl } from '@/lib/liveVideo';
import { mpsToMph } from '@/lib/dashcamForeground';
import { Radio, Gauge } from 'lucide-react';

/** Near-live road view — 1s JPEG previews + 1.5s WebM chunks (no API keys). */
export default function ChunkedLiveViewer({ session }) {
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const blobPartsRef = useRef([]);
  const chunkMimeRef = useRef('video/webm');
  const lastSeqRef = useRef(-1);
  const lastPreviewSeqRef = useRef(-1);
  const objectUrlRef = useRef(null);
  const previewUrlRef = useRef(null);
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(true);
  const [delaySec, setDelaySec] = useState(2);
  const [telemetry, setTelemetry] = useState(null);
  const [useVideoFallback, setUseVideoFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    blobPartsRef.current = [];
    lastSeqRef.current = -1;
    lastPreviewSeqRef.current = -1;

    const authHeaders = () => {
      const headers = {};
      const token = getToken?.();
      if (token) headers.Authorization = `Bearer ${token}`;
      return headers;
    };

    const fetchPreview = async (seq) => {
      const res = await fetch(livePreviewUrl(session.id, seq), { headers: authHeaders() });
      if (!res.ok) throw new Error('Preview load failed');
      return res.blob();
    };

    const fetchChunkBlob = async (seq) => {
      const res = await fetch(liveChunkUrl(session.id, seq), { headers: authHeaders() });
      if (!res.ok) throw new Error('Could not load video segment');
      const type = res.headers.get('content-type') || 'video/webm';
      if (type.includes('mp4')) chunkMimeRef.current = 'video/mp4';
      return res.blob();
    };

    const refresh = async () => {
      try {
        const preview = await api.functions.invoke('getLiveVideoPreview', {
          sessionId: session.id,
          afterSeq: lastSeqRef.current,
        });
        if (cancelled) return;

        if (preview.previewDelaySec) setDelaySec(preview.previewDelaySec);
        if (preview.driverLocation) setTelemetry(preview.driverLocation);

        if (!preview.live) {
          setWaiting(false);
          return;
        }

        if (preview.previewFrame && preview.previewFrame.seq > lastPreviewSeqRef.current) {
          const blob = await fetchPreview(preview.previewFrame.seq);
          if (cancelled) return;
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          lastPreviewSeqRef.current = preview.previewFrame.seq;
          if (imgRef.current) {
            imgRef.current.src = url;
          }
          setWaiting(false);
          setError('');
          setUseVideoFallback(false);
        }

        if (!preview.previewFrame && !preview.chunks?.length) {
          setWaiting(true);
          return;
        }

        if (preview.chunks?.length) {
          for (const chunk of preview.chunks) {
            const blob = await fetchChunkBlob(chunk.seq);
            if (cancelled) return;
            blobPartsRef.current.push(blob);
            lastSeqRef.current = chunk.seq;
          }

          if (useVideoFallback || !preview.previewFrame) {
            const combined = new Blob(blobPartsRef.current, { type: chunkMimeRef.current });
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            const url = URL.createObjectURL(combined);
            objectUrlRef.current = url;
            const video = videoRef.current;
            if (video) {
              video.src = url;
              try { await video.play(); } catch { /* autoplay */ }
              if (video.duration && Number.isFinite(video.duration)) {
                video.currentTime = Math.max(0, video.duration - 0.25);
              }
            }
            setWaiting(false);
            setError('');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setUseVideoFallback(true);
          if (!previewUrlRef.current) {
            setError(err?.data?.error || err?.message || 'Live preview unavailable');
            setWaiting(false);
          }
        }
      }
    };

    refresh();
    const timer = setInterval(refresh, 1200);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [session.id, useVideoFallback]);

  const mph = mpsToMph(telemetry?.speed_mps);
  const unitLabel = session.vehicle_unit_number
    ? `Unit ${session.vehicle_unit_number}${session.trailer_unit_number ? ` · Trl ${session.trailer_unit_number}` : ''}`
    : null;

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div>
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <span className="flex items-center gap-1 text-red-400 text-xs font-black uppercase">
              <Radio className="w-3 h-3 animate-pulse" /> Live — Road
            </span>
            {session.driver_name}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-2 items-center">
            <span>FleetCo · ~{delaySec}s delay · no API keys</span>
            {unitLabel && <span className="font-mono text-amber-400/90">{unitLabel}</span>}
            {mph != null && (
              <span className="flex items-center gap-0.5 text-slate-300">
                <Gauge className="w-3 h-3" /> {mph} mph
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-400 text-right">
          <div>Since {session.started_at ? new Date(session.started_at).toLocaleTimeString() : '—'}</div>
        </div>
      </div>

      {error ? (
        <div className="p-6 text-center text-red-400 text-sm">{error}</div>
      ) : (
        <div className="relative min-h-[12rem] sm:min-h-[16rem] bg-black">
          <img
            ref={imgRef}
            alt="Live road view"
            className={`w-full h-full min-h-[12rem] sm:min-h-[16rem] object-cover ${useVideoFallback ? 'hidden' : 'block'}`}
          />
          <video
            ref={videoRef}
            className={`w-full h-full min-h-[12rem] sm:min-h-[16rem] object-cover ${useVideoFallback ? 'block' : 'hidden'}`}
            playsInline
            muted
            autoPlay
          />
          {waiting && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs bg-black/70">
              Waiting for road feed from driver…
            </div>
          )}
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-600/90 text-[10px] font-black text-white rounded uppercase tracking-wider">
            REC
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-[10px] font-bold text-white z-10">
            ROAD · SEMI DASHCAM
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { api } from '@/api/apiClient';
import { getToken } from '@/api/apiClient';
import { liveChunkUrl } from '@/lib/liveVideo';
import { Radio } from 'lucide-react';

/** Near-live road view via FleetCo chunked uploads (~3–5 sec delay, no LiveKit). */
export default function ChunkedLiveViewer({ session }) {
  const videoRef = useRef(null);
  const blobPartsRef = useRef([]);
  const lastSeqRef = useRef(-1);
  const objectUrlRef = useRef(null);
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(true);
  const [delaySec, setDelaySec] = useState(3);

  useEffect(() => {
    let cancelled = false;
    blobPartsRef.current = [];
    lastSeqRef.current = -1;

    const fetchChunkBlob = async (seq) => {
      const headers = {};
      const token = getToken?.();
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(liveChunkUrl(session.id, seq), { headers });
      if (!res.ok) throw new Error('Could not load video segment');
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

        if (!preview.live) {
          setWaiting(false);
          return;
        }

        if (!preview.chunks?.length) {
          setWaiting(true);
          return;
        }

        for (const chunk of preview.chunks) {
          const blob = await fetchChunkBlob(chunk.seq);
          if (cancelled) return;
          blobPartsRef.current.push(blob);
          lastSeqRef.current = chunk.seq;
        }

        const combined = new Blob(blobPartsRef.current, { type: 'video/webm' });
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const url = URL.createObjectURL(combined);
        objectUrlRef.current = url;

        const video = videoRef.current;
        if (video) {
          const wasPlaying = !video.paused && video.currentTime > 0;
          video.src = url;
          if (wasPlaying || video.currentTime === 0) {
            try {
              await video.play();
            } catch {
              /* autoplay policy */
            }
          }
          if (video.duration && Number.isFinite(video.duration)) {
            video.currentTime = Math.max(0, video.duration - 0.25);
          }
        }

        setWaiting(false);
        setError('');
      } catch (err) {
        if (!cancelled) {
          setError(err?.data?.error || err?.message || 'Live preview unavailable');
          setWaiting(false);
        }
      }
    };

    refresh();
    const timer = setInterval(refresh, 2500);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [session.id]);

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
          <div className="text-xs text-slate-400 mt-0.5">
            FleetCo live view · ~{delaySec}s delay · no LiveKit
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Since {session.started_at ? new Date(session.started_at).toLocaleTimeString() : '—'}
        </div>
      </div>

      {error ? (
        <div className="p-6 text-center text-red-400 text-sm">{error}</div>
      ) : (
        <div className="relative min-h-[12rem] sm:min-h-[16rem] bg-black">
          <video
            ref={videoRef}
            className="w-full h-full min-h-[12rem] sm:min-h-[16rem] object-cover"
            playsInline
            muted
            autoPlay
          />
          {waiting && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs bg-black/70">
              Waiting for first video segment from driver…
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-[10px] font-bold text-white z-10">
            ROAD · CHUNKED LIVE
          </div>
        </div>
      )}
    </div>
  );
}

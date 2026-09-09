import React, { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { api } from '@/api/apiClient';
import { Radio } from 'lucide-react';

function attachTrack(track, publication, roadRef, cabinRef) {
  if (track.kind !== Track.Kind.Video) return;
  const el = track.attach();
  el.className = 'w-full h-full object-cover';
  const name = (publication?.trackName || '').toLowerCase();
  const container = name.includes('cabin') || name.includes('driver') ? cabinRef.current : roadRef.current;
  if (container) {
    container.innerHTML = '';
    container.appendChild(el);
  }
}

export default function LiveStreamViewer({ session }) {
  const roadRef = useRef(null);
  const cabinRef = useRef(null);
  const roomRef = useRef(null);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await api.functions.invoke('getLiveVideoViewerToken', { sessionId: session.id });
        if (cancelled) return;

        const room = new Room({ adaptiveStream: true });
        roomRef.current = room;

        const onTrack = (track, publication) => {
          attachTrack(track, publication, roadRef, cabinRef);
        };

        room.on(RoomEvent.TrackSubscribed, onTrack);
        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach().forEach((el) => el.remove());
        });

        await room.connect(result.livekitUrl, result.token);

        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.track) onTrack(publication.track, publication);
          });
        });

        if (!cancelled) setConnecting(false);
      } catch (err) {
        if (!cancelled) {
          setError(err?.data?.error || err?.message || 'Could not connect to live stream');
          setConnecting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [session.id]);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div>
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <span className="flex items-center gap-1 text-red-400 text-xs font-black uppercase">
              <Radio className="w-3 h-3 animate-pulse" /> Live Video
            </span>
            {session.driver_name}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">WebRTC stream · road + driver cameras</div>
        </div>
        <div className="text-xs text-slate-400">
          Since {session.started_at ? new Date(session.started_at).toLocaleTimeString() : '—'}
        </div>
      </div>

      {error ? (
        <div className="p-6 text-center text-red-400 text-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-2 gap-0.5 bg-black">
          <div className="relative min-h-[10rem] sm:min-h-[12rem] bg-slate-800">
            <div ref={roadRef} className="absolute inset-0" />
            {connecting && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">Connecting road…</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-[10px] font-bold text-white z-10">ROAD</div>
          </div>
          <div className="relative min-h-[10rem] sm:min-h-[12rem] bg-slate-800">
            <div ref={cabinRef} className="absolute inset-0" />
            {connecting && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">Connecting driver…</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-[10px] font-bold text-white z-10">DRIVER</div>
          </div>
        </div>
      )}
    </div>
  );
}

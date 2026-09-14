import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { loadLiveRecordingVideoUrl } from '@/lib/liveVideo';
import { Video, Play, Clock, MessageSquare, Loader2, X } from 'lucide-react';

function SharedVideoModal({ recording, onClose }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    (async () => {
      try {
        objectUrl = await loadLiveRecordingVideoUrl(recording.id, 'road');
        if (!cancelled) setVideoUrl(objectUrl);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load video');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [recording.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <div>
          <div className="font-bold text-sm">Fleet video review</div>
          <div className="text-xs text-slate-400">{new Date(recording.started_at).toLocaleString()}</div>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg bg-white/10" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {loading && <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />}
        {error && <p className="text-red-300 text-sm text-center">{error}</p>}
        {videoUrl && !error && (
          <video src={videoUrl} controls playsInline className="max-w-full max-h-full rounded-lg" />
        )}
      </div>

      {recording.share_message && (
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1 mb-1">
            <MessageSquare className="w-3.5 h-3.5" /> Message from fleet office
          </div>
          <p className="text-sm text-slate-200">{recording.share_message}</p>
        </div>
      )}

    </div>
  );
}

export default function DriverSharedVideos() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.functions.invoke('listDriverSharedRecordings');
      setRecordings(result.recordings || []);
    } catch {
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 pb-24 space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Video className="w-6 h-6 text-amber-500" />
          Video Reviews
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Videos your fleet manager shared for coaching or review.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : recordings.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
          <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-600">No shared videos yet</p>
          <p className="text-sm mt-1">When your fleet manager shares a dashcam clip, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recordings.map((rec) => (
            <button
              key={rec.id}
              type="button"
              onClick={() => setActive(rec)}
              className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-amber-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                  <Play className="w-6 h-6 text-amber-400 ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm">Road cam recording</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(rec.started_at).toLocaleString()}
                    {rec.duration_sec != null && ` · ${Math.round(rec.duration_sec / 60)} min`}
                  </div>
                  {rec.share_message && (
                    <p className="text-xs text-blue-700 mt-2 line-clamp-2">{rec.share_message}</p>
                  )}
                  {rec.shared_by_name && (
                    <p className="text-[10px] text-slate-400 mt-1">Shared by {rec.shared_by_name}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {active && (
        <SharedVideoModal recording={active} onClose={() => setActive(null)} />
      )}
    </div>
  );
}

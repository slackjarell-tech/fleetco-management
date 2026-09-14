import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/apiClient';
import { loadLiveRecordingVideoUrl, downloadLiveRecording } from '@/lib/liveVideo';
import {
  X, Play, Download, Share2, Save, Loader2, MapPin, Clock, User, MessageSquare,
} from 'lucide-react';

export default function RecordingReviewModal({
  recording,
  canDownload,
  canShare,
  onClose,
  onUpdated,
}) {
  const [notes, setNotes] = useState(recording?.manager_notes || '');
  const [shareMessage, setShareMessage] = useState(recording?.share_message || '');
  const [videoUrl, setVideoUrl] = useState('');
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [videoError, setVideoError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [unsharing, setUnsharing] = useState(false);
  const [localRec, setLocalRec] = useState(recording);

  useEffect(() => {
    setLocalRec(recording);
    setNotes(recording?.manager_notes || '');
    setShareMessage(recording?.share_message || '');
  }, [recording]);

  useEffect(() => {
    if (!recording?.id) return undefined;
    let cancelled = false;
    let objectUrl = '';

    (async () => {
      setLoadingVideo(true);
      setVideoError('');
      try {
        objectUrl = await loadLiveRecordingVideoUrl(recording.id, 'road');
        if (!cancelled) setVideoUrl(objectUrl);
      } catch (err) {
        if (!cancelled) setVideoError(err?.message || 'Could not load video');
      } finally {
        if (!cancelled) setLoadingVideo(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [recording?.id]);

  const handleSaveNotes = useCallback(async () => {
    setSaving(true);
    try {
      const result = await api.functions.invoke('updateLiveVideoRecordingReview', {
        recordingId: recording.id,
        managerNotes: notes,
        reviewStatus: notes.trim() ? 'reviewed' : 'pending',
      });
      setLocalRec(result.recording);
      onUpdated?.(result.recording);
    } catch (err) {
      alert(err?.data?.error || err?.message || 'Could not save notes');
    } finally {
      setSaving(false);
    }
  }, [recording.id, notes, onUpdated]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const result = await api.functions.invoke('shareLiveVideoRecordingWithDriver', {
        recordingId: recording.id,
        shareMessage: shareMessage,
      });
      setLocalRec(result.recording);
      onUpdated?.(result.recording);
      alert(result.message || 'Shared with driver');
    } catch (err) {
      alert(err?.data?.error || err?.message || 'Could not share');
    } finally {
      setSharing(false);
    }
  }, [recording.id, shareMessage, onUpdated]);

  const handleUnshare = useCallback(async () => {
    setUnsharing(true);
    try {
      const result = await api.functions.invoke('unshareLiveVideoRecordingWithDriver', {
        recordingId: recording.id,
      });
      setLocalRec(result.recording);
      setShareMessage('');
      onUpdated?.(result.recording);
    } catch (err) {
      alert(err?.data?.error || err?.message || 'Could not unshare');
    } finally {
      setUnsharing(false);
    }
  }, [recording.id, onUpdated]);

  if (!recording) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
      <div className="bg-white w-full max-w-3xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-amber-500" /> Video Review
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{localRec.driver_name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
            {loadingVideo && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center text-red-300 text-sm p-4 text-center">
                {videoError}
              </div>
            )}
            {videoUrl && !videoError && (
              <video
                src={videoUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
                aria-label="Dashcam recording"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {localRec.driver_name}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(localRec.started_at).toLocaleString()}</span>
            {localRec.duration_sec != null && (
              <span>{Math.round(localRec.duration_sec / 60)} min</span>
            )}
            {localRec.lat != null && localRec.lng != null && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> GPS tagged</span>
            )}
            {localRec.review_status === 'reviewed' && (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Reviewed</span>
            )}
            {localRec.shared_with_driver && (
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Shared with driver</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">Fleet manager notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Coaching notes, incident details, what to discuss with the driver…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveNotes}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save review notes'}
            </button>
          </div>

          {canShare && (
            <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
                <Share2 className="w-4 h-4" /> Share with driver
              </div>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                rows={2}
                placeholder="Optional message for the driver (e.g. please review hard braking at 2:15)"
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={sharing}
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 disabled:opacity-60"
                >
                  <Share2 className="w-4 h-4" />
                  {sharing ? 'Sharing…' : localRec.shared_with_driver ? 'Update share' : 'Share with driver'}
                </button>
                {localRec.shared_with_driver && (
                  <button
                    type="button"
                    disabled={unsharing}
                    onClick={handleUnshare}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-white disabled:opacity-60"
                  >
                    {unsharing ? 'Removing…' : 'Stop sharing'}
                  </button>
                )}
              </div>
              <p className="text-xs text-blue-800/80 flex items-start gap-1">
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Driver sees this in FleetCo Driver → More → Video Reviews.
              </p>
            </div>
          )}

          {canDownload && (
            <button
              type="button"
              onClick={() => downloadLiveRecording(recording.id, 'road')}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
            >
              <Download className="w-4 h-4" /> Download road video file
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

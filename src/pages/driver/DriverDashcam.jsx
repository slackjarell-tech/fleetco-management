import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useDriverDevice } from '@/components/mobile/DriverDeviceProvider';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useLiveVideoPublisher } from '@/hooks/useLiveVideoPublisher';
import { useLocalVideoRecorder } from '@/hooks/useLocalVideoRecorder';
import { uploadLiveRecording } from '@/lib/liveVideo';
import {
  Video, ChevronDown, ChevronUp, Battery, MapPin, AlertTriangle,
  Square, Play, Wind, Sun, Radio,
} from 'lucide-react';

const SETUP_TIPS = [
  'Mount the phone on the dash — rear camera sees the road, front camera toward the driver.',
  'Keep the phone plugged into a fast car charger the entire trip.',
  'Keep FleetCo Driver open while recording — video saves when you tap Stop.',
  'Video auto-saves for 15 days when you stop. Fleet managers can download or keep permanently.',
  'Some iPhones only support one camera at a time — road view is always captured.',
  'Texas & some states restrict windshield mounts — use a dash mount if needed.',
];

export default function DriverDashcam() {
  const { user } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    position,
    dualCameraEnabled,
    dualCameraActive,
    dualCameraSupported,
    refreshPosition,
  } = useDriverDevice();
  const roadPreviewRef = useRef(null);
  const cabinPreviewRef = useRef(null);
  const [session, setSession] = useState(null);
  const [streamMode, setStreamMode] = useState('local');
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [guideOpen, setGuideOpen] = useState(true);
  const liveStartRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [officeRequest, setOfficeRequest] = useState(null);
  const [startingLive, setStartingLive] = useState(false);
  const livePublisher = useLiveVideoPublisher();
  const localRecorder = useLocalVideoRecorder();

  const livekitReady = !!user?.livekit_configured;
  const canRecord = dualCameraEnabled;

  const { supported: wakeLockSupported } = useWakeLock(recording);

  useEffect(() => {
    if (!canRecord || recording) {
      setOfficeRequest(null);
      return undefined;
    }
    const check = async () => {
      try {
        const result = await api.functions.invoke('getPendingLiveVideoRequest');
        setOfficeRequest(result.pending ? result : null);
      } catch {
        setOfficeRequest(null);
      }
    };
    check();
    const t = setInterval(check, 3000);
    return () => clearInterval(t);
  }, [canRecord, recording]);

  const autoStartHandled = useRef(false);
  useEffect(() => {
    if (!canRecord || recording || startingLive || autoStartHandled.current) return;

    const acceptId = searchParams.get('accept');
    const autostart = searchParams.get('autostart') === '1';

    if (acceptId || autostart) {
      autoStartHandled.current = true;
      setSearchParams({}, { replace: true });
      startRecording(acceptId || null);
    }
  }, [canRecord, recording, startingLive, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = async (sessionId = null) => {
    if (!canRecord) {
      setError('Dashcam recording is turned off for your fleet — ask your fleet manager to enable it in Driver Media.');
      return;
    }
    setError('');
    setMessage('');
    setStartingLive(true);
    try {
      const result = await api.functions.invoke('startLiveVideoStream', sessionId ? { sessionId } : {});
      const mode = result.streamMode || result.session?.stream_mode || (result.livekitUrl ? 'livekit' : 'local');
      setSession(result.session);
      setStreamMode(mode);
      setRecording(true);
      setMessage(result.message);
      setOfficeRequest(null);
      liveStartRef.current = Date.now();

      if (mode === 'livekit') {
        await livePublisher.start({
          livekitUrl: result.livekitUrl,
          token: result.token,
          roadVideoEl: roadPreviewRef.current,
          cabinVideoEl: cabinPreviewRef.current,
          dualCamera: dualCameraEnabled,
        });
      } else {
        await localRecorder.start({
          roadVideoEl: roadPreviewRef.current,
          cabinVideoEl: cabinPreviewRef.current,
          dualCamera: dualCameraEnabled,
        });
      }
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Could not start recording');
    } finally {
      setStartingLive(false);
    }
  };

  const stopRecording = async () => {
    if (!session) return;
    setUploading(true);
    try {
      const durationSec = liveStartRef.current
        ? Math.round((Date.now() - liveStartRef.current) / 1000)
        : null;
      const { roadBlob, cabinBlob } = streamMode === 'livekit'
        ? await livePublisher.stop()
        : await localRecorder.stop();
      await api.functions.invoke('stopLiveVideoStream', { sessionId: session.id });

      let lat = null;
      let lng = null;
      let speed = 0;
      try {
        const pos = position || await refreshPosition();
        lat = pos.lat;
        lng = pos.lng;
        speed = pos.speed;
      } catch { /* optional */ }

      if (roadBlob?.size) {
        const upload = await uploadLiveRecording(roadBlob, { sessionId: session.id, track: 'road' });
        let cabinVideoUrl = '';
        if (cabinBlob?.size) {
          const cabinUpload = await uploadLiveRecording(cabinBlob, { sessionId: session.id, track: 'cabin' });
          cabinVideoUrl = cabinUpload.file_url;
        }
        await api.functions.invoke('registerLiveVideoRecording', {
          sessionId: session.id,
          videoUrl: upload.file_url,
          cabinVideoUrl,
          durationSec,
          fileSizeBytes: upload.file_size,
          lat,
          lng,
          speed,
        });
      }

      setMessage('Recording stopped. Video saved for 15 days — fleet managers can download or keep it permanently.');
      setRecording(false);
      setSession(null);
      liveStartRef.current = null;
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Could not stop recording');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-8">
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Video className="w-6 h-6 text-amber-500" /> Dashcam Recording
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tap Start Recording anytime — or accept a request from your fleet office. Video saves automatically when you stop.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button type="button" onClick={() => setGuideOpen(!guideOpen)} className="w-full flex items-center justify-between px-4 py-3 text-left">
          <span className="font-bold text-slate-900 text-sm">Dashcam Setup</span>
          {guideOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {guideOpen && (
          <ul className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
            {SETUP_TIPS.map((tip, i) => (
              <li key={i} className="text-xs text-slate-600 flex gap-2">
                <span className="text-amber-500 font-bold">{i + 1}.</span> {tip}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!dualCameraEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          Dashcam recording is turned off for your fleet. Ask your fleet manager to enable it in Driver Media.
        </div>
      )}

      {canRecord && !livekitReady && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
          Recording works on your phone now — no extra setup. Live office viewing can be added later with LiveKit.
        </div>
      )}

      {canRecord && !recording && (
        <div className="space-y-3">
          <button
            type="button"
            disabled={startingLive}
            onClick={() => startRecording()}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl shadow-lg disabled:opacity-60"
          >
            <Video className="w-6 h-6" />
            {startingLive ? 'Starting…' : 'Start Recording'}
          </button>
          <p className="text-xs text-center text-slate-500">
            You or your fleet office can start recording — saved video appears in Driver Media when you stop.
          </p>
          {officeRequest && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2 text-amber-900 text-sm">
                <Radio className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <div className="font-bold">Fleet office requested recording</div>
                  <p className="text-xs mt-1 text-amber-800">{officeRequest.message}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={startingLive}
                onClick={() => startRecording(officeRequest.pending?.id)}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl disabled:opacity-60"
              >
                <Play className="w-5 h-5" /> {startingLive ? 'Starting…' : 'Accept & Start Recording'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full">
          <Battery className="w-3 h-3" /> Keep plugged in
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full">
          <Wind className="w-3 h-3" /> {livekitReady ? 'Live + saved video' : 'On-device recording'}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
          <AlertTriangle className="w-3 h-3" /> Check local mount laws
        </span>
        {wakeLockSupported && recording && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-full">
            <Sun className="w-3 h-3" /> Screen stays on
          </span>
        )}
      </div>

      {!dualCameraSupported && canRecord && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
          This device may only support one camera (common on iPhone). Road view is always captured; driver view when supported.
        </div>
      )}

      {recording && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-black">
              <video ref={roadPreviewRef} className="w-full h-36 object-cover" playsInline muted aria-label="Road camera" />
              <div className="px-2 py-1.5 bg-slate-900 text-[10px] text-slate-300 font-bold">ROAD</div>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-black">
              <video ref={cabinPreviewRef} className="w-full h-36 object-cover" playsInline muted aria-label="Driver camera" />
              <div className="px-2 py-1.5 bg-slate-900 text-[10px] text-slate-300 font-bold">
                DRIVER {dualCameraActive ? '' : '(limited)'}
              </div>
            </div>
            <div className="col-span-2 px-3 py-2 bg-slate-900 text-xs text-slate-300 flex items-center justify-between rounded-lg">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {streamMode === 'livekit' ? 'Live stream + recording' : 'Recording on device'}
              </span>
              {position && (
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3 h-3" /> GPS ±{Math.round(position.accuracy || 0)}m
                </span>
              )}
            </div>
          </div>

          <div className="bg-red-600 text-white rounded-xl p-4 flex items-center gap-3">
            <span className={`w-3 h-3 bg-white rounded-full ${uploading ? '' : 'animate-pulse'}`} />
            <div className="flex-1">
              <div className="font-black text-sm">{uploading ? 'SAVING VIDEO' : 'RECORDING'}</div>
              <div className="text-xs text-red-100">
                {streamMode === 'livekit'
                  ? 'Fleet office is watching · auto-saved when you stop'
                  : 'Video saves to fleet library when you stop'}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl disabled:opacity-60"
          >
            <Square className="w-4 h-4" /> {uploading ? 'Uploading video…' : 'Stop & Save Recording'}
          </button>
        </div>
      )}

      {message && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">{message}</div>}
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>}

      <p className="text-xs text-slate-400 flex items-center gap-1">
        <MapPin className="w-3 h-3" /> GPS tagged on saved recordings · view in Driver Media portal
      </p>
    </div>
  );
}

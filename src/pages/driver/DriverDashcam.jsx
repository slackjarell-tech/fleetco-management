import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useDriverDevice } from '@/components/mobile/DriverDeviceProvider';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useLiveVideoPublisher } from '@/hooks/useLiveVideoPublisher';
import { useChunkedLiveRecorder } from '@/hooks/useChunkedLiveRecorder';
import { useActiveShift } from '@/hooks/useActiveShift';
import { useDashcamAutoStart } from '@/hooks/useDashcamAutoStart';
import { uploadLiveRecording } from '@/lib/liveVideo';
import { startDashcamForegroundService, stopDashcamForegroundService, mpsToMph } from '@/lib/dashcamForeground';
import { getDriverDuty, subscribeDriverDuty } from '@/lib/driverDuty';
import DriverDutyBar from '@/components/driver/DriverDutyBar';
import {
  Video, ChevronDown, ChevronUp, Battery, MapPin, AlertTriangle,
  Square, Play, Wind, Sun, Radio, Truck, Gauge, RotateCw,
} from 'lucide-react';

const SETUP_TIPS = [
  'Mount phone on dash — rear camera facing the road (wide view of lanes ahead).',
  'Per FMCSA 49 CFR §393.60: mount outside your sight lines to road signs — typically low on dash or upper windshield band.',
  'Use landscape orientation when possible — matches industry ELD road-camera layout.',
  'Keep plugged into a fast charger — live stream + GPS uploads continuously.',
  'Set duty to Driving when rolling — road cam can auto-start while clocked in.',
  'Texas & some states restrict windshield mounts — use dash mount if needed.',
];

export default function DriverDashcam() {
  const { user } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    position,
    dualCameraEnabled,
    refreshPosition,
    getRoadStream,
    bindRoadPreview,
    cameraActive,
    activateDevices,
  } = useDriverDevice();
  const { shift, clockedIn } = useActiveShift(user?.id);
  const roadPreviewRef = useRef(null);
  const positionRef = useRef(position);
  const [session, setSession] = useState(null);
  const [streamMode, setStreamMode] = useState('chunked');
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const liveStartRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [officeRequest, setOfficeRequest] = useState(null);
  const [startingLive, setStartingLive] = useState(false);
  const [duty, setDuty] = useState(getDriverDuty);
  const [autoStartPaused, setAutoStartPaused] = useState(false);
  const livePublisher = useLiveVideoPublisher();
  const chunkedRecorder = useChunkedLiveRecorder();
  const [cameraBootKey, setCameraBootKey] = useState(0);

  const livekitReady = !!user?.livekit_configured;
  const canRecord = dualCameraEnabled;
  const autoDashcam = user?.auto_dashcam_on_driving !== false;

  const { supported: wakeLockSupported } = useWakeLock(recording);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => subscribeDriverDuty(setDuty), []);
  useEffect(() => {
    if (duty !== 'driving') setAutoStartPaused(false);
  }, [duty]);

  useEffect(() => {
    if (!recording) return undefined;
    const t = setInterval(() => { refreshPosition().catch(() => {}); }, 12000);
    return () => clearInterval(t);
  }, [recording, refreshPosition]);

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

  const getTelemetry = useCallback(() => {
    const p = positionRef.current;
    return {
      lat: p?.lat ?? null,
      lng: p?.lng ?? null,
      speed: p?.speed ?? 0,
      vehicleUnitNumber: shift?.vehicle_unit_number || '',
    };
  }, [shift?.vehicle_unit_number]);

  const startRecording = useCallback(async (sessionId = null) => {
    if (!canRecord) {
      setError('Dashcam recording is turned off for your fleet — ask your fleet manager to enable it in Driver Media.');
      return;
    }
    setError('');
    setMessage('');
    setStartingLive(true);
    try {
      const result = await api.functions.invoke('startLiveVideoStream', sessionId ? {
        sessionId,
        vehicleId: shift?.vehicle_id || '',
        vehicleUnitNumber: shift?.vehicle_unit_number || '',
        trailerUnitNumber: shift?.trailer_unit_number || '',
      } : {
        vehicleId: shift?.vehicle_id || '',
        vehicleUnitNumber: shift?.vehicle_unit_number || '',
        trailerUnitNumber: shift?.trailer_unit_number || '',
      });
      const mode = result.streamMode || result.session?.stream_mode || (result.livekitUrl ? 'livekit' : 'chunked');
      setStreamMode(mode);
      setMessage(result.message);
      setOfficeRequest(null);
      liveStartRef.current = Date.now();
      setSession({
        ...result.session,
        _boot: {
          mode,
          result,
          unitLabel: shift?.vehicle_unit_number
            ? `Unit ${shift.vehicle_unit_number}`
            : 'Road cam active',
        },
      });
      setCameraBootKey((k) => k + 1);
      setRecording(true);
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Could not start recording');
      setStartingLive(false);
    }
  }, [canRecord, shift]);

  useLayoutEffect(() => {
    const boot = session?._boot;
    if (!recording || !session?.id || !boot || !roadPreviewRef.current) return undefined;

    let cancelled = false;

    (async () => {
      try {
        if (!cameraActive) {
          const ok = await activateDevices();
          if (!ok) throw new Error('Camera access required — allow camera in Settings and try again');
        }
        if (cancelled) return;

        let existingStream = getRoadStream();
        if (existingStream) {
          bindRoadPreview(roadPreviewRef.current);
        }

        await startDashcamForegroundService(`${boot.unitLabel} — live to fleet`);
        if (cancelled) return;

        if (boot.mode === 'livekit') {
          await livePublisher.start({
            livekitUrl: boot.result.livekitUrl,
            token: boot.result.token,
            roadVideoEl: roadPreviewRef.current,
          });
        } else {
          await chunkedRecorder.start({
            roadVideoEl: roadPreviewRef.current,
            sessionId: session.id,
            getTelemetry,
            existingStream: existingStream || undefined,
          });
        }

        if (!cancelled && session._boot) {
          setSession((prev) => (prev?.id === session.id ? { ...prev, _boot: undefined } : prev));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err?.data?.error || err?.message || 'Could not start camera');
        try {
          await api.functions.invoke('stopLiveVideoStream', { sessionId: session.id });
        } catch { /* ignore */ }
        await stopDashcamForegroundService().catch(() => {});
        setRecording(false);
        setSession(null);
        liveStartRef.current = null;
      } finally {
        if (!cancelled) setStartingLive(false);
      }
    })();

    return () => { cancelled = true; };
  }, [
    recording,
    session,
    cameraBootKey,
    cameraActive,
    activateDevices,
    getRoadStream,
    bindRoadPreview,
    getTelemetry,
    livePublisher,
    chunkedRecorder,
  ]);

  const endStuckStream = useCallback(async () => {
    setError('');
    setMessage('');
    try {
      await api.functions.invoke('stopLiveVideoStream', {});
      setMessage('Previous live stream cleared. Tap Start Road Cam again.');
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Could not end stuck stream');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!session) {
      setUploading(true);
      try {
        await stopDashcamForegroundService();
        await api.functions.invoke('stopLiveVideoStream', {});
        setRecording(false);
        setMessage('Live stream ended.');
      } catch (err) {
        setError(err?.data?.error || err?.message || 'Could not stop recording');
      } finally {
        setUploading(false);
      }
      return;
    }
    setUploading(true);
    try {
      const durationSec = liveStartRef.current
        ? Math.round((Date.now() - liveStartRef.current) / 1000)
        : null;
      const { roadBlob } = streamMode === 'livekit'
        ? await livePublisher.stop()
        : await chunkedRecorder.stop();
      await stopDashcamForegroundService();
      await api.functions.invoke('stopLiveVideoStream', { sessionId: session.id });

      let lat = null;
      let lng = null;
      let speed = 0;
      try {
        const pos = positionRef.current || await refreshPosition();
        lat = pos.lat;
        lng = pos.lng;
        speed = pos.speed;
      } catch { /* optional */ }

      if (roadBlob?.size) {
        const upload = await uploadLiveRecording(roadBlob, { sessionId: session.id, track: 'road' });
        await api.functions.invoke('registerLiveVideoRecording', {
          sessionId: session.id,
          videoUrl: upload.file_url,
          cabinVideoUrl: '',
          durationSec,
          fileSizeBytes: upload.file_size,
          lat,
          lng,
          speed,
        });
      }

      setMessage('Recording stopped. Road video saved for 15 days — fleet managers can download or keep permanently.');
      setAutoStartPaused(true);
      setRecording(false);
      setSession(null);
      liveStartRef.current = null;
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Could not stop recording');
    } finally {
      setUploading(false);
    }
  }, [session, streamMode, livePublisher, chunkedRecorder, refreshPosition]);

  useDashcamAutoStart({
    enabled: autoDashcam && !autoStartPaused,
    duty,
    clockedIn,
    canRecord,
    recording,
    starting: startingLive,
    startRecording,
    stopRecording,
  });

  const serverSyncRef = useRef(false);
  useEffect(() => {
    if (!canRecord || recording || startingLive || serverSyncRef.current) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { session: serverSession } = await api.functions.invoke('getMyLiveVideoSession');
        serverSyncRef.current = true;
        if (cancelled || !serverSession) return;
        await startRecording(null);
      } catch {
        serverSyncRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, [canRecord, recording, startingLive, startRecording]);

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
  }, [canRecord, recording, startingLive, searchParams, setSearchParams, startRecording]);

  const mph = mpsToMph(position?.speed);
  const unitLine = shift?.vehicle_unit_number
    ? `Tractor #${shift.vehicle_unit_number}${shift.trailer_unit_number ? ` · Trailer #${shift.trailer_unit_number}` : ''}`
    : null;

  return (
    <div className={`pb-8 ${recording ? 'p-2 sm:p-3 bg-black min-h-screen' : 'p-4 space-y-4'}`}>
      <div className={recording ? 'px-2 pt-2' : ''}>
        <h1 className={`font-black flex items-center gap-2 ${recording ? 'text-white text-lg' : 'text-slate-900 text-xl'}`}>
          <Video className={`w-6 h-6 ${recording ? 'text-red-500' : 'text-amber-500'}`} />
          Semi Road Cam
        </h1>
        <p className={`text-sm mt-1 ${recording ? 'text-slate-400' : 'text-slate-500'}`}>
          ELD-style road-facing live view — fleet watches in Driver Media. No API keys.
        </p>
      </div>

      {!recording && (
        <>
          <DriverDutyBar />

          {unitLine && (
            <div className="bg-slate-900 text-white rounded-xl px-4 py-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs text-slate-400">Clocked in</div>
                <div className="font-bold text-sm">{unitLine}</div>
              </div>
            </div>
          )}

          {!clockedIn && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              Clock in on the <strong>Clock</strong> tab and select your tractor for unit tracking on live map.
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button type="button" onClick={() => setGuideOpen(!guideOpen)} className="w-full flex items-center justify-between px-4 py-3 text-left">
              <span className="font-bold text-slate-900 text-sm">Semi / ELD mount guide</span>
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
        </>
      )}

      {!dualCameraEnabled && !recording && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          Dashcam recording is turned off for your fleet. Ask your fleet manager to enable it in Driver Media.
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
            {startingLive ? 'Starting…' : 'Start Road Cam'}
          </button>
          <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1">
            <RotateCw className="w-3 h-3" /> Rotate phone landscape for best road view
          </p>
          {autoDashcam && (
            <p className="text-xs text-center text-emerald-700">
              Auto-start enabled — set duty to <strong>Driving</strong> while clocked in.
            </p>
          )}
          {officeRequest && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2 text-amber-900 text-sm">
                <Radio className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <div className="font-bold">Fleet office requested live view</div>
                  <p className="text-xs mt-1 text-amber-800">{officeRequest.message}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={startingLive}
                onClick={() => startRecording(officeRequest.pending?.id)}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl disabled:opacity-60"
              >
                <Play className="w-5 h-5" /> {startingLive ? 'Starting…' : 'Accept & Go Live'}
              </button>
            </div>
          )}
        </div>
      )}

      {!recording && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full">
            <Battery className="w-3 h-3" /> Keep plugged in
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full">
            <Wind className="w-3 h-3" /> Road only
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" /> FMCSA mount rules
          </span>
        </div>
      )}

      {recording && (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border-2 border-red-600 bg-black relative">
            <video
              ref={(el) => {
                roadPreviewRef.current = el;
                if (el && recording) bindRoadPreview(el);
              }}
              className="w-full aspect-video object-cover landscape:aspect-[16/9]"
              playsInline
              muted
              autoPlay
              aria-label="Road camera"
            />
            <div className="absolute top-2 left-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-black rounded animate-pulse">● LIVE</span>
              {unitLine && (
                <span className="px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded">{unitLine}</span>
              )}
            </div>
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
              {mph != null && (
                <span className="px-2 py-1 bg-black/70 text-white text-xs font-black flex items-center gap-1 rounded">
                  <Gauge className="w-3.5 h-3.5" /> {mph} MPH
                </span>
              )}
              {position && (
                <span className="px-2 py-1 bg-black/60 text-slate-300 text-[10px] rounded flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> ±{Math.round(position.accuracy || 0)}m
                </span>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/90 to-transparent text-xs text-slate-200 flex justify-between">
              <span className="font-bold">ROAD AHEAD · FLEET WATCHING</span>
              {wakeLockSupported && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Sun className="w-3 h-3" /> Screen on
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl disabled:opacity-60 border border-slate-600"
          >
            <Square className="w-4 h-4" /> {uploading ? 'Saving video…' : 'Stop Road Cam'}
          </button>
        </div>
      )}

      {message && !recording && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">{message}</div>
      )}
      {error && (
        <div className={`text-sm rounded-xl p-3 space-y-2 ${recording ? 'text-red-300 bg-red-950/50 border border-red-800' : 'text-red-700 bg-red-50 border border-red-200'}`}>
          <p>{error}</p>
          {!recording && error.includes('Stop the current live stream') && (
            <button
              type="button"
              onClick={endStuckStream}
              className="w-full py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold"
            >
              End stuck stream
            </button>
          )}
        </div>
      )}
    </div>
  );
}

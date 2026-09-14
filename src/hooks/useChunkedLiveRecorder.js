import { useRef, useCallback } from 'react';
import { attachStreamToVideo, startCameraStream, stopCameraStream, captureFrameFromVideo } from '@/lib/nativeBridge';
import { uploadLiveChunk, uploadLivePreviewFrame } from '@/lib/liveVideo';
import { api } from '@/api/apiClient';

function pickMimeType() {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}

const CHUNK_MS = 1500;
const PREVIEW_MS = 1000;

/**
 * Record road dashcam — 1.5s WebM chunks + 1s JPEG previews for near-live office view (no API keys).
 */
export function useChunkedLiveRecorder() {
  const roadStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const seqRef = useRef(0);
  const frameSeqRef = useRef(0);
  const sessionIdRef = useRef(null);
  const videoElRef = useRef(null);
  const uploadQueueRef = useRef(Promise.resolve());
  const previewTimerRef = useRef(null);
  const getTelemetryRef = useRef(null);
  const ownsStreamRef = useRef(false);

  const enqueue = useCallback((task) => {
    uploadQueueRef.current = uploadQueueRef.current.then(task).catch((err) => {
      console.warn('[chunked-live] upload failed:', err?.message || err);
    });
  }, []);

  const uploadPreviewFrame = useCallback(async () => {
    const videoEl = videoElRef.current;
    const sessionId = sessionIdRef.current;
    if (!videoEl?.videoWidth || !sessionId) return;

    const { file } = await captureFrameFromVideo(videoEl, 0.72);
    const seq = frameSeqRef.current;
    frameSeqRef.current += 1;
    const tel = getTelemetryRef.current?.() || {};

    const upload = await uploadLivePreviewFrame(file, { sessionId, seq });
    await api.functions.invoke('registerLiveVideoPreviewFrame', {
      sessionId,
      seq,
      fileUrl: upload.file_url,
      fileSizeBytes: upload.file_size,
      lat: tel.lat ?? null,
      lng: tel.lng ?? null,
      speedMps: tel.speed ?? null,
      vehicleUnitNumber: tel.vehicleUnitNumber || '',
    });
  }, []);

  const stopRecorder = useCallback(() => {
    return new Promise((resolve) => {
      if (!recorderRef.current || recorderRef.current.state === 'inactive') {
        resolve({ roadBlob: null, cabinBlob: null });
        return;
      }
      recorderRef.current.onstop = () => {
        resolve({
          roadBlob: new Blob(chunksRef.current, { type: pickMimeType() }),
          cabinBlob: null,
        });
      };
      recorderRef.current.stop();
    });
  }, []);

  const start = useCallback(async ({ roadVideoEl, sessionId, getTelemetry, existingStream = null }) => {
    if (!roadVideoEl) {
      throw new Error('Camera preview not ready — try again');
    }
    if (recorderRef.current?.state === 'recording') {
      return;
    }

    sessionIdRef.current = sessionId;
    videoElRef.current = roadVideoEl;
    getTelemetryRef.current = getTelemetry;
    seqRef.current = 0;
    frameSeqRef.current = 0;

    let roadStream = existingStream;
    const trackLive = roadStream?.getVideoTracks?.().some((t) => t.readyState === 'live');
    if (trackLive) {
      ownsStreamRef.current = false;
      await attachStreamToVideo(roadVideoEl, roadStream);
    } else {
      roadStream = await startCameraStream(roadVideoEl, 'environment');
      ownsStreamRef.current = true;
    }
    roadStreamRef.current = roadStream;

    const videoTrack = roadStream.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState !== 'live') {
      throw new Error('Camera is not active — allow camera access and try again');
    }

    if (typeof MediaRecorder === 'undefined') {
      throw new Error('Video recording is not supported in this browser — use the FleetCo Driver app or Chrome on Android.');
    }

    const mime = pickMimeType();
    chunksRef.current = [];
    let recorder;
    try {
      recorder = new MediaRecorder(roadStream, {
        mimeType: mime,
        videoBitsPerSecond: 2_000_000,
      });
    } catch {
      recorder = new MediaRecorder(roadStream);
    }

    recorder.ondataavailable = (e) => {
      if (!e.data?.size) return;
      chunksRef.current.push(e.data);
      const seq = seqRef.current;
      seqRef.current += 1;
      enqueue(async () => {
        const upload = await uploadLiveChunk(e.data, { sessionId: sessionIdRef.current, seq });
        await api.functions.invoke('registerLiveVideoChunk', {
          sessionId: sessionIdRef.current,
          seq,
          fileUrl: upload.file_url,
          fileSizeBytes: upload.file_size,
        });
      });
    };

    recorder.start(CHUNK_MS);
    recorderRef.current = recorder;

    previewTimerRef.current = setInterval(() => {
      enqueue(() => uploadPreviewFrame());
    }, PREVIEW_MS);

    enqueue(() => uploadPreviewFrame());
  }, [enqueue, uploadPreviewFrame]);

  const stop = useCallback(async () => {
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    const blobs = await stopRecorder();
    await uploadQueueRef.current;
    if (ownsStreamRef.current) {
      stopCameraStream(roadStreamRef.current);
    }
    ownsStreamRef.current = false;
    roadStreamRef.current = null;
    recorderRef.current = null;
    videoElRef.current = null;
    sessionIdRef.current = null;
    getTelemetryRef.current = null;
    return blobs;
  }, [stopRecorder]);

  return { start, stop };
}

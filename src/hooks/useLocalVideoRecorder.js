import { useRef, useCallback } from 'react';
import { startDualCameraStreams, startCameraStream, stopCameraStream } from '@/lib/nativeBridge';

function pickMimeType() {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}

/**
 * Record road (+ optional cabin) video on-device without LiveKit — upload WebM when stopped.
 */
export function useLocalVideoRecorder() {
  const roadStreamRef = useRef(null);
  const cabinStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const cabinRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const cabinChunksRef = useRef([]);

  const stopRecorders = useCallback(() => {
    return new Promise((resolve) => {
      let pending = 0;
      let roadBlob = null;
      let cabinBlob = null;

      const done = () => {
        pending -= 1;
        if (pending <= 0) resolve({ roadBlob, cabinBlob });
      };

      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        pending += 1;
        recorderRef.current.onstop = () => {
          roadBlob = new Blob(chunksRef.current, { type: pickMimeType() });
          done();
        };
        recorderRef.current.stop();
      }

      if (cabinRecorderRef.current && cabinRecorderRef.current.state !== 'inactive') {
        pending += 1;
        cabinRecorderRef.current.onstop = () => {
          cabinBlob = new Blob(cabinChunksRef.current, { type: pickMimeType() });
          done();
        };
        cabinRecorderRef.current.stop();
      }

      if (pending === 0) resolve({ roadBlob: null, cabinBlob: null });
    });
  }, []);

  const startRecorder = useCallback((mediaStream, isCabin = false) => {
    if (!mediaStream) return null;
    const mime = pickMimeType();
    const recorder = new MediaRecorder(mediaStream, { mimeType: mime, videoBitsPerSecond: 1_500_000 });
    if (isCabin) {
      cabinChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data?.size) cabinChunksRef.current.push(e.data);
      };
      cabinRecorderRef.current = recorder;
    } else {
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
    }
    recorder.start(4000);
    return recorder;
  }, []);

  const start = useCallback(async ({ roadVideoEl, cabinVideoEl, dualCamera }) => {
    let roadStream;
    let cabinStream = null;

    if (dualCamera) {
      const dual = await startDualCameraStreams(roadVideoEl, cabinVideoEl);
      roadStream = dual.roadStream;
      cabinStream = dual.cabinStream;
    } else {
      roadStream = await startCameraStream(roadVideoEl, 'environment');
    }

    roadStreamRef.current = roadStream;
    cabinStreamRef.current = cabinStream;
    startRecorder(roadStream, false);
    if (cabinStream) startRecorder(cabinStream, true);
  }, [startRecorder]);

  const stop = useCallback(async () => {
    const blobs = await stopRecorders();
    stopCameraStream(roadStreamRef.current);
    stopCameraStream(cabinStreamRef.current);
    roadStreamRef.current = null;
    cabinStreamRef.current = null;
    recorderRef.current = null;
    cabinRecorderRef.current = null;
    return blobs;
  }, [stopRecorders]);

  return { start, stop };
}

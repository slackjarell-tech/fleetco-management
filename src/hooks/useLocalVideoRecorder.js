import { useRef, useCallback } from 'react';
import { startCameraStream, stopCameraStream } from '@/lib/nativeBridge';

function pickMimeType() {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}

/** Record road-facing dashcam video on-device — upload WebM when stopped. */
export function useLocalVideoRecorder() {
  const roadStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

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

  const start = useCallback(async ({ roadVideoEl }) => {
    const roadStream = await startCameraStream(roadVideoEl, 'environment');
    roadStreamRef.current = roadStream;

    const mime = pickMimeType();
    chunksRef.current = [];
    const recorder = new MediaRecorder(roadStream, { mimeType: mime, videoBitsPerSecond: 1_500_000 });
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunksRef.current.push(e.data);
    };
    recorder.start(4000);
    recorderRef.current = recorder;
  }, []);

  const stop = useCallback(async () => {
    const blobs = await stopRecorder();
    stopCameraStream(roadStreamRef.current);
    roadStreamRef.current = null;
    recorderRef.current = null;
    return blobs;
  }, [stopRecorder]);

  return { start, stop };
}

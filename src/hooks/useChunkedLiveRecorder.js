import { useRef, useCallback } from 'react';
import { startCameraStream, stopCameraStream } from '@/lib/nativeBridge';
import { uploadLiveChunk } from '@/lib/liveVideo';
import { api } from '@/api/apiClient';

function pickMimeType() {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}

const CHUNK_MS = 3000;

/**
 * Record road dashcam video and upload 3-second segments for live office viewing
 * (no LiveKit). Full WebM is assembled locally and uploaded when recording stops.
 */
export function useChunkedLiveRecorder() {
  const roadStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const seqRef = useRef(0);
  const sessionIdRef = useRef(null);
  const uploadQueueRef = useRef(Promise.resolve());

  const enqueueChunkUpload = useCallback((blob, sessionId, seq) => {
    if (!blob?.size || !sessionId) return;

    uploadQueueRef.current = uploadQueueRef.current
      .then(async () => {
        const upload = await uploadLiveChunk(blob, { sessionId, seq });
        await api.functions.invoke('registerLiveVideoChunk', {
          sessionId,
          seq,
          fileUrl: upload.file_url,
          fileSizeBytes: upload.file_size,
        });
      })
      .catch((err) => {
        console.warn('[chunked-live] chunk upload failed:', err?.message || err);
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

  const start = useCallback(async ({ roadVideoEl, sessionId }) => {
    sessionIdRef.current = sessionId;
    seqRef.current = 0;

    const roadStream = await startCameraStream(roadVideoEl, 'environment');
    roadStreamRef.current = roadStream;

    const mime = pickMimeType();
    chunksRef.current = [];
    const recorder = new MediaRecorder(roadStream, { mimeType: mime, videoBitsPerSecond: 1_200_000 });

    recorder.ondataavailable = (e) => {
      if (!e.data?.size) return;
      chunksRef.current.push(e.data);
      const seq = seqRef.current;
      seqRef.current += 1;
      enqueueChunkUpload(e.data, sessionIdRef.current, seq);
    };

    recorder.start(CHUNK_MS);
    recorderRef.current = recorder;
  }, [enqueueChunkUpload]);

  const stop = useCallback(async () => {
    const blobs = await stopRecorder();
    await uploadQueueRef.current;
    stopCameraStream(roadStreamRef.current);
    roadStreamRef.current = null;
    recorderRef.current = null;
    sessionIdRef.current = null;
    return blobs;
  }, [stopRecorder]);

  return { start, stop };
}

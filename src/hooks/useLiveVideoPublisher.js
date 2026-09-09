import { useRef, useCallback } from 'react';
import { Room, RoomEvent, createLocalTracks, Track } from 'livekit-client';

function pickMimeType() {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}

/**
 * Connect driver to LiveKit, publish road (+ optional cabin) video, and record WebM locally for upload.
 */
export function useLiveVideoPublisher() {
  const roomRef = useRef(null);
  const recorderRef = useRef(null);
  const cabinRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const cabinChunksRef = useRef([]);
  const tracksRef = useRef([]);

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

  const start = useCallback(async ({ livekitUrl, token, roadVideoEl, cabinVideoEl, dualCamera }) => {
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    await room.connect(livekitUrl, token);

    const roadTracks = await createLocalTracks({
      audio: false,
      video: { facingMode: 'environment', resolution: { width: 1280, height: 720 } },
    });
    const roadTrack = roadTracks.find((t) => t.kind === Track.Kind.Video);
    if (!roadTrack) throw new Error('Could not access road camera');

    await room.localParticipant.publishTrack(roadTrack, { name: 'road', source: Track.Source.Camera });
    tracksRef.current.push(roadTrack);
    if (roadVideoEl) roadTrack.attach(roadVideoEl);

    const roadStream = new MediaStream([roadTrack.mediaStreamTrack]);
    startRecorder(roadStream, false);

    if (dualCamera) {
      try {
        const cabinTracks = await createLocalTracks({
          audio: false,
          video: { facingMode: 'user', resolution: { width: 640, height: 480 } },
        });
        const cabinTrack = cabinTracks.find((t) => t.kind === Track.Kind.Video);
        if (cabinTrack) {
          await room.localParticipant.publishTrack(cabinTrack, { name: 'cabin', source: Track.Source.Unknown });
          tracksRef.current.push(cabinTrack);
          if (cabinVideoEl) cabinTrack.attach(cabinVideoEl);
          const cabinStream = new MediaStream([cabinTrack.mediaStreamTrack]);
          startRecorder(cabinStream, true);
        }
      } catch {
        /* cabin optional on iOS */
      }
    }

    return room;
  }, [startRecorder]);

  const stop = useCallback(async () => {
    const blobs = await stopRecorders();

    tracksRef.current.forEach((t) => {
      try { t.stop(); } catch { /* ignore */ }
    });
    tracksRef.current = [];

    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }

    recorderRef.current = null;
    cabinRecorderRef.current = null;

    return blobs;
  }, [stopRecorders]);

  return { start, stop };
}

export function useLiveVideoViewer() {
  const roomRef = useRef(null);

  const connect = useCallback(async ({ livekitUrl, token, onVideoElement }) => {
    const room = new Room();
    roomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track, publication) => {
      if (track.kind !== Track.Kind.Video) return;
      const el = track.attach();
      el.className = 'w-full h-full object-cover';
      onVideoElement?.(el, publication.trackName || track.sid);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((el) => el.remove());
    });

    await room.connect(livekitUrl, token);
    return room;
  }, []);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
  }, []);

  return { connect, disconnect };
}

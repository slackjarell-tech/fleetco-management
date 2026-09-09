import { useRef, useCallback } from 'react';
import { Room, RoomEvent, createLocalTracks, Track } from 'livekit-client';

function pickMimeType() {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}

/** Connect driver to LiveKit, publish road-facing video, and record WebM locally for upload. */
export function useLiveVideoPublisher() {
  const roomRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const tracksRef = useRef([]);

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

  const start = useCallback(async ({ livekitUrl, token, roadVideoEl }) => {
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

    const mime = pickMimeType();
    chunksRef.current = [];
    const recorder = new MediaRecorder(new MediaStream([roadTrack.mediaStreamTrack]), {
      mimeType: mime,
      videoBitsPerSecond: 1_500_000,
    });
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunksRef.current.push(e.data);
    };
    recorder.start(4000);
    recorderRef.current = recorder;

    return room;
  }, []);

  const stop = useCallback(async () => {
    const blobs = await stopRecorder();

    tracksRef.current.forEach((t) => {
      try { t.stop(); } catch { /* ignore */ }
    });
    tracksRef.current = [];

    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }

    recorderRef.current = null;
    return blobs;
  }, [stopRecorder]);

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

/**
 * LiveKit live video streaming + 15-day recording retention.
 *
 * Env:
 *   LIVEKIT_URL=wss://your-project.livekit.cloud
 *   LIVEKIT_API_KEY=
 *   LIVEKIT_API_SECRET=
 *   LIVE_STREAM_RETENTION_DAYS=15 (default)
 */
import { AccessToken } from 'livekit-server-sdk';
import {
  getLiveKitConfig,
  isLiveKitConfigured,
  getLiveKitConfigSource,
} from './liveKitSettings.js';
import fs from 'fs';
import path from 'path';
import {
  getLiveRecordingsDir,
  getLiveChunksDir,
  ensureUploadDirs,
  deleteStoredFile,
  deleteLocalDirectory,
  localPathFromUrl,
} from './mediaStorage.js';
import {
  createEntity,
  updateEntity,
  getEntity,
  listEntities,
  deleteEntity,
  filterEntities,
  findUserById,
  listUsers,
  nowIso,
} from './db.js';
import { isDriverCapableUser } from './driverAccess.js';
import { isInternalRole } from './entityScope.js';
import {
  isDualCameraEnabledForCustomer,
  canViewDriverMedia,
  canDownloadDriverMedia,
  canStartLiveVideoForDriver,
} from './driverMediaAccess.js';

ensureUploadDirs();
export const LIVE_RECORDINGS_DIR = getLiveRecordingsDir();
export const LIVE_CHUNKS_DIR = getLiveChunksDir();

export const RETENTION_DAYS = Math.max(1, Number(process.env.LIVE_STREAM_RETENTION_DAYS) || 15);
const REQUEST_TTL_MS = 30 * 60 * 1000;
const CHUNK_RETENTION_MS = 24 * 60 * 60 * 1000;

function sessionChunksDir(sessionId) {
  const safe = String(sessionId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safe) return null;
  return path.join(LIVE_CHUNKS_DIR, safe);
}

function chunkFilePath(sessionId, seq) {
  const dir = sessionChunksDir(sessionId);
  if (!dir) return null;
  return path.join(dir, `chunk-${String(seq).padStart(6, '0')}.webm`);
}

export function deleteSessionLiveChunks(sessionId) {
  const dir = sessionChunksDir(sessionId);
  if (dir) deleteLocalDirectory(dir);
}

function assertDriverCustomerAccess(driver, user, ctx) {
  const customerId = ctx?.customerId || user?.customer_id;
  if (isInternalRole(user?.role) && !customerId) return true;
  if (driver.customer_id && customerId && driver.customer_id !== customerId) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }
  return true;
}

function expireStaleRequest(session) {
  if (!session || session.status !== 'requested') return session;
  const ts = session.requested_at || session.started_at;
  if (!ts) return session;
  if (Date.now() - new Date(ts).getTime() > REQUEST_TTL_MS) {
    updateEntity('LiveStreamSession', session.id, { status: 'cancelled', ended_at: nowIso() });
    return null;
  }
  return session;
}

function liveKitConfig() {
  return getLiveKitConfig();
}

export { isLiveKitConfigured };

/** Chunked upload to FleetCo server — live office view without LiveKit. LiveKit is optional. */
export function getStreamMode() {
  return isLiveKitConfigured() ? 'livekit' : 'chunked';
}

function normalizeStreamMode(mode) {
  if (mode === 'local') return 'chunked';
  return mode || getStreamMode();
}

function roomName(sessionId) {
  return `fleetco-live-${sessionId}`;
}

async function buildToken({ room, identity, name, canPublish, canSubscribe }) {
  const cfg = liveKitConfig();
  if (!cfg) throw new Error('Live video is not configured — set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET on the server.');

  const token = new AccessToken(cfg.apiKey, cfg.apiSecret, {
    identity: String(identity),
    name: name || identity,
    ttl: '6h',
  });
  token.addGrant({
    roomJoin: true,
    room,
    canPublish,
    canSubscribe,
    canPublishData: false,
  });
  return token.toJwt();
}

function assertDriver(user) {
  if (!user) throw new Error('Unauthorized');
  if (!isDriverCapableUser(user)) throw new Error('Live video is for driver accounts only');
}

export function canViewLiveVideo(user) {
  return canViewDriverMedia(user);
}

export function canDownloadLiveVideo(user) {
  return canDownloadDriverMedia(user);
}

function assertRecordingAccess(recording, user, ctx) {
  if (!recording) throw new Error('Recording not found');
  const customerId = ctx?.customerId || user?.customer_id;
  if (isInternalRole(user?.role) && !customerId) return true;
  if (recording.customer_id && customerId && recording.customer_id !== customerId) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }
  if (!canViewLiveVideo(user)) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }
  return true;
}

export async function startLiveVideoStream(body, user) {
  assertDriver(user);

  const customer = user.customer_id ? getEntity('Customer', user.customer_id) : null;
  if (!isDualCameraEnabledForCustomer(customer)) {
    throw new Error('Dashcam recording is turned off for your fleet — your fleet manager can re-enable it in Driver Media.');
  }

  const active = filterEntities('LiveStreamSession', { driver_id: user.id, status: 'live' }, null, 1)[0];
  if (active) {
    throw new Error('Stop the current live stream before starting a new one');
  }

  const ts = nowIso();
  let session;

  if (body.sessionId) {
    session = getEntity('LiveStreamSession', body.sessionId);
    if (!session) throw new Error('Live video request not found');
    if (session.driver_id !== user.id) throw new Error('Not your live video request');
    session = expireStaleRequest(session);
    if (!session || session.status !== 'requested') {
      throw new Error('This live video request expired or was cancelled');
    }
    updateEntity('LiveStreamSession', session.id, {
      status: 'live',
      started_at: ts,
      stream_mode: getStreamMode(),
    });
    session = getEntity('LiveStreamSession', session.id);
  } else {
    const pending = filterEntities('LiveStreamSession', { driver_id: user.id, status: 'requested' });
    for (const p of pending) {
      updateEntity('LiveStreamSession', p.id, { status: 'cancelled', ended_at: ts });
    }

    session = createEntity('LiveStreamSession', {
      driver_id: user.id,
      driver_name: user.full_name || user.email,
      customer_id: user.customer_id || '',
      vehicle_id: body.vehicleId || '',
      status: 'live',
      stream_mode: getStreamMode(),
      room_name: '',
      started_at: ts,
      ended_at: '',
      requested_by: '',
      requested_by_name: '',
      requested_at: '',
      started_by: 'driver',
    });
  }

  const streamMode = session.stream_mode || getStreamMode();
  if (!session.stream_mode) {
    updateEntity('LiveStreamSession', session.id, { stream_mode: streamMode });
    session = { ...session, stream_mode: streamMode };
  }

  if (streamMode === 'chunked' || streamMode === 'local') {
    return {
      success: true,
      session: { ...session, status: 'live', stream_mode: 'chunked' },
      streamMode: 'chunked',
      message: body.sessionId
        ? 'Live dashcam started — fleet office can watch now. Full video saves when you stop.'
        : 'Live dashcam started — fleet managers can watch in Driver Media (~3–5 sec delay). Full video saves for 15 days when you stop.',
    };
  }

  const room = session.room_name || roomName(session.id);
  if (!session.room_name) {
    updateEntity('LiveStreamSession', session.id, { room_name: room, stream_mode: 'livekit' });
  }

  const publisherToken = await buildToken({
    room,
    identity: user.id,
    name: user.full_name || user.email,
    canPublish: true,
    canSubscribe: false,
  });

  const cfg = liveKitConfig();
  return {
    success: true,
    session: { ...session, room_name: room, status: 'live', stream_mode: 'livekit' },
    streamMode: 'livekit',
    livekitUrl: cfg.url,
    token: publisherToken,
    message: body.sessionId
      ? 'Live video started — your fleet office is now watching.'
      : 'Live video started — fleet managers can watch in Driver Media. Recording saves automatically for 15 days.',
  };
}

export function requestLiveVideoForDriver(body, user, ctx) {
  if (!canStartLiveVideoForDriver(user)) {
    throw new Error('Not authorized to request live video for a driver');
  }

  const { driverId, vehicleId = '' } = body;
  if (!driverId) throw new Error('driverId is required');

  const driver = findUserById(driverId);
  if (!driver || !isDriverCapableUser(driver)) {
    throw new Error('Driver not found');
  }
  assertDriverCustomerAccess(driver, user, ctx);

  const customer = driver.customer_id ? getEntity('Customer', driver.customer_id) : null;
  if (!isDualCameraEnabledForCustomer(customer)) {
    throw new Error('Dashcam recording is turned off for this fleet');
  }

  const sessions = listEntities('LiveStreamSession', '-started_at', 20)
    .filter((s) => s.driver_id === driverId && (s.status === 'live' || s.status === 'requested'));

  for (const s of sessions.filter((x) => x.status === 'requested')) {
    expireStaleRequest(s);
  }

  const refreshed = listEntities('LiveStreamSession', '-started_at', 20)
    .filter((s) => s.driver_id === driverId && (s.status === 'live' || s.status === 'requested'));

  if (refreshed.some((s) => s.status === 'live')) {
    throw new Error(`${driver.full_name || driver.email} is already live on video`);
  }
  if (refreshed.some((s) => s.status === 'requested')) {
    throw new Error(`Already waiting for ${driver.full_name || driver.email} to start live video`);
  }

  const ts = nowIso();
  const session = createEntity('LiveStreamSession', {
    driver_id: driver.id,
    driver_name: driver.full_name || driver.email,
    customer_id: driver.customer_id || '',
    vehicle_id: vehicleId,
    status: 'requested',
    room_name: '',
    started_at: ts,
    ended_at: '',
    requested_by: user.id,
    requested_by_name: user.full_name || user.email,
    requested_at: ts,
    started_by: 'office',
  });

  const room = roomName(session.id);
  updateEntity('LiveStreamSession', session.id, { room_name: room });

  return {
    success: true,
    session: { ...session, room_name: room },
    message: `Live video requested for ${driver.full_name || driver.email}. They will see a prompt in the FleetCo Driver app.`,
  };
}

export function getPendingLiveVideoRequest(_body, user) {
  assertDriver(user);

  let pending = filterEntities('LiveStreamSession', { driver_id: user.id, status: 'requested' }, null, 1)[0];
  pending = expireStaleRequest(pending);
  if (!pending) return { pending: null };

  return {
    pending,
    requestedBy: pending.requested_by_name || 'Fleet office',
    message: `${pending.requested_by_name || 'Your fleet office'} requested live video — tap Start when it is safe.`,
  };
}

export function cancelLiveVideoRequest(body, user, ctx) {
  if (!canStartLiveVideoForDriver(user)) {
    throw new Error('Not authorized to cancel live video requests');
  }

  const { sessionId } = body;
  if (!sessionId) throw new Error('sessionId is required');

  const session = getEntity('LiveStreamSession', sessionId);
  if (!session || session.status !== 'requested') {
    throw new Error('Live video request not found');
  }
  assertRecordingAccess({ customer_id: session.customer_id }, user, ctx);

  const updated = updateEntity('LiveStreamSession', session.id, {
    status: 'cancelled',
    ended_at: nowIso(),
  });

  return { success: true, session: updated };
}

export function listDriversForLiveVideo(_body, user, ctx) {
  if (!canViewLiveVideo(user)) throw new Error('Not authorized');

  const customerId = ctx?.customerId || user?.customer_id;
  let drivers = listUsers().filter((u) => u.customer_id && isDriverCapableUser(u));
  if (customerId) {
    drivers = drivers.filter((d) => d.customer_id === customerId);
  }

  const sessions = listEntities('LiveStreamSession', '-started_at', 100)
    .filter((s) => s.status === 'live' || s.status === 'requested');

  return {
    drivers: drivers.map((d) => {
      const live = sessions.find((s) => s.driver_id === d.id && s.status === 'live');
      let pending = sessions.find((s) => s.driver_id === d.id && s.status === 'requested');
      pending = expireStaleRequest(pending);
      return {
        id: d.id,
        name: d.full_name || d.email,
        email: d.email,
        liveSession: live || null,
        pendingSession: pending || null,
      };
    }),
    canStart: canStartLiveVideoForDriver(user),
    livekitConfigured: isLiveKitConfigured(),
  };
}

export async function stopLiveVideoStream(body, user) {
  assertDriver(user);
  const { sessionId } = body;
  if (!sessionId) throw new Error('sessionId is required');

  const session = getEntity('LiveStreamSession', sessionId);
  if (!session) throw new Error('Session not found');
  if (session.driver_id !== user.id) throw new Error('Not your live stream session');

  const ts = nowIso();
  const updated = updateEntity('LiveStreamSession', sessionId, {
    status: 'completed',
    ended_at: ts,
  });

  // Chunks are temporary — full recording upload follows; purge after a grace period.
  setTimeout(() => deleteSessionLiveChunks(sessionId), 30 * 60 * 1000);

  return {
    success: true,
    session: updated,
    message: 'Live stream ended. Uploading recording…',
  };
}

export async function getLiveVideoViewerToken(body, user, ctx) {
  if (!canViewLiveVideo(user)) throw new Error('Not authorized to view live video');

  const { sessionId } = body;
  if (!sessionId) throw new Error('sessionId is required');

  const session = getEntity('LiveStreamSession', sessionId);
  if (!session) throw new Error('Session not found');
  assertRecordingAccess({ customer_id: session.customer_id }, user, ctx);

  if (session.status !== 'live') throw new Error('This session is no longer live');
  const mode = normalizeStreamMode(session.stream_mode);
  if (mode === 'chunked' || !isLiveKitConfigured()) {
    throw new Error('This session uses FleetCo chunked live view — use the live preview player instead of LiveKit.');
  }

  const token = await buildToken({
    room: session.room_name,
    identity: user.id,
    name: user.full_name || user.email,
    canPublish: false,
    canSubscribe: true,
  });

  const cfg = liveKitConfig();
  return {
    livekitUrl: cfg.url,
    token,
    session,
  };
}

export async function listActiveLiveVideoSessions(_body, user, ctx) {
  if (!canViewLiveVideo(user)) throw new Error('Not authorized');

  let sessions = listEntities('LiveStreamSession', '-started_at', 50)
    .filter((s) => s.status === 'live' || s.status === 'requested');

  const customerId = ctx?.customerId || user?.customer_id;
  if (customerId && !isInternalRole(user?.role)) {
    sessions = sessions.filter((s) => s.customer_id === customerId);
  } else if (customerId && ctx?.customerId) {
    sessions = sessions.filter((s) => s.customer_id === customerId);
  }

  const requestedSessions = sessions
    .filter((s) => s.status === 'requested')
    .map((s) => expireStaleRequest(s))
    .filter(Boolean);
  const liveSessions = sessions
    .filter((s) => s.status === 'live')
    .map((s) => ({
      ...s,
      stream_mode: normalizeStreamMode(s.stream_mode || getStreamMode()),
    }));

  const cfg = liveKitConfig();
  return {
    sessions: liveSessions,
    requestedSessions,
    livekitConfigured: !!cfg,
    livekitSource: getLiveKitConfigSource(),
    chunkedLiveEnabled: true,
    livekitUrl: cfg?.url || null,
    canStart: canStartLiveVideoForDriver(user),
  };
}

export function registerLiveVideoChunk(body, user) {
  assertDriver(user);

  const { sessionId, seq, fileUrl, fileSizeBytes } = body;
  if (!sessionId || seq == null || !fileUrl) {
    throw new Error('sessionId, seq, and fileUrl are required');
  }

  const session = getEntity('LiveStreamSession', sessionId);
  if (!session) throw new Error('Session not found');
  if (session.driver_id !== user.id) throw new Error('Not your session');
  if (session.status !== 'live') throw new Error('Session is not live');

  const chunkSeq = Number(seq);
  const ts = nowIso();
  updateEntity('LiveStreamSession', sessionId, {
    latest_chunk_url: fileUrl,
    latest_chunk_seq: chunkSeq,
    latest_chunk_at: ts,
    stream_mode: normalizeStreamMode(session.stream_mode),
  });

  return {
    success: true,
    seq: chunkSeq,
    latest_chunk_at: ts,
    file_size: fileSizeBytes ? Number(fileSizeBytes) : null,
  };
}

export function getLiveVideoPreview(body, user, ctx) {
  if (!canViewLiveVideo(user)) throw new Error('Not authorized to view live video');

  const { sessionId, afterSeq = -1 } = body;
  if (!sessionId) throw new Error('sessionId is required');

  const session = getEntity('LiveStreamSession', sessionId);
  if (!session) throw new Error('Session not found');
  assertRecordingAccess({ customer_id: session.customer_id }, user, ctx);

  if (session.status !== 'live') {
    return {
      live: false,
      session,
      chunks: [],
      latestSeq: session.latest_chunk_seq ?? -1,
    };
  }

  const mode = normalizeStreamMode(session.stream_mode);
  const dir = sessionChunksDir(sessionId);
  const chunks = [];
  const startSeq = Math.max(0, Number(afterSeq) + 1);
  const latestSeq = session.latest_chunk_seq ?? -1;

  if (dir && fs.existsSync(dir)) {
    for (let s = startSeq; s <= latestSeq; s += 1) {
      const fp = chunkFilePath(sessionId, s);
      if (fp && fs.existsSync(fp)) {
        chunks.push({
          seq: s,
          url: `/uploads/live-chunks/${path.basename(dir)}/chunk-${String(s).padStart(6, '0')}.webm`,
          size: fs.statSync(fp).size,
        });
      }
    }
  }

  return {
    live: true,
    session: {
      ...session,
      stream_mode: mode,
    },
    chunks,
    latestSeq,
    latestChunkAt: session.latest_chunk_at || null,
    previewDelaySec: 3,
  };
}

export function getLiveVideoChunkPath(sessionId, seq, user, ctx) {
  const session = getEntity('LiveStreamSession', sessionId);
  if (!session) throw new Error('Session not found');
  assertRecordingAccess({ customer_id: session.customer_id }, user, ctx);

  const chunkSeq = Number(seq);
  if (!Number.isFinite(chunkSeq) || chunkSeq < 0) throw new Error('Invalid chunk sequence');

  const fp = chunkFilePath(sessionId, chunkSeq);
  if (!fp || !fs.existsSync(fp)) throw new Error('Chunk not found');

  return { filePath: fp, session };
}

export async function purgeStaleLiveChunks() {
  const cutoff = Date.now() - CHUNK_RETENTION_MS;
  let removed = 0;

  if (!fs.existsSync(LIVE_CHUNKS_DIR)) return { removed };

  for (const name of fs.readdirSync(LIVE_CHUNKS_DIR)) {
    const dir = path.join(LIVE_CHUNKS_DIR, name);
    if (!fs.statSync(dir).isDirectory()) continue;

    const session = listEntities('LiveStreamSession').find((s) => s.id === name);
    const endedAt = session?.ended_at ? new Date(session.ended_at).getTime() : 0;
    const isLive = session?.status === 'live';
    if (isLive) continue;
    if (session && endedAt && endedAt > cutoff) continue;
    if (!session) {
      const mtime = fs.statSync(dir).mtimeMs;
      if (mtime > cutoff) continue;
    }

    deleteLocalDirectory(dir);
    removed += 1;
  }

  if (removed > 0) {
    console.log(`[live-stream] Purged ${removed} stale live-chunk folder(s)`);
  }
  return { removed };
}

export function registerLiveVideoRecording(body, user) {
  assertDriver(user);

  const {
    sessionId,
    videoUrl,
    cabinVideoUrl,
    durationSec,
    fileSizeBytes,
    lat,
    lng,
    speed,
  } = body;

  if (!sessionId || !videoUrl) throw new Error('sessionId and videoUrl are required');

  const session = getEntity('LiveStreamSession', sessionId);
  if (!session) throw new Error('Session not found');
  if (session.driver_id !== user.id) throw new Error('Not your session');

  const ended = session.ended_at || nowIso();
  const expiresAt = new Date(new Date(ended).getTime() + RETENTION_DAYS * 86400000).toISOString();

  const recording = createEntity('LiveStreamRecording', {
    session_id: sessionId,
    driver_id: user.id,
    driver_name: user.full_name || user.email,
    customer_id: user.customer_id || '',
    video_url: videoUrl,
    cabin_video_url: cabinVideoUrl || '',
    duration_sec: durationSec ? Number(durationSec) : null,
    file_size_bytes: fileSizeBytes ? Number(fileSizeBytes) : null,
    lat: lat ?? null,
    lng: lng ?? null,
    speed_mps: speed ?? 0,
    started_at: session.started_at,
    ended_at: ended,
    expires_at: expiresAt,
    archived: false,
    archived_at: '',
    archived_by: '',
  });

  return { success: true, recording };
}

export function listLiveVideoRecordings(_body, user, ctx) {
  if (!canViewLiveVideo(user)) throw new Error('Not authorized');

  let recordings = listEntities('LiveStreamRecording', '-started_at', 200);
  const customerId = ctx?.customerId || user?.customer_id;

  if (customerId && !isInternalRole(user?.role)) {
    recordings = recordings.filter((r) => r.customer_id === customerId);
  } else if (customerId && ctx?.customerId) {
    recordings = recordings.filter((r) => r.customer_id === customerId);
  }

  const now = Date.now();
  return {
    recordings: recordings.map((r) => ({
      ...r,
      days_remaining: r.archived
        ? null
        : Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - now) / 86400000)),
    })),
    retentionDays: RETENTION_DAYS,
    canDownload: canDownloadLiveVideo(user),
  };
}

export function archiveLiveVideoRecording(body, user, ctx) {
  if (!canDownloadLiveVideo(user)) throw new Error('Only fleet managers can save recordings permanently');

  const { recordingId } = body;
  if (!recordingId) throw new Error('recordingId is required');

  const recording = getEntity('LiveStreamRecording', recordingId);
  assertRecordingAccess(recording, user, ctx);

  const updated = updateEntity('LiveStreamRecording', recordingId, {
    archived: true,
    archived_at: nowIso(),
    archived_by: user.id,
  });

  return { success: true, recording: updated, message: 'Recording saved — it will not be auto-deleted.' };
}

export async function purgeExpiredLiveRecordings() {
  const now = nowIso();
  const expired = listEntities('LiveStreamRecording').filter(
    (r) => !r.archived && r.expires_at && r.expires_at < now,
  );

  let removed = 0;
  for (const rec of expired) {
    await deleteStoredFile(rec.video_url);
    await deleteStoredFile(rec.cabin_video_url);
    deleteEntity('LiveStreamRecording', rec.id);
    removed += 1;
  }

  if (removed > 0) {
    console.log(`[live-stream] Purged ${removed} expired recording(s) (retention ${RETENTION_DAYS} days)`);
  }
  return { removed };
}

export function startLiveStreamRetentionScheduler() {
  purgeExpiredLiveRecordings().catch((err) => {
    console.warn('[live-stream] initial retention purge failed:', err.message);
  });
  purgeStaleLiveChunks().catch((err) => {
    console.warn('[live-stream] initial chunk purge failed:', err.message);
  });
  const intervalMs = 6 * 60 * 60 * 1000;
  setInterval(() => {
    purgeExpiredLiveRecordings().catch((err) => {
      console.warn('[live-stream] retention purge failed:', err.message);
    });
    purgeStaleLiveChunks().catch((err) => {
      console.warn('[live-stream] chunk purge failed:', err.message);
    });
  }, intervalMs);
  console.log(`[live-stream] Retention scheduler started (${RETENTION_DAYS}-day auto-delete)`);
}

export function getLiveRecordingUrl(recording, which = 'road') {
  const url = which === 'cabin' ? recording.cabin_video_url : recording.video_url;
  return url || null;
}

/** @deprecated Use getLiveRecordingUrl + getReadableStream */
export function getLiveRecordingFilePath(recording, which = 'road') {
  const url = getLiveRecordingUrl(recording, which);
  if (!url) return null;
  return localPathFromUrl(url);
}

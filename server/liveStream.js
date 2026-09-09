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
  getLiveRecordingsDir,
  ensureUploadDirs,
  deleteStoredFile,
  localPathFromUrl,
} from './mediaStorage.js';
import {
  createEntity,
  updateEntity,
  getEntity,
  listEntities,
  deleteEntity,
  filterEntities,
  nowIso,
} from './db.js';
import { isDriverCapableUser } from './driverAccess.js';
import { isInternalRole } from './entityScope.js';

ensureUploadDirs();
export const LIVE_RECORDINGS_DIR = getLiveRecordingsDir();

export const RETENTION_DAYS = Math.max(1, Number(process.env.LIVE_STREAM_RETENTION_DAYS) || 15);

function liveKitConfig() {
  const url = (process.env.LIVEKIT_URL || '').trim();
  const apiKey = (process.env.LIVEKIT_API_KEY || '').trim();
  const apiSecret = (process.env.LIVEKIT_API_SECRET || '').trim();
  if (!url || !apiKey || !apiSecret) return null;
  return { url, apiKey, apiSecret };
}

export function isLiveKitConfigured() {
  return !!liveKitConfig();
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

function fleetManagerRoles() {
  return ['customer_owner', 'customer_fleet_manager', 'customer_hr', 'user'];
}

export function canViewLiveVideo(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  if (user.customer_id && fleetManagerRoles().includes(user.role)) return true;
  return user.customer_id && user.role === 'customer_fleet_coordinator';
}

export function canDownloadLiveVideo(user) {
  if (!user) return false;
  if (isInternalRole(user.role)) return true;
  const r = user.role === 'user' ? 'customer_owner' : user.role;
  return user.customer_id && ['customer_owner', 'customer_fleet_manager'].includes(r);
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
  if (!customer?.driver_dual_camera_enabled) {
    throw new Error('Dual camera / live video is not enabled for your fleet — ask your fleet manager to turn it on in Driver Media.');
  }

  const active = filterEntities('LiveStreamSession', { driver_id: user.id, status: 'live' }, null, 1)[0];
  if (active) {
    throw new Error('Stop the current live stream before starting a new one');
  }

  const ts = nowIso();
  const session = createEntity('LiveStreamSession', {
    driver_id: user.id,
    driver_name: user.full_name || user.email,
    customer_id: user.customer_id || '',
    vehicle_id: body.vehicleId || '',
    status: 'live',
    room_name: '',
    started_at: ts,
    ended_at: '',
  });

  const room = roomName(session.id);
  updateEntity('LiveStreamSession', session.id, { room_name: room });

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
    session: { ...session, room_name: room },
    livekitUrl: cfg.url,
    token: publisherToken,
    message: 'Live video started — fleet managers can watch in Driver Media. Recording saves automatically for 15 days.',
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
    .filter((s) => s.status === 'live');

  const customerId = ctx?.customerId || user?.customer_id;
  if (customerId && !isInternalRole(user?.role)) {
    sessions = sessions.filter((s) => s.customer_id === customerId);
  } else if (customerId && ctx?.customerId) {
    sessions = sessions.filter((s) => s.customer_id === customerId);
  }

  const cfg = liveKitConfig();
  return {
    sessions,
    livekitConfigured: !!cfg,
    livekitUrl: cfg?.url || null,
  };
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
  const intervalMs = 6 * 60 * 60 * 1000;
  setInterval(() => {
    purgeExpiredLiveRecordings().catch((err) => {
      console.warn('[live-stream] retention purge failed:', err.message);
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

/**
 * FleetCo Safety AI — vision analysis of dashcam frames for driving behavior.
 * Uses Gemini vision when configured; falls back gracefully when not.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEntity, getEntity } from './db.js';
import { getAiStatus } from './aiProvider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const SAFETY_EVENT_TYPES = new Set([
  'lane_departure',
  'lane_split',
  'distraction',
  'drowsiness',
  'phone_use',
  'impaired',
  'tailgating',
  'harsh_braking',
  'no_seatbelt',
  'other',
]);

const SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

function normalizeEnv(value) {
  if (!value || typeof value !== 'string') return '';
  let v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

function geminiApiKey() {
  return normalizeEnv(process.env.GEMINI_API_KEY);
}

function imageUrlToBase64(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const rel = imageUrl.replace(/^\/uploads\//, '');
  const filePath = path.join(UPLOADS_DIR, rel);
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  return { data: buf.toString('base64'), mime };
}

function parseAiJson(text) {
  if (!text) return [];
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeEvent(raw, ctx) {
  const type = SAFETY_EVENT_TYPES.has(raw?.type) ? raw.type : 'other';
  const severity = SEVERITIES.has(raw?.severity) ? raw.severity : 'low';
  const confidence = Math.min(1, Math.max(0, Number(raw?.confidence) || 0.5));
  return {
    session_id: ctx.sessionId,
    driver_id: ctx.driverId,
    customer_id: ctx.customerId || '',
    frame_id: ctx.frameId,
    event_type: type,
    severity,
    confidence,
    description: String(raw?.description || '').slice(0, 500),
    camera_facing: ctx.cameraFacing,
    lat: ctx.lat ?? null,
    lng: ctx.lng ?? null,
    speed: ctx.speed ?? 0,
    captured_at: ctx.capturedAt,
    ai_model: ctx.model,
    acknowledged: false,
  };
}

async function analyzeWithGemini({ imageBase64, mime, cameraFacing, speed }) {
  const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey()}`;

  const roadPrompt = `You are FleetCo Safety AI analyzing a ROAD-FACING dashcam frame.
Detect driving safety issues: lane departure, lane splitting/weaving, tailgating, harsh braking signs, road hazards.
Speed: ${Math.round(speed || 0)} mph.
Return ONLY a JSON array (no markdown). Each item: {"type":"lane_departure|lane_split|tailgating|harsh_braking|other","severity":"low|medium|high|critical","confidence":0.0-1.0,"description":"brief reason"}.
If nothing concerning, return [].`;

  const cabinPrompt = `You are FleetCo Safety AI analyzing an IN-CABIN driver camera frame.
Detect: distraction (looking away), drowsiness, phone use, impaired signs, no seatbelt visible.
Speed: ${Math.round(speed || 0)} mph.
Return ONLY a JSON array (no markdown). Each item: {"type":"distraction|drowsiness|phone_use|impaired|no_seatbelt|other","severity":"low|medium|high|critical","confidence":0.0-1.0,"description":"brief reason"}.
If driver appears alert and safe, return [].`;

  const prompt = cameraFacing === 'cabin' ? cabinPrompt : roadPrompt;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mime, data: imageBase64 } },
        ],
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini vision error (${res.status})`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return { events: parseAiJson(text), model };
}

/**
 * Analyze a dashcam frame asynchronously. Creates DrivingSafetyEvent records.
 * Skips if Safety AI disabled or no vision provider configured.
 */
export function analyzeDashcamFrameAsync(frame, session, options = {}) {
  if (!frame?.image_url || !session) return;

  const customerId = session.customer_id || frame.customer_id;
  if (!options.force && customerId) {
    const customer = getEntity('Customer', customerId);
    if (customer && customer.driver_safety_ai_enabled === false) return;
  }

  if (!geminiApiKey()) return;

  setImmediate(async () => {
    try {
      const encoded = imageUrlToBase64(frame.image_url);
      if (!encoded) return;

      const { events, model } = await analyzeWithGemini({
        imageBase64: encoded.data,
        mime: encoded.mime,
        cameraFacing: frame.camera_facing || 'road',
        speed: frame.speed,
      });

      const ctx = {
        sessionId: session.id,
        driverId: session.driver_id,
        customerId: session.customer_id || '',
        frameId: frame.id,
        cameraFacing: frame.camera_facing || 'road',
        lat: frame.lat,
        lng: frame.lng,
        speed: frame.speed,
        capturedAt: frame.captured_at,
        model: model || 'gemini-vision',
      };

      for (const raw of events) {
        if ((Number(raw.confidence) || 0) < 0.55) continue;
        createEntity('DrivingSafetyEvent', normalizeEvent(raw, ctx));
      }
    } catch (err) {
      console.warn('[Safety AI] frame analysis failed:', err.message);
    }
  });
}

export async function getLiveDashcamFeedsHandler(_body, user, ctx) {
  const { listEntities } = await import('./db.js');
  const deps = { listEntities };

  let sessions = listEntities('DashcamSession', '-started_at', 50)
    .filter((s) => s.status === 'recording');

  if (ctx?.customerId) {
    sessions = sessions.filter((s) => s.customer_id === ctx.customerId);
  } else if (user?.customer_id && !['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(user.role)) {
    sessions = sessions.filter((s) => s.customer_id === user.customer_id);
  }

  const frames = listEntities('DashcamFrame', '-captured_at', 500);
  const events = listEntities('DrivingSafetyEvent', '-captured_at', 200);

  const feeds = sessions.map((session) => {
    const sessionFrames = frames.filter((f) => f.session_id === session.id);
    const roadFrames = sessionFrames.filter((f) => f.camera_facing !== 'cabin');
    const cabinFrames = sessionFrames.filter((f) => f.camera_facing === 'cabin');
    const latestRoad = roadFrames[0] || null;
    const latestCabin = cabinFrames[0] || null;
    const recentAlerts = events
      .filter((e) => e.session_id === session.id)
      .slice(0, 8);

    return {
      session,
      latestRoad,
      latestCabin,
      recentAlerts,
      isLive: session.mode === 'live_stream' || (session.interval_sec || 99) <= 2,
    };
  });

  return { feeds, aiConfigured: !!geminiApiKey(), aiStatus: getAiStatus() };
}

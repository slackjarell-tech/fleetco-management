/**
 * LiveKit credentials — env vars (Render) or platform_settings in Postgres (portal setup).
 */
import { AccessToken } from 'livekit-server-sdk';
import { getMemoryStore, scheduleSave } from './storePersist.js';

function normalizeUrl(raw) {
  let url = (raw || '').trim();
  if (!url) return '';
  if (url.startsWith('https://')) url = url.replace('https://', 'wss://');
  if (url.startsWith('http://')) url = url.replace('http://', 'ws://');
  return url;
}

function configFromParts(url, apiKey, apiSecret) {
  const u = normalizeUrl(url);
  const key = (apiKey || '').trim();
  const secret = (apiSecret || '').trim();
  if (!u || !key || !secret) return null;
  return { url: u, apiKey: key, apiSecret: secret };
}

function configFromEnv() {
  return configFromParts(
    process.env.LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
  );
}

function configFromStore() {
  const livekit = getMemoryStore().platform_settings?.livekit;
  if (!livekit) return null;
  return configFromParts(livekit.url, livekit.api_key, livekit.api_secret);
}

export function getLiveKitConfig() {
  return configFromEnv() || configFromStore();
}

export function isLiveKitConfigured() {
  return !!getLiveKitConfig();
}

export function getLiveKitConfigSource() {
  if (configFromEnv()) return 'environment';
  if (configFromStore()) return 'database';
  return null;
}

export async function validateLiveKitConfig(cfg) {
  if (!cfg) throw new Error('Missing LiveKit configuration');
  const token = new AccessToken(cfg.apiKey, cfg.apiSecret, {
    identity: 'fleetco-validate',
    ttl: '5m',
  });
  token.addGrant({
    roomJoin: true,
    room: 'fleetco-validate',
    canPublish: true,
    canSubscribe: true,
  });
  const jwt = await token.toJwt();
  if (!jwt || jwt.length < 20) {
    throw new Error('Could not generate a LiveKit token — check API key and secret');
  }
  return true;
}

export function getLiveKitSetupStatus() {
  const cfg = getLiveKitConfig();
  const source = getLiveKitConfigSource();
  return {
    configured: !!cfg,
    source,
    url: cfg?.url || null,
    apiKeyPreview: cfg?.apiKey ? `${cfg.apiKey.slice(0, 6)}…${cfg.apiKey.slice(-4)}` : null,
    hasEnvOverride: !!configFromEnv(),
  };
}

export function assertCanManageLiveKit(user) {
  if (!user) throw new Error('Unauthorized');
  if (!['owner', 'executive'].includes(user.role)) {
    throw new Error('Executive access required to manage LiveKit settings');
  }
}

export async function saveLiveKitSettings(body, user) {
  assertCanManageLiveKit(user);

  const url = body.url || body.livekitUrl;
  const apiKey = body.apiKey || body.api_key;
  const apiSecret = body.apiSecret || body.api_secret;
  const cfg = configFromParts(url, apiKey, apiSecret);
  if (!cfg) throw new Error('LiveKit URL, API key, and API secret are all required');

  await validateLiveKitConfig(cfg);

  const store = getMemoryStore();
  store.platform_settings = {
    ...(store.platform_settings || {}),
    livekit: {
      url: cfg.url,
      api_key: cfg.apiKey,
      api_secret: cfg.apiSecret,
      updated_at: new Date().toISOString(),
      updated_by: user.email,
    },
  };
  scheduleSave(store);

  return {
    success: true,
    ...getLiveKitSetupStatus(),
    message: 'LiveKit connected — drivers will use live streaming when they start recording.',
  };
}

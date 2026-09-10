/**
 * Durable media storage — survives Render redeploys.
 *
 * Tier 1 (default on Render): UPLOADS_PATH on the persistent disk (same mount as DATA_PATH).
 * Tier 2 (recommended for video scale): S3-compatible object storage (Cloudflare R2, AWS S3).
 *
 * Env:
 *   UPLOADS_PATH          — local root (default: DATA_PATH/uploads or server/uploads)
 *   S3_BUCKET / R2_BUCKET — enable object storage mirror
 *   S3_ENDPOINT / R2_ENDPOINT — R2: https://<account>.r2.cloudflarestorage.com
 *   S3_ACCESS_KEY_ID / R2_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY / R2_SECRET_ACCESS_KEY
 *   S3_REGION             — "auto" for R2 (default)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function env(key, fallback = '') {
  return (process.env[key] || fallback).trim();
}

function dataDir() {
  return env('DATA_PATH') || path.join(__dirname, 'data');
}

/** Local uploads root — on Render set UPLOADS_PATH to the persistent disk. */
export function getUploadsRoot() {
  if (env('UPLOADS_PATH')) return env('UPLOADS_PATH');
  const data = dataDir();
  if (env('DATA_PATH')) return path.join(data, 'uploads');
  return path.join(__dirname, 'uploads');
}

export function getLiveRecordingsDir() {
  return path.join(getUploadsRoot(), 'live-recordings');
}

export function getLiveChunksDir() {
  return path.join(getUploadsRoot(), 'live-chunks');
}

function objectStorageConfig() {
  const bucket = env('S3_BUCKET') || env('R2_BUCKET');
  if (!bucket) return null;
  const accessKeyId = env('S3_ACCESS_KEY_ID') || env('R2_ACCESS_KEY_ID');
  const secretAccessKey = env('S3_SECRET_ACCESS_KEY') || env('R2_SECRET_ACCESS_KEY');
  if (!accessKeyId || !secretAccessKey) return null;
  return {
    bucket,
    endpoint: env('S3_ENDPOINT') || env('R2_ENDPOINT') || undefined,
    region: env('S3_REGION') || 'auto',
    accessKeyId,
    secretAccessKey,
  };
}

let s3Client = null;

function getS3() {
  const cfg = objectStorageConfig();
  if (!cfg) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
      forcePathStyle: !!cfg.endpoint,
    });
  }
  return { client: s3Client, bucket: cfg.bucket };
}

export function isObjectStorageEnabled() {
  return !!objectStorageConfig();
}

export function isPersistentUploadsPath() {
  const root = getUploadsRoot();
  const data = dataDir();
  return root.startsWith(data) || !!env('UPLOADS_PATH');
}

export function ensureUploadDirs() {
  const root = getUploadsRoot();
  const live = getLiveRecordingsDir();
  const chunks = getLiveChunksDir();
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(live, { recursive: true });
  fs.mkdirSync(chunks, { recursive: true });
  return { root, live, chunks };
}

/** Stored URL `/uploads/foo` → object key `uploads/foo`. */
export function urlToStorageKey(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return null;
  return url.replace(/^\//, '');
}

export function localPathFromUrl(url) {
  if (!url || url.startsWith('http')) return null;
  const rel = url.replace(/^\/uploads\/?/, '');
  const full = path.join(getUploadsRoot(), rel);
  const normalized = path.normalize(full);
  const root = path.normalize(getUploadsRoot());
  if (!normalized.startsWith(root)) return null;
  return normalized;
}

function guessContentType(filePathOrUrl) {
  const ext = path.extname(filePathOrUrl).toLowerCase();
  const map = {
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
}

/** Mirror a file already on disk to object storage (best-effort). */
export async function replicateToObjectStorage(localAbsPath, publicUrl, contentType) {
  const s3 = getS3();
  const key = urlToStorageKey(publicUrl);
  if (!s3 || !key || !localAbsPath || !fs.existsSync(localAbsPath)) return false;

  const body = fs.readFileSync(localAbsPath);
  await s3.client.send(new PutObjectCommand({
    Bucket: s3.bucket,
    Key: key,
    Body: body,
    ContentType: contentType || guessContentType(localAbsPath),
  }));
  return true;
}

export async function readFileBuffer(url) {
  const local = localPathFromUrl(url);
  if (local && fs.existsSync(local)) {
    return fs.readFileSync(local);
  }

  const s3 = getS3();
  const key = urlToStorageKey(url);
  if (!s3 || !key) return null;

  try {
    const res = await s3.client.send(new GetObjectCommand({ Bucket: s3.bucket, Key: key }));
    const chunks = [];
    for await (const chunk of res.Body) chunks.push(chunk);
    return Buffer.concat(chunks);
  } catch (err) {
    if (err.name !== 'NoSuchKey') {
      console.warn('[media-storage] S3 read failed:', key, err.message);
    }
    return null;
  }
}

export async function getReadableStream(url) {
  const local = localPathFromUrl(url);
  if (local && fs.existsSync(local)) {
    return fs.createReadStream(local);
  }

  const s3 = getS3();
  const key = urlToStorageKey(url);
  if (!s3 || !key) return null;

  try {
    const res = await s3.client.send(new GetObjectCommand({ Bucket: s3.bucket, Key: key }));
    return res.Body;
  } catch (err) {
    if (err.name !== 'NoSuchKey') {
      console.warn('[media-storage] S3 stream failed:', key, err.message);
    }
    return null;
  }
}

/** Remove a session chunk directory (best-effort). */
export function deleteLocalDirectory(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return;
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch (err) {
    console.warn('[media-storage] directory delete failed:', dirPath, err.message);
  }
}

export async function deleteStoredFile(url) {
  if (!url) return;

  const local = localPathFromUrl(url);
  if (local && fs.existsSync(local)) {
    try {
      fs.unlinkSync(local);
    } catch (err) {
      console.warn('[media-storage] local delete failed:', local, err.message);
    }
  }

  const s3 = getS3();
  const key = urlToStorageKey(url);
  if (!s3 || !key) return;

  try {
    await s3.client.send(new DeleteObjectCommand({ Bucket: s3.bucket, Key: key }));
  } catch (err) {
    console.warn('[media-storage] S3 delete failed:', key, err.message);
  }
}

export function getStorageStatus() {
  const cfg = objectStorageConfig();
  return {
    uploadsPath: getUploadsRoot(),
    persistentDisk: isPersistentUploadsPath(),
    objectStorage: !!cfg,
    bucket: cfg?.bucket || null,
    endpoint: cfg?.endpoint || null,
    redeploySafe: isPersistentUploadsPath() || !!cfg,
  };
}

export function logStorageStartup() {
  const s = getStorageStatus();
  const parts = [
    `[media-storage] uploads=${s.uploadsPath}`,
    s.persistentDisk ? 'persistent-disk=yes' : 'persistent-disk=no',
    s.objectStorage ? `object-storage=${s.bucket}` : 'object-storage=off',
    s.redeploySafe ? 'redeploy-safe=yes' : 'redeploy-safe=NO — files will be lost on redeploy',
  ];
  if (s.redeploySafe) console.log(parts.join(' · '));
  else console.warn(parts.join(' · '));
}

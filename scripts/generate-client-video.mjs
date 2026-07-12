/**
 * Generate a 4–5 minute client presentation MP4 with live captures,
 * female voiceover (Microsoft Edge TTS), and Ken Burns motion on each scene.
 *
 * Run: npm run marketing:video
 */
import puppeteer from 'puppeteer';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { EdgeTTS } from 'edge-tts-universal';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BRAND } from '../marketing/brand.js';
import { SCENES, VOICE, PROSODY } from './video-narration.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'marketing');
const FRAMES_DIR = path.join(OUT_DIR, 'video-frames');
const AUDIO_DIR = path.join(OUT_DIR, 'video-audio');
const SEGMENTS_DIR = path.join(OUT_DIR, 'video-segments');
const OUT_FILE = path.join(OUT_DIR, 'FleetCo-Client-Presentation.mp4');
const PUBLIC_FILE = path.join(__dirname, '..', 'public', 'marketing', 'FleetCo-Client-Presentation.mp4');
const DOWNLOADS_FILE = path.join(process.env.USERPROFILE || '', 'Downloads', 'FleetCo-Client-Presentation.mp4');

const BASE = process.env.SITE_URL || 'https://fleetcomanagement.org';
const TOKEN_KEY = 'fleet_pulse_access_token';
const FFMPEG = ffmpegInstaller.path;
const FPS = 30;
const AUDIO_PAD_SEC = 0.6;

const ACCOUNTS = {
  owner: { email: 'jarell.slack@fleetcomanagement.org', password: 'FleetCo2026!' },
  driver: { email: 'driver1@fleetco.com', password: 'demo123' },
};

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function cleanDir(dir, ext) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    if (!ext || f.endsWith(ext)) fs.unlinkSync(path.join(dir, f));
  }
}

async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data.access_token;
}

function titleCardHtml({ kicker, title, body, accent = '#F59E0B' }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1920px;height:1080px;background:radial-gradient(ellipse at 20% 20%,#1e293b 0%,#0F172A 55%,#020617 100%);color:#fff;font-family:Segoe UI,Arial,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:120px}
    .bar{width:8px;height:120px;background:${accent};position:absolute;left:80px;top:480px;border-radius:4px}
    .kicker{color:${accent};font-size:28px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:24px}
    h1{font-size:72px;font-weight:900;line-height:1.05;max-width:1400px}
    p{font-size:32px;color:#94A3B8;margin-top:32px;max-width:1200px;line-height:1.4}
    .foot{position:absolute;bottom:80px;left:120px;color:#64748B;font-size:22px}
  </style></head><body>
    <div class="bar"></div>
    ${kicker ? `<div class="kicker">${kicker}</div>` : ''}
    <h1>${title}</h1>
    ${body ? `<p>${body}</p>` : ''}
    <div class="foot">${BRAND.website} · ${BRAND.phone} · ${BRAND.location}</div>
  </body></html>`;
}

function phoneFrameHtml(dataUrl, caption) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1920px;height:1080px;background:radial-gradient(ellipse at 70% 30%,#1e293b 0%,#0F172A 60%,#020617 100%);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,Arial,sans-serif;position:relative}
    .badge{position:absolute;top:72px;right:100px;background:#38BDF8;color:#0F172A;padding:14px 28px;border-radius:999px;font-weight:800;font-size:22px;letter-spacing:.04em}
    .wrap{display:flex;align-items:center;gap:80px;padding:0 100px;width:100%}
    .phone{width:420px;flex-shrink:0;height:860px;background:linear-gradient(145deg,#334155,#0f172a);border-radius:52px;padding:16px;box-shadow:0 50px 100px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08);border:2px solid #475569}
    .notch{width:140px;height:28px;background:#0f172a;border-radius:0 0 18px 18px;margin:-4px auto 8px}
    .screen{width:100%;height:calc(100% - 24px);border-radius:38px;overflow:hidden;background:#000}
    .screen img{width:100%;height:100%;object-fit:cover;object-position:top}
    .meta{flex:1;color:#fff}
    .meta h2{font-size:52px;font-weight:900;line-height:1.1;margin-bottom:20px}
    .meta p{font-size:28px;color:#94A3B8;line-height:1.5;max-width:720px}
    .meta .chip{display:inline-block;margin-top:28px;background:rgba(245,158,11,.15);color:#FCD34D;border:1px solid rgba(245,158,11,.35);padding:10px 18px;border-radius:999px;font-size:18px;font-weight:600}
  </style></head><body>
    <div class="badge">FleetCo Driver App</div>
    <div class="wrap">
      <div class="phone"><div class="notch"></div><div class="screen"><img src="${dataUrl}" alt=""/></div></div>
      <div class="meta">
        <h2>Built for drivers on the road</h2>
        <p>${caption || 'Mobile-first workflow synced to your portal in real time.'}</p>
        <div class="chip">iOS · Android · Mobile Web</div>
      </div>
    </div>
  </body></html>`;
}

function desktopFrameHtml(dataUrl, caption) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1920px;height:1080px;background:radial-gradient(ellipse at 30% 40%,#1e293b 0%,#0F172A 55%,#020617 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Segoe UI,Arial,sans-serif;padding:48px 80px 64px}
    .browser{width:100%;max-width:1680px;background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.45);border:1px solid #334155}
    .chrome{height:44px;background:#0f172a;display:flex;align-items:center;padding:0 16px;gap:8px;border-bottom:1px solid #334155}
    .dot{width:12px;height:12px;border-radius:50%}.r{background:#ef4444}.y{background:#eab308}.g{background:#22c55e}
    .url{flex:1;margin-left:12px;background:#1e293b;border-radius:8px;padding:8px 14px;color:#94a3b8;font-size:14px}
    .shot img{width:100%;display:block}
    .cap{margin-top:22px;color:#64748B;font-size:24px;text-align:center}
  </style></head><body>
    <div class="browser">
      <div class="chrome"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><div class="url">${BRAND.url}${caption ? '' : ''}</div></div>
      <div class="shot"><img src="${dataUrl}" alt=""/></div>
    </div>
    ${caption ? `<div class="cap">${caption}</div>` : ''}
  </body></html>`;
}

async function synthesizeNarration(text, outPath) {
  const tts = new EdgeTTS(text, VOICE, PROSODY);
  const result = await tts.synthesize();
  const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
  fs.writeFileSync(outPath, audioBuffer);
}

function getAudioDurationSec(file) {
  try {
    execFileSync(FFMPEG, ['-i', file], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
    if (match) {
      return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
    }
  }
  throw new Error(`Could not read audio duration: ${file}`);
}

async function shotHtml(page, html) {
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );
  await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 500));
  return page.screenshot({ type: 'png' });
}

async function captureLivePage(page, { url, token, mobile, scrollTo }) {
  page.setDefaultNavigationTimeout(120000);
  if (mobile) {
    await page.setUserAgent(MOBILE_UA);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  } else {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  }

  let path = url;
  let hashTarget = scrollTo || null;
  const hashIdx = url.indexOf('#');
  if (hashIdx >= 0) {
    path = url.slice(0, hashIdx) || '/';
    hashTarget = hashTarget || url.slice(hashIdx);
  }

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 120000 });
  if (token) {
    await page.evaluate((key, t) => localStorage.setItem(key, t), TOKEN_KEY, token);
  } else {
    await page.evaluate((key) => localStorage.removeItem(key), TOKEN_KEY);
  }

  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: 120000 });
  try {
    await page.waitForFunction(
      () => document.body && document.body.innerText.trim().length > 60,
      { timeout: 45000 },
    );
  } catch {
    await new Promise((r) => setTimeout(r, 4000));
  }

  const is404 = await page.evaluate(
    () => document.body.innerText.includes('404') && document.body.innerText.includes('Page Not Found'),
  );
  if (is404) {
    throw new Error(`404 Page Not Found while capturing ${path}`);
  }

  if (hashTarget) {
    const selector = hashTarget.startsWith('#') ? hashTarget : `#${hashTarget}`;
    try {
      await page.waitForSelector(selector, { timeout: 15000 });
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      }, selector);
      await new Promise((r) => setTimeout(r, 1500));
    } catch {
      throw new Error(`Scroll target missing: ${selector} on ${path}`);
    }
  } else if (!mobile) {
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  await new Promise((r) => setTimeout(r, 2000));
  return page.screenshot({ type: 'png', fullPage: false });
}

async function captureScene(page, scene, tokens) {
  if (scene.type === 'title') {
    const html = titleCardHtml(scene);
    return shotHtml(page, html);
  }

  const token = scene.type === 'portal' ? tokens.owner : scene.type === 'driver' ? tokens.driver : null;
  const mobile = scene.type === 'driver';
  const raw = await captureLivePage(page, {
    url: scene.url,
    token,
    mobile,
    scrollTo: scene.scrollTo,
  });

  const dataUrl = `data:image/png;base64,${raw.toString('base64')}`;
  const html = mobile ? phoneFrameHtml(dataUrl, scene.caption) : desktopFrameHtml(dataUrl, scene.caption);
  return shotHtml(page, html);
}

function buildSegment(imagePath, audioPath, durationSec, outPath) {
  const frames = Math.max(1, Math.ceil(durationSec * FPS));
  const fadeOutStart = Math.max(0, durationSec - 0.45);
  const filter = [
    `[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1`,
    `zoompan=z='min(zoom+0.0009,1.07)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=${FPS}`,
    'format=yuv420p[v]',
    `[1:a]afade=t=in:st=0:d=0.25,afade=t=out:st=${fadeOutStart.toFixed(3)}:d=0.4[a]`,
  ].join(',');

  execFileSync(
    FFMPEG,
    [
      '-y',
      '-loop',
      '1',
      '-i',
      imagePath,
      '-i',
      audioPath,
      '-filter_complex',
      filter,
      '-map',
      '[v]',
      '-map',
      '[a]',
      '-c:v',
      'libx264',
      '-tune',
      'stillimage',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-pix_fmt',
      'yuv420p',
      '-t',
      String(durationSec),
      outPath,
    ],
    { stdio: 'inherit' },
  );
}

function concatSegments(segmentPaths, outPath) {
  const listFile = path.join(SEGMENTS_DIR, 'concat.txt');
  const lines = segmentPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(listFile, lines);

  execFileSync(
    FFMPEG,
    [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listFile,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      outPath,
    ],
    { stdio: 'inherit' },
  );
}

async function main() {
  cleanDir(FRAMES_DIR, '.png');
  cleanDir(AUDIO_DIR, '.mp3');
  cleanDir(SEGMENTS_DIR, '.mp4');
  fs.mkdirSync(path.dirname(PUBLIC_FILE), { recursive: true });

  console.log(`Voice: ${VOICE} (${PROSODY.rate}, ${PROSODY.pitch})`);
  console.log(`Target: ${SCENES.length} scenes · ~4–5 minutes`);
  console.log(`Site: ${BASE}\n`);

  console.log('Authenticating…');
  const tokens = {
    owner: await apiLogin(ACCOUNTS.owner.email, ACCOUNTS.owner.password),
    driver: await apiLogin(ACCOUNTS.driver.email, ACCOUNTS.driver.password),
  };

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });
  const page = await browser.newPage();

  const segmentPaths = [];
  let totalSec = 0;

  for (let i = 0; i < SCENES.length; i += 1) {
    const scene = SCENES[i];
    const idx = String(i + 1).padStart(2, '0');
    const framePath = path.join(FRAMES_DIR, `${idx}-${scene.id}.png`);
    const audioPath = path.join(AUDIO_DIR, `${idx}-${scene.id}.mp3`);
    const segmentPath = path.join(SEGMENTS_DIR, `${idx}-${scene.id}.mp4`);

    console.log(`[${idx}/${SCENES.length}] ${scene.id}`);
    console.log('  · Generating voiceover…');
    await synthesizeNarration(scene.narration, audioPath);
    const audioDur = getAudioDurationSec(audioPath);
    const segmentDur = audioDur + AUDIO_PAD_SEC;
    totalSec += segmentDur;

    console.log('  · Capturing screen…');
    const png = await captureScene(page, scene, tokens);
    fs.writeFileSync(framePath, png);

    console.log(`  · Encoding segment (${segmentDur.toFixed(1)}s)…`);
    buildSegment(framePath, audioPath, segmentDur, segmentPath);
    segmentPaths.push(segmentPath);
  }

  await browser.close();

  console.log('\nMerging segments…');
  concatSegments(segmentPaths, OUT_FILE);
  fs.copyFileSync(OUT_FILE, PUBLIC_FILE);
  try {
    fs.copyFileSync(OUT_FILE, DOWNLOADS_FILE);
  } catch {
    /* Downloads copy is best-effort */
  }

  const sizeMb = (fs.statSync(OUT_FILE).size / (1024 * 1024)).toFixed(1);
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.round(totalSec % 60);

  console.log('\nDone.');
  console.log(`Duration: ${minutes}m ${seconds}s (${SCENES.length} scenes)`);
  console.log(`File: ${OUT_FILE} (${sizeMb} MB)`);
  console.log(`Public: ${BASE}/marketing/FleetCo-Client-Presentation.mp4`);
  if (fs.existsSync(DOWNLOADS_FILE)) {
    console.log(`Downloads: ${DOWNLOADS_FILE}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

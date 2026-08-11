/**
 * Rebuild client presentation MP4 — fresh Ava voiceover + slide frames (no login required).
 *
 * Run: npm run marketing:video:rebuild
 */
import puppeteer from 'puppeteer';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { EdgeTTS } from 'edge-tts-universal';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BRAND } from '../marketing/brand.js';
import { STOCK } from '../marketing/stock-images.mjs';
import { SCENES, VOICE, PROSODY } from './video-narration.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'marketing');
const FRAMES_DIR = path.join(OUT_DIR, 'video-frames');
const AUDIO_DIR = path.join(OUT_DIR, 'video-audio');
const SEGMENTS_DIR = path.join(OUT_DIR, 'video-segments');
const STOCK_DIR = path.join(OUT_DIR, 'video-stocks');
const OUT_FILE = path.join(OUT_DIR, 'FleetCo-Client-Presentation.mp4');
const PUBLIC_FILE = path.join(__dirname, '..', 'public', 'marketing', 'FleetCo-Client-Presentation.mp4');
const POSTER_FILE = path.join(__dirname, '..', 'public', 'marketing', 'video-poster.jpg');

const FFMPEG = ffmpegInstaller.path;
const FPS = 30;
const AUDIO_PAD_SEC = 0.6;

function cleanDir(dir, ext) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    if (!ext || f.endsWith(ext)) fs.unlinkSync(path.join(dir, f));
  }
}

function stockBgCss(stockUrl) {
  if (!stockUrl) {
    return 'background:radial-gradient(ellipse at 20% 20%,#1e293b 0%,#0F172A 55%,#020617 100%)';
  }
  return `background:linear-gradient(115deg,rgba(15,23,42,.92) 0%,rgba(15,23,42,.78) 45%,rgba(15,23,42,.55) 100%),url('${stockUrl}') center/cover no-repeat`;
}

function titleCardHtml({ kicker, title, body, accent = '#F59E0B', stockUrl = null }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1920px;height:1080px;${stockBgCss(stockUrl)};color:#fff;font-family:Segoe UI,Arial,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:120px 120px 120px 140px;position:relative}
    .bar{width:8px;height:120px;background:${accent};position:absolute;left:80px;top:480px;border-radius:4px;box-shadow:0 0 24px ${accent}88}
    .kicker{color:${accent};font-size:28px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:24px}
    h1{font-size:68px;font-weight:900;line-height:1.08;max-width:1400px;text-shadow:0 4px 24px rgba(0,0,0,.45)}
    p{font-size:30px;color:#E2E8F0;margin-top:32px;max-width:1200px;line-height:1.45;text-shadow:0 2px 12px rgba(0,0,0,.35)}
    .foot{position:absolute;bottom:80px;left:120px;color:#CBD5E1;font-size:22px}
  </style></head><body>
    <div class="bar"></div>
    ${kicker ? `<div class="kicker">${kicker}</div>` : ''}
    <h1>${title}</h1>
    ${body ? `<p>${body}</p>` : ''}
    <div class="foot">${BRAND.website} · ${BRAND.phone}</div>
  </body></html>`;
}

async function ensureStockImages() {
  fs.mkdirSync(STOCK_DIR, { recursive: true });
  const local = {};
  for (const [key, url] of Object.entries(STOCK)) {
    const file = path.join(STOCK_DIR, `${key}.jpg`);
    if (!fs.existsSync(file)) {
      const res = await fetch(url);
      if (res.ok) fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    if (fs.existsSync(file)) {
      local[key] = `file:///${file.replace(/\\/g, '/')}`;
    }
  }
  return local;
}

function sceneSlide(scene, stockLocal) {
  const stockUrl = scene.stockImage && stockLocal[scene.stockImage] ? stockLocal[scene.stockImage] : null;
  if (scene.type === 'title') {
    return titleCardHtml({
      kicker: scene.kicker,
      title: scene.title,
      body: scene.body,
      accent: scene.accent || '#F59E0B',
      stockUrl,
    });
  }
  const kicker =
    scene.type === 'driver' ? 'FleetCo Driver App'
      : scene.type === 'portal' ? 'Executive Portal'
        : 'fleetcomanagement.org';
  const accent = scene.type === 'driver' ? '#38BDF8' : '#F59E0B';
  const title = scene.caption || scene.id.replace(/-/g, ' ');
  const body = (scene.narration || '').split('. ').slice(0, 2).join('. ') + '.';
  return titleCardHtml({ kicker, title, body, accent, stockUrl });
}

async function renderFrame(page, html) {
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 400));
  return page.screenshot({ type: 'png' });
}

async function synthesizeNarration(text, outPath) {
  const tts = new EdgeTTS(text, VOICE, PROSODY);
  const result = await tts.synthesize();
  fs.writeFileSync(outPath, Buffer.from(await result.audio.arrayBuffer()));
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

function buildSegment(imagePath, audioPath, durationSec, outPath) {
  const frames = Math.max(1, Math.ceil(durationSec * FPS));
  const fadeOutStart = Math.max(0, durationSec - 0.45);
  const filter = [
    `[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1`,
    `zoompan=z='min(zoom+0.0009,1.07)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=${FPS}`,
    'format=yuv420p[v]',
    `[1:a]afade=t=in:st=0:d=0.35,afade=t=out:st=${fadeOutStart.toFixed(3)}:d=0.5[a]`,
  ].join(',');

  execFileSync(
    FFMPEG,
    [
      '-y', '-loop', '1', '-i', imagePath, '-i', audioPath,
      '-filter_complex', filter, '-map', '[v]', '-map', '[a]',
      '-c:v', 'libx264', '-tune', 'stillimage', '-c:a', 'aac', '-b:a', '192k',
      '-pix_fmt', 'yuv420p', '-t', String(durationSec), outPath,
    ],
    { stdio: 'inherit' },
  );
}

function concatSegments(segmentPaths, outPath) {
  const listFile = path.join(SEGMENTS_DIR, 'concat.txt');
  fs.writeFileSync(listFile, segmentPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
  execFileSync(
    FFMPEG,
    ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', outPath],
    { stdio: 'inherit' },
  );
}

async function main() {
  cleanDir(FRAMES_DIR, '.png');
  cleanDir(AUDIO_DIR, '.mp3');
  cleanDir(SEGMENTS_DIR, '.mp4');
  fs.mkdirSync(path.dirname(PUBLIC_FILE), { recursive: true });

  console.log(`Voice: ${VOICE} (${PROSODY.rate}, ${PROSODY.pitch})`);
  console.log(`Scenes: ${SCENES.length}\n`);

  const stockLocal = await ensureStockImages();

  const chromeCandidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  const executablePath = chromeCandidates.find((p) => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
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

    console.log('  · Slide frame…');
    const png = await renderFrame(page, sceneSlide(scene, stockLocal));
    fs.writeFileSync(framePath, png);

    console.log('  · Voiceover…');
    await synthesizeNarration(scene.narration, audioPath);

    const audioDur = getAudioDurationSec(audioPath);
    const segmentDur = audioDur + AUDIO_PAD_SEC;
    totalSec += segmentDur;

    console.log(`  · Encode (${segmentDur.toFixed(1)}s)…`);
    buildSegment(framePath, audioPath, segmentDur, segmentPath);
    segmentPaths.push(segmentPath);
  }

  await browser.close();

  console.log('\nMerging…');
  concatSegments(segmentPaths, OUT_FILE);
  fs.copyFileSync(OUT_FILE, PUBLIC_FILE);

  const introFrame = path.join(FRAMES_DIR, '01-intro.png');
  if (fs.existsSync(introFrame)) {
    execFileSync(FFMPEG, ['-y', '-i', introFrame, '-vf', 'scale=1920:1080', '-q:v', '2', POSTER_FILE], { stdio: 'ignore' });
  }

  const sizeMb = (fs.statSync(OUT_FILE).size / (1024 * 1024)).toFixed(1);
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.round(totalSec % 60);
  console.log(`\nDone — ${minutes}m ${seconds}s · ${sizeMb} MB`);
  console.log(`Public: ${PUBLIC_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

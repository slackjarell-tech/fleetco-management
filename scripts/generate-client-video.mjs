/**
 * Capture live site + driver app screenshots and compile a client presentation MP4.
 * Run: npm run marketing:video
 */
import puppeteer from 'puppeteer';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BRAND } from '../marketing/brand.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'marketing');
const FRAMES_DIR = path.join(OUT_DIR, 'video-frames');
const OUT_FILE = path.join(OUT_DIR, 'FleetCo-Client-Presentation.mp4');
const PUBLIC_FILE = path.join(__dirname, '..', 'public', 'marketing', 'FleetCo-Client-Presentation.mp4');

const BASE = process.env.SITE_URL || 'https://fleetcomanagement.org';
const TOKEN_KEY = 'fleet_pulse_access_token';
const SLIDE_SEC = 6;

const ACCOUNTS = {
  owner: { email: 'jarrell@fleetcomanagement.org', password: 'FleetCo2026!' },
  driver: { email: 'driver1@fleetco.com', password: 'demo123' },
};

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
    body{width:1920px;height:1080px;background:#0F172A;color:#fff;font-family:Segoe UI,Arial,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:120px}
    .bar{width:8px;height:120px;background:${accent};position:absolute;left:80px;top:480px}
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

async function shotPage(page, url, token) {
  page.setDefaultNavigationTimeout(120000);
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 120000 });
  if (token) {
    await page.evaluate((key, t) => localStorage.setItem(key, t), TOKEN_KEY, token);
  } else {
    await page.evaluate((key) => localStorage.removeItem(key), TOKEN_KEY);
  }

  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 120000 });
  try {
    await page.waitForFunction(
      () => document.body && document.body.innerText.trim().length > 80,
      { timeout: 45000 },
    );
  } catch {
    await new Promise((r) => setTimeout(r, 5000));
  }
  await new Promise((r) => setTimeout(r, 2000));
  return page.screenshot({ type: 'png', fullPage: false });
}

async function shotHtml(page, html) {
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 400));
  return page.screenshot({ type: 'png' });
}

function buildVideo(framePaths) {
  const inputs = [];
  const filters = [];
  framePaths.forEach((fp, i) => {
    inputs.push('-loop', '1', '-t', String(SLIDE_SEC), '-i', fp);
    filters.push(`[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v${i}]`);
  });
  const concatIn = framePaths.map((_, i) => `[v${i}]`).join('');
  const filterComplex = `${filters.join(';')};${concatIn}concat=n=${framePaths.length}:v=1:a=0[outv]`;

  execFileSync(ffmpegInstaller.path, [
    '-y',
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    '-preset', 'medium',
    '-movflags', '+faststart',
    OUT_FILE,
  ], { stdio: 'inherit' });
}

async function main() {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(PUBLIC_FILE), { recursive: true });

  for (const f of fs.readdirSync(FRAMES_DIR)) {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(FRAMES_DIR, f));
  }

  console.log('Logging in for portal captures…');
  const ownerToken = await apiLogin(ACCOUNTS.owner.email, ACCOUNTS.owner.password);
  const driverToken = await apiLogin(ACCOUNTS.driver.email, ACCOUNTS.driver.password);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });
  const page = await browser.newPage();

  const scenes = [
    { name: '01-intro', html: titleCardHtml({
      kicker: 'Client Presentation · July 2026',
      title: 'FleetCo Management',
      body: 'Complete fleet operations in one platform — website, portal, and mobile driver app.',
    }) },
    { name: '02-website', url: '/', token: null, caption: 'Public marketing site' },
    { name: '03-pricing', url: '/pricing', token: null, caption: 'Transparent monthly & yearly plans' },
    { name: '04-portal', url: '/portal', token: ownerToken, caption: 'Executive command center' },
    { name: '05-customers', url: '/portal/customers', token: ownerToken, caption: 'Customer & team management' },
    { name: '06-fleet', url: '/portal/fleet', token: ownerToken, caption: 'Fleet assets & documents' },
    { name: '07-loads', url: '/portal/loads', token: ownerToken, caption: 'Dispatch & load board' },
    { name: '08-maintenance', url: '/portal/maintenance', token: ownerToken, caption: 'Work orders & PM schedules' },
    { name: '09-driver-card', html: titleCardHtml({
      kicker: 'Mobile Driver App',
      title: 'FleetCo Driver — iOS & Android ready',
      body: 'Time clock, GPS, barcode scan, dashcam time-lapse, and in-cabin media — linked to the customer portal.',
    }) },
    { name: '10-driver-home', url: '/driver', token: driverToken, caption: 'Driver home & quick actions' },
    { name: '11-driver-dashcam', url: '/driver/dashcam', token: driverToken, caption: 'Dashcam & media capture' },
    { name: '12-driver-scan', url: '/driver/scan', token: driverToken, caption: 'Barcode scanning on the road' },
    { name: '13-close', html: titleCardHtml({
      kicker: 'Schedule a demo',
      title: 'Move freight. We handle the rest.',
      body: `${BRAND.phone} · ${BRAND.email} · Live demo at ${BRAND.url}/login`,
    }) },
  ];

  const framePaths = [];
  let idx = 0;
  for (const scene of scenes) {
    idx += 1;
    const out = path.join(FRAMES_DIR, `${String(idx).padStart(2, '0')}-${scene.name}.png`);
    console.log(`Capturing ${scene.name}…`);
    const buf = scene.html
      ? await shotHtml(page, scene.html)
      : await shotPage(page, scene.url, scene.token);
    fs.writeFileSync(out, buf);
    framePaths.push(out);
  }

  await browser.close();

  console.log('Encoding MP4…');
  buildVideo(framePaths);
  fs.copyFileSync(OUT_FILE, PUBLIC_FILE);

  const sizeMb = (fs.statSync(OUT_FILE).size / (1024 * 1024)).toFixed(1);
  console.log(`Created: ${OUT_FILE} (${sizeMb} MB)`);
  console.log(`Public URL: ${BASE}/marketing/FleetCo-Client-Presentation.mp4`);
  return { outFile: OUT_FILE, publicFile: PUBLIC_FILE, sizeMb: Number(sizeMb), slideCount: framePaths.length };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

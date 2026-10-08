/**
 * Shared screenshot capture for marketing decks & PDF manual.
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..', '..');
export const FRAMES_DIR = path.join(ROOT, 'marketing', 'manual-frames');
export const LEGACY_FRAMES = path.join(ROOT, 'marketing', 'video-frames');

export const BASE = process.env.SITE_URL || 'https://fleetcomanagement.org';
const TOKEN_KEY = 'fleet_pulse_access_token';
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

export const LOGIN_ACCOUNTS = [
  { email: process.env.FLEETCO_OWNER_EMAIL || 'jarell.slack@fleetcomanagement.org', password: process.env.FLEETCO_OWNER_PASSWORD || 'FleetCo2026!' },
  { email: 'admin@fleetco.com', password: 'admin123' },
];

export async function apiLogin() {
  for (const acct of LOGIN_ACCOUNTS) {
    if (!acct.password) continue;
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acct.email, password: acct.password }),
      });
      const data = await res.json();
      if (res.ok && data.access_token) return data.access_token;
    } catch {
      /* next */
    }
  }
  return null;
}

async function capturePage(page, { url, token, mobile }) {
  page.setDefaultNavigationTimeout(120000);
  if (mobile) {
    await page.setUserAgent(MOBILE_UA);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  } else {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  }

  if (token) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.evaluate((key, t) => localStorage.setItem(key, t), TOKEN_KEY, token);
  }

  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 120000 });
  try {
    await page.waitForFunction(
      () => document.body && document.body.innerText.trim().length > 40,
      { timeout: 30000 },
    );
  } catch {
    await new Promise((r) => setTimeout(r, 2500));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 1500));
  return page.screenshot({ type: 'png', fullPage: false });
}

export function resolveFramePath(id, fallback) {
  const primary = path.join(FRAMES_DIR, `${id}.png`);
  if (fs.existsSync(primary)) return primary;
  if (fallback) {
    const legacy = path.join(LEGACY_FRAMES, `${fallback}.png`);
    if (fs.existsSync(legacy)) return legacy;
  }
  return null;
}

/** @param {Array<{id:string,url:string,public?:boolean,mobile?:boolean,fallback?:string}>} shots */
export async function captureShots(shots, { refresh = false } = {}) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  const paths = {};

  let token = null;
  if (refresh && shots.some((s) => !s.public)) {
    token = await apiLogin();
    if (!token) console.warn('Could not login — using existing PNGs only');
  }

  let browser;
  if (refresh && (token || shots.some((s) => s.public))) {
    try {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    } catch (err) {
      console.warn('Puppeteer/Chrome unavailable — using cached PNGs only.', err.message);
    }
  }

  for (const shot of shots) {
    const outFile = path.join(FRAMES_DIR, `${shot.id}.png`);
    let captured = false;

    if (refresh && browser && (shot.public || token)) {
      try {
        const page = await browser.newPage();
        const buf = await capturePage(page, { url: shot.url, token: shot.public ? null : token, mobile: shot.mobile });
        fs.writeFileSync(outFile, buf);
        await page.close();
        paths[shot.id] = outFile;
        console.log('Captured', shot.id);
        captured = true;
      } catch (err) {
        console.warn(`Capture failed ${shot.id}:`, err.message);
      }
    }

    if (!captured) {
      const existing = resolveFramePath(shot.id, shot.fallback);
      if (existing) paths[shot.id] = existing;
    }
  }

  if (browser) await browser.close();
  return paths;
}

export const STANDARD_SHOTS = [
  { id: 'website-home', url: '/#platform-tour', public: true, fallback: '02-website-home' },
  { id: 'login', url: '/login', public: true },
  { id: 'portal-dashboard', url: '/portal', fallback: '04-portal-dashboard' },
  { id: 'portal-customers', url: '/portal/customers', fallback: '06-portal-customers' },
  { id: 'portal-fleet', url: '/portal/fleet', fallback: '05-portal-fleet' },
  { id: 'portal-workorders', url: '/portal/workorders', fallback: '09-portal-maintenance' },
  { id: 'portal-repairs', url: '/portal/repairs', fallback: '09-portal-maintenance' },
  { id: 'portal-loads', url: '/portal/loads', fallback: '06-portal-loads' },
  { id: 'portal-maintenance', url: '/portal/maintenance', fallback: '07-portal-maintenance' },
  { id: 'portal-parts', url: '/portal/parts' },
  { id: 'portal-accounting', url: '/portal/accounting' },
  { id: 'portal-reports', url: '/portal/reports' },
  { id: 'portal-vehicle-lookup', url: '/portal/vehicle-lookup' },
  { id: 'driver-home', url: '/driver', mobile: true, fallback: '09-driver-home' },
  { id: 'driver-clock', url: '/driver/clock', mobile: true, fallback: '15-driver-clock' },
];

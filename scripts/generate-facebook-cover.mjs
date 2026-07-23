/**
 * FleetCo Facebook cover photo (820×360, 2× export 1640×720).
 * Run: node scripts/generate-facebook-cover.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOGO = path.join(ROOT, 'public', 'assets', 'fleetco-logo.png');
const OUT_DIR = path.join(ROOT, 'public', 'marketing');

const W = 1640;
const H = 720;
const SAFE_W = 820;
const SAFE_H = 360;

async function buildCover(width, height, outPath) {
  const logo = sharp(LOGO);
  const meta = await logo.metadata();
  const logoMaxH = Math.round(height * 0.52);
  const logoBuf = await logo
    .resize({ height: logoMaxH, fit: 'inside' })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoBuf).metadata();

  const taglineSvg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="55%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:0"/>
      <stop offset="50%" style="stop-color:#f59e0b;stop-opacity:0.35"/>
      <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:0"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="0" y="${Math.round(height * 0.78)}" width="${width}" height="4" fill="url(#accent)"/>
  <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.82)}"
        font-family="Segoe UI, Arial, sans-serif" font-size="${Math.round(height * 0.045)}"
        font-weight="600" fill="#94a3b8" letter-spacing="2">FLEET OPERATIONS · DRIVER APP · ONE PLATFORM</text>
</svg>`;

  const bg = await sharp(Buffer.from(taglineSvg)).png().toBuffer();

  const logoLeft = Math.round(width * 0.08);
  const logoTop = Math.round((height - logoMeta.height) / 2 - height * 0.04);

  await sharp(bg)
    .composite([{ input: logoBuf, left: logoLeft, top: logoTop }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log(`Wrote ${outPath} (${width}×${height})`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const cover2x = path.join(OUT_DIR, 'FleetCo-Facebook-Cover-1640x720.png');
const cover1x = path.join(OUT_DIR, 'FleetCo-Facebook-Cover-820x360.png');

await buildCover(W, H, cover2x);
await buildCover(SAFE_W, SAFE_H, cover1x);

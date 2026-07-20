/**
 * Remove white background from logo PNGs and trim padding.
 * Run: node scripts/process-logo.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'assets', 'fleetco-logo.png');

function removeWhiteAlpha(data, width, height, threshold = 245) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r >= threshold && g >= threshold && b >= threshold) {
        data[i + 3] = 0;
      }
    }
  }
  return data;
}

async function processLogo(inputPath, outputPath, { cropTopRatio } = {}) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  removeWhiteAlpha(data, info.width, info.height);

  let pipeline = sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).trim({ threshold: 12 });

  if (cropTopRatio) {
    const meta = await pipeline.toBuffer({ resolveWithObject: true });
    const cropH = Math.round(meta.info.height * cropTopRatio);
    pipeline = sharp(meta.data, {
      raw: { width: meta.info.width, height: meta.info.height, channels: meta.info.channels },
    })
      .extract({ left: 0, top: 0, width: meta.info.width, height: cropH })
      .trim({ threshold: 12 });
  }

  await pipeline.png({ compressionLevel: 9 }).toFile(outputPath);
  const out = await sharp(outputPath).metadata();
  console.log(`Wrote ${outputPath} (${out.width}x${out.height})`);
}

const assetsDir = path.join(ROOT, 'public', 'assets');
const faviconPath = path.join(ROOT, 'public', 'favicon.png');

await processLogo(SRC, path.join(assetsDir, 'fleetco-logo.png'));
await processLogo(SRC, path.join(assetsDir, 'fleetco-icon.png'), { cropTopRatio: 0.58 });
await sharp(path.join(assetsDir, 'fleetco-icon.png'))
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(faviconPath);

console.log('Done — transparent logo assets updated.');

/**
 * Render a PNG preview of the FleetCo YMS example yard layout.
 * Run: node scripts/preview-yms-example.mjs
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CELL = 28;
const CELL_FT = 25;
const YARD = { name: 'Lone Star Terminal', width_ft: 400, length_ft: 300, cell_size_ft: 25 };
const COLS = 16;
const ROWS = 12;

const ELEMENTS = [
  { id: 'bld', type: 'building', label: 'Main Office', col: 10, row: 0, cols: 4, rows: 3, color: '#78716c', building: true },
  { id: 'd1', type: 'dock', label: 'Dock 1', col: 0, row: 0, cols: 2, rows: 1, color: '#3b82f6' },
  { id: 'd2', type: 'dock', label: 'Dock 2', col: 3, row: 0, cols: 2, rows: 1, color: '#3b82f6' },
  { id: 'gin', type: 'gate', label: 'Gate In', col: 15, row: 0, cols: 1, rows: 1, color: '#14b8a6' },
  { id: 'p1', type: 'parking', label: 'Trailer A1', col: 0, row: 2, cols: 2, rows: 3, color: '#166534', occupied: 'TR-101', parking: true },
  { id: 'p2', type: 'parking', label: 'Spot A2', col: 3, row: 2, cols: 2, rows: 2, color: '#22c55e', parking: true, empty: true },
  { id: 'p3', type: 'parking', label: 'Tractor B1', col: 6, row: 2, cols: 2, rows: 1, color: '#15803d', parking: true, empty: true },
  { id: 'stor', type: 'storage', label: 'Storage Lane 1', col: 0, row: 10, cols: 8, rows: 1, color: '#6366f1' },
  { id: 'gout', type: 'gate', label: 'Gate Out', col: 15, row: 11, cols: 1, rows: 1, color: '#f97316' },
];

function elHtml(el) {
  const w = el.cols * CELL - 4;
  const h = el.rows * CELL - 4;
  const left = el.col * CELL + 2;
  const top = el.row * CELL + 2;
  const border = el.building ? '2px solid rgba(0,0,0,0.3)' : el.parking && el.empty ? '2px dashed rgba(255,255,255,0.6)' : '2px solid rgba(255,255,255,0.35)';
  const bgImage = el.building
    ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%)'
    : 'none';
  const sub = el.occupied
    ? `<div style="font-size:9px;font-weight:400;opacity:0.9">${el.occupied}</div>`
    : el.empty
      ? '<div style="font-size:9px;font-weight:400;opacity:0.75">Empty</div>'
      : el.building
        ? `<div style="font-size:8px;font-weight:400;opacity:0.8">${el.cols * CELL_FT}×${el.rows * CELL_FT} ft</div>`
        : '';
  return `<div style="position:absolute;left:${left}px;top:${top}px;width:${w}px;height:${h}px;background:${el.color};border:${border};border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;text-align:center;padding:2px;background-size:12px 12px;background-image:${bgImage};box-shadow:${el.building ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'}"><div>${el.label}</div>${sub}</div>`;
}

const canvasW = COLS * CELL;
const canvasH = ROWS * CELL;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px}
  .frame{background:#fff;border-radius:20px;box-shadow:0 25px 80px rgba(0,0,0,0.45);overflow:hidden;max-width:920px;width:100%}
  .header{background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;padding:20px 28px;display:flex;justify-content:space-between;align-items:flex-start}
  .header h1{font-size:22px;font-weight:900;display:flex;align-items:center;gap:10px}
  .badge{background:#f59e0b;color:#0f172a;font-size:10px;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:0.05em}
  .sub{font-size:12px;color:#94a3b8;margin-top:6px}
  .tabs{display:flex;gap:8px;margin-top:12px}
  .tab{font-size:11px;font-weight:700;padding:6px 14px;border-radius:8px;background:#334155;color:#94a3b8}
  .tab.on{background:#f59e0b;color:#0f172a}
  .body{padding:24px 28px 28px;background:#f8fafc}
  .legend{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px;font-size:11px;color:#64748b}
  .leg{display:flex;align-items:center;gap:6px}
  .swatch{width:14px;height:14px;border-radius:3px}
  .canvas-wrap{overflow:auto;border-radius:12px;border:1px solid #cbd5e1;background:#e2e8f0;padding:16px}
  .meta{font-size:11px;color:#64748b;margin-bottom:8px;display:flex;justify-content:space-between}
  .canvas{position:relative;margin:0 auto;background:#e2e8f0;background-image:linear-gradient(to right,rgba(148,163,184,0.35) 1px,transparent 1px),linear-gradient(to bottom,rgba(148,163,184,0.35) 1px,transparent 1px);background-size:${CELL}px ${CELL}px}
  .foot{padding:14px 28px;background:#f1f5f9;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center}
</style></head><body>
<div class="frame">
  <div class="header">
    <div>
      <h1>🏭 Yard Management (YMS) <span class="badge">EXAMPLE</span></h1>
      <div class="sub">${YARD.name} · ${YARD.width_ft}×${YARD.length_ft} ft · Live view</div>
      <div class="tabs"><span class="tab">Design</span><span class="tab on">Live</span></div>
    </div>
  </div>
  <div class="body">
    <div class="legend">
      <span class="leg"><span class="swatch" style="background:#78716c"></span> Building</span>
      <span class="leg"><span class="swatch" style="background:#22c55e;border:1px dashed #fff"></span> Empty spot</span>
      <span class="leg"><span class="swatch" style="background:#166534"></span> Occupied</span>
      <span class="leg"><span class="swatch" style="background:#3b82f6"></span> Dock</span>
      <span class="leg"><span class="swatch" style="background:#6366f1"></span> Storage lane</span>
    </div>
    <div class="canvas-wrap">
      <div class="meta"><span>${YARD.name} · 16×12 grid @ ${CELL_FT} ft/cell</span><span>N ↑</span></div>
      <div class="canvas" style="width:${canvasW}px;height:${canvasH}px">
        ${ELEMENTS.map(elHtml).join('')}
      </div>
    </div>
  </div>
  <div class="foot">FleetCo YMS — customers design their own yard size, buildings, and parking spots in the portal</div>
</div>
</body></html>`;

const outDir = path.join(__dirname, '..', 'marketing');
const outFile = path.join(outDir, 'YMS-Example-Preview.png');
const downloadsFile = path.join(process.env.USERPROFILE || '', 'Downloads', 'FleetCo-YMS-Example.png');

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 980, height: 720, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.screenshot({ path: outFile, type: 'png' });
fs.copyFileSync(outFile, downloadsFile);
await browser.close();

console.log('Saved:', outFile);
console.log('Saved:', downloadsFile);

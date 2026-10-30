/**
 * Validates a .pptx has enough slides and non-empty text on each slide.
 * Usage: node scripts/audit-pptx-content.mjs path/to/deck.pptx [--min-slides=50]
 */
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const args = process.argv.slice(2);
const fileArg = args.find((a) => !a.startsWith('--'));
const minSlides = Number(args.find((a) => a.startsWith('--min-slides='))?.split('=')[1] || 1);

if (!fileArg || !fs.existsSync(fileArg)) {
  console.error('Usage: node scripts/audit-pptx-content.mjs <file.pptx> [--min-slides=50]');
  process.exit(1);
}

function stripXmlText(xml) {
  const chunks = [];
  const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    chunks.push(m[1]);
  }
  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

const buf = fs.readFileSync(path.resolve(fileArg));
const zip = await JSZip.loadAsync(buf);
const pres = await zip.file('ppt/presentation.xml')?.async('string');
if (!pres) {
  console.error('Invalid pptx: missing presentation.xml');
  process.exit(1);
}

const rels = await zip.file('ppt/_rels/presentation.xml.rels')?.async('string');
const slideTargets = [];
const relRe = /Id="([^"]+)"[^>]*Target="([^"]+)"/g;
const relMap = {};
let rm;
while ((rm = relRe.exec(rels || '')) !== null) {
  relMap[rm[1]] = rm[2];
}
const sldRe = /r:id="([^"]+)"/g;
while ((rm = sldRe.exec(pres)) !== null) {
  const target = relMap[rm[1]];
  if (target?.startsWith('slides/slide')) slideTargets.push(`ppt/${target.replace(/^\.\.\//, '')}`);
}

const uniqueSlides = [...new Set(slideTargets)];
const issues = [];
const MIN_CHARS = 48;

for (let i = 0; i < uniqueSlides.length; i += 1) {
  const slidePath = uniqueSlides[i];
  const xml = await zip.file(slidePath)?.async('string');
  if (!xml) {
    issues.push({ slide: i + 1, path: slidePath, problem: 'missing slide xml' });
    continue;
  }
  const text = stripXmlText(xml);
  if (text.length < MIN_CHARS) {
    issues.push({ slide: i + 1, path: slidePath, problem: `too little text (${text.length} chars)`, preview: text.slice(0, 80) });
  }
}

console.log(`File: ${fileArg}`);
console.log(`Slides: ${uniqueSlides.length} (minimum required: ${minSlides})`);

if (uniqueSlides.length < minSlides) {
  console.error(`FAIL: need at least ${minSlides} slides`);
  process.exit(1);
}

if (issues.length) {
  console.error('FAIL: blank or thin slides detected:');
  for (const iss of issues) {
    console.error(`  Slide ${iss.slide}: ${iss.problem}${iss.preview ? ` — "${iss.preview}"` : ''}`);
  }
  process.exit(1);
}

console.log(`PASS: all ${uniqueSlides.length} slides have substantive text (≥${MIN_CHARS} chars).`);

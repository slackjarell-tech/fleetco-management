/**
 * Export ICP prospect workbook for email outreach.
 * Usage: npm run marketing:icp-export
 *        node scripts/export-icp-prospect-spreadsheet.mjs --downloads
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../server/storePersist.js';
import { seedDatabase } from '../server/seed.js';
import {
  ICP_EXPORT_FILENAME,
  writeIcpProspectWorkbookFile,
  buildIcpProspectExportRows,
} from '../server/marketingTargetExport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

await initDatabase();
seedDatabase();

const args = process.argv.slice(2);
const toDownloads = args.includes('--downloads');

const marketingDir = path.join(ROOT, 'marketing');
const publicDir = path.join(ROOT, 'public', 'marketing');
fs.mkdirSync(marketingDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

const targets = [
  path.join(marketingDir, ICP_EXPORT_FILENAME),
  path.join(publicDir, ICP_EXPORT_FILENAME),
];

if (toDownloads) {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  if (home) targets.push(path.join(home, 'Downloads', ICP_EXPORT_FILENAME));
}

const written = [];
for (const out of targets) {
  try {
    const meta = await writeIcpProspectWorkbookFile(out, { includePortalRecords: true, fetchSafer: true });
    written.push({ ...meta, file: out });
  } catch (err) {
    console.warn('Skip', out, err.message);
  }
}

const rows = await buildIcpProspectExportRows({ includePortalRecords: true, fetchSafer: true });
const withEmail = rows.filter((r) => String(r.Email || '').includes('@')).length;

console.log('FleetCo ICP prospect export');
console.log('Total rows:', rows.length);
console.log('Rows with email (portal/CRM):', withEmail);
console.log('FMCSA/Motus rows without email:', rows.length - withEmail);
console.log('');
for (const w of written) {
  console.log('Wrote:', w.file);
}

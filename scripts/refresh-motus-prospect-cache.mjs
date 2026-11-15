/**
 * Refresh SAFER fields for seed USDOTs (Motus POC JSON is updated manually or via Cursor WebFetch).
 * Usage: npm run marketing:motus-cache
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uniqueProspectSeeds } from '../server/marketingProspectUsdots.js';
import { fetchSaferCarrierByUsdot } from '../server/fmcsaCarrierLookup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, '..', 'server', 'motus-prospect-cache.json');

const existing = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
const seeds = uniqueProspectSeeds();

for (const seed of seeds) {
  const usdot = seed.usdot;
  const safer = await fetchSaferCarrierByUsdot(usdot);
  if (safer.error && !safer.legalName) {
    console.warn('Skip', usdot, safer.error);
    continue;
  }
  existing[usdot] = {
    ...(existing[usdot] || {}),
    legalName: existing[usdot]?.legalName || safer.legalName,
    businessPhone: existing[usdot]?.businessPhone || safer.phone,
    address: existing[usdot]?.address || safer.physicalAddress,
    mcNumber: safer.mcNumber,
    powerUnits: safer.powerUnits,
    saferStatus: safer.usdotStatus,
    saferUrl: safer.saferUrl,
    saferSyncedAt: new Date().toISOString().slice(0, 10),
  };
  console.log('Updated', usdot, existing[usdot].legalName || safer.legalName);
  await new Promise((r) => setTimeout(r, 500));
}

existing._note = existing._note || 'POC from Motus + SAFER sync';
fs.writeFileSync(CACHE_PATH, `${JSON.stringify(existing, null, 2)}\n`);
console.log('Wrote', CACHE_PATH);

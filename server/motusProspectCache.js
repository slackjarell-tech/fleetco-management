import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, 'motus-prospect-cache.json');

let cacheMem = null;

export function loadMotusProspectCache() {
  if (cacheMem) return cacheMem;
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    const { _note, ...entries } = raw;
    cacheMem = entries;
    return cacheMem;
  } catch {
    cacheMem = {};
    return cacheMem;
  }
}

export function getMotusProspectRecord(usdot) {
  const id = String(usdot || '').replace(/\D/g, '');
  return loadMotusProspectCache()[id] || null;
}

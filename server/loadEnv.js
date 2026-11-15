/**
 * Load server/local.env (gitignored) — Twilio + Revan without committing secrets.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const CANDIDATES = [
  path.join(__dirname, 'local.env'),
  path.join(ROOT, '.env'),
  path.join(ROOT, 'server', '.env'),
];

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const eq = trimmed.indexOf('=');
  if (eq <= 0) return null;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  return { key, val };
}

export function loadLocalEnv() {
  for (const file of CANDIDATES) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      if (process.env[parsed.key] === undefined || process.env[parsed.key] === '') {
        process.env[parsed.key] = parsed.val;
      }
    }
    console.log(`[env] loaded ${path.basename(file)}`);
    return file;
  }
  return null;
}
/**
 * Tier-3 harness memory — persistent executive context on the server (Luke-style context files).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, 'revan-executive-memory.json');

const MAX_TURNS = 40;
const MAX_NOTES = 12;

function readStore() {
  try {
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeStore(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function bucket(userId) {
  const store = readStore();
  if (!store[userId]) {
    store[userId] = { turns: [], notes: [], updated_at: null };
  }
  return store[userId];
}

export function getRevanMemoryThread(userId) {
  const store = readStore();
  return store[userId]?.turns || [];
}

export function appendRevanMemoryTurn(userId, userText, assistantText) {
  if (!userId) return;
  const store = readStore();
  const b = bucket(userId);
  b.turns.push({
    at: new Date().toISOString(),
    user: String(userText || '').slice(0, 2000),
    assistant: String(assistantText || '').slice(0, 4000),
  });
  if (b.turns.length > MAX_TURNS) b.turns = b.turns.slice(-MAX_TURNS);
  b.updated_at = new Date().toISOString();
  store[userId] = b;
  writeStore(store);
}

export function addRevanMemoryNote(userId, note) {
  if (!userId || !note?.trim()) return;
  const store = readStore();
  const b = bucket(userId);
  b.notes.push({ at: new Date().toISOString(), text: note.trim().slice(0, 500) });
  if (b.notes.length > MAX_NOTES) b.notes = b.notes.slice(-MAX_NOTES);
  b.updated_at = new Date().toISOString();
  store[userId] = b;
  writeStore(store);
}

export function revanMemorySystemSnippet(userId) {
  const store = readStore();
  const b = store[userId];
  if (!b) return '';
  const recent = (b.turns || []).slice(-6);
  const notes = (b.notes || []).slice(-4);
  if (!recent.length && !notes.length) return '';

  const lines = ['Persistent Revan memory (executive harness):'];
  for (const n of notes) {
    lines.push(`- Note: ${n.text}`);
  }
  for (const t of recent.slice(-3)) {
    lines.push(`- Prior: User said "${t.user.slice(0, 120)}" → you replied "${t.assistant.slice(0, 160)}…"`);
  }
  return lines.join('\n');
}
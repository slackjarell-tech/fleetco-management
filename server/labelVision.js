/**
 * Shipping label vision — extract delivery address from label photos (Gemini).
 */
import path from 'path';
import { readFileBuffer } from './mediaStorage.js';

function normalizeEnv(value) {
  if (!value || typeof value !== 'string') return '';
  let v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

function geminiApiKey() {
  return normalizeEnv(process.env.GEMINI_API_KEY);
}

async function imageUrlToBase64(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const buf = await readFileBuffer(imageUrl);
  if (!buf) return null;
  const ext = path.extname(imageUrl).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return { data: buf.toString('base64'), mime };
}

function parseLabelJson(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const o = JSON.parse(match[0]);
    if (!o || typeof o !== 'object') return null;
    return o;
  } catch {
    return null;
  }
}

function clean(s) {
  return String(s || '').trim();
}

/**
 * Read a shipping label photo and return structured delivery fields.
 * Only returns data clearly visible on the label — never fabricates.
 */
export async function parseShippingLabelImage(imageUrl, { barcodeHint } = {}) {
  if (!geminiApiKey()) {
    throw new Error('Label reading requires GEMINI_API_KEY on the server — ask your fleet admin to enable AI.');
  }

  const image = await imageUrlToBase64(imageUrl);
  if (!image) throw new Error('Could not read label photo');

  const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey()}`;

  const hint = barcodeHint ? `\nBarcode already scanned (tracking hint): ${barcodeHint}` : '';

  const prompt = `You are FleetCo delivery label OCR. Read this shipping label photo and extract the DELIVERY / SHIP TO address only.${hint}

Return ONLY valid JSON (no markdown):
{
  "tracking_number": "",
  "recipient_name": "",
  "recipient_phone": "",
  "address": "",
  "city": "",
  "state": "",
  "zip": "",
  "package_description": "",
  "notes": ""
}

Rules:
- Use the recipient / ship-to block, NOT the sender or return address.
- "address" is street line(s) only — no city/state/zip in address.
- "state" is 2-letter US state when visible.
- Leave fields empty string if not clearly readable — do not guess.
- tracking_number: prefer the main carrier tracking barcode number if visible.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: image.mime, data: image.data } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Label vision error (${res.status})`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  const raw = parseLabelJson(text);
  if (!raw) throw new Error('Could not read delivery address from label — retake photo with full label in frame');

  return {
    tracking_number: clean(raw.tracking_number),
    recipient_name: clean(raw.recipient_name),
    recipient_phone: clean(raw.recipient_phone),
    address: clean(raw.address),
    city: clean(raw.city),
    state: clean(raw.state)?.toUpperCase().slice(0, 2),
    zip: clean(raw.zip),
    package_description: clean(raw.package_description),
    notes: clean(raw.notes),
    barcode_format: 'label_vision',
    raw: imageUrl,
    vision_model: model,
  };
}

export function isLabelVisionConfigured() {
  return !!geminiApiKey();
}

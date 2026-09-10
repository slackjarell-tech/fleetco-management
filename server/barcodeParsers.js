/**
 * Server-side barcode parsers (mirrors src/lib/barcodeParsers.js)
 */

const US_STATE = /^[A-Z]{2}$/;

function clean(s) {
  return String(s || '').trim();
}

function tryJson(raw) {
  if (!raw.startsWith('{') && !raw.startsWith('[')) return null;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return null;
    return {
      tracking_number: clean(o.tracking || o.tracking_number || o.trackingNumber || o.barcode || o.package_id),
      recipient_name: clean(o.name || o.recipient_name || o.recipientName || o.customer_name),
      recipient_phone: clean(o.phone || o.recipient_phone || o.recipientPhone),
      address: clean(o.address || o.street || o.line1 || o.address1),
      city: clean(o.city),
      state: clean(o.state || o.province)?.toUpperCase().slice(0, 2),
      zip: clean(o.zip || o.postal || o.postal_code || o.zipCode),
      package_description: clean(o.package || o.description || o.package_description),
      notes: clean(o.notes || o.instructions || o.delivery_notes),
      barcode_format: 'json_qr',
      raw,
    };
  } catch {
    return null;
  }
}

function tryDelimited(raw) {
  const sep = raw.includes('|') ? '|' : raw.includes('\t') ? '\t' : null;
  if (!sep) return null;
  const parts = raw.split(sep).map(clean);
  if (parts.length < 4) return null;
  const [p0, p1, p2, p3, p4, p5, p6] = parts;
  if (US_STATE.test(p3?.toUpperCase()) && /^\d{5}/.test(p4)) {
    return {
      tracking_number: p0,
      recipient_name: p1,
      address: p2,
      city: p3,
      state: p4?.toUpperCase().slice(0, 2),
      zip: p5,
      recipient_phone: p6,
      barcode_format: 'manifest_delimited',
      raw,
    };
  }
  return null;
}

function detectTrackingFormat(raw) {
  const code = clean(raw).toUpperCase();
  if (/^TBA[A-Z0-9]{8,}$/.test(code)) return { tracking_number: code, barcode_format: 'carrier_tba' };
  if (/^1Z[A-Z0-9]{16}$/.test(code)) return { tracking_number: code, barcode_format: 'carrier_ups' };
  if (/^\d{12,22}$/.test(code)) return { tracking_number: code, barcode_format: 'carrier_numeric' };
  if (/^C\d{8,}$/i.test(code)) return { tracking_number: code.toUpperCase(), barcode_format: 'carrier_alpha' };
  if (/^D\d{14,}$/i.test(code)) return { tracking_number: code.toUpperCase(), barcode_format: 'carrier_alpha_long' };
  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(code)) return { tracking_number: code, barcode_format: 'carrier_postal' };
  return null;
}

/** Multi-line label text (PDF417, Data Matrix, or pasted label block). */
function tryMultiLineLabelText(rawInput) {
  const normalized = String(rawInput || '')
    .replace(/[\x1d\x1e\x1f]/g, '\n')
    .replace(/\r/g, '\n');
  const lines = normalized.split(/\n+/).map(clean).filter(Boolean);
  if (lines.length < 2) return null;

  const headerRe = /^(ship\s*to|deliver\s*to|send\s*to|consignee|recipient):?$/i;
  const skipRe = /^(from|return|sender|shipper|billing):?$/i;
  const cszRe = /^(.+?)[,\s]+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i;

  let startIdx = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (headerRe.test(lines[i])) {
      startIdx = i + 1;
      break;
    }
  }

  let cszIdx = -1;
  let cszMatch = null;
  for (let i = startIdx; i < lines.length; i += 1) {
    const m = lines[i].match(cszRe);
    if (m) {
      cszIdx = i;
      cszMatch = m;
      break;
    }
  }
  if (cszIdx < 1 || !cszMatch) return null;

  const city = clean(cszMatch[1]);
  const state = clean(cszMatch[2]).toUpperCase();
  const zip = clean(cszMatch[3]);

  const block = lines.slice(startIdx, cszIdx).filter((l) => !skipRe.test(l));
  if (!block.length) return null;

  let recipient_name = '';
  let address = '';
  if (block.length >= 2) {
    recipient_name = block[0];
    address = block.slice(1).join(', ');
  } else {
    recipient_name = 'Recipient';
    address = block[0];
  }

  let tracking_number = '';
  for (const line of lines) {
    const t = detectTrackingFormat(line);
    if (t?.tracking_number) {
      tracking_number = t.tracking_number;
      break;
    }
  }

  if (!address || !city) return null;

  return {
    tracking_number,
    recipient_name,
    address,
    city,
    state,
    zip,
    barcode_format: 'label_multiline',
    raw: rawInput,
  };
}

export function parseDeliveryBarcode(rawInput) {
  const raw = clean(rawInput);
  if (!raw) return { raw: '', barcode_format: 'empty' };

  const json = tryJson(raw);
  if (json?.recipient_name && json?.address) return json;

  const delimited = tryDelimited(raw);
  if (delimited?.recipient_name && delimited?.address) return delimited;

  const multiline = tryMultiLineLabelText(raw);
  if (multiline?.address && multiline?.city) return multiline;

  const tracking = detectTrackingFormat(raw);
  if (tracking) return { ...tracking, raw };

  if (raw.includes(',') && raw.split(',').length >= 5) {
    const [tracking_number, recipient_name, address, city, state, zip, phone] = raw.split(',').map(clean);
    if (recipient_name && address) {
      return {
        tracking_number,
        recipient_name,
        address,
        city,
        state: state?.toUpperCase().slice(0, 2),
        zip,
        recipient_phone: phone,
        barcode_format: 'manifest_csv',
        raw,
      };
    }
  }

  return { tracking_number: raw, barcode_format: 'unknown', raw };
}

export function hasDeliverableAddress(parsed) {
  return !!(parsed?.address && parsed?.city && (parsed?.recipient_name || parsed?.state || parsed?.zip));
}

function normalizeOcrText(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/SHIP\s*T[0O]/gi, 'SHIP TO')
    .replace(/DELIVER\s*T[0O]/gi, 'DELIVER TO')
    .replace(/SEND\s*T[0O]/gi, 'SEND TO');
}

function tryCszLine(line) {
  const attempts = [line, line.replace(/O/g, '0'), line.replace(/I/g, '1')];
  const cszRe = /^(.+?)[,\s]+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i;
  for (const attempt of attempts) {
    const m = attempt.match(cszRe);
    if (m) {
      return {
        city: clean(m[1]),
        state: clean(m[2]).toUpperCase(),
        zip: clean(m[3]),
      };
    }
  }
  return null;
}

/** Parse OCR or pasted label text into delivery fields (no AI). */
export function parseLabelText(rawText) {
  const normalized = normalizeOcrText(rawText);
  const multiline = tryMultiLineLabelText(normalized);
  if (multiline?.address && multiline?.city) {
    return { ...multiline, barcode_format: 'label_ocr' };
  }

  const lines = normalized.split(/\n+/).map(clean).filter(Boolean);
  if (lines.length < 2) return null;

  const headerRe = /^(ship\s*to|deliver\s*to|send\s*to|consignee|recipient|to):?$/i;
  const skipRe = /^(from|return|sender|shipper|billing|sold\s*to):?$/i;
  const stopRe = /^(return|from|sender|shipper|billing|tracking|barcode|ups|usps|fedex|amazon)/i;

  let startIdx = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (headerRe.test(lines[i])) {
      startIdx = i + 1;
      break;
    }
  }

  let cszIdx = -1;
  let csz = null;
  for (let i = startIdx; i < lines.length; i += 1) {
    if (stopRe.test(lines[i])) break;
    const hit = tryCszLine(lines[i].toUpperCase());
    if (hit) {
      cszIdx = i;
      csz = hit;
    }
  }

  if (cszIdx < 1 || !csz) return null;

  const block = lines.slice(startIdx, cszIdx).filter((l) => !skipRe.test(l) && l.length > 1);
  if (!block.length) return null;

  let recipient_name = '';
  let address = '';
  if (block.length >= 2) {
    recipient_name = block[0];
    address = block.slice(1).join(', ');
  } else {
    recipient_name = 'Recipient';
    address = block[0];
  }

  let tracking_number = '';
  for (const line of lines) {
    const t = detectTrackingFormat(line);
    if (t?.tracking_number) {
      tracking_number = t.tracking_number;
      break;
    }
  }

  return {
    tracking_number,
    recipient_name,
    address,
    city: csz.city,
    state: csz.state,
    zip: csz.zip,
    barcode_format: 'label_ocr',
    raw: rawText,
  };
}

export function mergeParsedDelivery(primary, secondary) {
  if (!primary && !secondary) return null;
  const a = primary || {};
  const b = secondary || {};
  return {
    tracking_number: a.tracking_number || b.tracking_number || '',
    recipient_name: a.recipient_name || b.recipient_name || '',
    recipient_phone: a.recipient_phone || b.recipient_phone || '',
    address: a.address || b.address || '',
    city: a.city || b.city || '',
    state: a.state || b.state || '',
    zip: a.zip || b.zip || '',
    package_description: a.package_description || b.package_description || '',
    notes: a.notes || b.notes || '',
    barcode_format: a.barcode_format || b.barcode_format || 'merged',
    raw: a.raw || b.raw || '',
  };
}

export function formatStopAddress(stop) {
  return [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ');
}

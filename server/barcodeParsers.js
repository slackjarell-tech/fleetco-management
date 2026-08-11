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

export function parseDeliveryBarcode(rawInput) {
  const raw = clean(rawInput);
  if (!raw) return { raw: '', barcode_format: 'empty' };

  const json = tryJson(raw);
  if (json?.recipient_name && json?.address) return json;

  const delimited = tryDelimited(raw);
  if (delimited?.recipient_name && delimited?.address) return delimited;

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
  return !!(parsed?.recipient_name && parsed?.address && parsed?.city);
}

export function formatStopAddress(stop) {
  return [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ');
}

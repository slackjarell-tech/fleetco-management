import crypto from 'crypto';

function getKey() {
  const raw = (process.env.PAYROLL_ENCRYPTION_KEY || '').trim();
  if (raw.length >= 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    return Buffer.from(raw.slice(0, 64), 'hex');
  }
  if (raw.length >= 32) {
    return crypto.createHash('sha256').update(raw).digest();
  }
  return null;
}

export function maskAccountLast4(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return digits.slice(-4);
}

export function encryptSensitive(plaintext) {
  const text = String(plaintext || '').trim();
  if (!text) return { ciphertext: '', last4: '', mode: 'empty' };

  const key = getKey();
  const last4 = maskAccountLast4(text);
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PAYROLL_ENCRYPTION_KEY must be set in production to store bank numbers');
    }
    return {
      ciphertext: Buffer.from(text, 'utf8').toString('base64'),
      last4,
      mode: 'dev_base64',
    };
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, enc]).toString('base64');
  return { ciphertext: payload, last4, mode: 'aes-256-gcm' };
}

export function decryptSensitive(ciphertext, mode) {
  if (!ciphertext) return '';
  if (mode === 'dev_base64') {
    return Buffer.from(ciphertext, 'base64').toString('utf8');
  }
  if (mode !== 'aes-256-gcm') return '';

  const key = getKey();
  if (!key) throw new Error('PAYROLL_ENCRYPTION_KEY required to decrypt bank data');

  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

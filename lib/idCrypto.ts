import crypto from 'crypto';

const KEY_SOURCE = process.env.ID_ENCRYPT_KEY || process.env.JWT_SECRET || 'change-me-in-production';
const KEY = crypto.createHash('sha256').update(KEY_SOURCE).digest();
const ALGO = 'aes-256-cbc';

// Manual base64url encode/decode — avoids relying on Buffer's 'base64url'
// encoding, which isn't supported in every runtime this code may run in.
function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Buffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + pad, 'base64');
}

// Encrypts a numeric/string DB id into an opaque, URL-safe token.
export function encryptId(id: string | number): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(id), 'utf8'), cipher.final()]);
  return toBase64Url(Buffer.concat([iv, encrypted]));
}

// Decrypts a token back into the original id string.
// Falls back to returning the input unchanged if it isn't a valid token
// (e.g. an old bookmarked URL with a plain numeric id), so routes keep working.
export function decryptId(token: string): string {
  try {
    const buf = fromBase64Url(token);
    if (buf.length <= 16) return token;
    const iv = buf.subarray(0, 16);
    const data = buf.subarray(16);
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    return /^\d+$/.test(decrypted) ? decrypted : token;
  } catch {
    return token;
  }
}

export function decryptIdNum(token: string): number {
  return Number(decryptId(token));
}

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const STATE_TTL_MS = 10 * 60 * 1000;

export function createQuickBooksOAuthState(secret: string, now = Date.now()): string {
  const payload = `${now}.${randomBytes(24).toString('base64url')}`;
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyQuickBooksOAuthState(
  state: string,
  secret: string,
  now = Date.now(),
): boolean {
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [timestampText, nonce, signature] = parts;
  if (!timestampText || !nonce || !signature || !/^\d+$/.test(timestampText) || !/^[A-Za-z0-9_-]{32}$/.test(nonce) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return false;

  const timestamp = Number(timestampText);
  if (!Number.isSafeInteger(timestamp) || timestamp > now || now - timestamp > STATE_TTL_MS) {
    return false;
  }

  const expected = createHmac('sha256', secret)
    .update(`${timestampText}.${nonce}`)
    .digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

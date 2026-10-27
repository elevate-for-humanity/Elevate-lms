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
  const [timestampText, nonce, signature] = state.split('.');
  if (!timestampText || !nonce || !signature || !/^\d+$/.test(timestampText)) return false;

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

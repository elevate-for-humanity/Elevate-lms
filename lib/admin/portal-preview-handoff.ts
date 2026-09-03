import 'server-only';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

type PreviewHandoff = {
  actorId: string;
  targetId: string;
  expiresAt: number;
  nonce: string;
};

function signingKey(): string {
  const key = process.env.PORTAL_PREVIEW_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Portal preview signing secret is not configured');
  return key;
}

function signature(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url');
}

export function createPortalPreviewHandoff(actorId: string, targetId: string, ttlMs = 2 * 60 * 1000): string {
  const payload = Buffer.from(JSON.stringify({
    actorId,
    targetId,
    expiresAt: Date.now() + ttlMs,
    nonce: randomUUID(),
  } satisfies PreviewHandoff)).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifyPortalPreviewHandoff(token: string): PreviewHandoff | null {
  const [payload, suppliedSignature, extra] = token.split('.');
  if (!payload || !suppliedSignature || extra) return null;
  const expected = signature(payload);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as PreviewHandoff;
    if (!parsed.actorId || !parsed.targetId || !parsed.nonce || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

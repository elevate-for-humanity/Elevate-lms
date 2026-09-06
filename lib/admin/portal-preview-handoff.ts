import 'server-only';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

type PreviewHandoff = {
  actorId: string;
  targetId: string;
  expiresAt: number;
  nonce: string;
};

function signingKeys(): string[] {
  // Admin and LMS share the canonical service-role key. Prefer it so a
  // service-specific PORTAL_PREVIEW_SIGNING_SECRET cannot make cross-service
  // handoffs unverifiable. Keep configured portal secrets as verification
  // fallbacks so tokens issued immediately before a rollout still work.
  const keys = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.PORTAL_PREVIEW_SIGNING_SECRET,
  ].filter((key): key is string => Boolean(key?.trim()));

  const uniqueKeys = [...new Set(keys)];
  if (!uniqueKeys.length) throw new Error('Portal preview signing secret is not configured');
  return uniqueKeys;
}

function signature(payload: string, key = signingKeys()[0]!): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
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
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const signatureMatches = signingKeys().some((key) => {
    const expectedBuffer = Buffer.from(signature(payload, key));
    return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
  });
  if (!signatureMatches) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as PreviewHandoff;
    if (!parsed.actorId || !parsed.targetId || !parsed.nonce || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

import crypto from 'crypto';

/**
 * Extract the client IP from request headers.
 *
 * Priority: cf-connecting-ip → x-forwarded-for (first hop) → x-real-ip → 'unknown'
 *
 * Previously duplicated in:
 *   - app/api/applications/route.ts
 *   - app/api/ai-tutor/public/route.ts
 *   - app/api/verify/route.ts
 *   - lib/api/withRateLimit.ts
 */
export function getClientIp(request: Request): string {
  const h = request.headers;
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * One-way SHA-256 hash of an IP for logging / rate-limit keying
 * without storing raw IPs.
 *
 * @param ip   Raw IP string
 * @param salt Per-use salt (defaults to env `IP_HASH_SALT`)
 * @param len  Hex characters to keep (default 16)
 */
export function hashIp(ip: string, salt?: string, len = 16): string {
  const s = salt ?? process.env.IP_HASH_SALT ?? 'elevate-default';
  return crypto
    .createHash('sha256')
    .update(`${ip}:${s}`)
    .digest('hex')
    .slice(0, len);
}

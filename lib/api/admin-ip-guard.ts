/**
 * Admin IP allowlist guard
 *
 * Optional hardening for high-privilege routes (/admin/*, /api/admin/*).
 * Controlled by ADMIN_IP_ALLOWLIST env var — comma-separated CIDRs or IPs.
 * If the env var is not set, the guard is a no-op (allows all IPs).
 *
 * Recommended: set in Netlify production env only. Leave unset in preview/dev.
 *
 * Usage in an API route:
 *   import { checkAdminIP } from '@/lib/api/admin-ip-guard';
 *   const blocked = checkAdminIP(request);
 *   if (blocked) return blocked;
 *
 * Cloudflare alternative:
 *   If Cloudflare Access or WAF rules are used for admin path protection,
 *   this guard can remain as a defense-in-depth layer or be disabled.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

function parseAllowlist(): string[] {
  const raw = process.env.ADMIN_IP_ALLOWLIST ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function ipInCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr;

  const [network, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);

  const ipParts = ip.split('.').map(Number);
  const netParts = network.split('.').map(Number);

  if (ipParts.length !== 4 || netParts.length !== 4) return false;

  const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  const netInt = (netParts[0] << 24) | (netParts[1] << 16) | (netParts[2] << 8) | netParts[3];
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

  return (ipInt & mask) === (netInt & mask);
}

function isAllowed(ip: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true; // no restriction configured
  return allowlist.some((entry) => ipInCidr(ip, entry));
}

/**
 * Check if the request IP is in the admin allowlist.
 * Returns a 403 NextResponse if blocked, or null if allowed.
 */
export function checkAdminIP(request: NextRequest): NextResponse | null {
  const allowlist = parseAllowlist();
  if (allowlist.length === 0) return null; // guard disabled

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '';

  if (!isAllowed(ip, allowlist)) {
    logger.warn('Admin IP guard: blocked request', { ip, path: request.nextUrl.pathname });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

/**
 * Admin IP allowlist guard
 *
 * Optional hardening for high-privilege routes (/admin/*, /api/admin/*).
 * Controlled by ADMIN_IP_ALLOWLIST env var — comma-separated CIDRs or IPs.
 * If the env var is not set, the guard is a no-op (allows all IPs).
 *
 * Recommended: set in SSM /elevate/ADMIN_IP_ALLOWLIST. Leave unset in dev.
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

function ipInCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr;

  const [network, prefixStr] = cidr.split('/');
  if (network === undefined || prefixStr === undefined) return false;

  const prefix = Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;

  const parseIpv4 = (value: string): number | null => {
    const parts = value.split('.');
    if (parts.length !== 4) return null;

    let result = 0;
    for (const part of parts) {
      if (!/^\d{1,3}$/.test(part)) return null;
      const octet = Number(part);
      if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
      result = (result << 8) | octet;
    }

    return result >>> 0;
  };

  const ipInt = parseIpv4(ip);
  const netInt = parseIpv4(network);
  if (ipInt === null || netInt === null) return false;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

  return (ipInt & mask) === (netInt & mask);
}

function isAllowed(ip: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true; // no restriction configured
  return allowlist.some((entry) => ipInCidr(ip, entry));
}

/**
 * Edge-safe guard. Security middleware must use the immutable runtime
 * environment and must never import the server-only Supabase admin client.
 * Platform settings remain available to server routes through
 * lib/admin/security-settings.ts, but cannot weaken this request boundary.
 */
export function checkAdminIP(request: NextRequest): NextResponse | null {
  const raw = process.env.ADMIN_IP_ALLOWLIST ?? '';
  const allowlist = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowlist.length === 0) return null;

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '';

  if (!isAllowed(ip, allowlist)) {
    logger.warn('Admin IP guard: blocked request (sync)', { ip, path: request.nextUrl.pathname });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

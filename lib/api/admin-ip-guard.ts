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
import { getSecuritySettings } from '@/lib/admin/security-settings';

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
 * Async version — reads allowlist from cache (env var → platform_settings DB fallback).
 * Use this in middleware and API routes where async is available.
 */
export async function checkAdminIPAsync(request: NextRequest): Promise<NextResponse | null> {
  const { ipAllowlist } = await getSecuritySettings();
  if (ipAllowlist.length === 0) return null;

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '';

  if (!isAllowed(ip, ipAllowlist)) {
    logger.warn('Admin IP guard: blocked request', { ip, path: request.nextUrl.pathname });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/**
 * Sync version — reads from env var only (no DB fallback).
 * Use in contexts where async is not available.
 */
export function checkAdminIP(request: NextRequest): NextResponse | null {
  const raw = process.env.ADMIN_IP_ALLOWLIST ?? '';
  const allowlist = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (allowlist.length === 0) return null;

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '';

  if (!isAllowed(ip, allowlist)) {
    logger.warn('Admin IP guard: blocked request (sync)', { ip, path: request.nextUrl.pathname });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Canonical URL helpers.
 *
 * All URLs come from environment variables set in AWS SSM (/elevate/*).
 * No localhost fallbacks — missing vars in production are caught at call time.
 *
 * Required SSM parameters:
 *   /elevate/NEXT_PUBLIC_SITE_URL               https://www.elevateforhumanity.org
 *   /elevate/NEXT_PUBLIC_ADMIN_URL              https://admin.elevateforhumanity.org
 *   /elevate/NEXT_PUBLIC_COLLABORATION_WS_URL   wss://collab.elevateforhumanity.org
 */

function requireUrl(name: string): string {
  const val = (process.env[name] || '').trim();
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val.replace(/\/$/, '');
}

/** Public LMS / marketing site base URL (www). Prefer NEXT_PUBLIC_PUBLIC_SITE_URL on admin. */
export function getPublicSiteUrl(): string {
  const publicUrl = (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '').trim();
  if (publicUrl) return publicUrl.replace(/\/$/, '');
  return getSiteUrl();
}

/** LMS app base URL — canonical public site (www), not the admin subdomain */
export function getSiteUrl(): string {
  return requireUrl('NEXT_PUBLIC_SITE_URL');
}

/** Admin app base URL — https://admin.${PLATFORM_DEFAULTS.canonicalDomain} */
export function getAdminUrl(): string {
  const url = requireUrl('NEXT_PUBLIC_ADMIN_URL');
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase().endsWith('.elb.amazonaws.com')) {
      throw new Error('NEXT_PUBLIC_ADMIN_URL must not be a raw ALB hostname');
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    throw new Error(`Invalid NEXT_PUBLIC_ADMIN_URL: ${e instanceof Error ? e.message : e}`);
  }
}

/** WebSocket URL for Yjs collaboration */
export function getCollaborationWsUrl(): string {
  return requireUrl('NEXT_PUBLIC_COLLABORATION_WS_URL');
}

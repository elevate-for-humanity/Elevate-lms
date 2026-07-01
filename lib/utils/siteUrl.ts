import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Canonical URL helpers.
 *
 * All URLs come from runtime environment variables.
 * No localhost fallbacks — missing vars in production are caught at call time.
 *
 * Required runtime variables:
 *   NEXT_PUBLIC_SITE_URL               https://www.elevateforhumanity.org
 *   NEXT_PUBLIC_ADMIN_URL              
 *   NEXT_PUBLIC_COLLABORATION_WS_URL   wss://collab.elevateforhumanity.org
 */

const DEFAULT_ADMIN_URL = '';

function resolveUrl(name: string, fallback: string): string {
  const val = (process.env[name] || '').trim() || fallback;
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
  return resolveUrl('NEXT_PUBLIC_SITE_URL', PLATFORM_DEFAULTS.siteUrl);
}

/** Admin app base URL —  */
export function getAdminUrl(): string {
  const url = resolveUrl('NEXT_PUBLIC_ADMIN_URL', DEFAULT_ADMIN_URL);
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('.')) {
      throw new Error('NEXT_PUBLIC_ADMIN_URL must be a fully qualified hostname');
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    throw new Error(`Invalid NEXT_PUBLIC_ADMIN_URL: ${e instanceof Error ? e.message : e}`, { cause: e });
  }
}

/** WebSocket URL for Yjs collaboration */
export function getCollaborationWsUrl(): string {
  return resolveUrl(
    'NEXT_PUBLIC_COLLABORATION_WS_URL',
    'wss://collab.elevateforhumanity.org',
  );
}

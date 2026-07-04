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

// Using 'const' to avoid any shadowing issues with Error constructor
const resolveUrlFromEnv = (name: string, fallback: string): string => {
  const val = (process.env[name] || '').trim() || fallback;
  return val.replace(/\/$/, '');
};

/** Public LMS / marketing site base URL (www). Prefer NEXT_PUBLIC_PUBLIC_SITE_URL on admin. */
export function getPublicSiteUrl(): string {
  const publicUrl = (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '').trim();
  if (publicUrl) return publicUrl.replace(/\/$/, '');
  return getSiteUrl();
}

/** LMS app base URL — canonical public site (www), not the admin subdomain */
export function getSiteUrl(): string {
  return resolveUrlFromEnv('NEXT_PUBLIC_SITE_URL', PLATFORM_DEFAULTS.siteUrl);
}

/** Admin app base URL —  */
export function getAdminUrl(): string {
  const url = resolveUrlFromEnv('NEXT_PUBLIC_ADMIN_URL', DEFAULT_ADMIN_URL);
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('.')) {
      const err = new Error('NEXT_PUBLIC_ADMIN_URL must be a fully qualified hostname');
      throw err;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Construct error without cause to avoid TypeScript issues
    const finalError = new Error(`Invalid NEXT_PUBLIC_ADMIN_URL: ${msg}`);
    throw finalError;
  }
}

/** WebSocket URL for Yjs collaboration */
export function getCollaborationWsUrl(): string {
  return resolveUrlFromEnv(
    'NEXT_PUBLIC_COLLABORATION_WS_URL',
    'wss://collab.elevateforhumanity.org',
  );
}

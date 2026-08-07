import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Canonical URL helpers for the three-service production architecture.
 *
 * Marketing: www.elevateforhumanity.org
 * LMS:       app.elevateforhumanity.org
 * Admin:     admin.elevateforhumanity.org
 *
 * Values may be overridden by environment variables in each deployment.
 */

function requireUrl(name: string): string {
  const val = (process.env[name] || '').trim();
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val.replace(/\/$/, '');
}

function rootDomain(): string {
  return PLATFORM_DEFAULTS.canonicalDomain.replace(/^www\./, '');
}

/** Public Marketing site base URL. */
export function getPublicSiteUrl(): string {
  const publicUrl = (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || '').trim();
  if (publicUrl) return publicUrl.replace(/\/$/, '');
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (siteUrl) return siteUrl.replace(/\/$/, '');
  return `https://www.${rootDomain()}`;
}

/**
 * Legacy site helper retained for callers that mean the public Marketing site.
 * New cross-service code should prefer getPublicSiteUrl(), getLmsUrl(), or
 * getAdminUrl() explicitly.
 */
export function getSiteUrl(): string {
  return getPublicSiteUrl();
}

/** LMS application base URL. */
export function getLmsUrl(): string {
  const url = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_LMS_URL || '').trim();
  if (url) return url.replace(/\/$/, '');
  return `https://app.${rootDomain()}`;
}

/** Admin application base URL. */
export function getAdminUrl(): string {
  const url = (process.env.NEXT_PUBLIC_ADMIN_URL || '').trim();
  if (!url) {
    return `https://admin.${rootDomain()}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase().endsWith('.elb.amazonaws.com')) {
      throw new Error('NEXT_PUBLIC_ADMIN_URL must not be a raw ALB hostname');
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    const message = `Invalid NEXT_PUBLIC_ADMIN_URL: ${e instanceof Error ? e.message : String(e)}`;
    const err = new Error(message);
    (err as Error & { cause: unknown }).cause = e;
    throw err;
  }
}

/** WebSocket URL for Yjs collaboration. */
export function getCollaborationWsUrl(): string {
  return requireUrl('NEXT_PUBLIC_COLLABORATION_WS_URL');
}

/**
 * URL Factory - Single source of truth for all URLs
 * 
 * Replace all hardcoded URLs with these functions.
 * 
 * Usage:
 *   import { url, adminUrl, emailUrl } from '@/lib/utils/url-factory';
 *   
 *   url('/admin/dashboard')     → https://admin.elevateforhumanity.org/admin/dashboard
 *   url('/enroll')              → https://www.elevateforhumanity.org/enroll
 *   adminUrl('/lms/dashboard')      → https://admin.elevateforhumanity.org/dashboard
 *   emailUrl('/verify')        → https://www.elevateforhumanity.org/verify
 */

// Base URLs from environment
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org';
const CANONICAL_DOMAIN = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || 'www.elevateforhumanity.org';

// Email configuration
const EMAIL_FROM = process.env.NEXT_PUBLIC_EMAIL_FROM_ADDRESS || 'noreply@elevateforhumanity.org';
const EMAIL_FROM_NAME = process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || 'Elevate for Humanity';
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@elevateforhumanity.org';
const INFO_EMAIL = process.env.NEXT_PUBLIC_INFO_EMAIL || 'info@elevateforhumanity.org';

/**
 * Main site URL builder
 */
export function url(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Admin site URL builder
 */
export function adminUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${ADMIN_URL}${cleanPath}`;
}

/**
 * Canonical URL (for SEO)
 * Uses actual request URL if available, falls back to env var
 */
export function canonicalUrl(requestUrl?: string, path?: string): string {
  if (requestUrl) {
    // Extract base from request URL
    try {
      const url = new URL(requestUrl);
      if (path) {
        return `${url.origin}${path.startsWith('/') ? path : `/${path}`}`;
      }
      return url.origin;
    } catch {
      // Fall back to env var
    }
  }
  return path ? url(path) : SITE_URL;
}

/**
 * Email-specific URLs
 */
export function emailUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * LMS URL builder
 */
export function lmsUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}/lms${cleanPath}`;
}

/**
 * Email configuration
 */
export const emailConfig = {
  from: EMAIL_FROM,
  fromName: EMAIL_FROM_NAME,
  support: SUPPORT_EMAIL,
  info: INFO_EMAIL,
  
  // Common email URLs
  links: {
    enroll: `${SITE_URL}/enroll`,
    login: `${SITE_URL}/login`,
    dashboard: `${SITE_URL}/dashboard`,
    verify: `${SITE_URL}/verify`,
    unsubscribe: `${SITE_URL}/unsubscribe`,
    onboarding: `${SITE_URL}/onboarding`,
  },
};

/**
 * Admin internal links (for admin app internal navigation)
 * These should use relative paths in the admin app
 */
export function adminInternal(path: string): string {
  // Remove /admin prefix if present (admin app is served from /admin)
  const cleanPath = path.startsWith('/admin') ? path.slice(6) : path;
  const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return finalPath;
}

/**
 * API URLs
 */
export const api = {
  ping: `${SITE_URL}/api/ping`,
  health: `${SITE_URL}/api/health`,
  adminHealth: `${ADMIN_URL}/api/health`,
  webhook: `${SITE_URL}/api/webhooks`,
  lti: {
    config: `${SITE_URL}/api/lti/config`,
    login: `${SITE_URL}/api/lti/login`,
    launch: `${SITE_URL}/api/lti/launch`,
    jwks: `${SITE_URL}/api/lti/jwks`,
  },
};

/**
 * Static asset URLs
 */
export function asset(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

export const assets = {
  logo: `${SITE_URL}/images/logo.png`,
  logoJpg: `${SITE_URL}/images/logo.jpg`,
  ogImage: `${SITE_URL}/images/og-default.jpg`,
};

/**
 * Org information
 */
export const org = {
  name: process.env.NEXT_PUBLIC_ORG_NAME || 'Elevate for Humanity',
  legalName: process.env.NEXT_PUBLIC_ORG_LEGAl_NAME || 'Elevate for Humanity Technical and Career Institute',
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '(317) 314-3757',
  email: INFO_EMAIL,
  support: SUPPORT_EMAIL,
  address: 'Indianapolis, Indiana',
  cage: '0Q856',
  website: SITE_URL,
};

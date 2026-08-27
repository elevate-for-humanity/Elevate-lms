/**
 * Site URL Configuration
 *
 * Single source of truth for deployed Elevate service origins and common links.
 * Do not hardcode production domains in components or route handlers.
 */

function clean(value: string): string {
  return value.replace(/\/$/, '');
}

/** Registrable/root domain used when code derives service hosts such as admin.*. */
function canonicalDomain(value: string): string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
  const [hostname = ''] = normalized.split('/');
  const domain = hostname
    .replace(/\.$/, '')
    .replace(/^www\./, '');
  return domain || 'elevateforhumanity.org';
}

const SITE_URL = clean(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org');
const APP_URL = clean(
  process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_LMS_URL ||
    'https://app.elevateforhumanity.org',
);
const ADMIN_URL = clean(process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org');
const CANONICAL_DOMAIN = canonicalDomain(
  process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || 'elevateforhumanity.org',
);
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@elevateforhumanity.org';
const INFO_EMAIL = process.env.NEXT_PUBLIC_INFO_EMAIL || 'info@elevateforhumanity.org';
const FROM_EMAIL = process.env.NEXT_PUBLIC_EMAIL_FROM_ADDRESS || 'noreply@elevateforhumanity.org';
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '(317) 314-3757';

export const siteUrls = {
  site: SITE_URL,
  www: SITE_URL,
  app: APP_URL,
  lms: APP_URL,
  admin: ADMIN_URL,

  apply: `${SITE_URL}/apply`,
  enroll: `${SITE_URL}/enroll`,
  login: `${APP_URL}/login`,
  dashboard: `${APP_URL}/lms/dashboard`,
  employerPortal: `${APP_URL}/employer/dashboard`,
  adminLogin: `${ADMIN_URL}/login`,
  adminDashboard: `${ADMIN_URL}/dashboard`,

  emails: {
    support: SUPPORT_EMAIL,
    info: INFO_EMAIL,
    from: FROM_EMAIL,
    fromName: process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || 'Elevate for Humanity',
  },

  org: {
    name: process.env.NEXT_PUBLIC_ORG_NAME || 'Elevate for Humanity',
    legalName:
      process.env.NEXT_PUBLIC_ORG_LEGAL_NAME ||
      'Elevate for Humanity Technical and Career Institute',
    phone: SUPPORT_PHONE,
    address: process.env.NEXT_PUBLIC_ORG_LOCATION || 'Indianapolis, Indiana',
    cage: process.env.NEXT_PUBLIC_CAGE_CODE || '0Q856',
  },

  canonicalDomain: CANONICAL_DOMAIN,
} as const;

export default siteUrls;

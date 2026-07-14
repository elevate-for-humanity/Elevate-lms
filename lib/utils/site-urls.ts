/**
 * Site URL Configuration
 * 
 * Single source of truth for all site URLs.
 * Use these instead of hardcoded values.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org';
const LMS_URL = process.env.NEXT_PUBLIC_LMS_URL || `${SITE_URL}/lms`;
const CANONICAL_DOMAIN = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || 'www.elevateforhumanity.org';
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@elevateforhumanity.org';
const INFO_EMAIL = process.env.NEXT_PUBLIC_INFO_EMAIL || 'info@elevateforhumanity.org';
const FROM_EMAIL = process.env.NEXT_PUBLIC_EMAIL_FROM_ADDRESS || 'noreply@elevateforhumanity.org';

export const siteUrls = {
  // Main URLs
  site: SITE_URL,
  www: `https://${CANONICAL_DOMAIN}`,
  admin: ADMIN_URL,
  lms: LMS_URL,
  
  // Paths
  enroll: `${SITE_URL}/enroll`,
  login: `${SITE_URL}/login`,
  dashboard: `${SITE_URL}/dashboard`,
  adminDashboard: `${ADMIN_URL}/dashboard`,
  
  // Emails
  emails: {
    support: SUPPORT_EMAIL,
    info: INFO_EMAIL,
    from: FROM_EMAIL,
    fromName: process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || 'Elevate for Humanity',
  },
  
  // Org
  org: {
    name: process.env.NEXT_PUBLIC_ORG_NAME || 'Elevate for Humanity',
    legalName: process.env.NEXT_PUBLIC_ORG_LEGAL_NAME || 'Elevate for Humanity Technical and Career Institute',
    phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '(317) 314-3757',
    address: 'Indianapolis, Indiana',
    cage: '0Q856',
  },
};

export default siteUrls;

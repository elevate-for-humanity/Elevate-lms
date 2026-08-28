import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

/**
 * Centralized public site configuration.
 * Public pages should import identity/contact values from this module instead
 * of hardcoding them independently.
 */
export const siteConfig = {
  // Brand
  name: PLATFORM_DEFAULTS.orgName,
  shortName: 'Elevate',
  tagline: 'Workforce Infrastructure',
  description:
    'Workforce development and career training connecting participants with training pathways, public funding navigation, credentials, apprenticeships, and employer services.',

  // URLs
  url: process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl,
  domain: PLATFORM_DEFAULTS.canonicalDomain,

  // Contact
  phone: {
    display: PLATFORM_DEFAULTS.supportPhone,
    href: 'tel:+13173143757',
    e164: '+13173143757',
  },
  email: {
    general: 'info@elevateforhumanity.org',
    enrollment: 'info@elevateforhumanity.org',
    support: 'info@elevateforhumanity.org',
    careers: 'info@elevateforhumanity.org',
  },

  // Public Indianapolis location. Keep this synchronized with lib/contact-info.ts
  // and testing configuration.
  headquarters: {
    city: 'Indianapolis',
    state: 'Indiana',
    stateAbbr: 'IN',
    address: '120 E Market St, Suite 930',
    zip: '46204',
    country: 'United States',
  },

  // Social
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61571046346179',
    instagram: 'https://instagram.com/elevateforhumanity',
    linkedin: 'https://linkedin.com/company/elevate-for-humanity',
    youtube: 'https://youtube.com/@elevateforhumanity',
  },

  // Business hours
  hours: {
    weekdays: '9:00 AM - 5:00 PM EST',
    saturday: 'By appointment',
    sunday: 'Closed',
  },

  // Public organization description only. Do not publish placeholder EINs,
  // nonprofit status, or founding dates from this shared config.
  legal: {
    type: 'Workforce development and career training provider',
  },

  // SEO defaults
  seo: {
    titleTemplate: '%s | ' + PLATFORM_DEFAULTS.orgName + '',
    defaultTitle: 'Elevate for Humanity | Workforce Development & Career Training',
    defaultDescription:
      'Career training, registered apprenticeship pathways, testing, employer services, and workforce funding navigation in Indianapolis, Indiana.',
    defaultImage: '/og-default.webp',
  },

  // Feature flags
  features: {
    aiTutor: true,
    liveChat: true,
    videoConferencing: false,
    mobileApp: false,
    multiLanguage: false,
  },
} as const;

export type SiteConfig = typeof siteConfig;

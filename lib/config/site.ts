/**
 * Centralized site configuration
 * All hardcoded values should be defined here
 */

export const siteConfig = {
  // Brand
  name: 'Elevate for Humanity',
  // Official school/training entity name — use this wherever the institution is referenced
  schoolName: 'Elevate for Humanity Career & Technical Institute',
  // Full legal DBA name for contracts, MOUs, and legal documents
  legalName: '2Exclusive LLC-S d/b/a Elevate for Humanity Career & Technical Institute',
  shortName: 'Elevate',
  tagline: 'Workforce Infrastructure',
  description: 'Workforce infrastructure that connects public funding, employer demand, and credential-backed training to drive measurable outcomes.',
  
  // URLs
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
  domain: 'elevateforhumanity.org',
  
  // Contact
  phone: {
    display: '(317) 314-3757',
    href: 'tel:+13173143757',
    e164: '+13173143757',
  },
  email: {
    general: 'info@elevateforhumanity.org',
    enrollment: 'info@elevateforhumanity.org',
    support: 'info@elevateforhumanity.org',
    careers: 'info@elevateforhumanity.org',
  },
  
  // Location
  headquarters: {
    city: 'Indianapolis',
    state: 'Indiana',
    stateAbbr: 'IN',
    address: '8888 Keystone Crossing, Suite 1300',
    zip: '46240',
    country: 'United States',
  },
  
  // Social
  social: {
    facebook: 'https://facebook.com/elevateforhumanity',
    instagram: 'https://instagram.com/elevateforhumanity',
    linkedin: 'https://linkedin.com/company/elevate-for-humanity',
    youtube: 'https://youtube.com/@elevateforhumanity',
    twitter: 'https://twitter.com/elevate4humanity',
  },
  
  // Business hours
  hours: {
    weekdays: '9:00 AM - 5:00 PM EST',
    saturday: 'By appointment',
    sunday: 'Closed',
  },
  
  // Legal
  legal: {
    ein: '88-3456789',
    founded: 2020,
    type: '501(c)(3) Nonprofit',
  },
  
  // SEO defaults
  seo: {
    titleTemplate: '%s | Elevate for Humanity',
    defaultTitle: 'Elevate for Humanity | Workforce Infrastructure',
    defaultDescription: 'Free workforce training programs in healthcare, skilled trades, and technology. WIOA-funded career pathways in Indianapolis.',
    defaultImage: '/og-default.jpg',
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

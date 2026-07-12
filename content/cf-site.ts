import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
// Site config — merged from next-platform-starter into this repo.
// All handoff URLs now point to the same domain (no cross-domain redirects).
export const siteConfig = {
  name: 'Elevate for Humanity',
  url: 'https://www.elevateforhumanity.org',
  description:
    'Career training, workforce pathways, and community-centered education programs for re-entry, workforce development, and economic mobility.',
  ogImage: '/images/og-default.jpg',
  handoff: {
    apply: '/apply',
    login: '/login',
    checkout: '/store',
    lms: '/lms',
    studentPortal: '/learner/dashboard',
  },
  social: {
    facebook: 'https://www.facebook.com/elevateforhumanity',
    instagram: 'https://www.instagram.com/elevateforhumanity',
    linkedin: 'https://www.linkedin.com/company/elevate-for-humanity',
  },
};

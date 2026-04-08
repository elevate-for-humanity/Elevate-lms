/**
 * Single source of truth for all Elevate for Humanity social media URLs.
 * Update here — every component that imports from this file picks up the change automatically.
 */
export const SOCIAL_LINKS = {
  facebook:  'https://www.facebook.com/share/1BUqvUAnCo/',
  instagram: 'https://www.instagram.com/elevateforhumanity',
  linkedin:  'https://www.linkedin.com/company/elevate-for-humanity',
  youtube:   'https://www.youtube.com/@elevateforhumanity',
  twitter:   'https://twitter.com/elevate4humanity',
} as const;

export type SocialPlatform = keyof typeof SOCIAL_LINKS;

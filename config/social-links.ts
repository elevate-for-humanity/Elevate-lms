/**
 * Single source of truth for all Elevate for Humanity social media URLs.
 * Update here — every component that imports from this file picks up the change automatically.
 */
export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/61578240192934/',
  instagram: 'https://www.instagram.com/elevateforhumanity',
  linkedin: 'https://www.linkedin.com/company/elevate-for-humanity',
  youtube: 'https://www.youtube.com/@elevateforhumanity',
} as const;

/** Partner identities stay distinct from Elevate's own social profiles. */
export const PARTNER_LINKS = {
  riseForwardFoundation: '/rise-forward-foundation',
  curvatureBodySculpting: 'https://www.facebook.com/curvaturebodysculpt/',
  supersonicFastCash: '/locations',
} as const;

export const CREATOR_LINKS = {
  elizabethGreeneFacebook: 'https://www.facebook.com/share/19NMiz9daK/',
} as const;

export type SocialPlatform = keyof typeof SOCIAL_LINKS;

/**
 * Known broken / legacy public image paths → verified files under /public.
 * Use resolveSiteImagePath() before passing src to next/image.
 */
import conversionManifest from '../../scripts/.image-conversion-manifest.json' with { type: 'json' };

const SITE_IMAGE_ALIASES: Record<string, string> = {
  '/images/pages/tax-preparation.webp': '/images/business/office-admin.webp',
  '/images/pages/tax-preparation.jpg': '/images/business/professional-2.jpg',
  '/images/pages/accessibility-hero.webp': '/images/pages/accessibility-hero.jpg',
  '/images/pages/esthetician.webp': '/images/beauty/esthetician.webp',
  '/images/programs/culinary.jpg': '/images/pages/culinary.webp',
  '/hero-images/how-it-works-hero.jpg': '/hero-images/how-it-works-hero.webp',
  '/images/pages/how-it-works-hero.jpg': '/images/pages/how-it-works-hero.webp',
  '/images/alberta-davis.jpg': '/images/alberta-davis.webp',
  '/images/facilities-new/facility-2.jpg': '/images/facilities-new/facility-1.webp',
  // Missing JPG references → existing WebP versions
  '/images/barber-fade-cut.jpg': '/images/pages/barber-fade-cut.webp',
  '/images/barber-shop-wide.jpg': '/images/pages/barber-apprenticeship-hero.jpg',
  '/images/marketplace-page-1.jpg': '/images/pages/marketplace-page-1.webp',
  // Broken JPG references → existing WebP versions
  '/images/programs-hq/cdl-trucking.jpg': '/images/programs-hq/cdl-trucking.webp',
  '/images/pages/admin-compliance-hero.jpg': '/images/pages/admin-compliance-hero.webp',
  '/images/demos/lms-overview-thumb.jpg': '/images/demos/lms-overview-thumb.webp',
  '/images/pages/barber-gallery-3.jpg': '/images/pages/barber-gallery-3.webp',
  '/images/pages/career-counseling-page-1.jpg': '/images/pages/career-counseling-page-1.webp',
  // Missing images → fallbacks
  '/images/pages/contact-page-1.webp': '/images/pages/prog-hero-main-2.webp',
  '/images/pages/contact-page-1.jpg': '/images/pages/prog-hero-main-2.webp',
  '/images/pages/admin-employers-hero.webp': '/images/pages/admin-compliance-hero.webp',
  '/images/pages/admin-employers-hero.jpg': '/images/pages/admin-compliance-hero.webp',
  '/images/demos/lms-overview-thumb.webp': '/images/pages/prog-hero-main-2.webp',
  '/images/pages/programs-hvac-apply-hero.webp': '/images/pages/prog-hero-main-2.webp',
  '/images/pages/learner/dashboard-page-5.webp': '/images/pages/learner-page-1.webp',
  '/images/pages/learner/dashboard-page-1.webp': '/images/pages/learner-page-1.webp',
  '/images/pages/learner/dashboard-page-2.webp': '/images/pages/learner-page-1.webp',
  '/images/pages/learner/dashboard-page-3.webp': '/images/pages/learner-page-1.webp',
  '/images/pages/learner/dashboard-page-4.webp': '/images/pages/learner-page-1.webp',
  '/images/pages/learner/dashboard-page-4.jpg': '/images/pages/learner-page-1.webp',
  '/images/pages/learner/dashboard-page-6.webp': '/images/pages/learner-page-1.webp',
  '/images/pages/learner/dashboard-page-7.webp': '/images/pages/learner-page-1.webp',
  '/media/elevate-watermark.png': '/images/certification-badge.png',
  // Missing .jpg images → fallbacks
  '/images/pages/platform-page-7.jpg': '/images/pages/platform-page-7.webp',
  '/images/pages/platform-page-3.jpg': '/images/pages/platform-page-3.webp',
  '/images/pages/marketplace.jpg': '/images/pages/marketplace-page-1.webp',
  '/images/pages/testing-page-1.jpg': '/images/pages/testing-page-1.webp',
  '/images/pages/barber-shop-interior.jpg': '/images/pages/barber-apprenticeship-hero.jpg',
  '/images/pages/barber-fade-cut.jpg': '/images/pages/barber-fade-cut.webp',
  '/images/pages/barber-shop-wide.jpg': '/images/pages/barber-apprenticeship-hero.jpg',
  '/images/pages/barber-straight-razor.jpg': '/images/pages/barber-apprenticeship-hero.jpg',
  '/images/pages/barber-tools-closeup.jpg': '/images/pages/barber-apprenticeship-hero.jpg',
  '/images/pages/urban-build-crew-page-1.jpg': '/images/pages/urban-build-crew-page-1.webp',
  '/images/pages/login-page-1.jpg': '/images/pages/login-page-1.webp',
  '/images/pages/technology-sector.jpg': '/images/pages/prog-hero-main-2.webp',
  '/images/heroes/hero-state-funding.jpg': '/images/heroes/hero-state-funding.webp',
  '/images/programs/dental-assistant.jpg': '/images/programs/dental-assistant.webp',
  '/images/gallery/image8.jpg': '/images/gallery/image1.webp',
  '/images/pages/healthcare/cpr-certification-group.jpg': '/images/pages/prog-hero-main-2.webp',
  // More missing .jpg → existing .webp
  '/images/pages/marketplace-page-1.jpg': '/images/pages/marketplace-page-1.webp',
  '/images/pages/employer-handshake.jpg': '/images/pages/employer-handshake.webp',
  '/images/pages/enrollment-agreement-page-1.jpg': '/images/pages/enrollment-agreement-page-1.webp',
  '/images/pages/funding-impact-5.jpg': '/images/pages/funding-impact-3.webp',
  '/images/pages/barber-client-consult.jpg': '/images/pages/barber-client-consult.webp',
  '/images/gallery/image3.jpg': '/images/gallery/image1.webp',
  '/images/hvac/hvac-commercial.jpg': '/images/pages/prog-hero-main-2.webp',
  '/images/pages/programs-hvac-apply-hero.jpg': '/images/pages/prog-hero-main-2.webp',
  '/images/heroes/hero-state-funding.jpg': '/images/heroes/hero-state-funding.webp',
};

/** JPG paths retired after WebP migration — map to existing .webp siblings. */
const MANIFEST_JPG_TO_WEBP: Record<string, string> = Object.fromEntries(
  (conversionManifest as Array<{ origRel: string; webpRel: string }>).map((row) => [
    row.origRel,
    row.webpRel,
  ]),
);

const DEFAULT_FALLBACK = '/images/pages/prog-hero-main-2.webp';

export function resolveSiteImagePath(src: string | null | undefined): string {
  if (!src || !src.trim()) return DEFAULT_FALLBACK;
  const trimmed = src.trim();
  return (
    SITE_IMAGE_ALIASES[trimmed] ??
    MANIFEST_JPG_TO_WEBP[trimmed] ??
    trimmed
  );
}

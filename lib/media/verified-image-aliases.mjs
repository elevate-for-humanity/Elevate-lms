/*
 * Verified image aliases for stale or never-materialized asset paths.
 *
 * Every destination below is an existing repository asset selected by exact
 * basename/format equivalence or by the semantic category of the source use.
 * These are intentionally explicit; do not replace this map with heuristic
 * filename guessing or a generic fallback image.
 */

export const VERIFIED_IMAGE_ALIASES = Object.freeze({
  '/hero-images/how-it-works-hero.jpg': '/hero-images/how-it-works-hero.webp',
  '/hero-images/business-hero.jpg': '/hero-images/business-hero.webp',
  '/hero-images/healthcare-category.jpg': '/hero-images/healthcare-category.webp',
  '/hero-images/skilled-trades-category.jpg': '/hero-images/skilled-trades-category.webp',
  '/hero-images/technology-category.jpg': '/hero-images/technology-category.webp',
  '/hero-images/jri-hero.jpg': '/hero-images/jri-hero.webp',
  '/media/programs/efh-cna-hero.jpg': '/media/programs/efh-cna-hero.webp',
  '/branding/logo.png': '/logo.png',
  '/images/programs/efh-hvac-hero.jpg': '/images/pages/hvac-technician.webp',
  '/images/programs/efh-barber-hero.jpg': '/images/pages/barber-apprenticeship-hero.jpg',

  // Video/template library thumbnails: use distinct, semantically matched,
  // existing visual assets instead of a universal placeholder.
  '/templates/training-intro.jpg': '/images/pages/training-classroom.webp',
  '/templates/social-promo.jpg': '/images/pages/admin-campaigns-hero.webp',
  '/templates/product-demo.jpg': '/images/pages/admin-dev-studio-detail.webp',
  '/templates/testimonial.jpg': '/images/pages/comp-home-highlight-success.webp',
  '/templates/explainer.jpg': '/hero-images/how-it-works-hero.webp',
  '/templates/announcement.jpg': '/images/pages/business-meeting.webp',
  '/templates/instagram-reel.jpg': '/images/business/collaboration-1.webp',
  '/templates/youtube-intro.jpg': '/images/pages/programs-it-hero.webp',

  // Program catalog images.
  '/media/programs/healthcare-programs-grid-hd.jpg': '/images/pages/healthcare-hero.webp',
  '/media/programs/tax-prep-hd.jpg': '/images/pexels/bookkeeping.webp',
  '/media/programs/building-tech-hd.jpg': '/hero-images/skilled-trades-category.webp',

  // Website template previews and their corresponding thumbnails.
  '/templates/modern-tech.jpg': '/images/pages/programs-it-hero.webp',
  '/templates/professional.jpg': '/images/business/professional-2.jpg',
  '/templates/bold-energy.jpg': '/images/pages/electrical-panel.webp',
  '/templates/warm-community.jpg': '/images/business/collaboration-1.webp',
  '/templates/industrial.jpg': '/hero-images/skilled-trades-category.webp',
  '/templates/healthcare.jpg': '/hero-images/healthcare-category.webp',
  '/templates/academic.jpg': '/images/pages/training-classroom.webp',
  '/templates/startup.jpg': '/images/pages/entrepreneurship.webp',
  '/templates/modern-thumb.jpg': '/images/pages/programs-it-hero.webp',
  '/templates/professional-thumb.jpg': '/images/business/professional-2.jpg',
  '/templates/bold-thumb.jpg': '/images/pages/electrical-panel.webp',
  '/templates/warm-thumb.jpg': '/images/business/collaboration-1.webp',
  '/templates/academic-thumb.jpg': '/images/pages/training-classroom.webp',
  '/templates/industrial-thumb.jpg': '/hero-images/skilled-trades-category.webp',

  // Instructor records do not have verified portrait photography. Route their
  // stale portrait URLs to category-specific training imagery rather than
  // misrepresenting unrelated stock people as named instructors.
  '/instructors/sarah-mitchell.jpg': '/images/pages/medical-assistant-lab.webp',
  '/instructors/marcus-johnson.jpg': '/images/pages/hvac-technician.webp',
  '/instructors/diane-torres.jpg': '/images/pages/barber-training.webp',
  '/instructors/james-williams.jpg': '/images/pages/workforce-training.webp',
  '/instructors/michael-chen.jpg': '/images/pages/tech-classroom.webp',
  '/instructors/robert-martinez.jpg': '/images/pages/training-classroom.webp',
  '/instructors/david-anderson.jpg': '/images/pages/cdl-driver-seat.webp',
  '/instructors/lisa-thompson.jpg': '/images/pages/office-admin-desk.jpg',
  '/instructors/michael-torres.jpg': '/images/pages/cpr-mannequin.webp',
  '/instructors/patricia-wilson.jpg': '/images/pages/admin-wioa-hero.webp',
  '/instructors/corporate-trainer.jpg': '/images/pages/business-meeting.webp',
});

export function verifiedImageRewrites() {
  return Object.entries(VERIFIED_IMAGE_ALIASES).map(([source, destination]) => ({
    source,
    destination,
  }));
}

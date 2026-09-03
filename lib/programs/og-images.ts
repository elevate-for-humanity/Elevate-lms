import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Per-program OG image map.
 *
 * Maps program slug → absolute path to the best available hero/card image.
 * Used in generateMetadata() for Open Graph and Twitter card tags.
 *
 * Rules:
 *   - Prefer /images/pages/programs-{slug}-hero.jpg (program-specific hero)
 *   - Fall back to /images/pages/{slug}-hero.jpg
 *   - Fall back to /images/pages/card-{slug}.jpg
 *   - Fall back to PROGRAM_OG_DEFAULT
 *
 * All paths are relative to /public and must exist in the repo.
 */

export const PROGRAM_OG_DEFAULT = '/images/og-image.jpg';

export const PROGRAM_OG_IMAGES: Record<string, string> = {
  // ── Skilled Trades ────────────────────────────────────────────────────────
  'hvac-technician':                '/images/pages/programs-hvac-hero.webp',
  'hvac':                           '/images/pages/programs-hvac-hero.webp',
  'electrical':                     '/images/pages/programs-electrical-apply-hero.webp',
  'plumbing':                       '/images/pages/programs-plumbing-apply-hero.jpg',
  'welding':                        '/images/pages/programs-welding-apply-hero.webp',
  'cdl-training':                   '/images/pages/programs-cdl-hero.webp',
  'diesel-mechanic':                '/images/pages/programs-hvac-hero.webp',
  'forklift':                       '/images/pages/programs-hvac-hero.webp',
  'construction-trades-certification': '/images/pages/programs-welding-apply-hero.webp',

  // ── Healthcare ────────────────────────────────────────────────────────────
  'cna':                            '/images/pages/programs-cna-hero.webp',
  'cna-certification':              '/images/pages/programs-cna-hero.webp',
  'certified-nursing-assistant':    '/images/pages/programs-cna-hero.webp',
  'medical-assistant':              '/images/pages/programs-medical-apply-hero.webp',
  'phlebotomy':                     '/images/pages/programs-medical-apply-hero.webp',
  'pharmacy-technician':            '/images/pages/programs-medical-apply-hero.webp',
  'home-health-aide':               '/images/pages/programs-cna-hero.webp',
  'peer-recovery-specialist':       '/images/pages/programs-cna-hero.webp',
  'sanitation-infection-control':   '/images/pages/programs-medical-apply-hero.webp',
  'emergency-health-safety':        '/images/pages/programs-medical-apply-hero.webp',
  'cpr-first-aid':                  '/images/pages/programs-medical-apply-hero.webp',

  // ── Beauty / Apprenticeships ──────────────────────────────────────────────
  'barber-apprenticeship':          '/images/pages/barber-hero-main.jpg',
  'barber':                         '/images/pages/barber-hero-main.jpg',
  'cosmetology-apprenticeship':     '/images/pages/cosmetology-hero.webp',
  'esthetician':                    '/images/programs/efh-esthetician-client-services-card.jpg',
  'esthetician-apprenticeship':     '/images/programs/efh-esthetician-client-services-card.jpg',
  'nail-technician-apprenticeship': '/images/pages/nail-tech-hero.webp',
  'culinary-apprenticeship':        '/images/pages/programs-hvac-hero.webp',

  // ── Technology ────────────────────────────────────────────────────────────
  'cybersecurity-analyst':          '/images/pages/cybersecurity-hero.webp',
  'cybersecurity':                  '/images/pages/cybersecurity-hero.webp',
  'it-help-desk':                   '/images/pages/networking-hero.webp',
  'it-support':                     '/images/pages/networking-hero.webp',
  'network-administration':         '/images/pages/networking-hero.webp',
  'network-support-technician':     '/images/pages/networking-hero.webp',
  'software-development':           '/images/pages/networking-hero.webp',
  'web-development':                '/images/pages/networking-hero.webp',
  'cad-drafting':                   '/images/pages/networking-hero.webp',

  // ── Business ─────────────────────────────────────────────────────────────
  'business-administration':        '/images/programs/efh-business-startup-marketing-hero.jpg',
  'business':                       '/images/programs/efh-business-startup-marketing-hero.jpg',
  'bookkeeping':                    '/images/programs/efh-business-startup-marketing-hero.jpg',
  'finance-bookkeeping-accounting': '/images/programs/efh-business-startup-marketing-hero.jpg',
  'office-administration':          '/images/programs/efh-business-startup-marketing-hero.jpg',
  'project-management':             '/images/programs/efh-business-startup-marketing-hero.jpg',
  'entrepreneurship':               '/images/programs/efh-business-startup-marketing-hero.jpg',
  'graphic-design':                 '/images/programs/efh-business-startup-marketing-hero.jpg',
  'tax-preparation':                '/images/pages/tax-main-hero.webp',
  'tax-prep-financial-services':    '/images/pages/tax-main-hero.webp',

  // ── Hospitality / Other ───────────────────────────────────────────────────
  'hospitality':                    '/images/pages/programs-hvac-hero.webp',
  'technology':                     '/images/pages/networking-hero.webp',
  'direct-support-professional':    '/images/pages/programs-cna-hero.webp',
};

/** Returns the OG image path for a program slug. Always returns a valid path. */
export function getProgramOgImage(slug: string): string {
  return PROGRAM_OG_IMAGES[slug] ?? PROGRAM_OG_DEFAULT;
}

/** Full absolute URL for use in metadata (requires site base URL) */
export function getProgramOgImageUrl(slug: string, baseUrl = PLATFORM_DEFAULTS.siteUrl): string {
  return `${baseUrl}${getProgramOgImage(slug)}`;
}

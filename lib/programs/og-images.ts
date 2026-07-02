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

export const PROGRAM_OG_DEFAULT = 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/og-image.jpg';

export const PROGRAM_OG_IMAGES: Record<string, string> = {
  // ── Skilled Trades ────────────────────────────────────────────────────────
  'hvac-technician':                'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-hvac-hero.webp',
  'hvac':                           'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-hvac-hero.webp',
  'electrical':                     'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-electrical-apply-hero.webp',
  'plumbing':                       'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-plumbing-apply-hero.jpg',
  'welding':                        'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-welding-apply-hero.webp',
  'cdl-training':                   'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-cdl-hero.webp',
  'diesel-mechanic':                'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-hvac-hero.webp',
  'forklift':                       'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-hvac-hero.webp',
  'construction-trades-certification': 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-welding-apply-hero.webp',

  // ── Healthcare ────────────────────────────────────────────────────────────
  'cna':                            'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-cna-hero.webp',
  'cna-certification':              'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-cna-hero.webp',
  'certified-nursing-assistant':    'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-cna-hero.webp',
  'medical-assistant':              'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-medical-apply-hero.webp',
  'phlebotomy':                     'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-medical-apply-hero.webp',
  'pharmacy-technician':            'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-medical-apply-hero.webp',
  'home-health-aide':               'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-cna-hero.webp',
  'peer-recovery-specialist':       'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-cna-hero.webp',
  'sanitation-infection-control':   'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-medical-apply-hero.webp',
  'emergency-health-safety':        'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-medical-apply-hero.webp',
  'cpr-first-aid':                  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-medical-apply-hero.webp',

  // ── Beauty / Apprenticeships ──────────────────────────────────────────────
  'barber-apprenticeship':          'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/barber-hero-main.webp',
  'barber':                         'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/barber-hero-main.webp',
  'cosmetology-apprenticeship':     'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cosmetology-hero.webp',
  'esthetician':                    'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-esthetician-client-services-card.jpg',
  'esthetician-apprenticeship':     'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-esthetician-client-services-card.jpg',
  'nail-technician-apprenticeship': 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/nail-tech-hero.webp',
  'culinary-apprenticeship':        'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-hvac-hero.webp',

  // ── Technology ────────────────────────────────────────────────────────────
  'cybersecurity-analyst':          'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cybersecurity-hero.webp',
  'cybersecurity':                  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cybersecurity-hero.webp',
  'it-help-desk':                   'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/networking-hero.webp',
  'it-support':                     'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/networking-hero.webp',
  'network-administration':         'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/networking-hero.webp',
  'network-support-technician':     'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/networking-hero.webp',
  'software-development':           'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/networking-hero.webp',
  'web-development':                'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/networking-hero.webp',
  'cad-drafting':                   'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/networking-hero.webp',

  // ── Business ─────────────────────────────────────────────────────────────
  'business-administration':        'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-business-startup-marketing-hero.jpg',
  'business':                       'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-business-startup-marketing-hero.jpg',
  'bookkeeping':                    'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-business-startup-marketing-hero.jpg',
  'finance-bookkeeping-accounting': 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-business-startup-marketing-hero.jpg',
  'office-administration':          'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-business-startup-marketing-hero.jpg',
  'project-management':             'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-business-startup-marketing-hero.jpg',
  'entrepreneurship':               'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-business-startup-marketing-hero.jpg',
  'graphic-design':                 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/programs/efh-business-startup-marketing-hero.jpg',
  

  // ── Hospitality / Other ───────────────────────────────────────────────────
  'hospitality':                    'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-hvac-hero.webp',
  'technology':                     'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/networking-hero.webp',
  'direct-support-professional':    'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/programs-cna-hero.webp',
};

/** Returns the OG image path for a program slug. Always returns a valid path. */
export function getProgramOgImage(slug: string): string {
  return PROGRAM_OG_IMAGES[slug] ?? PROGRAM_OG_DEFAULT;
}

/** Full absolute URL for use in metadata (requires site base URL) */
export function getProgramOgImageUrl(slug: string, baseUrl = PLATFORM_DEFAULTS.siteUrl): string {
  return `${baseUrl}${getProgramOgImage(slug)}`;
}

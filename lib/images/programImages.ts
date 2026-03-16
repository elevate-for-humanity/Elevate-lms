/**
 * Canonical image map for every program.
 * One unique, program-specific image per slug.
 * Use these in program cards, hero banners, and catalog pages.
 * Do not reuse the same image across different programs on the same page.
 */

const BASE = '/images/pages';

export const PROGRAM_IMAGES: Record<string, { card: string; hero: string; alt: string }> = {
  // ── Skilled Trades ──────────────────────────────────────────────────────────
  'hvac-technician': {
    card: `${BASE}/hvac-technician.jpg`,
    hero: `${BASE}/hvac-unit.jpg`,
    alt: 'HVAC technician working on a rooftop unit',
  },
  'electrical': {
    card: `${BASE}/electrical.jpg`,
    hero: `${BASE}/electrical-panel.jpg`,
    alt: 'Electrician wiring an electrical panel',
  },
  'welding': {
    card: `${BASE}/welding-sparks.jpg`,
    hero: `${BASE}/welding.jpg`,
    alt: 'Welder producing sparks on a metal workpiece',
  },
  'plumbing': {
    card: `${BASE}/plumbing.jpg`,
    hero: `${BASE}/plumbing-pipes.jpg`,
    alt: 'Plumber working on pipe installation',
  },
  'construction-trades': {
    card: `${BASE}/construction-trades.jpg`,
    hero: `${BASE}/construction-trades.jpg`,
    alt: 'Construction trades training on a job site',
  },

  // ── Transportation ───────────────────────────────────────────────────────────
  'cdl': {
    card: `${BASE}/cdl-truck-highway.jpg`,
    hero: `${BASE}/cdl-training.jpg`,
    alt: 'CDL student in the cab of a commercial truck',
  },
  'cdl-training': {
    card: `${BASE}/cdl-truck-highway.jpg`,
    hero: `${BASE}/cdl-training.jpg`,
    alt: 'CDL student in the cab of a commercial truck',
  },

  // ── Healthcare ───────────────────────────────────────────────────────────────
  'cna': {
    card: `${BASE}/cna-patient-care.jpg`,
    hero: `${BASE}/cna-clinical.jpg`,
    alt: 'CNA student providing patient care in a clinical setting',
  },
  'medical-assistant': {
    card: `${BASE}/medical-assistant.jpg`,
    hero: `${BASE}/medical-assistant-lab.jpg`,
    alt: 'Medical assistant working in a clinical lab',
  },
  'phlebotomy': {
    card: `${BASE}/phlebotomy.jpg`,
    hero: `${BASE}/phlebotomy-draw.jpg`,
    alt: 'Phlebotomist performing a blood draw',
  },
  'home-health-aide': {
    card: `${BASE}/cna-nursing.jpg`,
    hero: `${BASE}/cna-nursing-real.jpg`,
    alt: 'Home health aide assisting a patient',
  },
  'direct-support-professional': {
    card: `${BASE}/peer-recovery.jpg`,
    hero: `${BASE}/peer-recovery.jpg`,
    alt: 'Direct support professional working with a client',
  },
  'peer-recovery-coach': {
    card: `${BASE}/peer-recovery.jpg`,
    hero: `${BASE}/peer-recovery.jpg`,
    alt: 'Peer recovery coach in a support session',
  },
  'emergency-health-safety-tech': {
    card: `${BASE}/cpr-training-real.jpg`,
    hero: `${BASE}/cpr-aed.jpg`,
    alt: 'Emergency health and safety technician training',
  },
  'cpr-certification': {
    card: `${BASE}/cpr-mannequin.jpg`,
    hero: `${BASE}/cpr-first-aid.jpg`,
    alt: 'CPR certification training on a mannequin',
  },

  // ── Cosmetology / Beauty ─────────────────────────────────────────────────────
  'barber-apprenticeship': {
    card: `${BASE}/barber-apprenticeship.jpg`,
    hero: `${BASE}/barber-hero-main.jpg`,
    alt: 'Barber apprentice cutting hair in a professional shop',
  },
  'cosmetology': {
    card: `${BASE}/cosmetology.jpg`,
    hero: `${BASE}/cosmetology.jpg`,
    alt: 'Cosmetology student practicing hair styling',
  },
  'professional-esthetician': {
    card: `${BASE}/nail-technician.jpg`,
    hero: `${BASE}/nail-technician.jpg`,
    alt: 'Esthetician performing a skincare treatment',
  },
  'nail-technician': {
    card: `${BASE}/nail-technician.jpg`,
    hero: `${BASE}/nail-technician.jpg`,
    alt: 'Nail technician applying nail art',
  },
  'beauty-career-educator': {
    card: `${BASE}/cosmetology.jpg`,
    hero: `${BASE}/training-classroom.jpg`,
    alt: 'Beauty career educator teaching in a classroom',
  },

  // ── Technology ───────────────────────────────────────────────────────────────
  'it-help-desk': {
    card: `${BASE}/it-help-desk.jpg`,
    hero: `${BASE}/it-helpdesk-desk.jpg`,
    alt: 'IT help desk technician supporting a user',
  },
  'cybersecurity': {
    card: `${BASE}/cybersecurity.jpg`,
    hero: `${BASE}/cybersecurity-screen.jpg`,
    alt: 'Cybersecurity analyst monitoring a security dashboard',
  },
  'cybersecurity-analyst': {
    card: `${BASE}/cybersecurity-code.jpg`,
    hero: `${BASE}/cybersecurity-screen.jpg`,
    alt: 'Cybersecurity analyst reviewing code',
  },

  // ── Business / Finance ───────────────────────────────────────────────────────
  'tax-prep-financial-services': {
    card: `${BASE}/tax-preparation.jpg`,
    hero: `${BASE}/tax-prep-desk.jpg`,
    alt: 'Tax preparer working with a client on financial documents',
  },
  'business-startup-marketing': {
    card: `${BASE}/business-sector.jpg`,
    hero: `${BASE}/training-classroom.jpg`,
    alt: 'Business startup and marketing training session',
  },

  // ── Workforce Readiness ──────────────────────────────────────────────────────
  'workforce-readiness': {
    card: `${BASE}/training-cohort.jpg`,
    hero: `${BASE}/training-classroom.jpg`,
    alt: 'Workforce readiness training cohort',
  },
};

/**
 * Returns the canonical card image for a program slug.
 * Falls back to a generic training image if the slug is not registered.
 */
export function getProgramCardImage(slug: string): string {
  return PROGRAM_IMAGES[slug]?.card ?? `${BASE}/training-cohort.jpg`;
}

/**
 * Returns the canonical hero image for a program slug.
 */
export function getProgramHeroImage(slug: string): string {
  return PROGRAM_IMAGES[slug]?.hero ?? `${BASE}/workforce-training.jpg`;
}

/**
 * Returns the alt text for a program's images.
 */
export function getProgramImageAlt(slug: string, fallback: string): string {
  return PROGRAM_IMAGES[slug]?.alt ?? fallback;
}

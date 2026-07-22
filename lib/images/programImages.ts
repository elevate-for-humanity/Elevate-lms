/**
 * Canonical program image registry.
 *
 * Every program slug maps to one card image and one hero image.
 * Images are chosen for trade specificity — active work, not posed portraits.
 *
 * Rules:
 * - No page file should hardcode a program image path directly.
 * - Use getProgramCardImage(slug) and getProgramHeroImage(slug) everywhere.
 * - Add new programs here before creating their page.
 * - Hero images: 16:9 or wider. Card images: 4:3.
 * - No duplicate images across unrelated programs.
 */

const P = '/images/pages';

interface ProgramImageEntry {
  /** 4:3 crop — used in grid cards, catalog rows, homepage lists */
  card: string;
  /** 16:9 or wider — used in page heroes, feature sections */
  hero: string;
  /** Descriptive alt text for both images */
  alt: string;
}

export const PROGRAM_IMAGES: Record<string, ProgramImageEntry> = {
  // ── HVAC ─────────────────────────────────────────────────────────────────
  'hvac-technician': {
    card: `${P}/hvac-unit.webp`,
    hero: `${P}/hvac-technician.webp`,
    alt: 'HVAC technician servicing a rooftop condenser unit',
  },

  // ── CDL / Commercial Driving ─────────────────────────────────────────────
  'cdl-training': {
    card: `${P}/cdl-driver-seat.webp`,
    hero: `${P}/cdl-truck-highway.webp`,
    alt: 'CDL student performing a pre-trip inspection on a commercial truck',
  },
  'diesel-mechanic': {
    card: `${P}/diesel-mechanic.webp`,
    hero: `${P}/cdl-cab-interior.webp`,
    alt: 'Diesel mechanic working on a commercial vehicle engine',
  },

  // ── Electrical ───────────────────────────────────────────────────────────
  electrical: {
    card: `${P}/electrical-panel.webp`,
    hero: `${P}/electrical-conduit.webp`,
    alt: 'Electrician wiring a breaker panel during installation',
  },

  // ── Welding ──────────────────────────────────────────────────────────────
  welding: {
    card: `${P}/welding-sparks.webp`,
    hero: `${P}/welding.webp`,
    alt: 'Welder producing sparks on a metal workpiece in a fabrication shop',
  },

  // ── Plumbing ─────────────────────────────────────────────────────────────
  plumbing: {
    card: `${P}/plumbing-pipes.webp`,
    hero: `${P}/plumbing.jpg`,
    alt: 'Plumber installing pipes during a commercial plumbing job',
  },

  // ── Construction Trades ──────────────────────────────────────────────────
  'construction-trades-certification': {
    card: `${P}/construction-trades.webp`,
    hero: `${P}/electrical-wiring.jpg`,
    alt: 'Construction trades student working on a framing project',
  },

  // ── CNA / Healthcare ─────────────────────────────────────────────────────
  cna: {
    card: `${P}/cna-patient-care.jpg`,
    hero: `${P}/cna-vitals.webp`,
    alt: 'CNA student checking patient vitals in a clinical simulation lab',
  },
  'medical-assistant': {
    card: `${P}/medical-assistant-lab.webp`,
    hero: `${P}/medical-assistant-real.webp`,
    alt: 'Medical assistant working in a clinical setting',
  },
  phlebotomy: {
    card: `${P}/phlebotomy-draw.webp`,
    hero: `${P}/phlebotomy-real.webp`,
    alt: 'Phlebotomist performing a blood draw procedure',
  },
  'pharmacy-technician': {
    card: `${P}/pharmacy-tech.webp`,
    hero: `${P}/pharmacy-technician.webp`,
    alt: 'Pharmacy technician preparing medications',
  },
  'sanitation-infection-control': {
    card: `${P}/sanitation.webp`,
    hero: `${P}/cna-clinical.jpg`,
    alt: 'Healthcare worker following infection control procedures',
  },

  // ── CPR / First Aid ──────────────────────────────────────────────────────
  'cpr-first-aid': {
    card: `${P}/cpr-mannequin.webp`,
    hero: `${P}/cpr-training-real.webp`,
    alt: 'CPR certification training on a mannequin',
  },

  // ── Barber / Cosmetology ─────────────────────────────────────────────────
  'barber-apprenticeship': {
    card: `${P}/barber-fade.webp`,
    hero: `${P}/barber-apprenticeship-hero.jpg`,
    alt: 'Barber apprentice executing a fade cut on a client',
  },
  'cosmetology-apprenticeship': {
    card: `${P}/cosmetology.webp`,
    hero: `${P}/barber-styling-hair.webp`,
    alt: 'Cosmetology student practicing hair styling techniques',
  },
  'esthetician-apprenticeship': {
    card: '/images/beauty/esthetician.webp',
    hero: '/images/beauty/esthetics-hero.webp',
    alt: 'Esthetician apprentice providing a professional skincare treatment',
  },
  'nail-technician-apprenticeship': {
    card: `${P}/nail-technician.webp`,
    hero: `${P}/barber-training.webp`,
    alt: 'Nail technician apprentice performing a manicure',
  },

  // ── Technology ───────────────────────────────────────────────────────────
  'it-help-desk': {
    card: `${P}/it-helpdesk-desk.webp`,
    hero: `${P}/it-help-desk.webp`,
    alt: 'IT help desk technician supporting a user at a workstation',
  },
  'cybersecurity-analyst': {
    card: `${P}/cybersecurity-screen.jpg`,
    hero: `${P}/cybersecurity-code.jpg`,
    alt: 'Cybersecurity analyst monitoring a security dashboard',
  },
  'network-administration': {
    card: `${P}/network-administration.jpg`,
    hero: `${P}/networking-hero.webp`,
    alt: 'Network administrator configuring network equipment',
  },
  'network-support-technician': {
    card: `${P}/networking-hero.webp`,
    hero: `${P}/network-administration.jpg`,
    alt: 'Network support technician troubleshooting a connection',
  },
  'software-development': {
    card: `${P}/software-development.jpg`,
    hero: `${P}/web-development.webp`,
    alt: 'Software development student writing code',
  },
  'web-development': {
    card: `${P}/web-development.webp`,
    hero: `${P}/software-development.jpg`,
    alt: 'Web development student building a site',
  },
  'graphic-design': {
    card: `${P}/graphic-design.webp`,
    hero: `${P}/graphic-design.webp`,
    alt: 'Graphic design student working in Adobe Creative Suite',
  },
  'cad-drafting': {
    card: `${P}/graphic-design.webp`,
    hero: `${P}/graphic-design.webp`,
    alt: 'CAD drafting student working on technical drawings',
  },

  // ── Business / Finance ───────────────────────────────────────────────────
  'tax-preparation': {
    card: `${P}/business-meeting.webp`,
    hero: `${P}/bookkeeping.webp`,
    alt: 'Tax preparer working with a client on financial documents',
  },
  bookkeeping: {
    card: `${P}/bookkeeping-ledger.webp`,
    hero: `${P}/bookkeeping.webp`,
    alt: 'Bookkeeping student working with financial records',
  },
  'finance-bookkeeping-accounting': {
    card: `${P}/bookkeeping.webp`,
    hero: `${P}/bookkeeping-ledger.webp`,
    alt: 'Finance and accounting student reviewing financial statements',
  },
  entrepreneurship: {
    card: `${P}/entrepreneurship.webp`,
    hero: `${P}/business-sector.webp`,
    alt: 'Entrepreneur working on a business plan',
  },
  business: {
    card: `${P}/business-sector.webp`,
    hero: `${P}/entrepreneurship.webp`,
    alt: 'Business administration student in a professional setting',
  },
  'office-administration': {
    card: `${P}/office-admin-desk.jpg`,
    hero: '/images/business/office-admin.webp',
    alt: 'Office administrator working at a professional workstation',
  },
  'project-management': {
    card: `${P}/project-management.webp`,
    hero: `${P}/business-sector.webp`,
    alt: 'Project manager leading a team meeting',
  },

  // ── Culinary ─────────────────────────────────────────────────────────────
  'culinary-apprenticeship': {
    card: `${P}/culinary.webp`,
    hero: `${P}/culinary-apprenticeship-hero.webp`,
    alt: 'Culinary apprentice preparing food in a professional kitchen',
  },

  // ── Forklift ─────────────────────────────────────────────────────────────
  forklift: {
    card: `${P}/forklift.webp`,
    hero: `${P}/cdl-loading-dock.webp`,
    alt: 'Forklift operator certification training',
  },
};

/**
 * Returns the card image path for a program slug.
 * Falls back to a generic training image if the slug is not registered.
 */
export function getProgramCardImage(slug: string): string {
  return PROGRAM_IMAGES[slug]?.card ?? `${P}/training-cohort.webp`;
}

/**
 * Returns the hero image path for a program slug.
 * Falls back to a generic workforce training image if the slug is not registered.
 */
export function getProgramHeroImage(slug: string): string {
  return PROGRAM_IMAGES[slug]?.hero ?? `${P}/workforce-training.webp`;
}

/**
 * Returns the alt text for a program slug.
 * Provide a fallback that describes the page context.
 */
export function getProgramImageAlt(slug: string, fallback: string): string {
  return PROGRAM_IMAGES[slug]?.alt ?? fallback;
}

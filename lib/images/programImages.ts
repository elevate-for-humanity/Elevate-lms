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
    card: `${P}/hvac-unit.jpg`,
    hero: `${P}/hvac-technician.jpg`,
    alt: 'HVAC technician servicing a rooftop condenser unit',
  },

  // ── CDL / Commercial Driving ─────────────────────────────────────────────
  'cdl-training': {
    card: `${P}/cdl-pretrip.jpg`,
    hero: `${P}/cdl-truck-highway.jpg`,
    alt: 'CDL student performing a pre-trip inspection on a commercial truck',
  },
  'diesel-mechanic': {
    card: `${P}/diesel-mechanic.jpg`,
    hero: `${P}/cdl-cab-interior.jpg`,
    alt: 'Diesel mechanic working on a commercial vehicle engine',
  },

  // ── Electrical ───────────────────────────────────────────────────────────
  'electrical': {
    card: `${P}/electrical-panel.jpg`,
    hero: `${P}/electrical-conduit.jpg`,
    alt: 'Electrician wiring a breaker panel during installation',
  },

  // ── Welding ──────────────────────────────────────────────────────────────
  'welding': {
    card: `${P}/welding-sparks.jpg`,
    hero: `${P}/welding-torch.jpg`,
    alt: 'Welder producing sparks on a metal workpiece in a fabrication shop',
  },

  // ── Plumbing ─────────────────────────────────────────────────────────────
  'plumbing': {
    card: `${P}/plumbing-pipes.jpg`,
    hero: `${P}/plumbing-tools.jpg`,
    alt: 'Plumber installing pipes during a commercial plumbing job',
  },

  // ── Construction Trades ──────────────────────────────────────────────────
  'construction-trades-certification': {
    card: `${P}/construction-trades.jpg`,
    hero: `${P}/electrical-wiring.jpg`,
    alt: 'Construction trades student working on a framing project',
  },

  // ── CNA / Healthcare ─────────────────────────────────────────────────────
  'cna': {
    card: `${P}/cna-patient-care.jpg`,
    hero: `${P}/cna-vitals.jpg`,
    alt: 'CNA student checking patient vitals in a clinical simulation lab',
  },
  'medical-assistant': {
    card: `${P}/medical-assistant-lab.jpg`,
    hero: `${P}/medical-assistant-real.jpg`,
    alt: 'Medical assistant working in a clinical setting',
  },
  'phlebotomy': {
    card: `${P}/phlebotomy-draw.jpg`,
    hero: `${P}/phlebotomy-real.jpg`,
    alt: 'Phlebotomist performing a blood draw procedure',
  },
  'pharmacy-technician': {
    card: `${P}/pharmacy-tech.jpg`,
    hero: `${P}/pharmacy-technician.jpg`,
    alt: 'Pharmacy technician preparing medications',
  },
  'sanitation-infection-control': {
    card: `${P}/sanitation.jpg`,
    hero: `${P}/cna-clinical.jpg`,
    alt: 'Healthcare worker following infection control procedures',
  },

  // ── CPR / First Aid ──────────────────────────────────────────────────────
  'cpr-first-aid': {
    card: `${P}/cpr-mannequin.jpg`,
    hero: `${P}/cpr-training-real.jpg`,
    alt: 'CPR certification training on a mannequin',
  },

  // ── Barber / Cosmetology ─────────────────────────────────────────────────
  'barber-apprenticeship': {
    card: `${P}/barber-fade-cut.jpg`,
    hero: `${P}/barber-clippers-work.jpg`,
    alt: 'Barber apprentice executing a fade cut on a client',
  },
  'cosmetology-apprenticeship': {
    card: `${P}/cosmetology.jpg`,
    hero: `${P}/barber-styling-hair.jpg`,
    alt: 'Cosmetology student practicing hair styling techniques',
  },
  'nail-technician-apprenticeship': {
    card: `${P}/nail-technician.jpg`,
    hero: `${P}/barber-tools-closeup.jpg`,
    alt: 'Nail technician apprentice performing a manicure',
  },

  // ── Technology ───────────────────────────────────────────────────────────
  'it-help-desk': {
    card: `${P}/it-helpdesk-desk.jpg`,
    hero: `${P}/it-help-desk.jpg`,
    alt: 'IT help desk technician supporting a user at a workstation',
  },
  'cybersecurity-analyst': {
    card: `${P}/cybersecurity-screen.jpg`,
    hero: `${P}/cybersecurity-code.jpg`,
    alt: 'Cybersecurity analyst monitoring a security dashboard',
  },
  'network-administration': {
    card: `${P}/network-administration.jpg`,
    hero: `${P}/it-networking.jpg`,
    alt: 'Network administrator configuring network equipment',
  },
  'network-support-technician': {
    card: `${P}/networking-hero.jpg`,
    hero: `${P}/it-hardware.jpg`,
    alt: 'Network support technician troubleshooting a connection',
  },
  'software-development': {
    card: `${P}/software-development.jpg`,
    hero: `${P}/web-development.jpg`,
    alt: 'Software development student writing code',
  },
  'web-development': {
    card: `${P}/web-development.jpg`,
    hero: `${P}/software-development.jpg`,
    alt: 'Web development student building a site',
  },
  'graphic-design': {
    card: `${P}/graphic-design.jpg`,
    hero: `${P}/cad-drafting.jpg`,
    alt: 'Graphic design student working in Adobe Creative Suite',
  },
  'cad-drafting': {
    card: `${P}/cad-drafting.jpg`,
    hero: `${P}/graphic-design.jpg`,
    alt: 'CAD drafting student working on technical drawings',
  },

  // ── Business / Finance ───────────────────────────────────────────────────
  'tax-preparation': {
    card: `${P}/tax-prep-desk.jpg`,
    hero: `${P}/tax-preparation.jpg`,
    alt: 'Tax preparer working with a client on financial documents',
  },
  'bookkeeping': {
    card: `${P}/bookkeeping-ledger.jpg`,
    hero: `${P}/bookkeeping.jpg`,
    alt: 'Bookkeeping student working with financial records',
  },
  'finance-bookkeeping-accounting': {
    card: `${P}/bookkeeping.jpg`,
    hero: `${P}/bookkeeping-ledger.jpg`,
    alt: 'Finance and accounting student reviewing financial statements',
  },
  'entrepreneurship': {
    card: `${P}/entrepreneurship.jpg`,
    hero: `${P}/business-sector.jpg`,
    alt: 'Entrepreneur working on a business plan',
  },
  'business': {
    card: `${P}/business-sector.jpg`,
    hero: `${P}/entrepreneurship.jpg`,
    alt: 'Business administration student in a professional setting',
  },
  'office-administration': {
    card: `${P}/office-admin-desk.jpg`,
    hero: `${P}/office-administration.jpg`,
    alt: 'Office administrator working at a professional workstation',
  },
  'project-management': {
    card: `${P}/project-management.jpg`,
    hero: `${P}/business-sector.jpg`,
    alt: 'Project manager leading a team meeting',
  },

  // ── Peer Recovery / DSP ──────────────────────────────────────────────────
  'peer-recovery-specialist': {
    card: `${P}/peer-recovery.jpg`,
    hero: `${P}/training-cohort.jpg`,
    alt: 'Peer recovery specialist in a professional support session',
  },

  // ── Culinary ─────────────────────────────────────────────────────────────
  'culinary-apprenticeship': {
    card: `${P}/culinary.jpg`,
    hero: `${P}/culinary.jpg`,
    alt: 'Culinary apprentice preparing food in a professional kitchen',
  },

  // ── Forklift ─────────────────────────────────────────────────────────────
  'forklift': {
    card: `${P}/forklift.jpg`,
    hero: `${P}/cdl-loading-dock.jpg`,
    alt: 'Forklift operator certification training',
  },
};

/**
 * Returns the card image path for a program slug.
 * Falls back to a generic training image if the slug is not registered.
 */
export function getProgramCardImage(slug: string): string {
  return PROGRAM_IMAGES[slug]?.card ?? `${P}/training-cohort.jpg`;
}

/**
 * Returns the hero image path for a program slug.
 * Falls back to a generic workforce training image if the slug is not registered.
 */
export function getProgramHeroImage(slug: string): string {
  return PROGRAM_IMAGES[slug]?.hero ?? `${P}/workforce-training.jpg`;
}

/**
 * Returns the alt text for a program slug.
 * Provide a fallback that describes the page context.
 */
export function getProgramImageAlt(slug: string, fallback: string): string {
  return PROGRAM_IMAGES[slug]?.alt ?? fallback;
}

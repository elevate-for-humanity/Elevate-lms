/**
 * Canonical program image registry.
 *
 * Every public/static program slug maps to one card image and one hero image.
 * Images are chosen for trade specificity wherever repository media permits.
 *
 * Rules:
 * - No page file should hardcode a program image path directly.
 * - Use getProgramCardImage(slug) and getProgramHeroImage(slug) everywhere.
 * - Add new programs here before creating their page.
 * - Hero images: 16:9 or wider. Card images: 4:3.
 * - No duplicate image assignment across unrelated PROGRAM_IMAGES entries.
 */

const P = '/images/pages';

interface ProgramImageEntry { card: string; hero: string; alt: string; }

export const PROGRAM_IMAGES: Record<string, ProgramImageEntry> = {
  'hvac-technician': { card: `${P}/hvac-unit.webp`, hero: `${P}/hvac-technician.webp`, alt: 'HVAC technician servicing a rooftop condenser unit' },
  'cdl-training': { card: `${P}/cdl-driver-seat.webp`, hero: `${P}/cdl-truck-highway.webp`, alt: 'CDL student performing a pre-trip inspection on a commercial truck' },
  'diesel-mechanic': { card: '/images/pexels/diesel.webp', hero: `${P}/cdl-cab-interior.webp`, alt: 'Diesel mechanic working on a commercial vehicle engine' },
  electrical: { card: `${P}/electrical-panel.webp`, hero: `${P}/electrical-conduit.webp`, alt: 'Electrician wiring a breaker panel during installation' },
  welding: { card: `${P}/welding-sparks.webp`, hero: `${P}/welding.webp`, alt: 'Welder producing sparks on a metal workpiece in a fabrication shop' },
  plumbing: { card: `${P}/plumbing-pipes.webp`, hero: '/images/pexels/plumbing.webp', alt: 'Plumber installing pipes during a commercial plumbing job' },
  'construction-trades-certification': { card: `${P}/construction-trades.webp`, hero: `${P}/electrical-wiring.jpg`, alt: 'Construction trades student working on a framing project' },
  cna: { card: `${P}/cna-patient-care.jpg`, hero: `${P}/cna-vitals.webp`, alt: 'CNA student checking patient vitals in a clinical simulation lab' },
  'medical-assistant': { card: `${P}/medical-assistant-lab.webp`, hero: `${P}/medical-assistant-real.webp`, alt: 'Medical assistant working in a clinical setting' },
  phlebotomy: { card: `${P}/phlebotomy-draw.webp`, hero: `${P}/phlebotomy-real.webp`, alt: 'Phlebotomist performing a blood draw procedure' },
  'pharmacy-technician': { card: `${P}/pharmacy-tech.webp`, hero: `${P}/pharmacy-technician.webp`, alt: 'Pharmacy technician preparing medications' },
  qma: { card: `${P}/funding-impact-1.webp`, hero: '/images/healthcare/hero-program-medical-assistant.webp', alt: 'Qualified Medication Aide supporting supervised patient medication care' },
  'home-health-aide': { card: `${P}/healthcare-classroom.webp`, hero: `${P}/adult-learner.webp`, alt: 'Home Health Aide learner preparing for in-home patient care' },
  'emergency-health-safety': { card: `${P}/comp-pathway-classroom.webp`, hero: '/images/healthcare/hero-program-patient-care.webp', alt: 'Emergency health and safety learner practicing patient-response skills' },
  'peer-recovery-specialist': { card: `${P}/career-counseling.jpg`, hero: '/images/pexels/medical-assistant.webp', alt: 'Peer recovery specialist supporting a client through a counseling conversation' },
  'sanitation-infection-control': { card: `${P}/sanitation.webp`, hero: `${P}/cna-clinical.jpg`, alt: 'Healthcare worker following infection control procedures' },
  'cpr-first-aid': { card: `${P}/cpr-mannequin.webp`, hero: `${P}/programs-cpr-hero.webp`, alt: 'CPR certification training on a mannequin' },
  'barber-apprenticeship': { card: `${P}/barber-fade.webp`, hero: `${P}/barber-apprenticeship-hero.jpg`, alt: 'Barber apprentice executing a fade cut on a client' },
  'cosmetology-apprenticeship': { card: `${P}/cosmetology.webp`, hero: `${P}/barber-styling-hair.webp`, alt: 'Cosmetology student practicing hair styling techniques' },
  esthetician: { card: '/images/beauty/esthetics-hero.webp', hero: `${P}/cosmetology-hero.webp`, alt: 'Esthetics learner practicing professional skincare and client services' },
  'esthetician-apprenticeship': { card: '/images/beauty/esthetician.webp', hero: '/images/pexels/esthetician.webp', alt: 'Esthetician apprentice providing a professional skincare treatment' },
  'nail-technician-apprenticeship': { card: `${P}/nail-technician.webp`, hero: `${P}/barber-training.webp`, alt: 'Nail technician apprentice performing a manicure' },
  'culinary-apprenticeship': { card: '/images/pexels/culinary.webp', hero: `${P}/culinary-apprenticeship-hero.webp`, alt: 'Culinary apprentice preparing food in a professional kitchen' },
  'it-help-desk': { card: `${P}/tech-classroom.webp`, hero: `${P}/it-help-desk.webp`, alt: 'IT help desk technician supporting a user at a workstation' },
  'cybersecurity-analyst': { card: `${P}/cybersecurity-screen.jpg`, hero: `${P}/cybersecurity-code.jpg`, alt: 'Cybersecurity analyst monitoring a security dashboard' },
  'network-administration': { card: `${P}/network-administration.jpg`, hero: `${P}/networking-hero.webp`, alt: 'Network administrator configuring network equipment' },
  'network-support-technician': { card: '/images/hero/hero-tech-careers.webp', hero: '/images/heroes/lms-analytics.webp', alt: 'Network support technician troubleshooting a connection' },
  'software-development': { card: `${P}/software-development.jpg`, hero: `${P}/admin-dev-studio-detail.webp`, alt: 'Software development student writing code' },
  'web-development': { card: `${P}/web-development.webp`, hero: `${P}/programs-tech-webdev-hero.webp`, alt: 'Web development student building a site' },
  'graphic-design': { card: `${P}/graphic-design.webp`, hero: `${P}/admin-videos-hero.webp`, alt: 'Graphic design student working in Adobe Creative Suite' },
  'cad-drafting': { card: `${P}/comp-program-template.webp`, hero: `${P}/admin-advanced-tools-hero.webp`, alt: 'CAD drafting student working on technical drawings' },
  technology: { card: '/images/pexels/webdev.webp', hero: `${P}/programs-it-hero.webp`, alt: 'Technology learner building practical IT and digital skills' },
  'tax-preparation': { card: `${P}/business-meeting.webp`, hero: '/images/business/professional-2.jpg', alt: 'Tax preparer working with a client on financial documents' },
  bookkeeping: { card: `${P}/bookkeeping-ledger.webp`, hero: '/images/pexels/bookkeeping.webp', alt: 'Bookkeeping student working with financial records' },
  'finance-bookkeeping-accounting': { card: '/images/business/team-2.jpg', hero: '/images/business/team-3.webp', alt: 'Finance and accounting student reviewing financial statements' },
  entrepreneurship: { card: `${P}/entrepreneurship.webp`, hero: '/images/business/collaboration-1.webp', alt: 'Entrepreneur working on a business plan' },
  business: { card: '/images/pexels/business.webp', hero: '/images/business/team-4.webp', alt: 'Business administration student in a professional setting' },
  'office-administration': { card: `${P}/office-admin-desk.jpg`, hero: '/images/business/office-admin.webp', alt: 'Office administrator working at a professional workstation' },
  'project-management': { card: '/images/pexels/project.webp', hero: `${P}/comp-home-highlight-success.webp`, alt: 'Project manager leading a team meeting' },
  hospitality: { card: `${P}/comp-home-hero-programs.jpg`, hero: `${P}/comp-layout-hero.webp`, alt: 'Hospitality and customer service learner preparing for guest-facing work' },
  forklift: { card: `${P}/forklift.webp`, hero: `${P}/cdl-loading-dock.webp`, alt: 'Forklift operator certification training' },
};

export function getProgramCardImage(slug: string): string { return PROGRAM_IMAGES[slug]?.card ?? `${P}/training-cohort.webp`; }
export function getProgramHeroImage(slug: string): string { return PROGRAM_IMAGES[slug]?.hero ?? `${P}/workforce-training.webp`; }
export function getProgramImageAlt(slug: string, fallback: string): string { return PROGRAM_IMAGES[slug]?.alt ?? fallback; }

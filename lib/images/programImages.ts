/**
 * Canonical program image registry.
 *
 * Every public/static program slug maps to one canonical program image.
 * The same visual is resolved for the catalog card and page hero so users do
 * not see a different program identity after opening a card.
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

interface ProgramImageEntry {
  card: string;
  hero: string;
  alt: string;
}

export const PROGRAM_IMAGES: Record<string, ProgramImageEntry> = {
  'business-administration': {
    card: '/images/pexels/business.webp',
    hero: '/hero-images/business-hero.webp',
    alt: 'Business administration learners collaborating in a professional setting',
  },
  'financial-literacy': {
    card: `${P}/financial-aid-page-1.webp`,
    hero: `${P}/finance-accounting.webp`,
    alt: 'Financial literacy learner reviewing a personal financial plan',
  },
  'administrative-assistant': {
    card: `${P}/suboffice-onboarding-page-1.webp`,
    hero: `${P}/admin-business-hero.webp`,
    alt: 'Administrative assistant working at a professional office workstation',
  },
  'automotive-technician': {
    card: `${P}/diesel-mechanic.webp`,
    hero: '/images/pexels/diesel.webp',
    alt: 'Automotive technician inspecting vehicle systems in a service shop',
  },
  'business-operations': {
    card: '/images/business/team-3.webp',
    hero: '/images/business/team-4.webp',
    alt: 'Business operations team coordinating a workplace process',
  },
  'business-startup': {
    card: `${P}/entrepreneurship.webp`,
    hero: '/images/programs/efh-business-startup-marketing-hero.jpg',
    alt: 'Entrepreneur building the launch plan for a new business',
  },
  'chw-cert': {
    card: `${P}/community-page-3.webp`,
    hero: '/images/hero/hero-community.webp',
    alt: 'Community health worker connecting a resident with support services',
  },
  'customer-service-pro': {
    card: `${P}/community-page-4.webp`,
    hero: '/images/business/collaboration-1.webp',
    alt: 'Customer service professional assisting a client',
  },
  'customer-service-representative': {
    card: `${P}/community-page-5.webp`,
    hero: '/images/business/partnership-1.webp',
    alt: 'Customer service representative helping a customer resolve a request',
  },
  'data-analytics': {
    card: `${P}/store-addons-analytics-hero.webp`,
    hero: '/images/heroes/lms-analytics.webp',
    alt: 'Data analytics learner reviewing charts and business metrics',
  },
  'dental-assistant': {
    card: '/images/healthcare/video-thumbnail-dental-assistant.jpg',
    hero: `${P}/programs-medical-apply-hero.webp`,
    alt: 'Dental assistant learner preparing for supervised chairside care',
  },
  'drug-alcohol-specimen-collector': {
    card: `${P}/drug-testing-page-4.webp`,
    hero: '/hero-images/drug-collector-hero.webp',
    alt: 'Drug and alcohol specimen collector following a documented collection process',
  },
  'nha-ekg-technician': {
    card: '/images/healthcare/healthcare-professional-portrait-1.jpg',
    hero: '/hero-images/healthcare-category.webp',
    alt: 'EKG technician learner preparing equipment for a cardiac test',
  },
  'nha-ehr': {
    card: `${P}/admin-docs-detail.webp`,
    hero: `${P}/admin-applications-hero.webp`,
    alt: 'Electronic health records learner documenting patient information securely',
  },
  'emt-apprenticeship': {
    card: `${P}/card-wioa.webp`,
    hero: `${P}/programs-emergency-health-safety-hero.webp`,
    alt: 'Emergency medical technician apprentice preparing for patient response',
  },
  'guest-service-gold': {
    card: `${P}/career-services-page-11.webp`,
    hero: '/hero-images/services-hero.webp',
    alt: 'Guest service professional welcoming and assisting a visitor',
  },
  'information-technology': {
    card: `${P}/technology-sector.webp`,
    hero: '/hero-images/technology-cat-new.jpg',
    alt: 'Information technology learner working in a computer lab',
  },
  'insurance-agent': {
    card: `${P}/business-meeting.webp`,
    hero: '/hero-images/business-category.webp',
    alt: 'Insurance agent reviewing coverage information with a client',
  },
  'manufacturing-technician': {
    card: '/images/programs/efh-building-tech-card.jpg',
    hero: '/images/programs/efh-building-tech-hero.jpg',
    alt: 'Manufacturing technician working with industrial production equipment',
  },
  'nha-medical-admin-assistant': {
    card: `${P}/admin/staff-portal-page-1.webp`,
    hero: `${P}/medical-assistant-hero.webp`,
    alt: 'Medical administrative assistant coordinating patient office records',
  },
  'nha-billing-coding': {
    card: `${P}/admin-compliance-exports-detail.webp`,
    hero: `${P}/admin-accreditation-report-hero.webp`,
    alt: 'Medical billing and coding learner reviewing healthcare records',
  },
  'nha-patient-care-technician': {
    card: `${P}/healthcare-sector.webp`,
    hero: `${P}/healthcare-grad.jpg`,
    alt: 'Patient care technician learner practicing supervised clinical care',
  },
  'real-estate-agent': {
    card: `${P}/about-employer-partners.webp`,
    hero: `${P}/admin-employers-hero.webp`,
    alt: 'Real estate agent presenting property information to a client',
  },
  'solar-panel-installation': {
    card: `${P}/electrical.jpg`,
    hero: '/hero-images/electrical-hero.jpg',
    alt: 'Solar installation learner preparing rooftop electrical equipment',
  },
  'start-hospitality': {
    card: `${P}/community-page-10.webp`,
    hero: `${P}/comp-home-hero-programs.jpg`,
    alt: 'Hospitality learner preparing for professional guest service',
  },
  'youth-culinary-apprenticeship': {
    card: `${P}/culinary.webp`,
    hero: `${P}/apprenticeship-structure.webp`,
    alt: 'Youth culinary apprentice preparing food in a professional kitchen',
  },
  'hvac-technician': {
    card: `${P}/hvac-unit.webp`,
    hero: `${P}/hvac-technician.webp`,
    alt: 'HVAC technician servicing a rooftop condenser unit',
  },
  'cdl-training': {
    card: `${P}/cdl-driver-seat.webp`,
    hero: `${P}/cdl-truck-highway.webp`,
    alt: 'CDL student performing a pre-trip inspection on a commercial truck',
  },
  'diesel-mechanic': {
    card: `${P}/card-cdl.webp`,
    hero: `${P}/cdl-cab-interior.webp`,
    alt: 'Diesel mechanic working on a commercial vehicle engine',
  },
  electrical: {
    card: `${P}/electrical-panel.webp`,
    hero: `${P}/electrical-conduit.webp`,
    alt: 'Electrician wiring a breaker panel during installation',
  },
  welding: {
    card: `${P}/welding-sparks.webp`,
    hero: `${P}/welding.webp`,
    alt: 'Welder producing sparks on a metal workpiece in a fabrication shop',
  },
  plumbing: {
    card: `${P}/plumbing-pipes.webp`,
    hero: '/images/pexels/plumbing.webp',
    alt: 'Plumber installing pipes during a commercial plumbing job',
  },
  'construction-trades-certification': {
    card: `${P}/construction-trades.webp`,
    hero: `${P}/electrical-wiring.jpg`,
    alt: 'Construction trades student working on a framing project',
  },
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
  qma: {
    card: `${P}/funding-impact-1.webp`,
    hero: '/hero-images/healthcare-cat-new.jpg',
    alt: 'Qualified Medication Aide supporting supervised patient medication care',
  },
  'home-health-aide': {
    card: '/images/healthcare/program-healthcare-overview.jpg',
    hero: `${P}/adult-learner.webp`,
    alt: 'Home Health Aide learner preparing for in-home patient care',
  },
  'emergency-health-safety': {
    card: `${P}/comp-pathway-classroom.webp`,
    hero: '/images/hero/hero-healthcare.jpg',
    alt: 'Emergency health and safety learner practicing patient-response skills',
  },
  'peer-recovery-specialist': {
    card: `${P}/peer-recovery.webp`,
    hero: '/images/team/instructors/instructor-recovery.webp',
    alt: 'Peer recovery specialist supporting a client through a counseling conversation',
  },
  'sanitation-infection-control': {
    card: `${P}/sanitation.webp`,
    hero: `${P}/cna-clinical.jpg`,
    alt: 'Healthcare worker following infection control procedures',
  },
  'cpr-first-aid': {
    card: `${P}/cpr-mannequin.webp`,
    hero: `${P}/programs-cpr-hero.webp`,
    alt: 'CPR certification training on a mannequin',
  },
  'barber-apprenticeship': {
    card: `${P}/barber-fade.webp`,
    hero: `${P}/barber-apprenticeship-hero.jpg`,
    alt: 'Barber apprentice executing a fade cut on a client',
  },
  'cosmetology-apprenticeship': {
    card: `${P}/cosmetology.webp`,
    hero: '/images/pages/cosmetology-apprenticeship-hero.webp',
    alt: 'Cosmetology student practicing hair styling techniques',
  },
  esthetician: {
    card: '/images/beauty/esthetics-hero.webp',
    hero: `${P}/cosmetology-hero.webp`,
    alt: 'Esthetics learner practicing professional skincare and client services',
  },
  'esthetician-apprenticeship': {
    card: '/images/beauty/esthetician.webp',
    hero: '/images/pexels/esthetician.webp',
    alt: 'Esthetician apprentice providing a professional skincare treatment',
  },
  'nail-technician-apprenticeship': {
    card: `${P}/nail-technician.webp`,
    hero: `${P}/nail-tech-hero.webp`,
    alt: 'Nail technician apprentice performing a manicure',
  },
  'culinary-apprenticeship': {
    card: '/images/pexels/culinary.webp',
    hero: `${P}/culinary-apprenticeship-hero.webp`,
    alt: 'Culinary apprentice preparing food in a professional kitchen',
  },
  'it-help-desk': {
    card: `${P}/tech-classroom.webp`,
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
    card: '/images/hero/hero-tech-careers.webp',
    hero: '/hero-images/technology-hero.webp',
    alt: 'Network support technician troubleshooting a connection',
  },
  'software-development': {
    card: `${P}/software-development.jpg`,
    hero: `${P}/admin-dev-studio-detail.webp`,
    alt: 'Software development student writing code',
  },
  'web-development': {
    card: `${P}/web-development.webp`,
    hero: `${P}/programs-tech-webdev-hero.webp`,
    alt: 'Web development student building a site',
  },
  'graphic-design': {
    card: `${P}/graphic-design.webp`,
    hero: `${P}/admin-videos-hero.webp`,
    alt: 'Graphic design student working in Adobe Creative Suite',
  },
  'cad-drafting': {
    card: `${P}/comp-program-template.webp`,
    hero: `${P}/admin-advanced-tools-hero.webp`,
    alt: 'CAD drafting student working on technical drawings',
  },
  technology: {
    card: '/images/pexels/webdev.webp',
    hero: `${P}/programs-it-hero.webp`,
    alt: 'Technology learner building practical IT and digital skills',
  },
  'tax-preparation': {
    card: `${P}/bookkeeping.webp`,
    hero: `${P}/admin-analytics-hero.webp`,
    alt: 'Tax preparer working with a client on financial documents',
  },
  bookkeeping: {
    card: `${P}/bookkeeping-ledger.webp`,
    hero: '/images/pexels/bookkeeping.webp',
    alt: 'Bookkeeping student working with financial records',
  },
  'finance-bookkeeping-accounting': {
    card: `${P}/business-sector.webp`,
    hero: `${P}/admin-analytics-learning-hero.webp`,
    alt: 'Finance and accounting student reviewing financial statements',
  },
  entrepreneurship: {
    card: '/images/business/team-2.jpg',
    hero: '/images/hero/hero-business.webp',
    alt: 'Entrepreneur working on a business plan',
  },
  business: {
    card: '/images/business/professional-2.jpg',
    hero: `${P}/admin-campaigns-hero.webp`,
    alt: 'Business administration student in a professional setting',
  },
  'office-administration': {
    card: `${P}/office-admin-desk.jpg`,
    hero: '/images/business/office-admin.webp',
    alt: 'Office administrator working at a professional workstation',
  },
  'project-management': {
    card: '/images/pexels/project.webp',
    hero: `${P}/comp-home-highlight-success.webp`,
    alt: 'Project manager leading a team meeting',
  },
  hospitality: {
    card: `${P}/services-page-1.webp`,
    hero: `${P}/career-services-hero.webp`,
    alt: 'Hospitality and customer service learner preparing for guest-facing work',
  },
  forklift: {
    card: `${P}/forklift.webp`,
    hero: `${P}/cdl-loading-dock.webp`,
    alt: 'Forklift operator certification training',
  },
  'jri-badge-1-mindsets': {
    card: '/hero-images/jri-hero.webp',
    hero: `${P}/jri-hero.webp`,
    alt: 'Job Ready Indy learner developing a career-ready mindset',
  },
  'jri-badge-2-self-management': {
    card: `${P}/pathways-page-6.webp`,
    hero: `${P}/career-coaching.webp`,
    alt: 'Job Ready Indy learner building self-management skills',
  },
  'jri-badge-3-learning-strategies': {
    card: `${P}/learner-page-1.webp`,
    hero: `${P}/onboarding-page-2.webp`,
    alt: 'Job Ready Indy learner practicing effective learning strategies',
  },
  'jri-badge-4-social-skills': {
    card: `${P}/team-collaboration.webp`,
    hero: `${P}/staff-page-13.jpg`,
    alt: 'Job Ready Indy learners practicing workplace communication',
  },
  'jri-badge-5-workplace-skills': {
    card: `${P}/workforce-training.webp`,
    hero: `${P}/job-placement.webp`,
    alt: 'Job Ready Indy learner practicing workplace skills',
  },
  'jri-badge-6-launch-a-career': {
    card: `${P}/career-services-page-2.jpg`,
    hero: `${P}/graduation-ceremony.webp`,
    alt: 'Job Ready Indy learner preparing to launch a career',
  },
  'jri-introduction': {
    card: `${P}/career-services-page-10.webp`,
    hero: '/hero-images/jri-hero.webp',
    alt: 'Introduction to the Job Ready Indy career-readiness pathway',
  },
  'nha-medical-assistant': {
    card: '/images/healthcare/program-medical-assistant.jpg',
    hero: '/images/healthcare/hero-program-medical-assistant.webp',
    alt: 'NHA medical assistant learner preparing for clinical work',
  },
  'nha-pharmacy-technician': {
    card: '/images/pexels/pharmacy.webp',
    hero: '/images/healthcare/hero-program-patient-care.jpg',
    alt: 'NHA pharmacy technician learner preparing medications',
  },
  'nha-phlebotomy': {
    card: '/images/pexels/phlebotomy.webp',
    hero: '/images/healthcare/hero-program-phlebotomy.webp',
    alt: 'NHA phlebotomy technician learner practicing blood collection',
  },
  'life-coach-certification-wioa': {
    card: '/images/career-coaching-new.webp',
    hero: '/images/career-coaching-new.jpg',
    alt: 'Life coach learner practicing a supportive coaching conversation',
  },
  'building-maintenance-wrg': {
    card: '/images/building-maintenance.webp',
    hero: '/images/programs/building-maintenance-hero.svg',
    alt: 'Building maintenance technician working on facility systems',
  },
};

export function getProgramCardImage(slug: string): string {
  return PROGRAM_IMAGES[slug]?.card ?? `${P}/training-cohort.webp`;
}
export function getProgramHeroImage(slug: string): string {
  return PROGRAM_IMAGES[slug]?.hero ?? `${P}/training-cohort.webp`;
}
export function getProgramImageAlt(slug: string, fallback: string): string {
  return PROGRAM_IMAGES[slug]?.alt ?? fallback;
}

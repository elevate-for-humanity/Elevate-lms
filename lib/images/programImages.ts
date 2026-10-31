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
    hero: '/images/business-collaboration-vibrant-2026.webp',
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
    hero: '/images/pages/community-page-4.webp',
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
    card: '/images/refresh-20261014/dental.webp',
    hero: '/images/refresh-20261014/dental.webp',
    alt: 'Illustrative Dental assistant instructor supervising instrument preparation in a skills lab',
  },
  'drug-alcohol-specimen-collector': {
    card: `${P}/drug-testing-page-4.webp`,
    hero: '/hero-images/drug-collector-hero.webp',
    alt: 'Drug and alcohol specimen collector following a documented collection process',
  },
  'nha-ekg-technician': {
    card: '/images/pages/medical-assistant-real.webp',
    hero: '/hero-images/healthcare-category.webp',
    alt: 'EKG technician learner preparing equipment for a cardiac test',
  },
  'nha-ehr': {
    card: `${P}/admin-docs-detail.webp`,
    hero: `${P}/admin-applications-hero.webp`,
    alt: 'Electronic health records learner documenting patient information securely',
  },
  'emt-apprenticeship': {
    card: '/images/refresh-20261014/emt.webp',
    hero: '/images/refresh-20261014/emt.webp',
    alt: 'Illustrative Emergency medical instructor and learner practicing assessment on a training manikin',
  },
  'guest-service-gold': {
    card: '/images/refresh-20261014/hospitality.webp',
    hero: '/images/refresh-20261014/hospitality.webp',
    alt: 'Illustrative Hospitality instructor and learner practicing hotel guest services',
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
    card: '/images/program-media-20261016/patient-care.webp',
    hero: '/images/program-media-20261016/patient-care.webp',
    alt: 'Illustrative supervised patient-mobility skills practice in a training lab',
  },
  'real-estate-agent': {
    card: `${P}/about-employer-partners.webp`,
    hero: `${P}/admin-employers-hero.webp`,
    alt: 'Real estate agent presenting property information to a client',
  },
  'solar-panel-installation': {
    card: '/images/refresh-20261014/solar.webp',
    hero: '/images/refresh-20261014/solar.webp',
    alt: 'Illustrative Solar installation instructor and learner inspecting panels on a training roof',
  },
  'start-hospitality': {
    card: '/images/program-media-20261016/start-hospitality.webp',
    hero: '/images/program-media-20261016/start-hospitality.webp',
    alt: 'Illustrative hotel supervisor guiding a learner through reception procedures',
  },
  'youth-culinary-apprenticeship': {
    card: '/images/refresh-20261014/culinary.webp',
    hero: '/images/refresh-20261014/culinary.webp',
    alt: 'Illustrative Chef instructor supervising culinary skills practice in a teaching kitchen',
  },
  'hvac-technician': {
    card: '/images/refresh-20261014/trades.webp',
    hero: '/images/refresh-20261014/trades.webp',
    alt: 'Illustrative HVAC instructor supervising a learner inspecting an HVAC unit',
  },
  'cdl-training': {
    card: '/images/refresh-20261014/cdl.webp',
    hero: '/images/refresh-20261014/cdl.webp',
    alt: 'Illustrative Commercial-driving instructor supervising a truck pretrip inspection',
  },
  'diesel-mechanic': {
    card: `${P}/card-cdl.webp`,
    hero: `${P}/cdl-cab-interior.webp`,
    alt: 'Diesel mechanic working on a commercial vehicle engine',
  },
  electrical: {
    card: '/images/refresh-20261014/electrical.webp',
    hero: '/images/refresh-20261014/electrical.webp',
    alt: 'Illustrative Electrical instructor supervising practice on a de-energized training panel',
  },
  welding: {
    card: '/images/refresh-20261014/welding.webp',
    hero: '/images/refresh-20261014/welding.webp',
    alt: 'Illustrative Welding instructor supervising a learner with proper protective equipment',
  },
  plumbing: {
    card: '/images/refresh-20261014/plumbing.webp',
    hero: '/images/refresh-20261014/plumbing.webp',
    alt: 'Illustrative Plumbing instructor supervising pipework assembly at a workshop training fixture',
  },
  'construction-trades-certification': {
    card: '/images/refresh-20261014/construction.webp',
    hero: '/images/refresh-20261014/construction.webp',
    alt: 'Illustrative Construction instructor and learner measuring a timber-frame training wall',
  },
  cna: {
    card: `${P}/cna-patient-care.jpg`,
    hero: `${P}/cna-vitals.webp`,
    alt: 'CNA student checking patient vitals in a clinical simulation lab',
  },
  'medical-assistant': {
    card: '/images/refresh-20261014/clinical.webp',
    hero: '/images/refresh-20261014/clinical.webp',
    alt: 'Illustrative Medical assistant instructor supervising blood-pressure measurement in a clinical skills lab',
  },
  phlebotomy: {
    card: '/images/refresh-20261014/phlebotomy.webp',
    hero: '/images/refresh-20261014/phlebotomy.webp',
    alt: 'Illustrative Phlebotomy instructor supervising practice on an artificial training arm',
  },
  'pharmacy-technician': {
    card: '/images/refresh-20261014/pharmacy.webp',
    hero: '/images/refresh-20261014/pharmacy.webp',
    alt: 'Illustrative Pharmacy technician instructor supervising medication preparation',
  },
  qma: {
    card: '/images/program-media-20261016/qma.webp',
    hero: '/images/program-media-20261016/qma.webp',
    alt: 'Illustrative medication aide learner reviewing a practice medication record with an instructor',
  },
  'home-health-aide': {
    card: '/images/refresh-20261014/home-care.webp',
    hero: '/images/refresh-20261014/home-care.webp',
    alt: 'Illustrative Home-care instructor supervising assistance with a walker',
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
    card: '/images/refresh-20261014/sanitation.webp',
    hero: '/images/refresh-20261014/sanitation.webp',
    alt: 'Illustrative Environmental cleaning instructor supervising surface disinfection',
  },
  'cpr-first-aid': {
    card: '/images/refresh-20261014/healthcare.webp',
    hero: '/images/refresh-20261014/healthcare.webp',
    alt: 'Illustrative CPR instructor supervising adult learners practicing on a manikin',
  },
  'barber-apprenticeship': {
    card: '/images/refresh-20261014/beauty.webp',
    hero: '/images/refresh-20261014/beauty.webp',
    alt: 'Illustrative Barber instructor supervising an apprentice in a working shop',
  },
  'cosmetology-apprenticeship': {
    card: `${P}/cosmetology.webp`,
    hero: '/images/pexels/cosmetology.webp',
    alt: 'Hair stylist preparing professional tools at a salon workstation',
  },
  esthetician: {
    card: '/images/beauty/esthetics-hero.webp',
    hero: `${P}/cosmetology-hero.webp`,
    alt: 'Esthetics learner practicing professional skincare and client services',
  },
  'esthetician-apprenticeship': {
    card: '/images/programs/efh-esthetician-client-services-card.jpg',
    hero: '/images/programs/esthetician-host-recruitment-2026.webp',
    alt: 'Esthetics skincare instruction and professional client services',
  },
  'nail-technician-apprenticeship': {
    card: '/images/refresh-20261014/nail.webp',
    hero: '/images/refresh-20261014/nail.webp',
    alt: 'Illustrative Nail technician instructor supervising a manicure at a salon workstation',
  },
  'culinary-apprenticeship': {
    card: '/images/pages/culinary-apprenticeship-hero.webp',
    hero: '/images/pages/culinary-apprenticeship-hero.webp',
    alt: 'Chef demonstrating cooking techniques in a professional kitchen',
  },
  'it-help-desk': {
    card: '/images/refresh-20261014/technology.webp',
    hero: '/images/refresh-20261014/technology.webp',
    alt: 'Illustrative IT instructor and learner troubleshooting a workstation',
  },
  'cybersecurity-analyst': {
    card: `${P}/cybersecurity-screen.jpg`,
    hero: `${P}/cybersecurity-code.jpg`,
    alt: 'Cybersecurity analyst monitoring a security dashboard',
  },
  'network-administration': {
    card: '/images/program-media-20261016/network-administration.webp',
    hero: '/images/program-media-20261016/network-administration.webp',
    alt: 'Illustrative instructor guiding a learner through network-switch connections',
  },
  'network-support-technician': {
    card: '/images/program-media-20261016/network-support.webp',
    hero: '/images/program-media-20261016/network-support.webp',
    alt: 'Illustrative network-support training using a cable tester and router',
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
    card: '/images/refresh-20261014/graphic-design.webp',
    hero: '/images/refresh-20261014/graphic-design.webp',
    alt: 'Illustrative Graphic design instructor and learner reviewing a vector composition',
  },
  'cad-drafting': {
    card: '/images/refresh-20261014/cad.webp',
    hero: '/images/refresh-20261014/cad.webp',
    alt: 'Illustrative CAD drafting instructor and learner reviewing a mechanical drawing',
  },
  technology: {
    card: '/images/pexels/webdev.webp',
    hero: `${P}/programs-it-hero.webp`,
    alt: 'Technology learner building practical IT and digital skills',
  },
  'tax-preparation': {
    card: '/images/tax/supersonic-tax-training-2026.webp',
    hero: '/images/tax/supersonic-tax-hero-2026.webp',
    alt: 'Tax preparer working with a client on financial documents',
  },
  bookkeeping: {
    card: '/images/refresh-20261014/business.webp',
    hero: '/images/refresh-20261014/business.webp',
    alt: 'Illustrative Instructor and learners reviewing business records at laptops',
  },
  'finance-bookkeeping-accounting': {
    card: '/images/pexels/bookkeeping.webp',
    hero: '/images/pexels/bookkeeping.webp',
    alt: 'Bookkeeping ledger showing financial entries',
  },
  entrepreneurship: {
    card: '/images/business/collaboration-1.webp',
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
    card: '/images/program-media-20261016/hospitality.webp',
    hero: '/images/program-media-20261016/hospitality.webp',
    alt: 'Illustrative hospitality instructor and learner preparing dining-room service',
  },
  forklift: {
    card: '/images/refresh-20261014/forklift.webp',
    hero: '/images/refresh-20261014/forklift.webp',
    alt: 'Illustrative Forklift instructor supervising a learner in a warehouse training area',
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
    hero: '/images/pages/career-services-page-10.webp',
    alt: 'Introduction to the Job Ready Indy career-readiness pathway',
  },
  'nha-medical-assistant': {
    card: '/images/program-media-20261016/medical-assistant.webp',
    hero: '/images/program-media-20261016/medical-assistant.webp',
    alt: 'Illustrative medical assistant instructor supervising blood-pressure measurement',
  },
  'nha-pharmacy-technician': {
    card: '/images/program-media-20261016/pharmacy-technician.webp',
    hero: '/images/program-media-20261016/pharmacy-technician.webp',
    alt: 'Illustrative pharmacy learner and supervisor reviewing a practice prescription package',
  },
  'nha-phlebotomy': {
    card: '/images/pages/phlebotomy-real.webp',
    hero: '/images/pages/phlebotomy-real.webp',
    alt: 'Gloved healthcare professional performing a blood collection',
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
export function getProgramImageAlt(
  slug: string,
  fallback = 'Career training at Elevate for Humanity',
): string {
  return PROGRAM_IMAGES[slug]?.alt ?? fallback;
}

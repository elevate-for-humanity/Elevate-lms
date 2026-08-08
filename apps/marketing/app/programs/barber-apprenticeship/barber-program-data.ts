import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { BARBER_PRICING } from '@/lib/programs/pricing';

export const SITE_URL = PLATFORM_DEFAULTS.siteUrl;

const RAPIDS = RAPIDS_CONFIG.programs.barber;
const OJL_HOURS = RAPIDS.totalHours;
const RTI_HOURS = RAPIDS.relatedInstructionHours;

export const QUICK_STATS = [
  { val: OJL_HOURS.toLocaleString(), label: `OJL Hours + ${RTI_HOURS} RTI` },
  { val: '40 hrs/wk', label: 'Standard OJL Schedule' },
  { val: `$${BARBER_PRICING.fullPrice.toLocaleString()}`, label: 'Self-Pay Tuition' },
  { val: '3', label: 'Completion / Career Credentials' },
];

export const COMPETENCIES = [
  'Tool disinfection procedures',
  'Workstation sanitation standards',
  'PPE and hygiene practices',
  'Chemical handling and safety',
  'Clipper handling and guard usage',
  'Fading and blending techniques',
  'Tapering and line-ups',
  'Shear cutting fundamentals',
  'Straight razor safety',
  'Beard shaping and lining',
  'Skin protection and sanitation',
  'Client consultation',
  'Communication and professionalism',
  'Time management and service efficiency',
  'Equipment setup and breakdown',
  'Shop sanitation maintenance',
  'Appointment flow and customer service',
  'Workplace safety compliance',
];

export const CREDENTIALS = [
  {
    name: 'DOL Registered Apprenticeship Certificate of Completion',
    type: 'Certificate' as const,
    issuer: 'U.S. Department of Labor',
  },
  {
    name: 'Barbershop Business Management Certificate',
    type: 'Certificate' as const,
    issuer: 'Elevate for Humanity',
  },
  {
    name: 'Indiana Barber License',
    type: 'Licensure' as const,
    issuer: 'Indiana Professional Licensing Agency',
  },
];

export const CURRICULUM = [
  { title: 'Haircutting Techniques', description: 'Fades, tapers, lineups, and precision cutting under licensed supervision in a real shop environment.' },
  { title: 'Clipper & Shear Mastery', description: 'Tool selection, maintenance, guard systems, and advanced clipper-over-comb and shear techniques.' },
  { title: 'Sanitation & Safety', description: 'Sanitation standards, chemical safety, bloodborne-pathogen precautions, and workstation compliance.' },
  { title: 'Shaving & Beard Grooming', description: 'Straight razor safety, beard shaping, lining, skin protection, and hot-towel service techniques.' },
  { title: 'Client Services & Professionalism', description: 'Client consultation, communication, time management, and repeat-client service.' },
  { title: 'Shop Operations & Business', description: 'Booking, pricing, business fundamentals, and shop-operations preparation.' },
  { title: 'License Exam Preparation', description: 'Indiana barber licensing-exam preparation and completion-document review.' },
  { title: 'Competency Evaluations', description: 'Documented employer/program competency review throughout OJL.' },
];

export const CAREERS = [
  { title: 'Licensed Barber', salary: 'Market dependent', demand: 'Current-market dependent' },
  { title: 'Senior Barber / Stylist', salary: 'Market dependent', demand: 'Experience-based' },
  { title: 'Shop Manager', salary: 'Market dependent', demand: 'Leadership path' },
  { title: 'Shop Owner', salary: 'Business-performance dependent', demand: 'Entrepreneurship' },
];

export const ENROLLMENT_STEPS = [
  { title: 'Complete Intake', description: 'Submit the application and funding information. Inquiry and enrollment are separate workflows.' },
  { title: 'Get Matched', description: 'Complete host-shop matching or verify your existing approved shop placement before OJL begins.' },
  { title: 'Earn & Learn', description: `Complete ${OJL_HOURS.toLocaleString()} approved supervised OJL hours and ${RTI_HOURS} RTI hours while your progress is tracked in the platform.` },
  { title: 'Complete & Apply for Licensure', description: 'Finish registered-program requirements, receive completion documentation, then complete the current Indiana licensing and examination process.' },
];

export const ELIGIBILITY = [
  'Meet program, employment, and current state/federal eligibility requirements',
  'Complete required identity and onboarding documentation',
  'Have or obtain an approved participating host-shop placement',
  'Be able to perform the essential functions of training with reasonable accommodation where applicable',
];

export const PARTNER_REQUIREMENTS = [
  'Active Indiana shop/business licensing required for the hosted occupation',
  'Qualified licensed supervisor or mentor available for oversight',
  'Required insurance and employment coverage',
  'Physical training location approved for the apprenticeship',
  'Commitment to structured OJL and competency verification',
  'Compliance with workplace, sanitation, and program requirements',
  'Signed Memorandum of Understanding (MOU) before activation',
];

export const PARTNER_BENEFITS = [
  'Access to apprenticeship candidates matched to approved sites',
  'Digital OJL-hour and competency tracking',
  'Program administration and compliance support',
  'Host-shop onboarding documents and MOU workflow',
  'Visibility into assigned apprentice progress',
  'Centralized records instead of duplicate paper processes',
];

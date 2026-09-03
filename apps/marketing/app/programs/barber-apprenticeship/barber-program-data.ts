import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { BARBER_PRICING } from '@/lib/programs/pricing';

export const SITE_URL = PLATFORM_DEFAULTS.siteUrl;

const REGISTERED = getRegisteredProgramStandard('barber-apprenticeship');
if (!REGISTERED) throw new Error('REGISTERED_BARBER_CONTRACT_MISSING');
const STANDARD = REGISTERED.standard;
const RTI_HOURS = REGISTERED.completion.requiredRtiHours;
const COMPETENCY_COUNT = REGISTERED.completion.competencyCount;

export const QUICK_STATS = [
  { val: `${COMPETENCY_COUNT}`, label: 'Registered Competencies' },
  { val: `${RTI_HOURS}`, label: 'Verified RTI Hours' },
  { val: STANDARD.apprenticeToMentorRatio, label: 'Apprentice-to-Mentor Ratio' },
  { val: `$${BARBER_PRICING.fullPrice.toLocaleString()}`, label: 'Self-Pay Tuition' },
];

export const COMPETENCIES = STANDARD.competencies.map((competency) => competency.description);

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
  ...STANDARD.relatedInstruction.map((item) => ({
    title: item.title,
    description: `${item.hours} verified RTI hours mapped to the approved registered occupation standard.`,
  })),
  { title: 'Registered Competency Verification', description: `Host Shop supervisors verify all ${COMPETENCY_COUNT} approved competencies from the registered Work Process Schedule. Work hours remain auditable evidence and do not replace competency verification.` },
];

export const CAREERS = [
  { title: 'Licensed Barber', salary: 'Market dependent', demand: 'Current-market dependent' },
  { title: 'Senior Barber / Stylist', salary: 'Market dependent', demand: 'Experience-based' },
  { title: 'Shop Manager', salary: 'Market dependent', demand: 'Leadership path' },
  { title: 'Shop Owner', salary: 'Business-performance dependent', demand: 'Entrepreneurship' },
];

export const ENROLLMENT_STEPS = [
  { title: 'Complete Intake', description: 'Submit the application and funding information. Inquiry and enrollment are separate workflows.' },
  { title: 'Get Matched', description: 'Complete host-shop matching or verify your existing approved shop placement before supervised work begins.' },
  { title: 'Earn & Learn', description: `Complete supervised work under the approved placement while progressing through all ${COMPETENCY_COUNT} registered competencies and ${RTI_HOURS} verified RTI hours. Work records, wages, RTI, and competency verification remain separate evidence streams.` },
  { title: 'Complete & Apply for Licensure', description: 'Finish the registered competency/RTI requirements and required sponsor records, receive completion documentation, then complete the current Indiana licensing and examination process.' },
];

export const ELIGIBILITY = [
  'Meet program, employment, and current state/federal eligibility requirements',
  'Complete required identity and onboarding documentation',
  'Have or obtain an approved participating host-shop placement',
  'Be able to perform the essential functions of training with reasonable accommodation where applicable',
];

export const PARTNER_REQUIREMENTS = [
  'Active Indiana shop/business licensing required for the hosted occupation',
  'Qualified licensed supervisor or mentor available for the registered 1:1 supervision requirement',
  'Required insurance and employment coverage',
  'Physical training location approved for the apprenticeship',
  'Commitment to truthful supervised-work records and registered competency verification',
  'Compliance with workplace, sanitation, wage, and program requirements',
  'Signed Memorandum of Understanding (MOU) before activation',
];

export const PARTNER_BENEFITS = [
  'Access to apprenticeship candidates matched to approved sites',
  'Digital supervised-work evidence and registered competency tracking',
  'Program administration and compliance support',
  'Host-shop onboarding documents and MOU workflow',
  'Visibility into assigned apprentice RTI and competency progress',
  'Centralized records instead of duplicate paper processes',
];

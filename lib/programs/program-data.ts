import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Complete Program Catalog
 * All Elevate for Humanity programs with INTraining IDs and pricing
 */

export interface ProgramCredential {
  name: string;
  type: 'Certificate' | 'Licensure' | 'Industry-Recognized Certification';
}

export interface Program {
  id: string;
  intrainingId: string;
  name: string;
  slug: string;
  price: number;
  duration: string;
  durationDays?: number;
  location: string;
  county: string;
  credentials: ProgramCredential[];
  description: string;
  requirements?: string[];
  isFree: boolean;
  isWIOAEligible: boolean;
  isWorkforceReadyGrant: boolean;
  category: string;
  skills: string[];
  careerOutcomes: string[];
}

export const PROGRAMS: Program[] = [
  {
    id: 'barber-apprenticeship',
    intrainingId: '#10004637',
    name: 'Barber Apprenticeship Program',
    slug: 'barber-apprenticeship-program',
    price: 4980,
    duration: '15 months',
    durationDays: 450,
    location: 'Elevate for Humanity Training Center, Indianapolis, Indiana',
    county: 'Marion County',
    credentials: [
      { name: 'Rise Up Certificate', type: 'Certificate' },
      { name: 'Registered Barber License', type: 'Licensure' },
    ],
    description:
      'Comprehensive barber training program leading to state licensure. Learn cutting techniques, styling, sanitation, and business management.',
    requirements: [
      'High school diploma or GED',
      'Must be at least 18 years old',
      'Valid government-issued ID',
    ],
    isFree: false,
    isWIOAEligible: true,
    isWorkforceReadyGrant: false,
    category: 'Cosmetology & Personal Care',
    skills: ['Hair cutting', 'Styling', 'Sanitation', 'Customer service', 'Business management'],
    careerOutcomes: ['Licensed Barber', 'Salon Owner', 'Barber Shop Manager'],
  },
  {
    id: 'business-startup-marketing',
    intrainingId: '#10004645',
    name: 'Business Start-up & Marketing Program',
    slug: 'business-startup-marketing',
    price: 4550,
    duration: '5 weeks',
    durationDays: 35,
    location: 'Elevate for Humanity Training Center, Indianapolis, Indiana',
    county: 'Marion County',
    credentials: [
      {
        name: 'Business of Retail Certified Specialist',
        type: 'Industry-Recognized Certification',
      },
      {
        name: 'Retail Industry Fundamentals Specialist',
        type: 'Industry-Recognized Certification',
      },
      { name: 'Certificate of Completion', type: 'Certificate' },
    ],
    description:
      'Learn to start and market your own business. Covers business planning, marketing strategies, financial management, and retail operations.',
    requirements: ['Basic computer skills', 'Business idea or concept'],
    isFree: false,
    isWIOAEligible: true,
    isWorkforceReadyGrant: false,
    category: 'Business & Entrepreneurship',
    skills: [
      'Business planning',
      'Marketing',
      'Financial management',
      'Retail operations',
      'Customer service',
    ],
    careerOutcomes: ['Business Owner', 'Marketing Specialist', 'Retail Manager'],
  },
  {
    id: 'cpr-aed-first-aid',
    intrainingId: '#10004674',
    name: 'CPR, AED & First Aid Certification',
    slug: 'cpr-aed-first-aid',
    price: 575,
    duration: '1 day',
    durationDays: 1,
    location: 'Elevate for Humanity Training Center, Indianapolis, Indiana',
    county: 'Marion County',
    credentials: [{ name: 'CPR', type: 'Industry-Recognized Certification' }],
    description:
      'Get certified in CPR, AED, and First Aid. Essential for healthcare workers, educators, and anyone wanting to be prepared for emergencies.',
    requirements: [],
    isFree: false,
    isWIOAEligible: true,
    isWorkforceReadyGrant: false,
    category: 'Healthcare & Safety',
    skills: ['CPR', 'AED operation', 'First aid', 'Emergency response'],
    careerOutcomes: [
      'Certified for healthcare positions',
      'Safety coordinator',
      'Emergency responder',
    ],
  },
  {
    id: 'emergency-health-safety-tech',
    intrainingId: '#10004621',
    name: 'Emergency Health & Safety Technician',
    slug: 'emergency-health-safety-technician',
    price: 4950,
    duration: '4 weeks',
    durationDays: 28,
    location: 'Elevate for Humanity Training Center, Indianapolis, Indiana',
    county: 'Marion County',
    credentials: [
      { name: 'CPR', type: 'Industry-Recognized Certification' },
      { name: 'Emergency Medical Responder (EMR)', type: 'Industry-Recognized Certification' },
      { name: 'OSHA 10 - Career Safe', type: 'Industry-Recognized Certification' },
    ],
    description:
      'Train to become an Emergency Medical Responder. Learn emergency medical procedures, patient assessment, and safety protocols.',
    requirements: [
      'High school diploma or GED',
      'Must be at least 18 years old',
      'Background check required',
    ],
    isFree: false,
    isWIOAEligible: true,
    isWorkforceReadyGrant: false,
    category: 'Healthcare & Safety',
    skills: [
      'Emergency medical response',
      'Patient care',
      'Safety protocols',
      'Medical procedures',
    ],
    careerOutcomes: ['Emergency Medical Responder', 'Safety Technician', 'First Responder'],
  },
  {
    id: 'home-health-aide',
    intrainingId: '#10004626',
    name: 'Home Health Aide Certification',
    slug: 'home-health-aide',
    price: 4700,
    duration: '4 weeks',
    durationDays: 28,
    location: 'Elevate for Humanity Training Center, Indianapolis, Indiana',
    county: 'Marion County',
    credentials: [
      {
        name: 'Certified Community Healthcare Worker (CCHW)',
        type: 'Industry-Recognized Certification',
      },
      { name: 'CPR', type: 'Industry-Recognized Certification' },
      { name: 'Rise Up Certificate', type: 'Certificate' },
      { name: 'Home Health Aide (HHA)', type: 'Licensure' },
    ],
    description:
      'Become a certified Home Health Aide. Learn patient care, vital signs monitoring, personal care assistance, and healthcare documentation.',
    requirements: ['High school diploma or GED', 'Background check required', 'TB test required'],
    isFree: false,
    isWIOAEligible: true,
    isWorkforceReadyGrant: false,
    category: 'Healthcare',
    skills: ['Patient care', 'Vital signs', 'Personal care', 'Documentation', 'Communication'],
    careerOutcomes: ['Home Health Aide', 'Personal Care Assistant', 'Healthcare Worker'],
  },
  {
    id: 'hvac-technician',
    intrainingId: '#10004322',
    name: 'HVAC Technician',
    slug: 'hvac-technician',
    price: 5000,
    duration: '60 days',
    durationDays: 60,
    location: 'Elevate for Humanity Training Center, Indianapolis, Indiana',
    county: 'Marion County',
    credentials: [
      { name: 'Residential HVAC Certification 1', type: 'Industry-Recognized Certification' },
      {
        name: 'Residential HVAC Certification 2 - Refrigeration Diagnostics',
        type: 'Industry-Recognized Certification',
      },
      { name: 'Rise Up Certificate', type: 'Certificate' },
      { name: 'CPR', type: 'Industry-Recognized Certification' },
      { name: 'OSHA 30', type: 'Industry-Recognized Certification' },
    ],
    description:
      'Comprehensive HVAC training covering installation, maintenance, and repair of heating, ventilation, and air conditioning systems.',
    requirements: ['High school diploma or GED', 'Basic math skills', 'Ability to lift 50 lbs'],
    isFree: false,
    isWIOAEligible: true,
    isWorkforceReadyGrant: true,
    category: 'Skilled Trades',
    skills: [
      'HVAC installation',
      'System maintenance',
      'Refrigeration',
      'Diagnostics',
      'Safety protocols',
    ],
    careerOutcomes: ['HVAC Technician', 'HVAC Installer', 'Service Technician'],
  },
  {
    id: 'medical-assistant',
    intrainingId: '#10004639',
    name: 'Medical Assistant',
    slug: 'medical-assistant',
    price: 4325,
    duration: '21 days',
    durationDays: 21,
    location: 'Elevate for Humanity Training Center, Indianapolis, Indiana',
    county: 'Marion County',
    credentials: [
      {
        name: 'Certified Community Healthcare Worker (CCHW)',
        type: 'Industry-Recognized Certification',
      },
      { name: 'CPR', type: 'Industry-Recognized Certification' },
      { name: 'Rise Up Certificate', type: 'Certificate' },
    ],
    description:
      'Train to become a Medical Assistant. Learn clinical and administrative skills for medical offices, clinics, and healthcare facilities.',
    requirements: ['High school diploma or GED', 'Background check required'],
    isFree: false,
    isWIOAEligible: true,
    isWorkforceReadyGrant: false,
    category: 'Healthcare',
    skills: [
      'Clinical procedures',
      'Administrative tasks',
      'Patient care',
      'Medical terminology',
      'EHR systems',
    ],
    careerOutcomes: ['Medical Assistant', 'Clinical Assistant', 'Healthcare Administrator'],
  },
  {
    id: 'professional-esthetician',
    intrainingId: '#10004628',
    name: 'Professional Esthetician & Client Services Career Program',
    slug: 'professional-esthetician',
    price: 4575,
    duration: '5 weeks',
    durationDays: 35,
    location: 'Elevate for Humanity Training Center, Indianapolis, Indiana',
    county: 'Marion County',
    credentials: [
      {
        name: 'Customer Service and Sales Certified Specialist',
        type: 'Industry-Recognized Certification',
      },
      {
        name: 'Business of Retail Certified Specialist',
        type: 'Industry-Recognized Certification',
      },
      { name: 'OSHA 10 - Career Safe', type: 'Industry-Recognized Certification' },
    ],
    description:
      'Professional esthetician training with focus on client services. Learn skincare, facial treatments, and business management.',
    requirements: ['High school diploma or GED', 'Must be at least 18 years old'],
    isFree: false,
    isWIOAEligible: true,
    isWorkforceReadyGrant: false,
    category: 'Cosmetology & Personal Care',
    skills: [
      'Skincare',
      'Facial treatments',
      'Customer service',
      'Retail sales',
      'Safety protocols',
    ],
    careerOutcomes: ['Esthetician', 'Spa Technician', 'Skincare Specialist'],
  },
  {
    id: 'public-safety-reentry',
    intrainingId: '#10004666',
    name: 'Public Safety Reentry Specialist Program',
    slug: 'public-safety-reentry-specialist',
    price: 4750,
    duration: '45 days',
    durationDays: 45,
    location: 'Elevate for Humanity Training Center, Indianapolis, Indiana',
    county: 'Marion County',
    credentials: [
      { name: 'Rise Up Certificate', type: 'Certificate' },
      { name: 'Certified Peer Recovery Coach (CPRC)', type: 'Industry-Recognized Certification' },
      { name: 'Certified Peer Support Professional', type: 'Industry-Recognized Certification' },
      {
        name: 'Certified Community Healthcare Worker (CCHW)',
        type: 'Industry-Recognized Certification',
      },
      { name: 'CPR', type: 'Industry-Recognized Certification' },
    ],
    description:
      'Specialized training for reentry support professionals. Learn peer recovery coaching, community health work, and support services.',
    requirements: [
      'High school diploma or GED',
      'Background check required',
      'Commitment to helping others',
    ],
    isFree: false,
    isWIOAEligible: true,
    isWorkforceReadyGrant: false,
    category: 'Social Services',
    skills: [
      'Peer recovery coaching',
      'Community health',
      'Case management',
      'Crisis intervention',
      'Support services',
    ],
    careerOutcomes: ['Peer Recovery Coach', 'Reentry Specialist', 'Community Health Worker'],
  },
  {
    id: 'tax-preparation-financial',
    intrainingId: '#10004627',
    name: 'Tax Preparation & Financial Service Career',
    slug: 'tax-preparation-financial',
    price: 4950,
    duration: '10 weeks',
    durationDays: 70,
    location: 'Elevate for Humanity Training Center, Indianapolis, Indiana',
    county: 'Marion County',
    credentials: [
      { name: 'Rise Up Certificate', type: 'Certificate' },
      { name: 'Microsoft 365 Fundamentals', type: 'Industry-Recognized Certification' },
      { name: 'Certificate of Completion', type: 'Certificate' },
      { name: 'QuickBooks Pro Advisor', type: 'Industry-Recognized Certification' },
    ],
    description:
      'Comprehensive tax preparation and financial services training. Learn tax law, QuickBooks, financial planning, and client services.',
    requirements: ['High school diploma or GED', 'Basic computer skills', 'Basic math skills'],
    isFree: false,
    isWIOAEligible: true,
    isWorkforceReadyGrant: false,
    category: 'Business & Finance',
    skills: [
      'Tax preparation',
      'QuickBooks',
      'Financial planning',
      'Microsoft 365',
      'Client services',
    ],
    careerOutcomes: ['Tax Preparer', 'Bookkeeper', 'Financial Services Representative'],
  },
];

/**
 * Get program by ID
 */
export function getProgramById(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

/**
 * Get program by slug
 */
export function getProgramBySlug(slug: string): Program | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

/**
 * Get program by INTraining ID
 */
export function getProgramByIntrainingId(intrainingId: string): Program | undefined {
  return PROGRAMS.find((p) => p.intrainingId === intrainingId);
}

/**
 * Get programs by category
 */
export function getProgramsByCategory(category: string): Program[] {
  return PROGRAMS.filter((p) => p.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(PROGRAMS.map((p) => p.category)));
}

/**
 * Get WIOA eligible programs
 */
export function getWIOAPrograms(): Program[] {
  return PROGRAMS.filter((p) => p.isWIOAEligible);
}

/**
 * Get Workforce Ready Grant programs
 */
export function getWorkforceReadyPrograms(): Program[] {
  return PROGRAMS.filter((p) => p.isWorkforceReadyGrant);
}

/**
 * Search programs
 */
export function searchPrograms(query: string): Program[] {
  const lowerQuery = query.toLowerCase();
  return PROGRAMS.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery) ||
      p.skills.some((s) => s.toLowerCase().includes(lowerQuery)),
  );
}

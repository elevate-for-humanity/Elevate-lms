
/**
 * Comprehensive Credential System
 * Integrates with all partner platforms and credential providers
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type CredentialType =
  | 'Certificate'
  | 'Licensure'
  | 'Industry-Recognized Certification'
  | 'Degree'
  | 'Diploma'
  | 'Badge'
  | 'Micro-Credential';

export type CredentialProvider =
  | 'Rise Up'
  | 'CareerSafe (OSHA)'
  | 'American Heart Association (CPR)'
  | 'National Retail Federation (NRF)'
  | 'Microsoft'
  | 'QuickBooks/Intuit'
  | 'State of Indiana'
  | 'Elevate for Humanity'
  | 'National Association for Healthcare Quality (NAHQ)'
  | 'Indiana Commission on Peer Recovery (ICPR)'
  | 'Certiport'
  | 'Certiport'
  | 'AWS'
  | 'Google'
  | 'Cisco'
  | 'Adobe'
  | 'Salesforce'
  | 'HubSpot'
  | 'Facebook Blueprint'
  | 'Hootsuite'
  | 'NCCER'
  | 'EPA'
  | 'ASE'
  | 'NATE'
  | 'HVAC Excellence';

export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  provider: CredentialProvider;
  description: string;
  externalId?: string;
  verificationUrl?: string;
  expirationMonths?: number; // null = never expires
  requiresRenewal: boolean;
  stackable: boolean; // Can be stacked toward higher credentials
  industryRecognized: boolean;
  nationallyRecognized: boolean;
  stateRecognized: boolean;
  prerequisites?: string[];
  relatedCredentials?: string[];
}

export interface CourseCredential {
  courseId: string;
  credentialId: string;
  isRequired: boolean; // Required vs optional credential
  isPrimary: boolean; // Primary credential for the course
  completionRequirements: {
    minimumScore?: number;
    requiredAssessments?: string[];
    practicalExam?: boolean;
    clinicalHours?: number;
    attendancePercentage?: number;
  };
}

/**
 * All Available Credentials
 */
export const CREDENTIALS: Record<string, Credential> = {
  // IRS VITA/TCE Certification
  'irs-vita-tce': {
    id: 'irs-vita-tce',
    name: 'IRS VITA/TCE Certification',
    type: 'Industry - Recognized Certification',
    provider: 'Internal Revenue Service',
    description:
      'IRS Volunteer Income Tax Assistance / Tax Counseling for the Elderly certification. Qualifies holder to prepare federal tax returns at IRS-approved VITA sites.',
    externalId: 'IRS-VITA-TCE',
    verificationUrl: 'https://apps.irs.gov/app/vita/',
    expirationMonths: 12, // Annual recertification required
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
  },

  // Rise Up Credentials
  'rise-up-certificate': {
    id: 'rise-up-certificate',
    name: 'Rise Up Certificate',
    type: 'Certificate',
    provider: 'Rise Up',
    description:
      'Foundational employability skills certification covering workplace readiness, communication, and professional development.',
    externalId: 'RISEUP-CERT',
    verificationUrl: 'https://www.riseup.com/verify',
    expirationMonths: null,
    requiresRenewal: false,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: true,
    prerequisites: [],
    relatedCredentials: [],
  },

  // OSHA Credentials
  'osha-10': {
    id: 'osha-10',
    name: 'OSHA 10-Hour Safety Certification',
    type: 'Industry-Recognized Certification',
    provider: 'CareerSafe (OSHA)',
    description:
      '10-hour OSHA safety training covering workplace hazards, rights, and safety protocols.',
    externalId: 'OSHA-10',
    verificationUrl: 'https://www.careersafeonline.com/verify',
    expirationMonths: 60, // 5 years
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: true,
    prerequisites: [],
    relatedCredentials: ['osha-30'],
  },

  'osha-30': {
    id: 'osha-30',
    name: 'OSHA 30-Hour Safety Certification',
    type: 'Industry-Recognized Certification',
    provider: 'CareerSafe (OSHA)',
    description:
      '30-hour OSHA safety training for supervisors and safety coordinators.',
    externalId: 'OSHA-30',
    verificationUrl: 'https://www.careersafeonline.com/verify',
    expirationMonths: 60,
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: true,
    prerequisites: ['osha-10'],
    relatedCredentials: [],
  },

  // CPR/First Aid
  'cpr-aed': {
    id: 'cpr-aed',
    name: 'CPR & AED Certification',
    type: 'Industry-Recognized Certification',
    provider: 'American Heart Association (CPR)',
    description:
      'American Heart Association CPR and AED certification for healthcare providers and general public.',
    externalId: 'AHA-CPR',
    verificationUrl: 'https://www.heart.org/verify',
    expirationMonths: 24, // 2 years
    requiresRenewal: true,
    stackable: false,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: true,
    prerequisites: [],
    relatedCredentials: ['first-aid'],
  },

  'first-aid': {
    id: 'first-aid',
    name: 'First Aid Certification',
    type: 'Industry-Recognized Certification',
    provider: 'American Heart Association (CPR)',
    description:
      'First Aid certification covering emergency response and basic medical care.',
    externalId: 'AHA-FA',
    verificationUrl: 'https://www.heart.org/verify',
    expirationMonths: 24,
    requiresRenewal: true,
    stackable: false,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: true,
    prerequisites: [],
    relatedCredentials: ['cpr-aed'],
  },

  // Healthcare Credentials
  cchw: {
    id: 'cchw',
    name: 'Certified Community Healthcare Worker (CCHW)',
    type: 'Industry-Recognized Certification',
    provider: 'National Association for Healthcare Quality (NAHQ)',
    description:
      'Certification for community healthcare workers providing patient support and health education.',
    externalId: 'CCHW',
    verificationUrl: 'https://www.nahq.org/verify',
    expirationMonths: 24,
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: true,
    prerequisites: [],
    relatedCredentials: ['home-health-aide'],
  },

  'home-health-aide': {
    id: 'home-health-aide',
    name: 'Home Health Aide (HHA)',
    type: 'Licensure',
    provider: 'State of Indiana',
    description:
      'State licensure for home health aides providing in-home patient care.',
    externalId: 'IN-HHA',
    verificationUrl: 'https://www.in.gov/pla/verify',
    expirationMonths: 24,
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: false,
    stateRecognized: true,
    prerequisites: ['cpr-aed'],
    relatedCredentials: ['cchw'],
  },

  emr: {
    id: 'emr',
    name: 'Emergency Medical Responder (EMR)',
    type: 'Industry-Recognized Certification',
    provider: 'National Registry of Emergency Medical Technicians',
    description: 'Entry-level emergency medical responder certification.',
    externalId: 'NREMT-EMR',
    verificationUrl: 'https://www.nremt.org/verify',
    expirationMonths: 24,
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: true,
    prerequisites: ['cpr-aed'],
    relatedCredentials: [],
  },

  // Peer Recovery
  cprc: {
    id: 'cprc',
    name: 'Certified Peer Recovery Coach (CPRC)',
    type: 'Industry-Recognized Certification',
    provider: 'Indiana Commission on Peer Recovery (ICPR)',
    description:
      'Certification for peer recovery coaches supporting individuals in recovery.',
    externalId: 'ICPR-CPRC',
    verificationUrl: 'https://www.in.gov/fssa/dmha/peer-recovery',
    expirationMonths: 24,
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: false,
    stateRecognized: true,
    prerequisites: [],
    relatedCredentials: ['peer-support-professional'],
  },

  'peer-support-professional': {
    id: 'peer-support-professional',
    name: 'Certified Peer Support Professional',
    type: 'Industry-Recognized Certification',
    provider: 'Indiana Commission on Peer Recovery (ICPR)',
    description: 'Advanced peer support professional certification.',
    externalId: 'ICPR-PSP',
    verificationUrl: 'https://www.in.gov/fssa/dmha/peer-recovery',
    expirationMonths: 24,
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: false,
    stateRecognized: true,
    prerequisites: ['cprc'],
    relatedCredentials: [],
  },

  // Retail/Business
  'nrf-customer-service': {
    id: 'nrf-customer-service',
    name: 'Customer Service and Sales Certified Specialist',
    type: 'Industry-Recognized Certification',
    provider: 'National Retail Federation (NRF)',
    description:
      'NRF certification in customer service and sales fundamentals.',
    externalId: 'NRF-CSS',
    verificationUrl: 'https://www.nrf.com/verify',
    expirationMonths: null,
    requiresRenewal: false,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: false,
    prerequisites: [],
    relatedCredentials: ['nrf-retail-business'],
  },

  'nrf-retail-business': {
    id: 'nrf-retail-business',
    name: 'Business of Retail Certified Specialist',
    type: 'Industry-Recognized Certification',
    provider: 'National Retail Federation (NRF)',
    description:
      'NRF certification in retail business operations and management.',
    externalId: 'NRF-BRC',
    verificationUrl: 'https://www.nrf.com/verify',
    expirationMonths: null,
    requiresRenewal: false,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: false,
    prerequisites: [],
    relatedCredentials: ['nrf-retail-fundamentals'],
  },

  'nrf-retail-fundamentals': {
    id: 'nrf-retail-fundamentals',
    name: 'Retail Industry Fundamentals Specialist',
    type: 'Industry-Recognized Certification',
    provider: 'National Retail Federation (NRF)',
    description:
      'Foundational retail industry knowledge and skills certification.',
    externalId: 'NRF-RIF',
    verificationUrl: 'https://www.nrf.com/verify',
    expirationMonths: null,
    requiresRenewal: false,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: false,
    prerequisites: [],
    relatedCredentials: [],
  },

  // Microsoft
  'microsoft-365-fundamentals': {
    id: 'microsoft-365-fundamentals',
    name: 'Microsoft 365 Fundamentals',
    type: 'Industry-Recognized Certification',
    provider: 'Microsoft',
    description:
      'Microsoft 365 fundamentals certification covering cloud services, productivity apps, and collaboration tools.',
    externalId: 'MS-900',
    verificationUrl: 'https://learn.microsoft.com/verify',
    expirationMonths: null,
    requiresRenewal: false,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: false,
    prerequisites: [],
    relatedCredentials: [],
  },

  // QuickBooks
  'quickbooks-pro-advisor': {
    id: 'quickbooks-pro-advisor',
    name: 'QuickBooks Pro Advisor',
    type: 'Industry-Recognized Certification',
    provider: 'QuickBooks/Intuit',
    description:
      'QuickBooks Pro Advisor certification for accounting and bookkeeping professionals.',
    externalId: 'QB-PA',
    verificationUrl: 'https://quickbooks.intuit.com/verify',
    expirationMonths: 12,
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: false,
    prerequisites: [],
    relatedCredentials: [],
  },

  // HVAC
  'hvac-residential-1': {
    id: 'hvac-residential-1',
    name: 'Residential HVAC Certification 1',
    type: 'Industry-Recognized Certification',
    provider: 'HVAC Excellence',
    description:
      'Entry-level residential HVAC installation and maintenance certification.',
    externalId: 'HVAC-R1',
    verificationUrl: 'https://www.hvacexcellence.org/verify',
    expirationMonths: 24,
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: false,
    prerequisites: ['osha-10'],
    relatedCredentials: ['hvac-residential-2'],
  },

  'hvac-residential-2': {
    id: 'hvac-residential-2',
    name: 'Residential HVAC Certification 2 - Refrigeration Diagnostics',
    type: 'Industry-Recognized Certification',
    provider: 'HVAC Excellence',
    description:
      'Advanced residential HVAC certification focusing on refrigeration systems and diagnostics.',
    externalId: 'HVAC-R2',
    verificationUrl: 'https://www.hvacexcellence.org/verify',
    expirationMonths: 24,
    requiresRenewal: true,
    stackable: true,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: false,
    prerequisites: ['hvac-residential-1'],
    relatedCredentials: ['epa-608'],
  },

  'epa-608': {
    id: 'epa-608',
    name: 'EPA 608 Certification',
    type: 'Licensure',
    provider: 'EPA',
    description: 'EPA certification for handling refrigerants in HVAC systems.',
    externalId: 'EPA-608',
    verificationUrl: 'https://www.epa.gov/section608/verify',
    expirationMonths: null,
    requiresRenewal: false,
    stackable: false,
    industryRecognized: true,
    nationallyRecognized: true,
    stateRecognized: true,
    prerequisites: [],
    relatedCredentials: [],
  },

  // Barber/Cosmetology
  'registered-barber-license': {
    id: 'registered-barber-license',
    name: 'Registered Barber License',
    type: 'Licensure',
    provider: 'State of Indiana',
    description: 'State of Indiana registered barber license.',
    externalId: 'IN-BARBER',
    verificationUrl: 'https://www.in.gov/pla/professions/barber-board/',
    expirationMonths: 24,
    requiresRenewal: true,
    stackable: false,
    industryRecognized: true,
    nationallyRecognized: false,
    stateRecognized: true,
    prerequisites: [],
    relatedCredentials: [],
  },

  // Elevate for Humanity Certificates
  'efh-completion-certificate': {
    id: 'efh-completion-certificate',
    name: 'Certificate of Completion',
    type: 'Certificate',
    provider: 'Elevate for Humanity',
    description: 'Elevate for Humanity certificate of program completion.',
    externalId: 'EFH-CERT',
    verificationUrl: 'https://www.elevateforhumanity.org/verify',
    expirationMonths: null,
    requiresRenewal: false,
    stackable: true,
    industryRecognized: false,
    nationallyRecognized: false,
    stateRecognized: false,
    prerequisites: [],
    relatedCredentials: [],
  },
};

/**
 * Award credential to student
 */
export async function awardCredential(
  userId: string,
  credentialId: string,
  courseId: string,
  metadata?: {
    score?: number;
    completionDate?: Date;
    externalCredentialId?: string;
    verificationCode?: string;
  }
): Promise<string> {
  const supabase = await createClient();
  const credential = CREDENTIALS[credentialId];

  if (!credential) {
    throw new Error(`Credential ${credentialId} not found`);
  }

  const expirationDate = credential.expirationMonths
    ? new Date(
        Date.now() + credential.expirationMonths * 30 * 24 * 60 * 60 * 1000
      )
    : null;

  const { data, error }: any = await supabase
    .from('user_credentials')
    .insert({
      user_id: userId,
      credential_id: credentialId,
      course_id: courseId,
      awarded_at: new Date().toISOString(),
      expires_at: expirationDate?.toISOString(),
      verification_code:
        metadata?.verificationCode || generateVerificationCode(),
      external_credential_id: metadata?.externalCredentialId,
      score: metadata?.score,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to award credential', error);
    throw new Error('Failed to award credential');
  }

  // Log credential award
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'credential_awarded',
    resource_type: 'credential',
    resource_id: data.id,
    metadata: {
      credential_id: credentialId,
      credential_name: credential.name,
      course_id: courseId,
    },
  });

  return data.id;
}

/**
 * Generate verification code
 */
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Verify credential
 */
export async function verifyCredential(verificationCode: string): Promise<any> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('user_credentials')
    .select(
      `
      *,
      user:profiles(first_name, last_name),
      course:courses(name)
    `
    )
    .eq('verification_code', verificationCode)
    .single();

  if (error || !data) {
    return null;
  }

  const credential = CREDENTIALS[data.credential_id];

  return {
    ...data,
    credential,
    isValid:
      data.status === 'active' &&
      (!data.expires_at || new Date(data.expires_at) > new Date()),
  };
}

/**
 * Get user credentials
 */
export async function getUserCredentials(userId: string): Promise<any[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('user_credentials')
    .select('*')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });

  if (error) {
    logger.error('Failed to get user credentials', error);
    return [];
  }

  return data.map((uc) => ({
    ...uc,
    credential: CREDENTIALS[uc.credential_id],
  }));
}

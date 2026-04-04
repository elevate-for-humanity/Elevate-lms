/**
 * Proctoring capability model for Elevate's testing center.
 *
 * Three capability types:
 *   IN_PERSON_ONLY            — exam must be taken at a physical testing site
 *   IN_PERSON_OR_PROVIDER_REMOTE — provider runs their own remote system; center can also host in-person
 *   CENTER_REMOTE_ALLOWED     — Elevate can proctor live online (center-controlled remote)
 *
 * This drives what booking options appear in the UI and prevents compliance errors
 * (e.g. offering remote proctoring for an exam that requires in-person supervision).
 */

export type ProctoringCapability =
  | 'IN_PERSON_ONLY'
  | 'IN_PERSON_OR_PROVIDER_REMOTE'
  | 'CENTER_REMOTE_ALLOWED';

export interface ExamFee {
  /** Label shown to the test-taker, e.g. "Per assessment" */
  label: string;
  /** Amount in dollars charged to the test-taker */
  amount: number;
  /** Optional note, e.g. "Includes $13.50 ACT fee + $31.50 proctoring" */
  note?: string;
}

export interface CertProvider {
  key: string;
  name: string;
  capability: ProctoringCapability;
  /** Short description of what this provider certifies */
  description: string;
  /** Exams/credentials available through this provider */
  exams: string[];
  /** External verification or scheduling URL */
  verifyUrl?: string;
  /** Whether Elevate is currently an active authorized site */
  status: 'active' | 'available_through_partner';
  /**
   * Fees charged to test-takers. Multiple entries for different exam types.
   * If empty, pricing is quoted on request.
   */
  fees?: ExamFee[];
  /** Group/bulk discount note */
  groupDiscount?: string;
}

export interface ProctoringOptions {
  inPerson: boolean;
  remoteProvider: boolean;  // provider controls the remote system
  remoteCenter: boolean;    // Elevate runs live online proctoring
}

export const CERT_PROVIDERS: Record<string, CertProvider> = {
  esco: {
    key: 'esco',
    name: 'EPA Section 608 (ESCO Institute)',
    capability: 'IN_PERSON_ONLY',
    description: 'Federal refrigerant handling certification required by the Clean Air Act. Elevate for Humanity is a nationally authorized proctor site for both ESCO Group and Mainstream Engineering. Proctored in person on-site.',
    exams: ['Core', 'Type I — Small Appliances', 'Type II — High-Pressure', 'Type III — Low-Pressure', 'Universal'],
    verifyUrl: 'https://www.escogroup.org/esco/certifications/epa608.aspx',
    status: 'active',
    fees: [
      { label: 'Universal (all sections)', amount: 55, note: 'Includes exam fee + proctoring' },
      { label: 'Single section', amount: 35, note: 'Includes exam fee + proctoring' },
    ],
    groupDiscount: 'Groups of 5+ — contact us for employer/cohort pricing',
  },
  nrf: {
    key: 'nrf',
    name: 'NRF RISE Up (National Retail Federation)',
    capability: 'IN_PERSON_ONLY',
    description: 'Workforce credentials in customer service, retail, and business fundamentals.',
    exams: ['Customer Service & Sales', 'Business of Retail', 'Retail Industry Fundamentals'],
    verifyUrl: 'https://nrffoundation.org/riseup',
    status: 'active',
    fees: [
      { label: 'Per credential exam', amount: 45, note: 'Includes exam fee + proctoring' },
    ],
  },
  certiport: {
    key: 'certiport',
    name: 'Certiport Authorized Testing Center',
    capability: 'IN_PERSON_OR_PROVIDER_REMOTE',
    description: 'Authorized Certiport testing center. Microsoft, Adobe, CompTIA, Intuit, and IC3 exams.',
    exams: [
      'Microsoft Office Specialist (Word, Excel, PowerPoint, Outlook)',
      'IT Specialist (Python, Java, HTML/CSS, Networking, Cybersecurity)',
      'Intuit QuickBooks Certified User',
      'Entrepreneurship & Small Business (ESB)',
      'IC3 Digital Literacy',
      'Adobe Certified Professional',
      'CompTIA A+ · Security+ · Network+',
    ],
    verifyUrl: 'https://certiport.pearsonvue.com/Locator',
    status: 'active',
    fees: [
      { label: 'Per exam', amount: 65, note: 'Includes exam voucher + proctoring' },
    ],
    groupDiscount: 'Groups of 5+ — contact us for cohort pricing',
  },
  nha: {
    key: 'nha',
    name: 'NHA — National Healthcareer Association',
    capability: 'IN_PERSON_ONLY',
    description: 'NHA Authorized Testing Center. Healthcare certification exams for phlebotomy, medical assisting, billing & coding, and more.',
    exams: [
      'Certified Phlebotomy Technician (CPT)',
      'Certified Clinical Medical Assistant (CCMA)',
      'Certified EKG Technician (CET)',
      'Certified Patient Care Technician/Assistant (CPCT/A)',
      'Certified Medical Administrative Assistant (CMAA)',
      'Certified Pharmacy Technician — ExCPT',
    ],
    verifyUrl: 'https://www.nhanow.com/',
    status: 'active',
    // Exam fees = NHA exam cost + $25 Elevate proctoring surcharge.
    // NHA exam costs confirmed from April 2026 proposals (account 412957).
    fees: [
      { label: 'CPT — Phlebotomy',             amount: 154, note: '$129 NHA exam + $25 proctoring' },
      { label: 'CCMA — Medical Assistant',      amount: 190, note: '$165 NHA exam + $25 proctoring' },
      { label: 'CET — EKG Technician',          amount: 154, note: '$129 NHA exam + $25 proctoring' },
      { label: 'ExCPT — Pharmacy Technician',   amount: 154, note: '$129 NHA exam + $25 proctoring (includes free retake)' },
      { label: 'CPCT/A — Patient Care Tech',    amount: 154, note: '$129 NHA exam + $25 proctoring' },
      { label: 'CMAA — Medical Admin Assistant', amount: 154, note: '$129 NHA exam + $25 proctoring' },
    ],
    groupDiscount: 'Groups of 5+ — contact us for cohort pricing',
  },
  workkeys: {
    key: 'workkeys',
    name: 'ACT WorkKeys / NCRC',
    capability: 'IN_PERSON_OR_PROVIDER_REMOTE',
    description: 'National Career Readiness Certificate recognized by 22,000+ employers. Applied Math, Workplace Documents, Business Writing. Realm: 1317721865.',
    exams: ['Applied Math', 'Workplace Documents', 'Business Writing', 'National Career Readiness Certificate (NCRC)'],
    verifyUrl: 'https://www.act.org/content/act/en/products-and-services/workkeys-for-job-seekers.html',
    status: 'active',
    fees: [
      { label: 'Per assessment (individual)', amount: 45, note: 'Includes ACT fee + proctoring' },
      { label: 'Full NCRC (3 assessments)', amount: 120, note: 'Applied Math + Workplace Documents + Business Writing' },
      { label: 'Per assessment (workforce agency referral)', amount: 35, note: 'WorkOne / WIOA-referred candidates' },
    ],
    groupDiscount: 'Groups of 5+ — $30/assessment. Contact us for employer or cohort scheduling.',
  },
  servsafe: {
    key: 'servsafe',
    name: 'ServSafe (National Restaurant Association)',
    capability: 'IN_PERSON_OR_PROVIDER_REMOTE',
    description: 'Food handler and food manager certification required by most states for food service workers.',
    exams: ['Food Handler', 'Food Manager', 'Alcohol', 'Allergens'],
    verifyUrl: 'https://www.servsafe.com/',
    status: 'available_through_partner',
    fees: [
      { label: 'Per exam', amount: 45, note: 'Includes exam fee + proctoring' },
    ],
  },
  careersafe: {
    key: 'careersafe',
    name: 'CareerSafe / OSHA Outreach',
    capability: 'CENTER_REMOTE_ALLOWED',
    description: 'OSHA 10-Hour and 30-Hour safety certification. DOL wallet card issued upon completion.',
    exams: ['OSHA 10-Hour General Industry', 'OSHA 10-Hour Construction', 'OSHA 30-Hour General Industry', 'OSHA 30-Hour Construction'],
    verifyUrl: 'https://www.osha.gov/training/outreach',
    status: 'active',
    fees: [
      { label: 'OSHA 10-Hour', amount: 65, note: 'Includes course + DOL card' },
      { label: 'OSHA 30-Hour', amount: 185, note: 'Includes course + DOL card' },
    ],
  },
};

/**
 * Returns which proctoring modes are available for a given provider.
 * Use this to drive booking UI — only show options the provider actually supports.
 */
export function getProctoringOptions(providerKey: string): ProctoringOptions {
  const provider = CERT_PROVIDERS[providerKey];

  if (!provider) {
    // Unknown provider — default to in-person only (safest)
    return { inPerson: true, remoteProvider: false, remoteCenter: false };
  }

  switch (provider.capability) {
    case 'IN_PERSON_ONLY':
      return { inPerson: true, remoteProvider: false, remoteCenter: false };

    case 'IN_PERSON_OR_PROVIDER_REMOTE':
      return { inPerson: true, remoteProvider: true, remoteCenter: false };

    case 'CENTER_REMOTE_ALLOWED':
      return { inPerson: true, remoteProvider: false, remoteCenter: true };

    default:
      return { inPerson: true, remoteProvider: false, remoteCenter: false };
  }
}

/**
 * Returns human-readable labels for the available proctoring modes.
 * Use this to render booking option cards or dropdowns.
 */
export function getProctoringLabels(providerKey: string): string[] {
  const options = getProctoringOptions(providerKey);
  const labels: string[] = [];

  if (options.inPerson)       labels.push('In-person at Elevate Testing Center');
  if (options.remoteProvider) labels.push('Remote — provider-controlled system');
  if (options.remoteCenter)   labels.push('Live online — Elevate-proctored');

  return labels;
}

/**
 * Returns all active providers grouped by capability type.
 * Useful for admin dashboards and scheduling views.
 */
export function getProvidersByCapability(): Record<ProctoringCapability, CertProvider[]> {
  const grouped: Record<ProctoringCapability, CertProvider[]> = {
    IN_PERSON_ONLY: [],
    IN_PERSON_OR_PROVIDER_REMOTE: [],
    CENTER_REMOTE_ALLOWED: [],
  };

  for (const provider of Object.values(CERT_PROVIDERS)) {
    grouped[provider.capability].push(provider);
  }

  return grouped;
}

/** Active providers only — for public-facing pages */
export const ACTIVE_PROVIDERS = Object.values(CERT_PROVIDERS).filter(
  (p) => p.status === 'active'
);

/** All providers — for admin/scheduling views */
export const ALL_PROVIDERS = Object.values(CERT_PROVIDERS);

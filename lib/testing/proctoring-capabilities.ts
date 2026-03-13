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
  },
  nrf: {
    key: 'nrf',
    name: 'NRF RISE Up (National Retail Federation)',
    capability: 'IN_PERSON_ONLY',
    description: 'Workforce credentials in customer service, retail, and business fundamentals.',
    exams: ['Customer Service & Sales', 'Business of Retail', 'Retail Industry Fundamentals'],
    verifyUrl: 'https://nrffoundation.org/riseup',
    status: 'active',
  },
  certiport: {
    key: 'certiport',
    name: 'Certiport (Pearson VUE)',
    capability: 'IN_PERSON_OR_PROVIDER_REMOTE',
    description: 'Authorized Certiport testing center. Microsoft, Adobe, CompTIA, Intuit, and IC3 exams.',
    exams: [
      'Microsoft Office Specialist (Word, Excel, PowerPoint, Outlook)',
      'IT Specialist (Python, Java, HTML/CSS, Networking, Cybersecurity)',
      'Intuit QuickBooks Certified User',
      'Entrepreneurship & Small Business (ESB)',
      'IC3 Digital Literacy',
      'Adobe Certified Professional',
    ],
    verifyUrl: 'https://certiport.pearsonvue.com/Locator',
    status: 'active',
  },
  workkeys: {
    key: 'workkeys',
    name: 'ACT WorkKeys / NCRC',
    capability: 'IN_PERSON_OR_PROVIDER_REMOTE',
    description: 'National Career Readiness Certificate recognized by 22,000+ employers. Applied Math, Workplace Documents, Business Writing.',
    exams: ['Applied Math', 'Workplace Documents', 'Business Writing', 'National Career Readiness Certificate (NCRC)'],
    verifyUrl: 'https://www.act.org/content/act/en/products-and-services/workkeys-for-job-seekers.html',
    status: 'available_through_partner',
  },
  servsafe: {
    key: 'servsafe',
    name: 'ServSafe (National Restaurant Association)',
    capability: 'IN_PERSON_OR_PROVIDER_REMOTE',
    description: 'Food handler and food manager certification required by most states for food service workers. Scheduling available — contact us to book a session.',
    exams: ['Food Handler', 'Food Manager', 'Alcohol', 'Allergens'],
    verifyUrl: 'https://www.servsafe.com/',
    status: 'available_through_partner',
  },
  careersafe: {
    key: 'careersafe',
    name: 'CareerSafe / OSHA Outreach',
    capability: 'CENTER_REMOTE_ALLOWED',
    description: 'OSHA 10-Hour and 30-Hour safety certification. DOL wallet card issued upon completion.',
    exams: ['OSHA 10-Hour General Industry', 'OSHA 10-Hour Construction', 'OSHA 30-Hour General Industry', 'OSHA 30-Hour Construction'],
    verifyUrl: 'https://www.osha.gov/training/outreach',
    status: 'active',
  },
  milady: {
    key: 'milady',
    name: 'Milady (Cosmetology & Esthetics)',
    capability: 'CENTER_REMOTE_ALLOWED',
    description: 'Industry-standard assessments for cosmetology, esthetics, nail technology, and barbering programs. Contact us to schedule a session.',
    exams: ['Cosmetology Theory', 'Esthetics Theory', 'Nail Technology Theory', 'Barbering Theory'],
    verifyUrl: 'https://www.miladypro.com/',
    status: 'available_through_partner',
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

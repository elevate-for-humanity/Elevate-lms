/**
 * PARIS Document Requirements Engine
 * 
 * Determines required documents based on application type and funding sources.
 * Only requests documents that are legally and programmatically required.
 */

import type {
  ApplicationWorkflowType,
  DocumentRequirement,
  FundingType,
} from './types';

/**
 * Base document requirements for all applications
 */
const BASE_REQUIREMENTS: DocumentRequirement[] = [
  {
    code: 'PHOTO_ID',
    documentType: 'IDENTITY',
    displayName: 'Government-issued photo ID',
    required: true,
  },
  {
    code: 'EDUCATION_VERIFICATION',
    documentType: 'EDUCATION',
    displayName: 'High school diploma, transcript, or GED',
    required: true,
  },
  {
    code: 'RESIDENCY',
    documentType: 'RESIDENCY',
    displayName: 'Proof of Indiana residency',
    required: true,
  },
];

/**
 * Additional requirements for apprenticeship programs
 */
const APPRENTICESHIP_REQUIREMENTS: DocumentRequirement[] = [
  {
    code: 'APPRENTICESHIP_AGREEMENT',
    documentType: 'APPRENTICESHIP',
    displayName: 'Signed apprenticeship agreement',
    required: true,
  },
  {
    code: 'HOST_SHOP_ASSIGNMENT',
    documentType: 'APPRENTICESHIP',
    displayName: 'Host shop assignment letter',
    required: true,
  },
  {
    code: 'SPONSORING_EMPLOYER',
    documentType: 'APPRENTICESHIP',
    displayName: 'Employer sponsorship documentation',
    required: false, // May be employer or self-sponsored
  },
];

/**
 * Testing candidate requirements
 */
const TESTING_REQUIREMENTS: DocumentRequirement[] = [
  {
    code: 'TESTING_AUTHORIZATION',
    documentType: 'TESTING',
    displayName: 'Testing authorization or voucher',
    required: true,
  },
];

/**
 * Funding-specific document requirements
 * Only includes legally required documents per funding source
 */
const FUNDING_REQUIREMENTS: Partial<Record<FundingType, DocumentRequirement[]>> = {
  WIOA: [
    {
      code: 'WIOA_INCOME',
      documentType: 'FUNDING',
      displayName: 'Income verification (pay stubs, tax returns, or benefits letter)',
      required: true,
    },
    {
      code: 'WIOA_SELECTIVE_SERVICE',
      documentType: 'FUNDING',
      displayName: 'Selective Service registration verification (if applicable)',
      required: true,
    },
    {
      code: 'WIOA_EMPLOYMENT_STATUS',
      documentType: 'FUNDING',
      displayName: 'Employment status documentation',
      required: true,
    },
  ],
  
  WORKFORCE_READY_GRANT: [
    {
      code: 'WRG_RESIDENCY',
      documentType: 'FUNDING',
      displayName: 'Indiana state ID or driver\'s license',
      required: true,
    },
    {
      code: 'WRG_HIGH_SCHOOL',
      documentType: 'FUNDING',
      displayName: 'High school diploma or GED verification',
      required: true,
    },
  ],
  
  VOCATIONAL_REHABILITATION: [
    {
      code: 'VR_AUTHORIZATION',
      documentType: 'FUNDING',
      displayName: 'VR counselor authorization',
      required: true,
    },
    {
      code: 'VR_PLAN',
      documentType: 'FUNDING',
      displayName: 'Individualized plan for employment (IPE)',
      required: true,
    },
  ],
  
  EMPLOYER_SPONSORSHIP: [
    {
      code: 'EMPLOYER_AUTHORIZATION',
      documentType: 'FUNDING',
      displayName: 'Employer sponsorship letter on company letterhead',
      required: true,
    },
    {
      code: 'EMPLOYER_AGREEMENT',
      documentType: 'FUNDING',
      displayName: 'Signed employer training agreement',
      required: true,
    },
  ],
  
  GRANT: [
    {
      code: 'GRANT_AWARD_LETTER',
      documentType: 'FUNDING',
      displayName: 'Grant award letter or voucher',
      required: true,
    },
  ],
};

/**
 * Documents that require periodic renewal
 */
const EXPIRABLE_DOCUMENTS = new Set([
  'PHOTO_ID', // Driver's license expires
  'RESIDENCY', // Utility bills, lease
  'WIOA_INCOME', // 30-90 day verification
  'TESTING_AUTHORIZATION', // Voucher expiration
  'VR_AUTHORIZATION', // VR plans have dates
]);

/**
 * Get expiration days for a document type
 * Returns null if document doesn't expire
 */
export function getDocumentExpirationDays(requirementCode: string): number | null {
  const expirations: Record<string, number> = {
    PHOTO_ID: 365, // 1 year
    RESIDENCY: 90, // 90 days
    WIOA_INCOME: 90, // 90 days
    TESTING_AUTHORIZATION: 180, // 6 months
    VR_AUTHORIZATION: 365, // 1 year
  };
  return expirations[requirementCode] ?? null;
}

/**
 * Check if a document type is expirable
 */
export function isExpirableDocument(requirementCode: string): boolean {
  return EXPIRABLE_DOCUMENTS.has(requirementCode);
}

/**
 * Get document requirements for an application
 * 
 * @param input.applicationType - Type of application (STUDENT, APPRENTICE, TESTING_CANDIDATE)
 * @param input.requestedFunding - Array of funding types being pursued
 * @returns Array of document requirements with deduplication
 */
export function getDocumentRequirements(input: {
  applicationType: ApplicationWorkflowType;
  requestedFunding: FundingType[];
}): DocumentRequirement[] {
  const requirements: DocumentRequirement[] = [];

  // Add base requirements for all applications
  requirements.push(...BASE_REQUIREMENTS);

  // Add type-specific requirements
  switch (input.applicationType) {
    case 'APPRENTICE':
      requirements.push(...APPRENTICESHIP_REQUIREMENTS);
      break;
    case 'TESTING_CANDIDATE':
      requirements.push(...TESTING_REQUIREMENTS);
      break;
    // STUDENT type has no additional requirements
  }

  // Add funding-specific requirements
  for (const fundingType of input.requestedFunding) {
    const fundingReqs = FUNDING_REQUIREMENTS[fundingType];
    if (fundingReqs) {
      requirements.push(...fundingReqs);
    }
  }

  // Deduplicate by requirement code
  return Array.from(
    new Map(
      requirements.map((req) => [req.code, req]),
    ).values(),
  );
}

/**
 * Get only required documents (not optional)
 */
export function getRequiredDocuments(requirements: DocumentRequirement[]): DocumentRequirement[] {
  return requirements.filter((req) => req.required);
}

/**
 * Get optional documents
 */
export function getOptionalDocuments(requirements: DocumentRequirement[]): DocumentRequirement[] {
  return requirements.filter((req) => !req.required);
}

/**
 * Get documents by type
 */
export function getDocumentsByType(
  requirements: DocumentRequirement[],
  documentType: string,
): DocumentRequirement[] {
  return requirements.filter((req) => req.documentType === documentType);
}

/**
 * Get document type labels for display
 */
export function getDocumentTypeLabel(documentType: string): string {
  const labels: Record<string, string> = {
    IDENTITY: 'Identity Verification',
    EDUCATION: 'Education Verification',
    RESIDENCY: 'Residency Verification',
    FUNDING: 'Funding Documentation',
    APPRENTICESHIP: 'Apprenticeship Documents',
    TESTING: 'Testing Authorization',
    MEDICAL: 'Medical Documents',
    BACKGROUND: 'Background Check',
    OTHER: 'Other Documents',
  };
  return labels[documentType] ?? documentType;
}

/**
 * Get acceptance formats for document upload
 */
export function getAcceptedFormats(documentType: string): string[] {
  // Standard document formats
  const standardFormats = ['image/jpeg', 'image/png', 'application/pdf'];
  
  // Photos (for ID)
  const photoFormats = ['image/jpeg', 'image/png'];
  
  // Based on document type
  switch (documentType) {
    case 'IDENTITY':
      return photoFormats;
    case 'EDUCATION':
    case 'FUNDING':
    case 'APPRENTICESHIP':
      return standardFormats;
    default:
      return standardFormats;
  }
}

/**
 * Get maximum file size in bytes for a document type
 */
export function getMaxFileSize(documentType: string): number {
  // 10MB default
  const tenMB = 10 * 1024 * 1024;
  
  // 5MB for images
  const fiveMB = 5 * 1024 * 1024;
  
  switch (documentType) {
    case 'IDENTITY':
      return fiveMB;
    default:
      return tenMB;
  }
}

/**
 * Human-readable format for accepted file types
 */
export function getAcceptedFormatsDisplay(documentType: string): string {
  const formats = getAcceptedFormats(documentType);
  return formats.map((f) => {
    switch (f) {
      case 'application/pdf':
        return 'PDF';
      case 'image/jpeg':
        return 'JPEG';
      case 'image/png':
        return 'PNG';
      default:
        return f;
    }
  }).join(', ');
}

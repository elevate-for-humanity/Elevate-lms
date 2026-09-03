/**
 * Partner Types and Status Logic
 *
 * Partners do NOT require manual admin approval.
 * Access is granted automatically when required documents are uploaded and validated.
 */

export type PartnerStatus = 'draft' | 'submitted' | 'active' | 'restricted';

export type DocumentStatus = 'pending' | 'accepted' | 'rejected';

export type DocumentType =
  | 'partner_mou'
  | 'w9'
  | 'business_formation'
  | 'liability_insurance'
  | 'barber_shop_license'
  | 'cosmetology_shop_license'
  | 'healthcare_facility_license';

export interface PartnerDocument {
  id: string;
  partner_id: string;
  program_id: string;
  state: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  uploaded_at: string;
  status: DocumentStatus;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
}

export interface Partner {
  id: string;
  legal_name: string;
  dba?: string;
  fein?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  website?: string;
  status: PartnerStatus;
  programs: string[];
  states_of_operation: string[];
  created_at: string;
  updated_at: string;
}

export interface PartnerProgramAccess {
  partner_id: string;
  program_id: string;
  state: string;
  status: 'pending' | 'active' | 'restricted';
  activated_at?: string;
}

/**
 * Required documents by program and state
 */
export const REQUIRED_DOCUMENTS: Record<string, Record<string, DocumentType[]>> = {
  BARBER: {
    Indiana: [
      'partner_mou',
      'w9',
      'business_formation',
      'liability_insurance',
      'barber_shop_license',
    ],
    // Add other states as needed
    default: ['partner_mou', 'w9', 'business_formation', 'liability_insurance'],
  },
  COSMETOLOGY: {
    Indiana: [
      'partner_mou',
      'w9',
      'business_formation',
      'liability_insurance',
      'cosmetology_shop_license',
    ],
    default: ['partner_mou', 'w9', 'business_formation', 'liability_insurance'],
  },
  CNA: {
    default: [
      'partner_mou',
      'w9',
      'business_formation',
      'liability_insurance',
      'healthcare_facility_license',
    ],
  },
  HVAC: {
    default: ['partner_mou', 'w9', 'business_formation', 'liability_insurance'],
  },
};

/**
 * Human-readable document type labels
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  partner_mou: 'Signed Partner MOU',
  w9: 'IRS W-9',
  business_formation: 'Proof of Business Formation/License',
  liability_insurance: 'Proof of Liability Insurance (COI)',
  barber_shop_license: 'Indiana Barber Shop/Establishment License',
  cosmetology_shop_license: 'Indiana Cosmetology Establishment License',
  healthcare_facility_license: 'Healthcare Facility License',
};

/**
 * Get required documents for a program and state
 */
export function getRequiredDocuments(programId: string, state: string): DocumentType[] {
  const programDocs = REQUIRED_DOCUMENTS[programId];
  if (!programDocs) return REQUIRED_DOCUMENTS.BARBER.default;
  return programDocs[state] || programDocs.default || [];
}

/**
 * Check if all required documents are accepted for a program/state
 */
export function areAllDocumentsAccepted(
  documents: PartnerDocument[],
  programId: string,
  state: string,
): boolean {
  const required = getRequiredDocuments(programId, state);
  const acceptedTypes = documents
    .filter((d) => d.program_id === programId && d.state === state && d.status === 'accepted')
    .map((d) => d.document_type);

  return required.every((docType) => acceptedTypes.includes(docType));
}

/**
 * Get missing documents for a program/state
 */
export function getMissingDocuments(
  documents: PartnerDocument[],
  programId: string,
  state: string,
): DocumentType[] {
  const required = getRequiredDocuments(programId, state);
  const uploadedTypes = documents
    .filter((d) => d.program_id === programId && d.state === state)
    .map((d) => d.document_type);

  return required.filter((docType) => !uploadedTypes.includes(docType));
}

/**
 * Get pending documents (uploaded but not yet reviewed)
 */
export function getPendingDocuments(
  documents: PartnerDocument[],
  programId: string,
  state: string,
): PartnerDocument[] {
  return documents.filter(
    (d) => d.program_id === programId && d.state === state && d.status === 'pending',
  );
}

/**
 * Calculate partner status based on documents
 *
 * Status logic:
 * - draft: Initial state, no documents submitted
 * - submitted: At least one document uploaded, waiting for review
 * - active: All required documents accepted for at least one program/state
 * - restricted: Was active but documents expired or were revoked
 */
export function calculatePartnerStatus(
  partner: Partner,
  documents: PartnerDocument[],
): PartnerStatus {
  if (documents.length === 0) {
    return 'draft';
  }

  // Check if any program/state combination has all documents accepted
  for (const programId of partner.programs) {
    for (const state of partner.states_of_operation) {
      if (areAllDocumentsAccepted(documents, programId, state)) {
        return 'active';
      }
    }
  }

  // Check if any documents are pending
  const hasPending = documents.some((d) => d.status === 'pending');
  if (hasPending) {
    return 'submitted';
  }

  // Has documents but none accepted (all rejected)
  return 'restricted';
}

/**
 * Check if partner has access to a specific program
 */
export function hasPartnerProgramAccess(
  partner: Partner,
  documents: PartnerDocument[],
  programId: string,
  state: string,
): boolean {
  if (partner.status !== 'active') return false;
  if (!partner.programs.includes(programId)) return false;
  if (!partner.states_of_operation.includes(state)) return false;

  return areAllDocumentsAccepted(documents, programId, state);
}

/**
 * Get all programs a partner has active access to
 */
export function getPartnerActivePrograms(
  partner: Partner,
  documents: PartnerDocument[],
): Array<{ programId: string; state: string }> {
  const activePrograms: Array<{ programId: string; state: string }> = [];

  for (const programId of partner.programs) {
    for (const state of partner.states_of_operation) {
      if (areAllDocumentsAccepted(documents, programId, state)) {
        activePrograms.push({ programId, state });
      }
    }
  }

  return activePrograms;
}

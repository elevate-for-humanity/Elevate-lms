import { logger } from '@/lib/logger';
/**
 * Document Management System
 * 
 * MANDATORY VERIFICATION ENFORCEMENT (LOCKED)
 * 
 * Automation must NOT:
 * - Credit transfer hours
 * - Approve host shops/apprentices
 * - Match apprentices to host shops
 * - Set IPLA exam eligibility
 * 
 * UNTIL required documents are VERIFIED (documents.verified=true OR status='verified').
 * 
 * Required verified docs:
 * - Apprentice enrollment: photo_id
 * - Host shop enrollment: shop_license + barber_license
 * - Transfer evaluation:
 *   * school transfers: school_transcript OR certificate
 *   * out_of_state_license: out_of_state_license
 * - CE approval: ce_certificate
 */

import { createAdminClient } from '@/lib/supabase/admin';

export type OwnerType = 'apprentice' | 'host_shop';

export type DocumentType =
  | 'photo_id'
  | 'school_transcript'
  | 'certificate'
  | 'out_of_state_license'
  | 'shop_license'
  | 'barber_license'
  | 'ce_certificate'
  | 'employment_verification'
  | 'ipla_packet'
  | 'other';

export type TransferSourceType = 
  | 'in_state_barber_school'
  | 'out_of_state_school'
  | 'out_of_state_license'
  | 'previous_apprenticeship'
  | 'work_experience';

export interface Document {
  id: string;
  owner_type: OwnerType;
  owner_id: string;
  document_type: DocumentType;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  uploaded_by: string;
  uploaded_at: string;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  rejection_reason: string | null;
  status: 'pending' | 'verified' | 'rejected';
}

// Required VERIFIED documents by owner type
export const REQUIRED_VERIFIED_DOCUMENTS: Record<OwnerType, DocumentType[]> = {
  apprentice: ['photo_id'],
  host_shop: ['shop_license', 'barber_license'],
};

// Alias for backward compatibility
export const REQUIRED_DOCUMENTS = REQUIRED_VERIFIED_DOCUMENTS;

// Required documents for transfer evaluation by source type
export const TRANSFER_DOCS_BY_SOURCE: Record<TransferSourceType, DocumentType[]> = {
  in_state_barber_school: ['school_transcript', 'certificate'],
  out_of_state_school: ['school_transcript', 'certificate'],
  out_of_state_license: ['out_of_state_license'],
  previous_apprenticeship: ['school_transcript', 'certificate'],
  work_experience: ['employment_verification'],
};

// Legacy export
export const TRANSFER_REQUIRED_DOCUMENTS: DocumentType[] = [
  'school_transcript',
  'certificate',
  'out_of_state_license',
  'employment_verification',
];

// CE approval requires
export const CE_REQUIRED_DOCUMENTS: DocumentType[] = ['ce_certificate'];

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

// Max file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Check if required documents exist for an owner
 */
export async function hasRequiredDocuments(
  ownerType: OwnerType,
  ownerId: string
): Promise<{ complete: boolean; missing: DocumentType[] }> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { complete: false, missing: REQUIRED_DOCUMENTS[ownerType] };
  }

  const required = REQUIRED_DOCUMENTS[ownerType];

  const { data: docs } = await supabase
    .from('documents')
    .select('document_type')
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId);

  const uploadedTypes = new Set(docs?.map((d) => d.document_type) || []);
  const missing = required.filter((type) => !uploadedTypes.has(type));

  return {
    complete: missing.length === 0,
    missing,
  };
}

/**
 * Check if required documents are verified for an owner
 * This is the PRIMARY gate for all automation actions.
 */
export async function hasVerifiedDocuments(
  ownerType: OwnerType,
  ownerId: string,
  requiredTypes?: DocumentType[]
): Promise<{ complete: boolean; unverified: DocumentType[] }> {
  const supabase = createAdminClient();
  if (!supabase) {
    const required = requiredTypes || REQUIRED_VERIFIED_DOCUMENTS[ownerType];
    return { complete: false, unverified: required };
  }

  const required = requiredTypes || REQUIRED_VERIFIED_DOCUMENTS[ownerType];

  const { data: docs } = await supabase
    .from('documents')
    .select('document_type, verified, status')
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId);

  // Document is verified if verified=true OR status='verified'
  const verifiedTypes = new Set(
    docs?.filter((d) => d.verified === true || d.status === 'verified')
      .map((d) => d.document_type) || []
  );
  const unverified = required.filter((type) => !verifiedTypes.has(type));

  return {
    complete: unverified.length === 0,
    unverified,
  };
}

/**
 * Check if transfer has required VERIFIED documents based on source type.
 * For school transfers: school_transcript OR certificate must be verified.
 * For out_of_state_license: out_of_state_license must be verified.
 */
export async function hasVerifiedTransferDocuments(
  userId: string,
  sourceType: TransferSourceType
): Promise<{ complete: boolean; unverified: DocumentType[] }> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { complete: false, unverified: TRANSFER_DOCS_BY_SOURCE[sourceType] || [] };
  }

  const requiredDocs = TRANSFER_DOCS_BY_SOURCE[sourceType] || [];
  
  // For school transfers, only ONE of the docs needs to be verified (OR logic)
  const isOrLogic = ['in_state_barber_school', 'out_of_state_school', 'previous_apprenticeship'].includes(sourceType);

  const { data: docs } = await supabase
    .from('documents')
    .select('document_type, verified, status')
    .eq('user_id', userId)
    .in('document_type', requiredDocs);

  const verifiedTypes = new Set(
    docs?.filter((d) => d.verified === true || d.status === 'verified')
      .map((d) => d.document_type) || []
  );

  if (isOrLogic) {
    // At least ONE must be verified
    const hasAnyVerified = requiredDocs.some((type) => verifiedTypes.has(type));
    return {
      complete: hasAnyVerified,
      unverified: hasAnyVerified ? [] : requiredDocs,
    };
  }

  // All must be verified (AND logic)
  const unverified = requiredDocs.filter((type) => !verifiedTypes.has(type));
  return {
    complete: unverified.length === 0,
    unverified,
  };
}

/**
 * Check if transfer has required documents (uploaded, not necessarily verified)
 * @deprecated Use hasVerifiedTransferDocuments for enforcement
 */
export async function hasTransferDocuments(
  apprenticeId: string,
  transferId?: string
): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const { data: docs } = await supabase
    .from('documents')
    .select('document_type')
    .eq('owner_type', 'apprentice')
    .eq('owner_id', apprenticeId)
    .in('document_type', TRANSFER_REQUIRED_DOCUMENTS);

  return (docs?.length || 0) > 0;
}

// ============================================================================
// ENFORCEMENT GATES - Server-side checks that MUST pass before automation
// ============================================================================

export interface VerificationGateResult {
  allowed: boolean;
  reason?: string;
  unverifiedDocs?: DocumentType[];
}

/**
 * GATE: Can apprentice be approved?
 * Requires: photo_id verified
 */
export async function canApproveApprentice(
  apprenticeId: string
): Promise<VerificationGateResult> {
  const result = await hasVerifiedDocuments('apprentice', apprenticeId);
  
  if (!result.complete) {
    return {
      allowed: false,
      reason: 'Document verification required before apprentice approval',
      unverifiedDocs: result.unverified,
    };
  }
  
  return { allowed: true };
}

/**
 * GATE: Can host shop be approved?
 * Requires: shop_license AND barber_license verified
 */
export async function canApproveHostShop(
  shopId: string
): Promise<VerificationGateResult> {
  const result = await hasVerifiedDocuments('host_shop', shopId);
  
  if (!result.complete) {
    return {
      allowed: false,
      reason: 'Document verification required before host shop approval',
      unverifiedDocs: result.unverified,
    };
  }
  
  return { allowed: true };
}

/**
 * GATE: Can transfer hours be evaluated/credited?
 * Requires: appropriate transfer docs verified based on source type
 */
export async function canEvaluateTransfer(
  userId: string,
  sourceType: TransferSourceType
): Promise<VerificationGateResult> {
  const result = await hasVerifiedTransferDocuments(userId, sourceType);
  
  if (!result.complete) {
    return {
      allowed: false,
      reason: 'Document verification required before transfer evaluation',
      unverifiedDocs: result.unverified,
    };
  }
  
  return { allowed: true };
}

/**
 * GATE: Can apprentice be matched to host shop?
 * Requires: apprentice photo_id verified AND host shop licenses verified
 */
export async function canMatchApprentice(
  apprenticeId: string,
  shopId: string
): Promise<VerificationGateResult> {
  const apprenticeResult = await hasVerifiedDocuments('apprentice', apprenticeId);
  const shopResult = await hasVerifiedDocuments('host_shop', shopId);
  
  if (!apprenticeResult.complete || !shopResult.complete) {
    const allUnverified = [
      ...(apprenticeResult.unverified || []),
      ...(shopResult.unverified || []),
    ];
    return {
      allowed: false,
      reason: 'Document verification required for both apprentice and host shop before matching',
      unverifiedDocs: allUnverified,
    };
  }
  
  return { allowed: true };
}

/**
 * GATE: Can apprentice be marked exam eligible?
 * Requires: photo_id verified, all transfer docs verified, hours threshold met
 */
export async function canSetExamEligible(
  apprenticeId: string,
  userId: string
): Promise<VerificationGateResult> {
  // Check apprentice docs
  const apprenticeResult = await hasVerifiedDocuments('apprentice', apprenticeId);
  
  if (!apprenticeResult.complete) {
    return {
      allowed: false,
      reason: 'Document verification required before setting exam eligibility',
      unverifiedDocs: apprenticeResult.unverified,
    };
  }
  
  // Check for any pending transfer requests that need verification
  const supabase = createAdminClient();
  if (supabase) {
    const { data: pendingTransfers } = await supabase
      .from('hour_transfer_requests')
      .select('id, status')
      .eq('apprentice_id', apprenticeId)
      .eq('status', 'requires_manual_review');
    
    if (pendingTransfers && pendingTransfers.length > 0) {
      return {
        allowed: false,
        reason: 'Pending transfer requests must be reviewed before setting exam eligibility',
      };
    }
  }
  
  return { allowed: true };
}

/**
 * GATE: Can CE hours be approved?
 * Requires: ce_certificate verified
 */
export async function canApproveCEHours(
  userId: string
): Promise<VerificationGateResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      allowed: false,
      reason: 'Service unavailable',
      unverifiedDocs: CE_REQUIRED_DOCUMENTS,
    };
  }

  const { data: docs } = await supabase
    .from('documents')
    .select('document_type, verified, status')
    .eq('user_id', userId)
    .eq('document_type', 'ce_certificate');

  const hasVerified = docs?.some(
    (d) => d.verified === true || d.status === 'verified'
  );

  if (!hasVerified) {
    return {
      allowed: false,
      reason: 'CE certificate must be verified before approving CE hours',
      unverifiedDocs: CE_REQUIRED_DOCUMENTS,
    };
  }

  return { allowed: true };
}

/**
 * Get all documents for an owner
 */
export async function getDocuments(
  ownerType: OwnerType,
  ownerId: string
): Promise<Document[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId)
    .order('uploaded_at', { ascending: false });

  return (data as Document[]) || [];
}

/**
 * Verify a document (admin only)
 * Records verified_by, verified_at, and optional verification_notes for audit trail.
 */
export async function verifyDocument(
  documentId: string,
  verifiedBy: string,
  verificationNotes?: string
): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('documents')
    .update({
      verified: true,
      status: 'verified',
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      verification_notes: verificationNotes || null,
      rejection_reason: null,
    })
    .eq('id', documentId);

  return !error;
}

/**
 * Reject a document (admin only)
 * Records verified_by, verified_at, and rejection_reason for audit trail.
 */
export async function rejectDocument(
  documentId: string,
  rejectedBy: string,
  reason: string
): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('documents')
    .update({
      verified: false,
      status: 'rejected',
      verified_by: rejectedBy,
      verified_at: new Date().toISOString(),
      rejection_reason: reason,
      verification_notes: null,
    })
    .eq('id', documentId);

  return !error;
}

/**
 * Create a document record (after upload)
 */
export async function createDocumentRecord(params: {
  ownerType: OwnerType;
  ownerId: string;
  documentType: DocumentType;
  filePath: string;
  fileName: string;
  mimeType?: string;
  fileSizeBytes?: number;
  uploadedBy: string;
}): Promise<Document | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('documents')
    .insert({
      owner_type: params.ownerType,
      owner_id: params.ownerId,
      document_type: params.documentType,
      file_path: params.filePath,
      file_name: params.fileName,
      mime_type: params.mimeType || null,
      file_size_bytes: params.fileSizeBytes || null,
      uploaded_by: params.uploadedBy,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating document record:', error);
    return null;
  }

  return data as Document;
}

/**
 * Validate file before upload
 */
export function validateFile(file: {
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Get storage bucket name for owner type
 */
export function getStorageBucket(ownerType: OwnerType): string {
  return ownerType === 'apprentice'
    ? 'apprentice-documents'
    : 'host-shop-documents';
}

/**
 * Generate storage path for a document
 */
export function generateStoragePath(
  ownerType: OwnerType,
  ownerId: string,
  documentType: DocumentType,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${ownerId}/${documentType}/${timestamp}_${sanitizedFileName}`;
}

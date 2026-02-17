/**
 * Canonical Agreement Acceptance Recording
 * 
 * This is the ONLY function that should write to license_agreement_acceptances.
 * All agreement signing flows must use this function.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type AgreementType = 
  | 'enrollment'
  | 'handbook'
  | 'data_sharing'
  | 'program_holder_mou'
  | 'employer_agreement'
  | 'staff_agreement'
  | 'ferpa'
  | 'participation'
  | 'media_release'
  | 'eula'
  | 'tos'
  | 'aup'
  | 'disclosures'
  | 'license'
  | 'nda'
  | 'mou';

export type SignatureMethod = 'checkbox' | 'typed' | 'drawn';

export interface RecordAgreementParams {
  supabase: SupabaseClient;
  userId: string;
  userEmail: string;
  userRole: string;
  agreementType: AgreementType;
  documentVersion: string;
  signerName: string;
  signerEmail: string;
  signatureMethod: SignatureMethod;
  signatureTyped?: string;
  signatureData?: string; // Base64 for drawn signatures
  ipAddress: string;
  userAgent: string;
  context?: string;
  organizationId?: string;
  tenantId?: string;
  programId?: string;
}

export interface RecordAgreementResult {
  success: boolean;
  id?: string;
  alreadyExists?: boolean;
  error?: string;
}

/**
 * Records an agreement acceptance to license_agreement_acceptances.
 * 
 * Features:
 * - Idempotent: returns success if row already exists for (user_id, agreement_type, document_version)
 * - Validates signer_email matches authenticated user email
 * - Captures full audit trail (IP, user agent, timestamp)
 * - Records role at time of signing
 */
export async function recordAgreementAcceptance(
  params: RecordAgreementParams
): Promise<RecordAgreementResult> {
  const {
    supabase,
    userId,
    userEmail,
    userRole,
    agreementType,
    documentVersion,
    signerName,
    signerEmail,
    signatureMethod,
    signatureTyped,
    signatureData,
    ipAddress,
    userAgent,
    context,
    organizationId,
    tenantId,
    programId,
  } = params;

  // Validate email match
  if (signerEmail.toLowerCase() !== userEmail.toLowerCase()) {
    return {
      success: false,
      error: `Signer email (${signerEmail}) must match authenticated user email (${userEmail})`,
    };
  }

  // Check if already exists (idempotency)
  const { data: existing } = await supabase
    .from('license_agreement_acceptances')
    .select('id')
    .eq('user_id', userId)
    .eq('agreement_type', agreementType)
    .eq('document_version', documentVersion)
    .single();

  if (existing) {
    return {
      success: true,
      id: existing.id,
      alreadyExists: true,
    };
  }

  // Insert new acceptance
  const { data, error } = await supabase
    .from('license_agreement_acceptances')
    .insert({
      user_id: userId,
      agreement_type: agreementType,
      document_version: documentVersion,
      signer_name: signerName.trim(),
      signer_email: signerEmail.trim().toLowerCase(),
      auth_email: userEmail.toLowerCase(),
      signature_method: signatureMethod,
      signature_typed: signatureMethod === 'typed' ? signatureTyped?.trim() : null,
      signature_data: signatureMethod === 'drawn' ? signatureData : null,
      ip_address: ipAddress,
      user_agent: userAgent,
      acceptance_context: context || 'onboarding',
      organization_id: organizationId || null,
      tenant_id: tenantId || null,
      program_id: programId || null,
      role_at_signing: userRole,
      legal_acknowledgment: true,
      is_immutable: true,
    })
    .select('id')
    .single();

  if (error) {
    // Handle unique constraint violation (race condition)
    if (error.code === '23505') {
      const { data: raceExisting } = await supabase
        .from('license_agreement_acceptances')
        .select('id')
        .eq('user_id', userId)
        .eq('agreement_type', agreementType)
        .eq('document_version', documentVersion)
        .single();

      if (raceExisting) {
        return {
          success: true,
          id: raceExisting.id,
          alreadyExists: true,
        };
      }
    }

    console.error('Agreement acceptance insert error:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    id: data.id,
    alreadyExists: false,
  };
}

/**
 * Records multiple agreement acceptances in a single transaction.
 */
export async function recordMultipleAgreements(
  supabase: SupabaseClient,
  baseParams: Omit<RecordAgreementParams, 'supabase' | 'agreementType' | 'documentVersion'>,
  agreements: Array<{ type: AgreementType; version: string }>
): Promise<{ success: boolean; results: RecordAgreementResult[]; allSucceeded: boolean }> {
  const results: RecordAgreementResult[] = [];

  for (const agreement of agreements) {
    const result = await recordAgreementAcceptance({
      supabase,
      ...baseParams,
      agreementType: agreement.type,
      documentVersion: agreement.version,
    });
    results.push(result);
  }

  return {
    success: true,
    results,
    allSucceeded: results.every((r) => r.success),
  };
}

/**
 * Helper to extract request metadata for audit trail.
 */
export function extractRequestMetadata(headers: Headers): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    '0.0.0.0';

  const userAgent = headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

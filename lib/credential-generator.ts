
// =====================================================
// CREDENTIAL GENERATION WITH NON-GUESSABLE IDS
// =====================================================

import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Generate non-guessable credential code
 * Format: crd_<32 random chars>
 */
export function generateCredentialCode(): string {
  const randomBytes = crypto.randomBytes(20);
  const code = `crd_${randomBytes.toString('hex')}`;
  return code;
}

/**
 * Generate share token for credential links
 * Format: <32 random chars>
 */
export function generateShareToken(): string {
  const randomBytes = crypto.randomBytes(20);
  return randomBytes.toString('hex');
}

/**
 * Issue a new credential
 */
export async function issueCredential(params: {
  studentId: string;
  programId: string;
  courseId?: string;
  credentialType: string;
  issuerOrgId: string;
  expiresInDays?: number;
  metadata?: any;
}) {
  const supabase = await createServerSupabaseClient();

  const code = generateCredentialCode();
  const issuedAt = new Date();
  const expiresAt = params.expiresInDays
    ? new Date(issuedAt.getTime() + params.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const { data: credential, error } = await supabase
    .from('credentials')
    .insert({
      code,
      student_id: params.studentId,
      program_id: params.programId,
      course_id: params.courseId,
      credential_type: params.credentialType,
      issuer_org_id: params.issuerOrgId,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt?.toISOString(),
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to issue credential', { error, params });
    throw new Error('Failed to issue credential');
  }

  // Log issuance
  await supabase.from('audit_logs').insert({
    event_type: 'credential_issued',
    resource_type: 'credential',
    resource_id: credential.id,
    user_id: params.studentId,
    metadata: {
      credential_type: params.credentialType,
      program_id: params.programId,
      issuer_org_id: params.issuerOrgId,
    },
  });

  logger.info('Credential issued', {
    credentialId: credential.id,
    studentId: params.studentId,
    type: params.credentialType,
  });

  return credential;
}

/**
 * Create expiring share link for credential
 */
export async function createShareLink(params: {
  credentialId: string;
  credentialCode: string;
  expiresInMinutes?: number;
  oneTimeUse?: boolean;
}) {
  const supabase = await createServerSupabaseClient();

  const token = generateShareToken();
  const expiresAt = new Date(
    Date.now() + (params.expiresInMinutes || 60) * 60 * 1000
  );

  const { data: shareLink, error } = await supabase
    .from('credential_share_links')
    .insert({
      token,
      credential_id: params.credentialId,
      credential_code: params.credentialCode,
      expires_at: expiresAt.toISOString(),
      one_time_use: params.oneTimeUse || false,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create share link', { error, params });
    throw new Error('Failed to create share link');
  }

  logger.info('Share link created', {
    shareLinkId: shareLink.id,
    credentialId: params.credentialId,
    expiresAt,
  });

  return {
    ...shareLink,
    url: `/c/${token}`,
  };
}

/**
 * Revoke a credential
 */
export async function revokeCredential(
  credentialId: string,
  reason: string,
  revokedBy: string
) {
  const supabase = await createServerSupabaseClient();

  const { data: credential, error } = await supabase
    .from('credentials')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_reason: reason,
    })
    .eq('id', credentialId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to revoke credential', { error, credentialId });
    throw new Error('Failed to revoke credential');
  }

  // Log revocation
  await supabase.from('audit_logs').insert({
    event_type: 'credential_revoked',
    resource_type: 'credential',
    resource_id: credentialId,
    user_id: revokedBy,
    metadata: {
      reason,
    },
  });

  logger.info('Credential revoked', {
    credentialId,
    reason,
    revokedBy,
  });

  return credential;
}

/**
 * Check if credential is valid
 */
export async function isCredentialValid(code: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { data: credential } = await supabase
    .from('credentials')
    .select('issued_at, expires_at, revoked_at')
    .eq('code', code)
    .single();

  if (!credential) return false;

  const now = new Date();
  const isExpired = credential.expires_at && new Date(credential.expires_at) < now;
  const isRevoked = !!credential.revoked_at;

  return !isExpired && !isRevoked;
}

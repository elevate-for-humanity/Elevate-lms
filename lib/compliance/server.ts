/**
 * Server-side Compliance Utilities
 * 
 * Use these functions in Server Components and API routes.
 */

import { createClient } from '@/lib/supabase/server';
import { checkComplianceStatusWithClient, type ComplianceStatus, REQUIRED_AGREEMENTS } from './enforcement';

/**
 * Check compliance status (server-side)
 */
export async function checkComplianceStatusServer(
  userId: string,
  context: keyof typeof REQUIRED_AGREEMENTS = 'student'
): Promise<ComplianceStatus> {
  const supabase = await createClient();
  return checkComplianceStatusWithClient(supabase, userId, context);
}

/**
 * Get user's compliance summary for admin views
 */
export async function getUserComplianceSummary(userId: string) {
  const supabase = await createClient();

  const [
    { data: agreements },
    { data: handbook },
    { data: onboarding },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('license_agreement_acceptances')
      .select('agreement_type, document_version, accepted_at, signature_method')
      .eq('user_id', userId),
    supabase
      .from('handbook_acknowledgments')
      .select('handbook_version, acknowledged_at')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', userId)
      .single(),
  ]);

  const requiredAgreements = ['enrollment', 'participation', 'ferpa'];
  const signedAgreements = agreements?.map(a => a.agreement_type) || [];
  const missingAgreements = requiredAgreements.filter(a => !signedAgreements.includes(a));

  return {
    user: {
      id: userId,
      name: profile?.full_name,
      email: profile?.email,
      role: profile?.role,
    },
    agreements: {
      signed: agreements || [],
      missing: missingAgreements,
      complete: missingAgreements.length === 0,
    },
    handbook: {
      acknowledged: !!handbook,
      version: handbook?.handbook_version,
      acknowledgedAt: handbook?.acknowledged_at,
    },
    onboarding: {
      status: onboarding?.status || 'not_started',
      profileComplete: onboarding?.profile_completed || false,
      agreementsComplete: onboarding?.agreements_completed || false,
      handbookComplete: onboarding?.handbook_acknowledged || false,
      documentsComplete: onboarding?.documents_uploaded || false,
      completedAt: onboarding?.completed_at,
    },
    isFullyCompliant:
      missingAgreements.length === 0 &&
      !!handbook &&
      onboarding?.status === 'completed',
  };
}

/**
 * Get compliance audit trail for a user
 */
export async function getComplianceAuditTrail(
  userId: string,
  options?: { limit?: number; eventTypes?: string[] }
) {
  const supabase = await createClient();

  let query = supabase
    .from('compliance_audit_log')
    .select('*')
    .eq('user_id', userId)
    .order('event_timestamp', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.eventTypes?.length) {
    query = query.in('event_type', options.eventTypes);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Audit trail error:', error);
    return [];
  }

  return data || [];
}

/**
 * Verify if a specific agreement was signed
 */
export async function verifyAgreementSigned(
  userId: string,
  agreementType: string,
  version?: string
): Promise<{
  signed: boolean;
  acceptance?: {
    id: string;
    signedAt: string;
    signerName: string;
    signatureMethod: string;
  };
}> {
  const supabase = await createClient();

  let query = supabase
    .from('license_agreement_acceptances')
    .select('id, accepted_at, signer_name, signature_method')
    .eq('user_id', userId)
    .eq('agreement_type', agreementType);

  if (version) {
    query = query.eq('document_version', version);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return { signed: false };
  }

  return {
    signed: true,
    acceptance: {
      id: data.id,
      signedAt: data.accepted_at,
      signerName: data.signer_name,
      signatureMethod: data.signature_method,
    },
  };
}

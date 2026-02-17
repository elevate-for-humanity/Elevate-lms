import { logger } from '@/lib/logger';
/**
 * Compliance Enforcement Module
 * Handles onboarding progress tracking and compliance enforcement
 */

import { createClient } from '@/lib/supabase/client';

export async function updateOnboardingProgress(
  userId: string,
  step: string,
  status: 'completed' | 'pending' | 'skipped'
): Promise<void> {
  const supabase = createClient();
  
  if (!supabase) {
    logger.warn('[Compliance] Supabase not configured, skipping progress update');
    return;
  }

  try {
    await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: userId,
        step,
        status,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,step'
      });
  } catch (error) {
    logger.error('[Compliance] Failed to update onboarding progress:', error);
  }
}

export async function getOnboardingProgress(userId: string): Promise<Record<string, string>> {
  const supabase = createClient();
  
  if (!supabase) {
    return {};
  }

  try {
    const { data } = await supabase
      .from('onboarding_progress')
      .select('step, status')
      .eq('user_id', userId);

    if (!data) return {};

    return data.reduce((acc, row) => {
      acc[row.step] = row.status;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    logger.error('[Compliance] Failed to get onboarding progress:', error);
    return {};
  }
}

export async function checkComplianceStatus(userId: string): Promise<{
  isCompliant: boolean;
  missingSteps: string[];
}> {
  const progress = await getOnboardingProgress(userId);
  
  const requiredSteps = [
    'profile',
    'documents',
    'agreements',
    'verification',
  ];

  const missingSteps = requiredSteps.filter(
    step => progress[step] !== 'completed'
  );

  return {
    isCompliant: missingSteps.length === 0,
    missingSteps,
  };
}

export type ComplianceStatus = {
  isCompliant: boolean;
  missingSteps: string[];
};

export interface AgreementAcceptanceParams {
  userId: string;
  agreementType: string;
  documentVersion: string;
  signerName: string;
  signerEmail: string;
  authEmail?: string;
  signatureMethod: 'checkbox' | 'typed' | 'drawn';
  signatureData?: string;
  signatureTyped?: string;
  acceptanceContext?: string;
  programId?: string;
  tenantId?: string;
  organizationId?: string;
}

export async function recordAgreementAcceptance(
  params: AgreementAcceptanceParams
): Promise<{ success: boolean; acceptanceId?: string; error?: string }> {
  const supabase = createClient();
  
  if (!supabase) {
    logger.warn('[Compliance] Supabase not configured, skipping agreement recording');
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('agreement_acceptances')
      .insert({
        user_id: params.userId,
        agreement_type: params.agreementType,
        document_version: params.documentVersion,
        signer_name: params.signerName,
        signer_email: params.signerEmail,
        auth_email: params.authEmail,
        signature_method: params.signatureMethod,
        signature_data: params.signatureData,
        signature_typed: params.signatureTyped,
        acceptance_context: params.acceptanceContext,
        program_id: params.programId,
        tenant_id: params.tenantId,
        organization_id: params.organizationId,
        signed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      logger.error('[Compliance] Failed to record agreement acceptance:', error);
      return { success: false, error: 'Operation failed' };
    }

    return { success: true, acceptanceId: data?.id };
  } catch (error) {
    logger.error('[Compliance] Failed to record agreement acceptance:', error);
    return { success: false, error: 'Failed to record agreement' };
  }
}

export async function getCurrentAgreementVersions(): Promise<Record<string, string>> {
  const client = createClient();
  const { data } = await client
    .from('agreement_versions')
    .select('agreement_type, version')
    .eq('is_current', true);
  const versions: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    versions[row.agreement_type] = row.version;
  });
  return versions;
}

export async function recordHandbookAcknowledgment({
  userId,
  handbookVersion,
}: {
  userId: string;
  handbookVersion: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createClient();
    const { error } = await client.from('handbook_acknowledgments').insert({
      user_id: userId,
      handbook_version: handbookVersion,
      acknowledged_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    logger.error('[Compliance] Failed to record handbook acknowledgment:', error);
    return { success: false, error: 'Failed to record acknowledgment' };
  }
}

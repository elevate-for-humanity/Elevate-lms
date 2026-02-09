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
    console.warn('[Compliance] Supabase not configured, skipping progress update');
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
    console.error('[Compliance] Failed to update onboarding progress:', error);
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
    console.error('[Compliance] Failed to get onboarding progress:', error);
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
    console.warn('[Compliance] Supabase not configured, skipping agreement recording');
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
      console.error('[Compliance] Failed to record agreement acceptance:', error);
      return { success: false, error: error.message };
    }

    return { success: true, acceptanceId: data?.id };
  } catch (error) {
    console.error('[Compliance] Failed to record agreement acceptance:', error);
    return { success: false, error: 'Failed to record agreement' };
  }
}

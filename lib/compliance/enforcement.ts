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

export async function checkComplianceStatus(userId: string, context?: string): Promise<ComplianceStatus> {
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
    canAccess: missingSteps.length === 0,
    onboardingComplete: !missingSteps.includes('profile') && !missingSteps.includes('verification'),
    agreementsComplete: !missingSteps.includes('agreements'),
    handbookComplete: true, // checked separately via API
    missingAgreements: missingSteps.includes('agreements') ? ['enrollment', 'participation', 'ferpa'] : [],
    redirectTo: missingSteps.length > 0 ? '/onboarding/learner' : null,
  };
}

export type ComplianceStatus = {
  isCompliant: boolean;
  missingSteps: string[];
  canAccess: boolean;
  onboardingComplete: boolean;
  agreementsComplete: boolean;
  handbookComplete: boolean;
  missingAgreements: string[];
  redirectTo: string | null;
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
  try {
    const res = await fetch('/api/compliance/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'agreement_acceptance',
        agreementType: params.agreementType,
        documentVersion: params.documentVersion,
        signerName: params.signerName,
        signerEmail: params.signerEmail,
        authEmail: params.authEmail,
        signatureMethod: params.signatureMethod,
        signatureData: params.signatureData,
        signatureTyped: params.signatureTyped,
        acceptanceContext: params.acceptanceContext,
        programId: params.programId,
        tenantId: params.tenantId,
        organizationId: params.organizationId,
      }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed');
    return { success: true, acceptanceId: result.acceptanceId };
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
    const res = await fetch('/api/compliance/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'handbook_acknowledgment', handbookVersion }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed');
    return { success: true };
  } catch (error) {
    logger.error('[Compliance] Failed to record handbook acknowledgment:', error);
    return { success: false, error: 'Failed to record acknowledgment' };
  }
}

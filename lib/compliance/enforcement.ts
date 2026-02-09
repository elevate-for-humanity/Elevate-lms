/**
 * Compliance Enforcement Module
 * Handles onboarding progress tracking and compliance enforcement
 */

import { createClient } from '@/lib/supabase/server';

export async function updateOnboardingProgress(
  userId: string,
  step: string,
  status: 'completed' | 'pending' | 'skipped'
): Promise<void> {
  const supabase = await createClient();
  
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
  const supabase = await createClient();
  
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

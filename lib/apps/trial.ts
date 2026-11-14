import { createClient } from '@/lib/supabase/server';

interface StartTrialParams {
  appId: string;
  userId: string;
}

interface TrialResult {
  success: boolean;
  trialId?: string;
  error?: string;
}

export async function startAppTrial({ appId, userId }: StartTrialParams): Promise<TrialResult> {
  const supabase = await createClient();
  
  try {
    // Check if user already has a trial for this app
    const { data: existing } = await supabase
      .from('user_app_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('app_slug', appId)
      .maybeSingle();
    
    if (existing) {
      return { success: false, error: 'Trial already exists' };
    }
    
    // Create trial subscription
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial
    
    const { data, error } = await supabase
      .from('user_app_subscriptions')
      .insert({
        user_id: userId,
        app_slug: appId,
        status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, trialId: data.id };
  } catch (err) {
    return { success: false, error: 'Failed to start trial' };
  }
}

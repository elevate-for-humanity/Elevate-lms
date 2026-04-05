import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

// POST /api/onboarding/complete-step
// Marks a single onboarding step complete for the authenticated user.
// Writes to onboarding_progress and updates profiles if step is 'agreements' or 'all'.
export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step, data: stepData = {} } = await req.json();
    if (!step) {
      return NextResponse.json({ error: 'Missing step' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Upsert into onboarding_progress
    const { error: progressError } = await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: user.id,
        step,
        completed: true,
        data: stepData,
        completed_at: now,
        updated_at: now,
      }, { onConflict: 'user_id,step' });

    if (progressError) {
      logger.warn('[onboarding/complete-step] onboarding_progress upsert failed', progressError);
    }

    // Mirror critical steps to profiles columns
    const profileUpdates: Record<string, unknown> = { updated_at: now };

    if (step === 'agreements') {
      profileUpdates.agreements_signed_at = now;
    }
    if (step === 'documents') {
      profileUpdates.documents_submitted_at = now;
    }
    if (step === 'orientation') {
      profileUpdates.orientation_completed = true;
      profileUpdates.orientation_completed_at = now;
    }
    if (step === 'handbook') {
      profileUpdates.handbook_acknowledged_at = now;
    }

    if (Object.keys(profileUpdates).length > 1) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) {
        logger.warn('[onboarding/complete-step] profiles update failed (non-fatal)', profileError);
      }
    }

    // Check if all steps are now complete
    const { data: allSteps } = await supabase
      .from('onboarding_progress')
      .select('step, completed')
      .eq('user_id', user.id)
      .eq('completed', true);

    const completedSteps = allSteps?.map(s => s.step) ?? [];
    const requiredSteps = ['profile', 'documents', 'agreements', 'orientation'];
    const allComplete = requiredSteps.every(s => completedSteps.includes(s));

    if (allComplete) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true, onboarding_completed_at: now })
        .eq('id', user.id);
    }

    return NextResponse.json({ success: true, step, allComplete });
  } catch (error) {
    logger.error('[onboarding/complete-step] error:', error);
    return NextResponse.json({ error: 'Failed to complete step' }, { status: 500 });
  }
}

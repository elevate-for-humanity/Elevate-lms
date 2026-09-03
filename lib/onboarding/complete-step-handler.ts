import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';

const LEARNER_STEPS = new Set([
  'profile',
  'agreements',
  'orientation',
  'documents',
  'handbook',
  'funding',
  'schedule',
]);

export async function handleLearnerOnboardingStep(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const step = String(body?.step || '');
    const stepData = body?.data && typeof body.data === 'object' ? body.data : {};
    if (!LEARNER_STEPS.has(step)) {
      return NextResponse.json({ error: 'Invalid onboarding step' }, { status: 400 });
    }

    const { data: profile, error: profileReadError } = await supabase
      .from('profiles')
      .select('role, orientation_completed, orientation_completed_at, documents_submitted_at, agreements_signed_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileReadError) {
      logger.warn('[onboarding] profile read failed', profileReadError);
      return NextResponse.json({ error: 'Unable to verify learner profile' }, { status: 503 });
    }

    const blockedRoles = ['program_holder', 'employer', 'partner', 'admin', 'super_admin', 'staff'];
    if (profile?.role && blockedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'This onboarding flow is for learners only.' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const progressUpdates: Record<string, unknown> = {
      user_id: user.id,
      role: profile?.role || 'student',
      step,
      status: 'in_progress',
      updated_at: now,
    };

    if (step === 'profile') {
      progressUpdates.profile_completed = true;
      progressUpdates.profile_completed_at = now;
    }
    if (step === 'agreements') {
      progressUpdates.agreements_completed = true;
      progressUpdates.agreements_completed_at = now;
    }
    if (step === 'handbook') {
      progressUpdates.handbook_acknowledged = true;
      progressUpdates.handbook_acknowledged_at = now;
    }
    if (step === 'documents') {
      progressUpdates.documents_uploaded = true;
      progressUpdates.documents_uploaded_at = now;
    }

    const { error: progressError } = await supabase
      .from('onboarding_progress')
      .upsert(progressUpdates, { onConflict: 'user_id' });

    if (progressError) {
      logger.error('[onboarding] onboarding progress write failed', progressError);
      return NextResponse.json({ error: 'Unable to save onboarding progress' }, { status: 503 });
    }

    const profileUpdates: Record<string, unknown> = { updated_at: now };
    if (step === 'agreements') profileUpdates.agreements_signed_at = now;
    if (step === 'documents') profileUpdates.documents_submitted_at = now;
    if (step === 'handbook') profileUpdates.handbook_acknowledged_at = now;
    if (step === 'orientation') {
      profileUpdates.orientation_completed = true;
      profileUpdates.orientation_completed_at = now;
    }
    if (step === 'funding') {
      profileUpdates.funding_confirmed = true;
      profileUpdates.funding_source = String((stepData as Record<string, unknown>).funding_source || 'self_pay');
    }
    if (step === 'schedule') {
      profileUpdates.schedule_selected = true;
      profileUpdates.cohort_start_date = (stepData as Record<string, unknown>).cohort_start_date || null;
      profileUpdates.schedule_preference = (stepData as Record<string, unknown>).schedule_preference || null;
    }

    const { error: profileWriteError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);

    if (profileWriteError) {
      logger.error('[onboarding] profile update failed', profileWriteError);
      return NextResponse.json({ error: 'Unable to save onboarding milestone' }, { status: 503 });
    }

    if (step === 'orientation') {
      const { error: enrollmentError } = await supabase
        .from('program_enrollments')
        .update({
          enrollment_state: 'orientation',
          orientation_completed_at: now,
          next_required_action: 'DOCUMENTS',
          updated_at: now,
        })
        .eq('user_id', user.id)
        .in('enrollment_state', ['applied', 'onboarding', 'orientation']);

      if (enrollmentError) {
        logger.error('[onboarding] enrollment orientation update failed', enrollmentError);
        return NextResponse.json({ error: 'Unable to advance enrollment' }, { status: 503 });
      }
    }

    const [{ data: progress }, { data: refreshedProfile }] = await Promise.all([
      supabase
        .from('onboarding_progress')
        .select('profile_completed, agreements_completed, documents_uploaded')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('orientation_completed')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const allComplete = Boolean(
      progress?.profile_completed &&
        progress?.agreements_completed &&
        progress?.documents_uploaded &&
        refreshedProfile?.orientation_completed,
    );

    if (allComplete) {
      await Promise.all([
        supabase
          .from('onboarding_progress')
          .update({ is_complete: true, status: 'completed', completed_at: now, updated_at: now })
          .eq('user_id', user.id),
        supabase
          .from('profiles')
          .update({ onboarding_completed: true, onboarding_completed_at: now, updated_at: now })
          .eq('id', user.id),
      ]);
    }

    return NextResponse.json({ success: true, step, allComplete });
  } catch (error) {
    logger.error(
      '[onboarding] complete step failed',
      normalizeError(error, 'Complete step failed'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Failed to complete onboarding step' }, { status: 500 });
  }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function acknowledgeLearnerOrientation(
  _previous: { error: string },
  form: FormData,
): Promise<{ error: string }> {
  if (form.get('reviewed') !== 'yes') {
    return { error: 'Review the orientation and check the acknowledgement before continuing.' };
  }
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { error: 'Sign in again before completing orientation.' };
  const { data: profile, error: profileReadError } = await session
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profileReadError || !profile) return { error: 'Your learner profile could not be verified.' };
  if (!['student', 'learner', 'apprentice', 'barber_apprentice', 'cosmetology_apprentice'].includes(profile.role)) {
    return { error: 'Only the learner can acknowledge their orientation.' };
  }
  // Verify ownership through the learner's session before any privileged write.
  const { data: enrollments, error: enrollmentReadError } = await session
    .from('program_enrollments').select('id')
    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
    .in('status', ['active', 'enrolled', 'in_progress', 'pending', 'onboarding', 'orientation', 'applied'])
    .is('revoked_at', null).is('suspended_at', null).is('cancelled_at', null);
  if (enrollmentReadError || !enrollments?.length) {
    return { error: 'An active learner enrollment could not be verified. Contact learner support.' };
  }
  try {
    const db = await requireAdminClient();
    const now = new Date().toISOString();
    const { data: saved, error: enrollmentError } = await db
      .from('program_enrollments').update({ orientation_completed_at: now })
      .in('id', enrollments.map((row) => row.id))
      .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
      .is('revoked_at', null).is('suspended_at', null).is('cancelled_at', null)
      .select('id');
    if (enrollmentError || saved?.length !== enrollments.length) throw new Error('Enrollment save failed');
    const { data: savedProfile, error: profileError } = await db.from('profiles')
      .update({ orientation_completed: true, orientation_completed_at: now, updated_at: now })
      .eq('id', user.id).select('id').maybeSingle();
    if (profileError || !savedProfile) throw new Error('Profile save failed');
    const { data: previousProgress, error: progressReadError } = await db.from('onboarding_progress')
      .select('status').eq('user_id', user.id).maybeSingle();
    if (progressReadError) throw new Error('Progress read failed');
    const { error: progressError } = await db.from('onboarding_progress').upsert({
      user_id: user.id, step: 'orientation',
      status: previousProgress?.status === 'completed' ? 'completed' : 'in_progress', updated_at: now,
    }, { onConflict: 'user_id' });
    if (progressError) throw new Error('Progress save failed');
  } catch {
    return { error: 'Orientation could not be fully saved. Please retry or contact learner support.' };
  }
  // Other onboarding, document review, and course completion remain unchanged.
  revalidatePath('/lms/orientation');
  revalidatePath('/lms/onboarding');
  revalidatePath('/lms/dashboard');
  redirect('/lms/onboarding');
}

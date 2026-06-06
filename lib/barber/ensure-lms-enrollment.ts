import type { SupabaseClient } from '@supabase/supabase-js';
import { BARBER_COURSE_ID, BARBER_PROGRAM_SLUG } from '@/lib/barber/constants';
import { BARBER_CURRICULUM_COVER } from '@/lib/barber/branding';
import { logger } from '@/lib/logger';

export async function ensureBarberLmsEnrollment(
  db: SupabaseClient,
  userId: string,
  options?: { grantAccess?: boolean },
): Promise<void> {
  const now = new Date().toISOString();

  const { data: course } = await db
    .from('courses')
    .select('id, slug')
    .eq('id', BARBER_COURSE_ID)
    .maybeSingle();

  if (!course) {
    logger.warn('[ensureBarberLmsEnrollment] Barber course not found', { BARBER_COURSE_ID });
    return;
  }

  const patch: Record<string, unknown> = {
    course_id: BARBER_COURSE_ID,
    program_slug: BARBER_PROGRAM_SLUG,
    updated_at: now,
  };
  if (options?.grantAccess) {
    patch.access_granted_at = now;
    patch.enrollment_state = 'active';
    patch.status = 'active';
  }

  const { error: peError } = await db
    .from('program_enrollments')
    .update(patch)
    .eq('user_id', userId)
    .eq('program_slug', BARBER_PROGRAM_SLUG);

  if (peError) {
    logger.warn('[ensureBarberLmsEnrollment] enrollment update failed', peError);
  }

  const { error: progressError } = await db.from('lms_progress').upsert(
    {
      user_id: userId,
      course_id: BARBER_COURSE_ID,
      course_slug: course.slug ?? 'barber-apprenticeship-v1',
      status: 'in_progress',
      started_at: now,
      last_activity_at: now,
    },
    { onConflict: 'user_id,course_id' },
  );

  if (progressError) {
    logger.warn('[ensureBarberLmsEnrollment] lms_progress upsert failed', progressError);
  }
}

export async function publishBarberCourseCatalog(db: SupabaseClient): Promise<void> {
  const { error } = await db
    .from('courses')
    .update({
      title: 'Prestige Elevation™ Barbering RTI',
      short_description:
        'DOL registered barber apprenticeship RTI — 8 modules, video lessons, checkpoints, and Indiana licensure prep.',
      status: 'published',
      is_active: true,
      thumbnail_url: BARBER_CURRICULUM_COVER,
      updated_at: new Date().toISOString(),
    })
    .eq('id', BARBER_COURSE_ID);

  if (error) throw new Error(error.message);
}

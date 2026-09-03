import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

interface EnsureBinderParams {
  db: SupabaseClient<any, 'public', any>;
  userId: string;
  enrollmentId: string;
}

/**
 * Idempotent — finds or creates a digital binder for the given enrollment.
 * Lookup order:
 *   1. Existing binder already linked to this enrollment
 *   2. Existing binder for this user (legacy, no enrollment_id) — attaches it
 *   3. Creates a new binder
 *
 * Returns null binderId on DB error — callers should treat this as non-fatal.
 */
export async function ensureDigitalBinder({
  db,
  userId,
  enrollmentId,
}: EnsureBinderParams): Promise<{ binderId: string | null; created: boolean }> {
  // 1. Binder already linked to this enrollment
  const { data: existingByEnrollment } = await db
    .from('digital_binders')
    .select('id')
    .eq('enrollment_id', enrollmentId)
    .maybeSingle();

  if (existingByEnrollment?.id) {
    return { binderId: existingByEnrollment.id, created: false };
  }

  // 2. Legacy binder for this user — attach it to the enrollment
  const { data: existingByUser } = await db
    .from('digital_binders')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingByUser?.id) {
    await db
      .from('digital_binders')
      .update({ enrollment_id: enrollmentId })
      .eq('id', existingByUser.id);
    return { binderId: existingByUser.id, created: false };
  }

  // 3. Create new binder
  const { data: created, error } = await db
    .from('digital_binders')
    .insert({
      user_id: userId,
      enrollment_id: enrollmentId,
      title: 'Student Digital Binder',
      status: 'active',
    })
    .select('id')
    .maybeSingle();

  if (error || !created?.id) {
    logger.warn('[ensureDigitalBinder] Failed to create binder', error);
    return { binderId: null, created: false };
  }

  return { binderId: created.id, created: true };
}

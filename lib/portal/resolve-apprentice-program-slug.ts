import type { SupabaseClient } from '@supabase/supabase-js';
import { ACTIVE_ENROLLMENT_STATES } from '@/lib/portal/apprenticeship-portal-paths';
import { SLUG_TO_PORTAL } from '@/components/portal/ApprenticePortalShell';

/**
 * Resolve the user's active apprenticeship program slug from enrollment.
 * Returns null when no apprenticeship enrollment exists (never guess barber).
 */
export async function resolveApprenticeProgramSlug(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('program_slug')
    .eq('user_id', userId)
    .in('enrollment_state', [...ACTIVE_ENROLLMENT_STATES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const slug = enrollment?.program_slug?.trim();
  if (!slug) return null;
  if (SLUG_TO_PORTAL[slug]) return slug;
  return null;
}

/** Canonical per-program portal path, or null if slug is not an apprenticeship program. */
export function apprenticePortalPathForSlug(programSlug: string | null | undefined): string | null {
  if (!programSlug) return null;
  return SLUG_TO_PORTAL[programSlug] ?? null;
}

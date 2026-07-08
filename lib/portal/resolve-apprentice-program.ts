import 'server-only';

import type { SupabaseClient } from '@/lib/supabase';

const APPRENTICESHIP_SLUGS = [
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'esthetician-apprenticeship',
  'nail-technician-apprenticeship',
  'culinary-apprenticeship',
  'electrical',
  'plumbing',
] as const;

/**
 * Resolve the active apprenticeship program for nav + billing context.
 */
export async function resolveApprenticeProgramSlug(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('program_slug')
    .eq('user_id', userId)
    .in('program_slug', [...APPRENTICESHIP_SLUGS])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrollment?.program_slug) {
    return enrollment.program_slug;
  }

  const { data: barberSub } = await supabase
    .from('barber_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (barberSub) {
    return 'barber-apprenticeship';
  }

  return null;
}

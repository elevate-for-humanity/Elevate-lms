import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const APPRENTICESHIP = {
  IN: {
    enabled: true,
    state: 'Indiana',
    sponsorName: '2Exclusive LLC-S (DBA ' + PLATFORM_DEFAULTS.orgName + ' Career & Technical Institute)',
    system: 'U.S. Department of Labor Registered Apprenticeship (RAPIDS)',
    programName: 'Barber Apprenticeship',
    earnAndLearn: true,
    registrationNumber: process.env.NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER || '',
    notes:
      'Indiana Registered Apprenticeship program. Earn while you learn. Classroom instruction provided through approved curriculum partners.',
  },
} as const;

export type ApprenticeshipState = keyof typeof APPRENTICESHIP;

export const APPRENTICESHIP_REQUIRED_HOURS: Record<string, number> = {
  'barber-apprenticeship': 2000,
  'cosmetology-apprenticeship': 2000,
  'nail-tech-apprenticeship': 450,
  'nail-technician-apprenticeship': 450,
};

export function getApprenticeshipRequiredHours(programSlug: string | null | undefined) {
  if (!programSlug) return null;
  return APPRENTICESHIP_REQUIRED_HOURS[programSlug] ?? null;
}

/**
 * Resolve the active program_id (and optional slug) for an apprenticeship learner.
 * First checks `apprentices` (most direct), then falls back to `program_enrollments`.
 * Works in server components — pass the Supabase server client and the authenticated user id.
 */
export async function resolveApprenticeProgram(
  db: { from: (table: string) => any },
  userId: string,
): Promise<{ programId: string | null; programSlug: string | null }> {
  const { data: apprentice } = await db
    .from('apprentices')
    .select('program_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (apprentice?.program_id) {
    return { programId: apprentice.program_id, programSlug: null };
  }

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('program_id, program_slug')
    .eq('user_id', userId)
    .in('status', ['active', 'enrolled', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    programId: enrollment?.program_id ?? null,
    programSlug: enrollment?.program_slug ?? null,
  };
}

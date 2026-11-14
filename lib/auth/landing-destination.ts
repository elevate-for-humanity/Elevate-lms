import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getRoleDestination } from '@/lib/auth/role-destinations';
import { getAdminClient } from '@/lib/supabase/admin';
import { resolvePortalForUser } from '@/lib/portal/router';

type ProfileRouteFields = {
  role: string | null;
  onboarding_completed?: boolean | null;
};

const EMPLOYER_ONBOARDING_ROLES = new Set(['employer']);

async function loadProfileForLanding(
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<ProfileRouteFields | null> {
  const db = (await getAdminClient()) ?? supabase;
  const { data } = await db
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  return data ?? null;
}

export async function resolveAuthenticatedLandingDestination(
  supabase: SupabaseClient<any>,
  user: User,
): Promise<{ redirectTo: string; role: string; profileFound: boolean }> {
  const profile = await loadProfileForLanding(supabase, user.id);
  const role = profile?.role ?? user.user_metadata?.role ?? 'student';

  if (!profile) {
    return { redirectTo: '/onboarding/learner', role, profileFound: false };
  }

  if (EMPLOYER_ONBOARDING_ROLES.has(role) && profile.onboarding_completed !== true) {
    return { redirectTo: '/onboarding/employer', role, profileFound: true };
  }

  if (role === 'student') {
    const db = (await getAdminClient()) ?? supabase;
    return {
      redirectTo: await resolvePortalForUser(db, user.id),
      role,
      profileFound: true,
    };
  }

  return { redirectTo: getRoleDestination(role), role, profileFound: true };
}

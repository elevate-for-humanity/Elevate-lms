import { createClient } from '@/lib/supabase/server';

export type AccessTier = 'free' | 'student' | 'career' | 'partner';

export interface UserAccess {
  tier: AccessTier;
  status: string | null;
  current_period_end: string | null;
}

/**
 * Get user's access tier from Supabase
 * Returns 'free' if not logged in or no record found
 */
export async function getAccessTier(): Promise<UserAccess> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  const user = u?.user;

  if (!user) {
    return { tier: 'free', status: null, current_period_end: null };
  }

  const { data }: any = await supabase
    .from('user_access')
    .select('tier, status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data?.tier) {
    return { tier: 'free', status: null, current_period_end: null };
  }

  return {
    tier: data.tier as AccessTier,
    status: data.status ?? null,
    current_period_end: data.current_period_end ?? null,
  };
}

/**
 * Check if user has at least the required tier
 * Tier hierarchy: free < student < career < partner
 */
export function hasAccess(userTier: AccessTier, requiredTier: AccessTier): boolean {
  const hierarchy: AccessTier[] = ['free', 'student', 'career', 'partner'];
  const userLevel = hierarchy.indexOf(userTier);
  const requiredLevel = hierarchy.indexOf(requiredTier);
  return userLevel >= requiredLevel;
}

/**
 * Require specific tier or redirect to pricing
 * Use in server components/pages
 */
export async function requireTier(requiredTier: AccessTier): Promise<UserAccess> {
  const access = await getAccessTier();

  if (!hasAccess(access.tier, requiredTier)) {
    const { redirect } = await import('next/navigation');
    redirect('/pricing');
  }

  return access;
}

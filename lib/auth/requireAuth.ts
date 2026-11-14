import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export type RequireAuthResult = {
  user: User | null;
  error: Error | null;
};

/**
 * Resolve the current Supabase user for request/server handlers.
 * The request argument is accepted for compatibility; auth is cookie-bound.
 */
export async function requireAuth(_request?: Request): Promise<RequireAuthResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return { user: null, error: error ? new Error(error.message) : null };
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_active, suspended')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) return { user: null, error: new Error('PROFILE_LOOKUP_UNAVAILABLE') };
    if (profile?.is_active === false || profile?.suspended === true) {
      return { user: null, error: new Error('ACCOUNT_DISABLED') };
    }
    return {
      user,
      error: error ? new Error(error.message) : null,
    };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

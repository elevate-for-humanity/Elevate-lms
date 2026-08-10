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
    const { data: { user }, error } = await supabase.auth.getUser();
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

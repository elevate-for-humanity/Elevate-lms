import { createClient } from '@/lib/supabase/server';

/**
 * Asserts an authenticated session exists.
 * Throws — never returns null or a degraded state.
 *
 * Usage in route handlers:
 *   const { user, supabase } = await requireUser();
 *
 * Usage in server actions:
 *   const { user } = await requireUser();
 */
export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw new Error(`AUTH_FAILED: ${error.message}`);
  if (!data?.user) throw new Error('UNAUTHENTICATED');

  return { user: data.user, supabase };
}

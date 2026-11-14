/**
 * Used by the login page server component.
 *
 * Returns the canonical home path for an already-authenticated user,
 * or null if the visitor is a guest (no session).
 *
 * The login page redirects to this path (or the ?redirect param) when
 * a session already exists, preventing authenticated users from seeing
 * the login form.
 */

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getRoleDestination } from '@/lib/auth/role-destinations';

export async function requireGuestOrGetUserHome(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return getRoleDestination(profile?.role ?? null);
}

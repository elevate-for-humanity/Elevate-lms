import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns an authenticated user and a DB client that bypasses the
 * partner_users RLS recursion. The admin (service-role) client is
 * used for data queries; auth verification still goes through the
 * user's JWT. All queries MUST filter by user.id explicitly.
 */
export async function getAuthenticatedDb(): Promise<{
  user: any;
  db: SupabaseClient;
} | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = await getAdminClient();
  return { user, db: admin || supabase };
}

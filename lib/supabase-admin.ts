/** @deprecated Use '@/lib/supabase/admin' instead. */
import { getAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — evaluated on first access, not at module load time.
// Prevents build-time throws when env vars are absent during static analysis.
let _client: SupabaseClient<any> | null = null;

/** @deprecated Use await getAdminClient() from '@/lib/supabase/admin' instead. */
export const supabaseAdmin: SupabaseClient<any> = new Proxy({} as SupabaseClient<any>, {
  get(_target, prop) {
    if (!_client) _client = await getAdminClient();
    return (_client as any)[prop];
  },
});

/** @deprecated Use await getAdminClient() from '@/lib/supabase/admin' directly. */
export async function getUserByEmail(email: string) {
  const db = await getAdminClient();
  const { data, error } = await db
    .from('profiles')
    .select('id, email')
    .ilike('email', email.trim())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: authData, error: authError } = await db.auth.admin.getUserById(data.id);
  if (authError) throw authError;
  return authData.user ?? null;
}

/** @deprecated Use await getAdminClient() from '@/lib/supabase/admin' directly. */
export async function getUserById(userId: string) {
  const db = await getAdminClient();
  const { data, error }: any = await db.auth.admin.getUserById(userId);
  if (error) throw error;
  return data.user;
}

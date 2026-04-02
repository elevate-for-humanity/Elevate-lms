/** @deprecated Use '@/lib/supabase/admin' instead. */
import { createAdminClient } from '@/lib/supabase/admin';

/** @deprecated Use createAdminClient() from '@/lib/supabase/admin' instead. */
export const supabaseAdmin = createAdminClient();

/** @deprecated Use createAdminClient() from '@/lib/supabase/admin' directly. */
export async function getUserByEmail(email: string) {
  const db = createAdminClient();
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

/** @deprecated Use createAdminClient() from '@/lib/supabase/admin' directly. */
export async function getUserById(userId: string) {
  const db = createAdminClient();
  const { data, error }: any = await db.auth.admin.getUserById(userId);
  if (error) throw error;
  return data.user;
}

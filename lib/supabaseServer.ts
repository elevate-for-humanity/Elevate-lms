/** @deprecated Use '@/lib/supabase/server' instead. */
import { getAdminClient } from '@/lib/supabase/admin';

/** @deprecated Use await getAdminClient() from '@/lib/supabase/admin' instead. */
export async function supabaseServer() {
  return getAdminClient();
}

/** @deprecated Use await getAdminClient() from '@/lib/supabase/admin' instead. */
export async function getSupabaseServerClient() {
  return getAdminClient();
}

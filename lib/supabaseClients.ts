/** @deprecated Use '@/lib/supabase/server', '@/lib/supabase/client', '@/lib/supabase/admin' instead. */
import { getAdminClient } from '@/lib/supabase/admin';
import { createBrowserClient } from '@/lib/supabase/client';

/** @deprecated Use createBrowserClient() from '@/lib/supabase/client' instead. */
export function getClientSupabase() {
  return createBrowserClient();
}

/** @deprecated Use createClient() from '@/lib/supabase/server' instead. */
export async function getServerSupabase() {
  return getAdminClient();
}

/** @deprecated Use await getAdminClient() from '@/lib/supabase/admin' instead. */
export async function getAdminSupabase() {
  return getAdminClient();
}

/** @deprecated */
export const supabaseAdmin = null;

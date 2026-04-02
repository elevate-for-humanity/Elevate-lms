/** @deprecated Use '@/lib/supabase/server', '@/lib/supabase/client', '@/lib/supabase/admin' instead. */
import { createAdminClient } from '@/lib/supabase/admin';
import { createBrowserClient } from '@/lib/supabase/client';

/** @deprecated Use createBrowserClient() from '@/lib/supabase/client' instead. */
export function getClientSupabase() {
  return createBrowserClient();
}

/** @deprecated Use createClient() from '@/lib/supabase/server' instead. */
export function getServerSupabase() {
  return createAdminClient();
}

/** @deprecated Use createAdminClient() from '@/lib/supabase/admin' instead. */
export function getAdminSupabase() {
  return createAdminClient();
}

/** @deprecated */
export const supabaseAdmin = null;

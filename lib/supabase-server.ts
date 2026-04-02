/** @deprecated Use '@/lib/supabase/server' instead. */
import { createAdminClient } from '@/lib/supabase/admin';

/** @deprecated Use createAdminClient() from '@/lib/supabase/admin' instead. */
export function supabaseServer() {
  return createAdminClient();
}
